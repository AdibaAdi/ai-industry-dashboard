/**
 * @typedef {'Private'|'Public'|'Subsidiary'|'Nonprofit'} CompanyType
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
 * @property {string[]} tags
 * @property {string} last_updated
 */

export const companyTypeSchema = Object.freeze(['Private', 'Public', 'Subsidiary', 'Nonprofit']);
