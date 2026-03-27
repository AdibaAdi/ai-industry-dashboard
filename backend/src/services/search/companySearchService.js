import { getCompanies } from '../../data/repositories/companyRepository.js';
import { retrieveHybridCompanySignals } from '../retrieval/hybridCompanyRetrievalService.js';
import { ensureCompanyVectorIndex, getVectorRetrievalInfo, searchCompanyVectors } from '../vector/vectorStoreService.js';

const SEARCH_LIMIT = 6;
const RAG_RETRIEVAL_LIMIT = 18;
const RAG_CANDIDATE_LIMIT = 12;

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
  exactCompanyNameMatch: 60,
  partialCompanyNameMatch: 28,
  domainMatch: 26,
  subdomainMatch: 12,
  tagMatch: 11,
  descriptionMatch: 6,
  semanticSimilarity: 14,
  scoreSignal: 10,
  explicitCompanyPriority: 20,
  explicitDomainMissPenalty: -22,
  semanticRelevanceBaseline: 72,
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
  const breakdown = {
    name: 0,
    domain: 0,
    subdomain: 0,
    tags: 0,
    description: 0,
    semantic: 0,
    scoreSignal: 0,
    hasDomainFamilyMatch: false,
  };
  let score = 0;

  const companyName = document.fields.name;
  const nameTokens = tokenize(companyName);

  if (companyName === normalizedQuery || explicitCompanies.some((entry) => entry.id === document.company.id)) {
    score += RANKING_WEIGHTS.exactCompanyNameMatch;
    breakdown.name += RANKING_WEIGHTS.exactCompanyNameMatch;
    contributions.push(`exact company match (+${RANKING_WEIGHTS.exactCompanyNameMatch.toFixed(1)})`);
  } else if (tokens.some((token) => nameTokens.includes(token) || companyName.includes(token))) {
    score += RANKING_WEIGHTS.partialCompanyNameMatch;
    breakdown.name += RANKING_WEIGHTS.partialCompanyNameMatch;
    contributions.push(`company name overlap (+${RANKING_WEIGHTS.partialCompanyNameMatch.toFixed(1)})`);
  }

  const domainMatches = tokens.filter((token) => document.fields.domain.includes(token)).length;
  if (domainMatches > 0) {
    const domainScore = domainMatches * RANKING_WEIGHTS.domainMatch;
    score += domainScore;
    breakdown.domain += domainScore;
    breakdown.hasDomainFamilyMatch = true;
    contributions.push(`domain alignment (+${domainScore.toFixed(1)})`);
  }

  const subdomainMatches = tokens.filter((token) => document.fields.subdomain.includes(token)).length;
  if (subdomainMatches > 0) {
    const subdomainScore = subdomainMatches * RANKING_WEIGHTS.subdomainMatch;
    score += subdomainScore;
    breakdown.subdomain += subdomainScore;
    breakdown.hasDomainFamilyMatch = true;
    contributions.push(`subdomain alignment (+${subdomainScore.toFixed(1)})`);
  }

  const tagMatches = tokens.filter((token) => document.fields.tags.some((tag) => tag.includes(token))).length;
  if (tagMatches > 0) {
    const tagScore = tagMatches * RANKING_WEIGHTS.tagMatch;
    score += tagScore;
    breakdown.tags += tagScore;
    contributions.push(`tag relevance (+${tagScore.toFixed(1)})`);
  }

  const descriptionMatches = tokens.filter((token) => document.fields.description.includes(token)).length;
  if (descriptionMatches > 0) {
    const descriptionScore = descriptionMatches * RANKING_WEIGHTS.descriptionMatch;
    score += descriptionScore;
    breakdown.description += descriptionScore;
    contributions.push(`description relevance (+${descriptionScore.toFixed(1)})`);
  }

  const scoreSignal = (computeScoreSignal(document.company) / 100) * RANKING_WEIGHTS.scoreSignal;
  score += scoreSignal;
  breakdown.scoreSignal += scoreSignal;
  contributions.push(`score signal (+${scoreSignal.toFixed(1)})`);

  if (semanticSimilarity > 0) {
    const semanticBoost = semanticSimilarity * RANKING_WEIGHTS.semanticRelevanceBaseline;
    score += semanticBoost;
    breakdown.semantic += semanticBoost;
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

  return { score, contributions, breakdown };
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

const uniqueCompaniesById = (companies) => {
  const seen = new Set();
  return companies.filter((company) => {
    if (seen.has(company.id)) {
      return false;
    }
    seen.add(company.id);
    return true;
  });
};

const retrieveRagCandidates = ({ companies, normalizedQuery, explicitCompanies, explicitDomainTerms }) => {
  const byId = new Map(companies.map((company) => [company.id, company]));
  const retrievalTrace = {
    method: 'embedding_similarity',
    requested_limit: RAG_RETRIEVAL_LIMIT,
    retrieved_ids: [],
    used_fallback: false,
  };

  try {
    ensureCompanyVectorIndex(companies);
    const matches = searchCompanyVectors(normalizedQuery, {
      limit: RAG_RETRIEVAL_LIMIT,
      minSimilarity: 0.05,
    });

    retrievalTrace.retrieved_ids = matches.map((entry) => entry.id);

    const fromVectors = matches
      .map((entry) => byId.get(entry.id))
      .filter(Boolean);

    const candidates = uniqueCompaniesById([
      ...explicitCompanies,
      ...fromVectors,
    ]);

    if (candidates.length) {
      return {
        candidates: candidates.slice(0, RAG_CANDIDATE_LIMIT),
        retrievalTrace,
      };
    }
  } catch {
    retrievalTrace.used_fallback = true;
  }

  const fallback = explicitDomainTerms.length
    ? companies.filter((company) => {
        const domainTokens = new Set(tokenize(`${company.domain} ${company.subdomain} ${company.tags.join(' ')}`));
        return explicitDomainTerms.some((token) => domainTokens.has(token));
      })
    : companies;

  return {
    candidates: uniqueCompaniesById([...explicitCompanies, ...fallback]).slice(0, RAG_CANDIDATE_LIMIT),
    retrievalTrace: { ...retrievalTrace, used_fallback: true },
  };
};

const buildAnswer = ({ query, intent, rankedResults, explicitCompanies, comparisonAnalysis, ragContext }) => {
  if (!rankedResults.length) {
    return `I could not find grounded matches for "${query}" in the current company dataset.`;
  }

  if (intent === INTENTS.COMPANY_COMPARISON && comparisonAnalysis) {
    const [left, right] = comparisonAnalysis.companies;
    return `Comparison complete for ${left.name} and ${right.name}: ${comparisonAnalysis.short_comparative_analysis}`;
  }

  if (intent === INTENTS.CROWDED_DOMAIN) {
    const topDomain = rankedResults[0]?.company?.domain;
    return `${topDomain} appears most crowded in the current dataset, based on concentration of retrieved companies and score strength.`;
  }

  if (intent === INTENTS.DOMAIN_RANKING) {
    return 'Domain ranking is based on average power and growth signals across companies in each domain.';
  }

  if (intent === INTENTS.COMPETITOR_LOOKUP && explicitCompanies.length) {
    return `Closest tracked competitors to ${explicitCompanies[0].name} are ranked by shared domain/subdomain relevance and score strength.`;
  }

  const topNames = rankedResults.slice(0, 3).map((result) => result.company.name);
  return `Top matches for "${query}" are ${topNames.join(', ')}, selected from ${ragContext.candidateCount} retrieved companies using embeddings plus score-strength reranking.`;
};

const buildStructuredSummary = ({ query, intent, rankedResults, explicitCompanies, comparisonAnalysis, domainRanking, ragContext }) => {
  if (!rankedResults.length) {
    return {
      key_finding: `No companies in the current dataset had strong relevance for "${query}".`,
      why_these_results_were_chosen: ['No candidates exceeded the relevance threshold.'],
      notable_trend: null,
      domain_trend: null,
      limitations: 'Low confidence: query terms did not align well with tracked domains, tags, or company names.',
      reasoning: [
        `Retrieved ${ragContext.candidateCount} candidates from embedding search.`,
        'Applied weighted relevance scoring over company profile fields and strength metrics.',
        'No company passed the confidence threshold for grounded ranking.',
      ],
    };
  }

  const topThree = rankedResults.slice(0, 3);
  const lowConfidence = topThree[0].relevance_score < 0.55;

  const summary = {
    key_finding: `The strongest result is ${topThree[0].company.name}, with weighted relevance led by name/domain alignment, followed by tags, description, and company strength signals.`,
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
    domain_trend: buildDomainTrend(rankedResults),
    limitations: lowConfidence
      ? 'Confidence is moderate-to-low because top relevance scores are close, so ranking separation is limited.'
      : 'Results are grounded in tracked company metadata and semantic similarity; external market changes are not included.',
    intent,
    reasoning: [
      `Embedded query and retrieved top ${ragContext.candidateCount} semantically similar companies from the vector index.`,
      'Reranked candidates using domain/subdomain/tag/description matches and growth/influence/power signals.',
      'Generated answer and summary strictly from retrieved candidates in the current dataset.',
    ],
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

const formatReasonFromBreakdown = ({ company, contributions, breakdown, semanticSimilarity, metadataScore }) => {
  const reasonParts = [];
  const sortedSignals = [
    ['name', breakdown.name, 'name match'],
    ['domain', breakdown.domain + breakdown.subdomain, 'domain/subdomain match'],
    ['tags', breakdown.tags, 'tag match'],
    ['description', breakdown.description, 'description match'],
  ]
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sortedSignals.length) {
    reasonParts.push(
      `primary relevance from ${sortedSignals
        .map(([, value, label]) => `${label} (+${value.toFixed(1)})`)
        .join(', ')}`,
    );
  } else {
    reasonParts.push('selected mainly from semantic similarity and company strength signals');
  }

  if (semanticSimilarity > 0) {
    reasonParts.push(`semantic similarity ${semanticSimilarity.toFixed(3)}`);
  }

  if (metadataScore > 0) {
    reasonParts.push(`retrieval boost metadata=${metadataScore.toFixed(2)}`);
  }

  if (contributions.some((part) => part.includes('domain mismatch'))) {
    reasonParts.push('penalized for weak direct domain alignment');
  }

  reasonParts.push(`company strength signal ${computeScoreSignal(company).toFixed(1)}`);
  return reasonParts.join('; ');
};

const applyLowRelevanceFilter = (rankedEntries, { explicitCompanies }) => {
  if (!rankedEntries.length) {
    return rankedEntries;
  }

  const topScore = rankedEntries[0].score;
  const minRelativeScore = topScore * 0.34;
  const minAbsoluteScore = 24;

  const filtered = rankedEntries.filter((entry) => {
    const isExplicit = explicitCompanies.some((company) => company.id === entry.company.id);
    if (isExplicit) {
      return true;
    }

    const hasDirectSignal =
      entry.breakdown.name > 0 ||
      entry.breakdown.domain > 0 ||
      entry.breakdown.subdomain > 0 ||
      entry.breakdown.tags > 0 ||
      entry.semanticSimilarity >= 0.12;

    return entry.score >= minAbsoluteScore && entry.score >= minRelativeScore && hasDirectSignal;
  });

  return filtered.length ? filtered : rankedEntries.slice(0, Math.min(3, rankedEntries.length));
};

const rankGeneralResults = ({ companies, normalizedQuery, matchTokens, explicitCompanies, explicitDomainTerms }) => {
  const metadataFilter = explicitDomainTerms.length ? { tags: explicitDomainTerms } : {};

  const hybridSignals = retrieveHybridCompanySignals({
    companies,
    query: normalizedQuery,
    metadataFilter,
    semanticOptions: { limit: 20, minSimilarity: 0.06 },
  });

  const ranked = companies
    .map((company) => toSearchDocument(company))
    .map((document) => {
      const semanticSimilarity = hybridSignals.semanticScores.get(document.company.id) ?? 0;
      const metadataScore = hybridSignals.metadataScores.get(document.company.id) ?? 0;

      const { score, contributions, breakdown } = computeWeightedScore({
        document,
        normalizedQuery,
        tokens: matchTokens,
        explicitCompanies,
        explicitDomainTerms,
        semanticSimilarity,
      });

      const metadataBoost = metadataScore * 4;
      const boostedScore = score + metadataBoost;
      if (metadataBoost > 0) {
        contributions.push(`metadata retrieval boost (+${metadataBoost.toFixed(1)})`);
      }

      if (hybridSignals.retrieval.usedFallback) {
        contributions.push('semantic retrieval fallback to metadata and company strength signals');
      }

      return {
        company: document.company,
        score: boostedScore,
        reason: '',
        contributions,
        breakdown,
        semanticSimilarity,
        metadataScore,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const filteredRanked = applyLowRelevanceFilter(ranked, { explicitCompanies }).slice(0, SEARCH_LIMIT);

  const topScore = filteredRanked[0]?.score ?? 0;
  return filteredRanked.map((entry) => ({
    ...entry,
    relevance_score: toRelevanceScore(entry.score, topScore),
    reason: formatReasonFromBreakdown(entry),
  }));
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
  const { candidates: ragCandidates, retrievalTrace } = retrieveRagCandidates({
    companies,
    normalizedQuery: normalizedLower,
    explicitCompanies,
    explicitDomainTerms,
  });

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
      companies: ragCandidates.length ? ragCandidates : companies,
      metric: 'growth_score',
      explicitDomainTerms,
      explicitCompanies,
    });
  } else if (intent === INTENTS.STRONGEST) {
    rankedResults = rankByMetric({
      companies: ragCandidates.length ? ragCandidates : companies,
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
        companies: ragCandidates.length ? ragCandidates : companies,
        normalizedQuery: normalizedLower,
        matchTokens: effectiveTokens,
        explicitCompanies,
        explicitDomainTerms,
      });
    }
  } else {
    rankedResults = rankGeneralResults({
      companies: ragCandidates.length ? ragCandidates : companies,
      normalizedQuery: normalizedLower,
      matchTokens: effectiveTokens,
      explicitCompanies,
      explicitDomainTerms,
    });
  }

  const comparisonAnalysis = intent === INTENTS.COMPANY_COMPARISON ? buildComparisonAnalysis(explicitCompanies) : null;
  const domainRanking = intent === INTENTS.DOMAIN_RANKING || intent === INTENTS.CROWDED_DOMAIN ? buildDomainRankingSummary(companies) : null;
  const retrievalInfo = getVectorRetrievalInfo();
  const ragContext = {
    candidateCount: ragCandidates.length,
    retrievalTrace,
    retrievalInfo,
  };

  return {
    query: normalizedQuery,
    intent,
    answer: buildAnswer({
      query: normalizedQuery,
      intent,
      rankedResults,
      explicitCompanies,
      comparisonAnalysis,
      ragContext,
    }),
    analysis: buildStructuredSummary({
      query: normalizedQuery,
      intent,
      rankedResults,
      explicitCompanies,
      comparisonAnalysis,
      domainRanking,
      ragContext,
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
    rag: {
      grounded_in_dataset: true,
      retrieval: {
        strategy: 'embedding_top_k_then_rerank',
        embedding_provider: retrievalInfo.provider,
        embedding_dimensions: retrievalInfo.dimensions,
        candidate_count: ragCandidates.length,
        retrieved_company_ids: retrievalTrace.retrieved_ids,
        fallback_used: retrievalTrace.used_fallback,
      },
      grounding: rankedResults.slice(0, 3).map(({ company, reason, relevance_score }) => ({
        id: company.id,
        name: company.name,
        evidence: {
          domain: company.domain,
          subdomain: company.subdomain,
          tags: company.tags,
          scores: {
            growth: company.growth_score,
            influence: company.influence_score,
            power: company.power_score,
            relevance: relevance_score,
          },
        },
        rationale: reason,
      })),
    },
  };
};
