import { getCompanies, getCompanyById } from '../data/repositories/companyRepository.js';
import { buildCompanyFilters, filterAndSortCompanies } from '../utils/companyQueryUtils.js';

export const listCompanies = (searchParams) => {
  const filters = buildCompanyFilters(searchParams);
  const companies = getCompanies();

  return filterAndSortCompanies(companies, filters);
};

export const findCompanyById = (id) => getCompanyById(id);
