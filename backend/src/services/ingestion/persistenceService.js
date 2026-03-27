import { upsertCompanies } from '../../data/repositories/companyRepository.js';

export const persistIngestedCompanies = (companies) => {
  const persistedAt = new Date().toISOString();
  const persistedCompanies = companies.map((company) => ({
    ...company,
    updated_at: persistedAt,
    ingestion_status: 'persisted',
    last_updated: persistedAt.slice(0, 10),
  }));

  return upsertCompanies(persistedCompanies);
};
