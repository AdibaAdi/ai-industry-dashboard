import { getCompanies } from '../../data/repositories/companyRepository.js';
import { ensureCompanyVectorIndex, searchCompanyVectors } from '../vector/vectorStoreService.js';

const FIELD_WEIGHTS = {
  name: 8,
  description: 5,
  domain: 6,
  subdomain: 5,
  tags: 4,
  strengths: 4,
  insights: 3,
};

const HIGHLIGHTABLE_FIELDS = ['domain', 'subdomain', 'tags', 'description'];

const SEARCH_LIMIT = 6;

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
  'strongest',
  'companies',
  'company',
  'ai',
]);

const tokenize = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1);

const unique = (items) => [...new Set(items)];

const inferStrengths = (company) => {
  const strengths = [];

  if (company.power_score >= 92) {
    strengths.push('market-leading power score');
  } else if (company.power_score >= 85) {
    strengths.push('strong competitive position');
  }

  if (company.growth_score >= 90) {
    strengths.push('high growth momentum');
  }

  if (company.influence_score >= 90) {
    strengths.push('high ecosystem influence');
  }

  return strengths;
};

const inferInsights = (company) => [
  `Power score ${company.power_score.toFixed(1)} with growth score ${company.growth_score.toFixed(1)}.`,
  `${company.name} is positioned in ${company.domain} / ${company.subdomain}.`,
];

const toSearchDocument = (company) => {
  const strengths = company.strengths?.length ? company.strengths : inferStrengths(company);
  const insights = company.insights?.length ? company.insights : inferInsights(company);

  return {
    company,
    fields: {
      name: company.name,
      description: company.description,
      domain: company.domain,
      subdomain: company.subdomain,
      tags: company.tags.join(' '),
      strengths: strengths.join(' '),
      insights: insights.join(' '),
    },
  };
};

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

const scoreDocument = (document, query, matchTokens, intentTokens, explicitDomainTerms) => {
  const contributions = [];
  let score = 0;

  for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
    const fieldValue = document.fields[field] ?? '';
    const fieldText = fieldValue.toLowerCase();
    if (!fieldText) {
      continue;
    }

    let fieldMatches = 0;
    for (const token of matchTokens) {
      if (fieldText.includes(token)) {
        fieldMatches += 1;
      }
    }

    if (fieldMatches > 0) {
      const fieldScore = fieldMatches * weight;
      score += fieldScore;
      contributions.push(`${field} match (+${fieldScore.toFixed(1)})`);
    }

    if (query.length > 4 && fieldText.includes(query)) {
      const phraseScore = weight * 1.5;
      score += phraseScore;
      contributions.push(`${field} phrase match (+${phraseScore.toFixed(1)})`);
    }
  }

  const alignmentTokens = new Set(tokenize(`${document.company.domain} ${document.company.subdomain} ${document.company.tags.join(' ')}`));
  const alignmentOverlap = intentTokens.filter((token) => alignmentTokens.has(token)).length;

  if (alignmentOverlap > 0) {
    const alignmentScore = alignmentOverlap * 6;
    score += alignmentScore;
    contributions.push(`metadata alignment (+${alignmentScore.toFixed(1)})`);
  }

  const hasExplicitDomainMatch = explicitDomainTerms.some((term) => alignmentTokens.has(term));
  if (explicitDomainTerms.length > 0 && !hasExplicitDomainMatch) {
    score -= 10;
    contributions.push('domain mismatch penalty (-10.0)');
  }

  const metadataScore = document.company.power_score / 10 + document.company.growth_score / 20 + document.company.influence_score / 20;
  score += metadataScore;
  contributions.push(`power-weighted signal (+${metadataScore.toFixed(1)})`);

  return {
    score,
    contributions,
  };
};

const buildSnippets = (rankedResults, query) =>
  rankedResults
    .slice(0, 3)
    .map(({ company, reason }) => {
      const snippet = `${company.name} (${company.domain}) — ${company.description} ${reason}`;
      return snippet.length > 220 ? `${snippet.slice(0, 217)}...` : snippet;
    })
    .concat(`Search query interpreted as: "${query}".`);

const sentenceCase = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const clip = (value, maxLength = 180) => {
  if (!value || value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 3)}...`;
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

    const normalizedField = fieldValue.toLowerCase();
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

  return `${domain} appears frequently across top matches (${count}/${rankedResults.length}), suggesting concentrated momentum for this query.`;
};

const buildAnswer = (query, rankedResults) => {
  if (!rankedResults.length) {
    return `I could not find grounded matches for "${query}" in the current company dataset.`;
  }

  const topNames = rankedResults.slice(0, 3).map((result) => result.company.name);
  const dominantDomain = rankedResults[0].company.domain;

  return `Based on the tracked dataset, ${topNames.join(', ')} are the strongest matches for "${query}". Top-ranked results cluster around ${dominantDomain} with strong power and relevance signals.`;
};

const buildStructuredSummary = (query, rankedResults) => {
  if (!rankedResults.length) {
    return {
      key_finding: `No companies in the current dataset had strong relevance for "${query}".`,
      strongest_matching_companies: [],
      why_they_match: [],
      domain_trend: null,
    };
  }

  const topThree = rankedResults.slice(0, 3);

  return {
    key_finding: `Top-ranked companies combine strong relevance signals with high power scores, led by ${topThree[0].company.name}.`,
    strongest_matching_companies: topThree.map((entry, index) => ({
      rank: index + 1,
      id: entry.company.id,
      name: entry.company.name,
      domain: entry.company.domain,
      power_score: entry.company.power_score,
    })),
    why_they_match: topThree.map((entry) => `${entry.company.name}: ${entry.reason}.`),
    domain_trend: buildDomainTrend(rankedResults),
  };
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

  const tokens = unique(tokenize(normalizedQuery));
  const intentTokens = tokens.filter((token) => !STOPWORDS.has(token));
  const matchTokens = intentTokens.length ? intentTokens : tokens;
  const explicitDomainTerms = intentTokens.filter((token) => DOMAIN_VOCABULARY.has(token));
  const companies = getCompanies();
  let semanticScoreById = new Map();

  try {
    ensureCompanyVectorIndex(companies);
    const semanticMatches = searchCompanyVectors(normalizedQuery, { limit: 16, minSimilarity: 0.08 });
    semanticScoreById = new Map(semanticMatches.map((entry) => [entry.id, entry.score]));
  } catch {
    semanticScoreById = new Map();
  }

  const ranked = companies
    .map((company) => toSearchDocument(company))
    .map((document) => {
      const { score, contributions } = scoreDocument(document, normalizedQuery, matchTokens, intentTokens, explicitDomainTerms);
      const semanticSimilarity = semanticScoreById.get(document.company.id) ?? 0;
      const semanticBoost = semanticSimilarity * 24;
      const totalScore = score + semanticBoost;

      if (semanticBoost > 0) {
        contributions.push(`semantic similarity (+${semanticBoost.toFixed(1)})`);
      }

      return {
        company: document.company,
        score: totalScore,
        reason: contributions.slice(0, 3).join('; '),
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, SEARCH_LIMIT);

  return {
    query: normalizedQuery,
    answer: buildAnswer(normalizedQuery, ranked),
    analysis: buildStructuredSummary(normalizedQuery, ranked),
    results: ranked.map(({ company, reason }) => ({
      id: company.id,
      name: company.name,
      domain: company.domain,
      subdomain: company.subdomain,
      tags: company.tags,
      power_score: company.power_score,
      reason,
      matched_fields: buildMatchedFields(company, matchTokens),
    })),
    supporting_snippets: buildSnippets(ranked, normalizedQuery),
  };
};
