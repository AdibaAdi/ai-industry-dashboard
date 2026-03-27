import { getCompanies } from '../../data/repositories/companyRepository.js';
import { retrieveHybridCompanySignals } from '../retrieval/hybridCompanyRetrievalService.js';

const SEARCH_LIMIT = 6;

const INTENTS = {
  COMPANY_COMPARISON: 'company_comparison',
  DOMAIN_RANKING: 'domain_ranking',
  FASTEST_GROWING: 'fastest_growing_companies',
  STRONGEST: 'strongest_companies',
  COMPETITOR_LOOKUP: 'competitor_lookup',
  CROWDED_DOMAIN: 'crowded_domain_detection',
  GENERAL: 'general_search',
};

const STOPWORDS = new Set([
  'which',
  'what',
  'who',
  'are',
  'is',
  'the',
  'a',
  'an',
  'for',
  'with',
  'right',
  'now',
  'top',
  'best',
  'companies',
  'company',
  'ai',
  'and',
  'of',
  'to',
]);

const HIGHLIGHTABLE_FIELDS = ['domain', 'subdomain', 'tags', 'description'];

const RANKING_WEIGHTS = {
  exactCompanyNameMatch: 50,
  partialCompanyNameMatch: 16,
  domainMatch: 18,
  subdomainMatch: 14,
  tagMatch: 11,
  descriptionMatch: 8,
  semanticSimilarity: 22,
  scoreSignal: 18,
  explicitCompanyPriority: 20,
  explicitDomainMissPenalty: -14,
};

const tokenize = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1);

const unique = (items) => [...new Set(items)];

const normalize = (value) => (typeof value === 'string' ? value.toLowerCase().trim() : '');

const sentenceCase = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const clip = (value, maxLength = 180) => {
  if (!value || value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 3)}...`;
};

const toSearchDocument = (company) => ({
  company,
  fields: {
    name: normalize(company.name),
    description: normalize(company.description),
    domain: normalize(company.domain),
    subdomain: normalize(company.subdomain),
    tags: company.tags.map((tag) => normalize(tag)),
  },
});

const buildDomainVocabulary = () => {
  const vocabulary = new Set();
  for (const company of getCompanies()) {
    for (const token of tokenize(`${company.domain} ${company.subdomain} ${company.tags.join(' ')}`)) {
      vocabulary.add(token);
    }
  }
  return vocabulary;
};

const DOMAIN_VOCABULARY = buildDomainVocabulary();

const detectIntent = (normalizedQuery) => {
  if (/\b(compare|comparison|versus|vs\.?|against)\b/.test(normalizedQuery)) {
    return INTENTS.COMPANY_COMPARISON;
  }

  if (/\b(crowded|saturated|most companies|dense|concentrated)\b/.test(normalizedQuery) && /\b(domain|segment|category)\b/.test(normalizedQuery)) {
    return INTENTS.CROWDED_DOMAIN;
  }

  if (/\b(rank|ranking|top domains|best domains|leading domains)\b/.test(normalizedQuery) && /\b(domain|segment|category)\b/.test(normalizedQuery)) {
    return INTENTS.DOMAIN_RANKING;
  }

  if (/\b(fastest|growing fastest|highest growth|growth leaders|momentum)\b/.test(normalizedQuery)) {
    return INTENTS.FASTEST_GROWING;
  }

  if (/\b(strongest|most powerful|leaders|best positioned|highest power)\b/.test(normalizedQuery)) {
    return INTENTS.STRONGEST;
  }

  if (/\b(competitor|competitors|rival|rivals|competes with|similar to)\b/.test(normalizedQuery)) {
    return INTENTS.COMPETITOR_LOOKUP;
  }

  return INTENTS.GENERAL;
};

const extractExplicitCompanies = (normalizedQuery, companies) => {
  const matches = companies
    .map((company) => ({ company, idx: normalizedQuery.indexOf(normalize(company.name)) }))
    .filter((entry) => entry.idx >= 0)
    .sort((a, b) => a.idx - b.idx)
    .map((entry) => entry.company);

  return unique(matches);
};

const computeScoreSignal = (company) => company.power_score * 0.5 + company.growth_score * 0.25 + company.influence_score * 0.25;

const computeWeightedScore = ({ document, normalizedQuery, tokens, explicitCompanies, explicitDomainTerms, semanticSimilarity }) => {
  const contributions = [];
  let score = 0;

  const companyName = document.fields.name;
  const nameTokens = tokenize(companyName);

  if (companyName === normalizedQuery || explicitCompanies.some((entry) => entry.id === document.company.id)) {
    score += RANKING_WEIGHTS.exactCompanyNameMatch;
    contributions.push(`exact company match (+${RANKING_WEIGHTS.exactCompanyNameMatch.toFixed(1)})`);
  } else if (tokens.some((token) => nameTokens.includes(token) || companyName.includes(token))) {
    score += RANKING_WEIGHTS.partialCompanyNameMatch;
    contributions.push(`company name overlap (+${RANKING_WEIGHTS.partialCompanyNameMatch.toFixed(1)})`);
  }

  const domainMatches = tokens.filter((token) => document.fields.domain.includes(token)).length;
  if (domainMatches > 0) {
    const domainScore = domainMatches * RANKING_WEIGHTS.domainMatch;
    score += domainScore;
    contributions.push(`domain alignment (+${domainScore.toFixed(1)})`);
  }

  const subdomainMatches = tokens.filter((token) => document.fields.subdomain.includes(token)).length;
  if (subdomainMatches > 0) {
    const subdomainScore = subdomainMatches * RANKING_WEIGHTS.subdomainMatch;
    score += subdomainScore;
    contributions.push(`subdomain alignment (+${subdomainScore.toFixed(1)})`);
  }

  const tagMatches = tokens.filter((token) => document.fields.tags.some((tag) => tag.includes(token))).length;
  if (tagMatches > 0) {
    const tagScore = tagMatches * RANKING_WEIGHTS.tagMatch;
    score += tagScore;
    contributions.push(`tag relevance (+${tagScore.toFixed(1)})`);
  }

  const descriptionMatches = tokens.filter((token) => document.fields.description.includes(token)).length;
  if (descriptionMatches > 0) {
    const descriptionScore = descriptionMatches * RANKING_WEIGHTS.descriptionMatch;
    score += descriptionScore;
    contributions.push(`description relevance (+${descriptionScore.toFixed(1)})`);
  }

  const scoreSignal = (computeScoreSignal(document.company) / 100) * RANKING_WEIGHTS.scoreSignal;
  score += scoreSignal;
  contributions.push(`score signal (+${scoreSignal.toFixed(1)})`);

  if (semanticSimilarity > 0) {
    const semanticBoost = semanticSimilarity * RANKING_WEIGHTS.semanticSimilarity;
    score += semanticBoost;
    contributions.push(`semantic similarity (+${semanticBoost.toFixed(1)})`);
  }

  if (explicitCompanies.length > 0) {
    if (explicitCompanies.some((entry) => entry.id === document.company.id)) {
      score += RANKING_WEIGHTS.explicitCompanyPriority;
      contributions.push(`explicit company priority (+${RANKING_WEIGHTS.explicitCompanyPriority.toFixed(1)})`);
    } else {
      score *= 0.6;
      contributions.push('non-explicit company dampener (x0.6)');
    }
  }

  if (explicitDomainTerms.length > 0) {
    const domainTokens = new Set(tokenize(`${document.company.domain} ${document.company.subdomain} ${document.company.tags.join(' ')}`));
    const hasDomainAlignment = explicitDomainTerms.some((token) => domainTokens.has(token));
    if (!hasDomainAlignment) {
      score += RANKING_WEIGHTS.explicitDomainMissPenalty;
      contributions.push(`domain mismatch (${RANKING_WEIGHTS.explicitDomainMissPenalty.toFixed(1)})`);
    }
  }

  return { score, contributions };
};

const toRelevanceScore = (score, topScore) => {
  if (!topScore || topScore <= 0) {
    return 0;
  }
  return Number(Math.max(0, Math.min(1, score / topScore)).toFixed(3));
};

const buildMatchedFields = (company, matchTokens) => {
  const items = [];

  for (const field of HIGHLIGHTABLE_FIELDS) {
    const fieldValue =
      field === 'tags'
        ? company.tags.join(', ')
        : field === 'description'
          ? company.description
          : company[field] ?? '';

    const normalizedField = normalize(fieldValue);
    const matchedTerms = unique(matchTokens.filter((token) => normalizedField.includes(token)));

    if (!matchedTerms.length) {
      continue;
    }

    items.push({
      field,
      label: sentenceCase(field),
      text: clip(fieldValue),
      matched_terms: matchedTerms,
    });
  }

  return items;
};

const buildComparisonAnalysis = (explicitCompanies) => {
  const selected = explicitCompanies.slice(0, 2);
  if (selected.length < 2) {
    return null;
  }

  const [left, right] = selected;
  const growthDelta = Number((left.growth_score - right.growth_score).toFixed(1));
  const influenceDelta = Number((left.influence_score - right.influence_score).toFixed(1));
  const powerDelta = Number((left.power_score - right.power_score).toFixed(1));

  const leader = left.power_score >= right.power_score ? left : right;
  const momentumLeader = left.growth_score >= right.growth_score ? left : right;

  return {
    companies: selected.map((company) => ({
      id: company.id,
      name: company.name,
      domain: company.domain,
      subdomain: company.subdomain,
      growth_score: company.growth_score,
      influence_score: company.influence_score,
      power_score: company.power_score,
    })),
    short_comparative_analysis: `${leader.name} currently leads on power, while ${momentumLeader.name} shows stronger growth momentum. Score gaps: growth ${Math.abs(growthDelta)}, influence ${Math.abs(influenceDelta)}, power ${Math.abs(powerDelta)}.`,
  };
};

const buildDomainTrend = (rankedResults) => {
  const topDomainCounts = rankedResults.reduce((accumulator, entry) => {
    const key = entry.company.domain;
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});

  const sortedDomains = Object.entries(topDomainCounts).sort((a, b) => b[1] - a[1]);
  if (!sortedDomains.length) {
    return null;
  }

  const [domain, count] = sortedDomains[0];
  if (count < 2) {
    return null;
  }

  return `${domain} appears frequently across top matches (${count}/${rankedResults.length}), indicating concentrated competitive activity for this query.`;
};

const buildDomainRankingSummary = (companies) => {
  const domainMap = new Map();

  for (const company of companies) {
    const current = domainMap.get(company.domain) ?? { domain: company.domain, company_count: 0, avg_power_score: 0, avg_growth_score: 0 };
    current.company_count += 1;
    current.avg_power_score += company.power_score;
    current.avg_growth_score += company.growth_score;
    domainMap.set(company.domain, current);
  }

  return [...domainMap.values()]
    .map((entry) => ({
      ...entry,
      avg_power_score: Number((entry.avg_power_score / entry.company_count).toFixed(1)),
      avg_growth_score: Number((entry.avg_growth_score / entry.company_count).toFixed(1)),
    }))
    .sort((a, b) => b.avg_power_score - a.avg_power_score)
    .slice(0, 5);
};

const buildAnswer = ({ query, intent, rankedResults, explicitCompanies, comparisonAnalysis }) => {
  if (!rankedResults.length) {
    return `I could not find grounded matches for "${query}" in the current company dataset.`;
  }

  if (intent === INTENTS.COMPANY_COMPARISON && comparisonAnalysis) {
    const [left, right] = comparisonAnalysis.companies;
    return `Comparison complete for ${left.name} and ${right.name}: ${comparisonAnalysis.short_comparative_analysis}`;
  }

  if (intent === INTENTS.CROWDED_DOMAIN) {
    const topDomain = rankedResults[0]?.company?.domain;
    return `${topDomain} appears most crowded in the current dataset, based on concentration of relevant companies and score strength.`;
  }

  if (intent === INTENTS.DOMAIN_RANKING) {
    return 'Domain ranking is based on average power and growth signals across companies in each domain.';
  }

  if (intent === INTENTS.COMPETITOR_LOOKUP && explicitCompanies.length) {
    return `Closest tracked competitors to ${explicitCompanies[0].name} are ranked by shared domain/subdomain relevance and score strength.`;
  }

  const topNames = rankedResults.slice(0, 3).map((result) => result.company.name);
  return `Top matches for "${query}" are ${topNames.join(', ')}, selected for high relevance alignment and company score strength.`;
};

const buildStructuredSummary = ({ query, intent, rankedResults, explicitCompanies, comparisonAnalysis, domainRanking }) => {
  if (!rankedResults.length) {
    return {
      key_finding: `No companies in the current dataset had strong relevance for "${query}".`,
      why_these_results_were_chosen: ['No candidates exceeded the relevance threshold.'],
      notable_trend: null,
      limitations: 'Low confidence: query terms did not align well with tracked domains, tags, or company names.',
    };
  }

  const topThree = rankedResults.slice(0, 3);
  const lowConfidence = topThree[0].relevance_score < 0.55;

  const summary = {
    key_finding: `The strongest result is ${topThree[0].company.name}, combining direct query alignment with high score-based strength.`,
    strongest_matching_companies: topThree.map((entry, index) => ({
      rank: index + 1,
      id: entry.company.id,
      name: entry.company.name,
      domain: entry.company.domain,
      power_score: entry.company.power_score,
      relevance_score: entry.relevance_score,
    })),
    why_these_results_were_chosen: topThree.map((entry) => `${entry.company.name}: ${entry.reason}.`),
    notable_trend: buildDomainTrend(rankedResults),
    limitations: lowConfidence
      ? 'Confidence is moderate-to-low because top relevance scores are close, so ranking separation is limited.'
      : 'Results are grounded in tracked company metadata and semantic similarity; external market changes are not included.',
    intent,
  };

  if (comparisonAnalysis) {
    summary.key_finding = `${comparisonAnalysis.companies[0].name} and ${comparisonAnalysis.companies[1].name} were compared directly using growth, influence, and power scores.`;
    summary.comparison = comparisonAnalysis;
  }

  if (intent === INTENTS.DOMAIN_RANKING || intent === INTENTS.CROWDED_DOMAIN) {
    summary.domain_ranking = domainRanking;
  }

  if (intent === INTENTS.COMPETITOR_LOOKUP && explicitCompanies.length) {
    summary.key_finding = `Competitor set for ${explicitCompanies[0].name} emphasizes adjacent players in the same market segment.`;
  }

  return summary;
};

const buildSnippets = (rankedResults, query) =>
  rankedResults
    .slice(0, 3)
    .map(({ company, reason }) => {
      const snippet = `${company.name} (${company.domain}) — ${company.description} ${reason}`;
      return snippet.length > 220 ? `${snippet.slice(0, 217)}...` : snippet;
    })
    .concat(`Search query interpreted as: "${query}".`);

const rankGeneralResults = ({ companies, normalizedQuery, matchTokens, explicitCompanies, explicitDomainTerms }) => {
  const metadataFilter = explicitDomainTerms.length ? { tags: explicitDomainTerms } : {};

  const hybridSignals = retrieveHybridCompanySignals({
    companies,
    query: normalizedQuery,
    tokens: matchTokens,
    metadataFilter,
    semanticOptions: { limit: 20, minSimilarity: 0.08 },
  });

  const ranked = companies
    .map((company) => toSearchDocument(company))
    .map((document) => {
      const semanticSimilarity = hybridSignals.semanticScores.get(document.company.id) ?? 0;
      const keywordScore = hybridSignals.keywordScores.get(document.company.id) ?? 0;
      const metadataScore = hybridSignals.metadataScores.get(document.company.id) ?? 0;

      const { score, contributions } = computeWeightedScore({
        document,
        normalizedQuery,
        tokens: matchTokens,
        explicitCompanies,
        explicitDomainTerms,
        semanticSimilarity,
      });

      const hybridBoost = keywordScore * 3 + metadataScore * 4;
      const boostedScore = score + hybridBoost;
      if (hybridBoost > 0) {
        contributions.push(`hybrid retrieval boost (+${hybridBoost.toFixed(1)})`);
      }

      if (hybridSignals.retrieval.usedFallback) {
        contributions.push('semantic retrieval fallback to keyword and metadata signals');
      }

      return {
        company: document.company,
        score: boostedScore,
        reason: contributions.slice(0, 5).join('; '),
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, SEARCH_LIMIT);

  const topScore = ranked[0]?.score ?? 0;
  return ranked.map((entry) => ({ ...entry, relevance_score: toRelevanceScore(entry.score, topScore) }));
};

const rankByMetric = ({ companies, metric, explicitDomainTerms, explicitCompanies }) => {
  const filtered = companies.filter((company) => {
    if (!explicitDomainTerms.length) {
      return true;
    }

    const domainTokens = new Set(tokenize(`${company.domain} ${company.subdomain} ${company.tags.join(' ')}`));
    return explicitDomainTerms.some((token) => domainTokens.has(token));
  });

  const rankedSource = filtered.length ? filtered : companies;
  const includesExplicit = explicitCompanies.length > 0;
  const base = rankedSource
    .slice()
    .sort((a, b) => b[metric] - a[metric])
    .map((company) => ({
      company,
      score: company[metric],
      reason: `${sentenceCase(metric.replace('_', ' '))} signal ${company[metric].toFixed(1)} with power ${company.power_score.toFixed(1)} and influence ${company.influence_score.toFixed(1)}.`,
    }));

  const reordered = includesExplicit
    ? [
        ...base.filter((entry) => explicitCompanies.some((company) => company.id === entry.company.id)),
        ...base.filter((entry) => !explicitCompanies.some((company) => company.id === entry.company.id)),
      ]
    : base;

  const top = reordered.slice(0, SEARCH_LIMIT);
  const topScore = top[0]?.score ?? 0;

  return top.map((entry) => ({ ...entry, relevance_score: toRelevanceScore(entry.score, topScore) }));
};

const rankCompetitors = ({ companies, anchorCompany }) => {
  if (!anchorCompany) {
    return [];
  }

  const ranked = companies
    .filter((company) => company.id !== anchorCompany.id)
    .map((company) => {
      const sameDomain = company.domain === anchorCompany.domain ? 1 : 0;
      const sameSubdomain = company.subdomain === anchorCompany.subdomain ? 1 : 0;
      const tagOverlap = company.tags.filter((tag) => anchorCompany.tags.includes(tag)).length;
      const strengthSignal = computeScoreSignal(company) / 100;
      const score = sameDomain * 40 + sameSubdomain * 30 + tagOverlap * 6 + strengthSignal * 20;

      const reasons = [];
      if (sameDomain) reasons.push('same domain');
      if (sameSubdomain) reasons.push('same subdomain');
      if (tagOverlap) reasons.push(`shared tags (${tagOverlap})`);
      reasons.push(`score signal ${computeScoreSignal(company).toFixed(1)}`);

      return {
        company,
        score,
        reason: reasons.join('; '),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, SEARCH_LIMIT);

  const topScore = ranked[0]?.score ?? 0;
  return ranked.map((entry) => ({ ...entry, relevance_score: toRelevanceScore(entry.score, topScore) }));
};

export const searchCompanies = (query) => {
  const normalizedQuery = typeof query === 'string' ? query.trim() : '';

  if (!normalizedQuery) {
    return {
      query: normalizedQuery,
      answer: 'Please provide a non-empty query.',
      results: [],
      supporting_snippets: [],
    };
  }

  const normalizedLower = normalize(normalizedQuery);
  const companies = getCompanies();
  const tokens = unique(tokenize(normalizedLower));
  const matchTokens = tokens.filter((token) => !STOPWORDS.has(token));
  const effectiveTokens = matchTokens.length ? matchTokens : tokens;
  const explicitDomainTerms = effectiveTokens.filter((token) => DOMAIN_VOCABULARY.has(token));
  const explicitCompanies = extractExplicitCompanies(normalizedLower, companies);
  const intent = detectIntent(normalizedLower);

  let rankedResults = [];

  if (intent === INTENTS.COMPANY_COMPARISON && explicitCompanies.length >= 2) {
    rankedResults = explicitCompanies.slice(0, 2).map((company) => ({
      company,
      score: computeScoreSignal(company),
      relevance_score: 1,
      reason: 'explicit company comparison target with direct scorecard evaluation',
    }));
  } else if (intent === INTENTS.FASTEST_GROWING) {
    rankedResults = rankByMetric({
      companies,
      metric: 'growth_score',
      explicitDomainTerms,
      explicitCompanies,
    });
  } else if (intent === INTENTS.STRONGEST) {
    rankedResults = rankByMetric({
      companies,
      metric: 'power_score',
      explicitDomainTerms,
      explicitCompanies,
    });
  } else if (intent === INTENTS.COMPETITOR_LOOKUP) {
    rankedResults = rankCompetitors({
      companies,
      anchorCompany: explicitCompanies[0],
    });

    if (!rankedResults.length) {
      rankedResults = rankGeneralResults({
        companies,
        normalizedQuery: normalizedLower,
        matchTokens: effectiveTokens,
        explicitCompanies,
        explicitDomainTerms,
      });
    }
  } else {
    rankedResults = rankGeneralResults({
      companies,
      normalizedQuery: normalizedLower,
      matchTokens: effectiveTokens,
      explicitCompanies,
      explicitDomainTerms,
    });
  }

  const comparisonAnalysis = intent === INTENTS.COMPANY_COMPARISON ? buildComparisonAnalysis(explicitCompanies) : null;
  const domainRanking = intent === INTENTS.DOMAIN_RANKING || intent === INTENTS.CROWDED_DOMAIN ? buildDomainRankingSummary(companies) : null;

  return {
    query: normalizedQuery,
    intent,
    answer: buildAnswer({
      query: normalizedQuery,
      intent,
      rankedResults,
      explicitCompanies,
      comparisonAnalysis,
    }),
    analysis: buildStructuredSummary({
      query: normalizedQuery,
      intent,
      rankedResults,
      explicitCompanies,
      comparisonAnalysis,
      domainRanking,
    }),
    results: rankedResults.map(({ company, reason, relevance_score }) => ({
      id: company.id,
      name: company.name,
      domain: company.domain,
      subdomain: company.subdomain,
      tags: company.tags,
      growth_score: company.growth_score,
      influence_score: company.influence_score,
      power_score: company.power_score,
      relevance_score,
      reason,
      matched_fields: buildMatchedFields(company, effectiveTokens),
    })),
    supporting_snippets: buildSnippets(rankedResults, normalizedQuery),
  };
};
