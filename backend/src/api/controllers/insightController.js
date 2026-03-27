import { getCompanies } from '../../data/repositories/companyRepository.js';
import { getDomainBreakdown } from '../../services/domainService.js';
import { buildInsights } from '../../services/insightsService.js';

export const getInsightsHandler = () => {
  const companies = getCompanies();
  const domains = getDomainBreakdown(companies);
  const data = buildInsights(companies, domains);

  return {
    statusCode: 200,
    payload: { data },
  };
};
