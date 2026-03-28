import { getCompanies } from '../../data/repositories/companyRepository.js';
import { runDataIntegrityValidation } from '../../services/validation/dataIntegrityValidationService.js';

const isProduction = () => process.env.NODE_ENV === 'production';

export const getDataValidationReportHandler = () => {
  if (isProduction()) {
    return {
      statusCode: 403,
      payload: { error: 'Dev validation endpoint is disabled in production.' },
    };
  }

  const companies = getCompanies();
  const report = runDataIntegrityValidation(companies);

  return {
    statusCode: 200,
    payload: {
      data: report,
    },
  };
};
