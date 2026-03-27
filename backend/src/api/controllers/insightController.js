import { getCompanies } from '../../data/repositories/companyRepository.js';
import { getDomainBreakdown } from '../../services/domainService.js';
import { buildInsights } from '../../services/insightsService.js';
import { buildCompanyInsight } from '../../services/insight/companyInsightService.js';

export const getInsightsHandler = () => {
  const companies = getCompanies();
  const domains = getDomainBreakdown(companies);
  const data = buildInsights(companies, domains);

  return {
    statusCode: 200,
    payload: { data },
  };
};

export const getCompanyInsightHandler = ({ params }) => {
  const data = buildCompanyInsight(params.id);

  if (!data) {
    return {
      statusCode: 404,
      payload: { error: `Company with id "${params.id}" not found.` },
    };
  }

  return {
    statusCode: 200,
    payload: { data },
  };
};
