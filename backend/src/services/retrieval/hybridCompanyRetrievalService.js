import { ensureCompanyVectorIndex, searchCompanyVectors } from '../vector/vectorStoreService.js';

const tokenize = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1);

const normalize = (value) => (typeof value === 'string' ? value.toLowerCase().trim() : '');

const scoreKeywordMatch = (company, tokens, normalizedQuery) => {
  const normalizedName = normalize(company.name);
  const normalizedDescription = normalize(company.description);
  const normalizedDomain = normalize(company.domain);
  const normalizedSubdomain = normalize(company.subdomain);
  const normalizedTags = company.tags.map((tag) => normalize(tag));

  let score = 0;

  if (normalizedName === normalizedQuery) {
    score += 1;
  }

  for (const token of tokens) {
    if (normalizedName.includes(token)) score += 0.5;
    if (normalizedDomain.includes(token)) score += 0.4;
    if (normalizedSubdomain.includes(token)) score += 0.35;
    if (normalizedDescription.includes(token)) score += 0.25;
    if (normalizedTags.some((tag) => tag.includes(token))) score += 0.3;
  }

  return score;
};

const scoreMetadataMatch = (company, options = {}) => {
  const domainFilter = options.domain ? normalize(options.domain) : null;
  const subdomainFilter = options.subdomain ? normalize(options.subdomain) : null;
  const tagFilter = options.tags?.map((tag) => normalize(tag)) ?? [];

  let score = 0;

  if (domainFilter && normalize(company.domain) === domainFilter) {
    score += 1;
  }

  if (subdomainFilter && normalize(company.subdomain) === subdomainFilter) {
    score += 0.8;
  }

  if (tagFilter.length) {
    const matchedTags = company.tags.map((tag) => normalize(tag)).filter((tag) => tagFilter.includes(tag)).length;
    score += matchedTags * 0.45;
  }

  return score;
};

export const retrieveHybridCompanySignals = ({
  companies,
  query,
  tokens,
  metadataFilter,
  semanticOptions = {},
}) => {
  const normalizedQuery = normalize(query);
  const effectiveTokens = tokens?.length ? tokens : tokenize(normalizedQuery);

  const keywordScores = new Map();
  const metadataScores = new Map();

  for (const company of companies) {
    keywordScores.set(company.id, scoreKeywordMatch(company, effectiveTokens, normalizedQuery));
    metadataScores.set(company.id, scoreMetadataMatch(company, metadataFilter));
  }

  let semanticScores = new Map();
  let usedSemantic = false;

  try {
    ensureCompanyVectorIndex(companies);
    const semanticMatches = searchCompanyVectors(normalizedQuery, {
      limit: semanticOptions.limit ?? 20,
      minSimilarity: semanticOptions.minSimilarity ?? 0.08,
      metadataFilter,
    });
    semanticScores = new Map(semanticMatches.map((entry) => [entry.id, entry.score]));
    usedSemantic = semanticMatches.length > 0;
  } catch {
    semanticScores = new Map();
    usedSemantic = false;
  }

  const usedFallback = !usedSemantic;

  return {
    keywordScores,
    metadataScores,
    semanticScores,
    retrieval: {
      usedSemantic,
      usedFallback,
      activeSignals: [
        'exact_keyword_matching',
        'metadata_filtering',
        usedSemantic ? 'semantic_similarity' : 'semantic_similarity_unavailable',
      ],
    },
  };
};
