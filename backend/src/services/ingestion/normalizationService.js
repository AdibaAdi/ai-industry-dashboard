import { companyTypeSchema } from '../../types/companyTypes.js';

const toSlug = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const toNumeric = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
};

export const normalizeCompanyRecord = (rawCompany) => {
  const name = String(rawCompany.name ?? '').trim();
  const now = rawCompany._ingested_at ?? new Date().toISOString();
  const website = String(rawCompany.website ?? '').trim();
  const normalizedId = toSlug(rawCompany.id || name);
  const companyType = companyTypeSchema.includes(rawCompany.company_type) ? rawCompany.company_type : 'Private';

  return {
    id: normalizedId,
    name,
    description: String(rawCompany.description ?? '').trim(),
    website,
    domain: String(rawCompany.domain ?? '').trim(),
    subdomain: String(rawCompany.subdomain ?? '').trim(),
    founded_year: toNumeric(rawCompany.founded_year, new Date().getUTCFullYear()),
    headquarters: String(rawCompany.headquarters ?? 'Unknown').trim(),
    funding: toNumeric(rawCompany.funding, 0),
    valuation: rawCompany.valuation == null ? null : toNumeric(rawCompany.valuation, null),
    company_type: companyType,
    growth_score: toNumeric(rawCompany.growth_score, 0),
    influence_score: toNumeric(rawCompany.influence_score, 0),
    power_score: toNumeric(rawCompany.power_score, 0),
    source_urls: toArray(rawCompany.source_urls),
    tags: toArray(rawCompany.tags),
    last_updated: String(rawCompany.last_updated ?? now.slice(0, 10)),
    created_at: String(rawCompany.created_at ?? now),
    updated_at: String(rawCompany.updated_at ?? now),
    ingestion_status: 'normalized',
    confidence_score: Number(toNumeric(rawCompany.confidence_score, 0.7).toFixed(2)),
    predicted_domain: String(rawCompany.predicted_domain ?? '').trim(),
    predicted_subdomain: String(rawCompany.predicted_subdomain ?? '').trim(),
    classification_confidence: Number(toNumeric(rawCompany.classification_confidence, 0).toFixed(2)),
    classification_source: String(rawCompany.classification_source ?? '').trim(),
    classification_provider: String(rawCompany.classification_provider ?? '').trim(),
    data_source: String(rawCompany.data_source ?? 'manual').trim(),
  };
};

export const normalizeCompanyRecords = (rawCompanies) => rawCompanies.map(normalizeCompanyRecord);
