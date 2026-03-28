import { getCompanies } from '../../data/repositories/companyRepository.js';
import { getDomainBreakdown, getDomainDistributionWarning } from '../../services/domainService.js';

export const getDomainsHandler = () => {
  const companies = getCompanies();
  const data = getDomainBreakdown(companies);
  const warning = getDomainDistributionWarning(data, companies.length);

  return {
    statusCode: 200,
    payload: {
      data,
      meta: {
        total_domains: data.length,
        total_companies: companies.length,
      },
      warnings: warning ? [warning] : [],
    },
  };
};
