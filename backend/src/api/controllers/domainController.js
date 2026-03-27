import { getCompanies } from '../../data/repositories/companyRepository.js';
import { getDomainBreakdown } from '../../services/domainService.js';

export const getDomainsHandler = () => {
  const data = getDomainBreakdown(getCompanies());

  return {
    statusCode: 200,
    payload: { data, meta: { total: data.length } },
  };
};
