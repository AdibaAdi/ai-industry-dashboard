/**
 * @typedef {'Private'|'Public'|'Subsidiary'|'Nonprofit'} CompanyType
 */

/**
 * @typedef {'seeded'|'received'|'normalized'|'enriched'|'classified'|'scored'|'persisted'|'failed'} IngestionStatus
 */

/**
 * @typedef {Object} AICompany
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} website
 * @property {string} domain
 * @property {string} subdomain
 * @property {number} founded_year
 * @property {string} headquarters
 * @property {number} funding
 * @property {number|null} valuation
 * @property {CompanyType} company_type
 * @property {number} growth_score
 * @property {number} influence_score
 * @property {number} power_score
 * @property {string[]} source_urls
 * @property {string[]} sources
 * @property {string[]} tags
 * @property {string} last_updated
 * @property {string} created_at
 * @property {string} updated_at
 * @property {IngestionStatus} ingestion_status
 * @property {number} confidence_score
 * @property {string} predicted_domain
 * @property {string} predicted_subdomain
 * @property {number} classification_confidence
 * @property {string} classification_source
 * @property {string} classification_provider
 * @property {string} data_source
 */

export const companyTypeSchema = Object.freeze(['Private', 'Public', 'Subsidiary', 'Nonprofit']);
