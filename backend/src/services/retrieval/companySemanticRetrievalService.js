import {
  ensureCompanyVectorIndex,
  getVectorRetrievalInfo,
  searchCompanyVectors,
} from '../vector/vectorStoreService.js';

export const ensureSemanticCompanyIndex = async (companies) => {
  await ensureCompanyVectorIndex(companies);
};

export const retrieveRelevantCompanyDocuments = async ({
  companies,
  query,
  limit = 12,
  minSimilarity = 0.05,
  metadataFilter = {},
}) => {
  await ensureSemanticCompanyIndex(companies);
  return searchCompanyVectors(query, {
    limit,
    minSimilarity,
    metadataFilter,
  });
};

export const getSemanticRetrievalInfo = () => getVectorRetrievalInfo();
