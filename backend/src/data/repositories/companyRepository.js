import { companies as seedCompanies } from '../companies.js';
import { normalizeCompanyScores } from '../../services/scoringService.js';

const withOperationalMetadata = (company) => {
  const now = new Date().toISOString();
  const createdAt = company.created_at ?? now;

  return {
    ...company,
    created_at: createdAt,
    updated_at: company.updated_at ?? createdAt,
    ingestion_status: company.ingestion_status ?? 'seeded',
    confidence_score: Number((company.confidence_score ?? 0.82).toFixed(2)),
    predicted_domain: company.predicted_domain ?? company.domain ?? '',
    predicted_subdomain: company.predicted_subdomain ?? company.subdomain ?? '',
    classification_confidence: Number((company.classification_confidence ?? company.confidence_score ?? 0.82).toFixed(2)),
    classification_source: company.classification_source ?? 'seed-manual',
    classification_provider: company.classification_provider ?? 'seed-data',
    sources: company.sources ?? ['Crunchbase', 'Company Website', 'Industry Reports'],
    data_source: company.data_source ?? 'seed-data',
  };
};

const hydrateCompanies = (companies) => normalizeCompanyScores(companies.map(withOperationalMetadata));

let cachedCompanies = hydrateCompanies(seedCompanies);

export const getCompanies = () => cachedCompanies;

export const getCompanyById = (id) => cachedCompanies.find((company) => company.id === id) ?? null;

export const setCompanies = (nextCompanies) => {
  cachedCompanies = hydrateCompanies(nextCompanies);
};

export const upsertCompanies = (companies) => {
  const now = new Date().toISOString();
  const currentById = new Map(cachedCompanies.map((company) => [company.id, company]));
  const inserted = [];
  const updated = [];

  for (const company of companies) {
    const existing = currentById.get(company.id);

    if (existing) {
      const merged = {
        ...existing,
        ...company,
        created_at: existing.created_at,
        updated_at: company.updated_at ?? now,
      };
      currentById.set(company.id, merged);
      updated.push(company.id);
      continue;
    }

    currentById.set(company.id, {
      ...company,
      created_at: company.created_at ?? now,
      updated_at: company.updated_at ?? now,
    });
    inserted.push(company.id);
  }

  cachedCompanies = hydrateCompanies([...currentById.values()]);

  return {
    inserted,
    updated,
    records: cachedCompanies.filter((company) => inserted.includes(company.id) || updated.includes(company.id)),
  };
};
