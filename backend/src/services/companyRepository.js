import { companies as seedCompanies } from '../data/companies.js';
import { normalizeCompanyScores } from './scoringService.js';

let cachedCompanies = normalizeCompanyScores(seedCompanies);

export const getCompanies = () => cachedCompanies;

export const getCompanyById = (id) => cachedCompanies.find((company) => company.id === id) ?? null;

export const setCompanies = (nextCompanies) => {
  cachedCompanies = normalizeCompanyScores(nextCompanies);
};
