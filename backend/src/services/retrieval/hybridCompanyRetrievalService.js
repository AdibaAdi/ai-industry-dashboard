import { ensureCompanyVectorIndex, searchCompanyVectors } from '../vector/vectorStoreService.js';

const normalize = (value) => (typeof value === 'string' ? value.toLowerCase().trim() : '');

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

export const retrieveHybridCompanySignals = async ({
  companies,
  query,
  metadataFilter,
  semanticOptions = {},
}) => {
  const normalizedQuery = normalize(query);
  const metadataScores = new Map();

  for (const company of companies) {
    metadataScores.set(company.id, scoreMetadataMatch(company, metadataFilter));
  }

  let semanticScores = new Map();
  let usedSemantic = false;

  try {
    await ensureCompanyVectorIndex(companies);
    const semanticMatches = await searchCompanyVectors(normalizedQuery, {
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

  return {
    metadataScores,
    semanticScores,
    retrieval: {
      usedSemantic,
      usedFallback: !usedSemantic,
      activeSignals: [
        'semantic_similarity',
        'metadata_filtering',
      ],
    },
  };
};
