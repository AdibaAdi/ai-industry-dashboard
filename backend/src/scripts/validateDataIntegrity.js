import { getCompanies } from '../data/repositories/companyRepository.js';
import { formatValidationReport, runDataIntegrityValidation } from '../services/validation/dataIntegrityValidationService.js';

const companies = getCompanies();
const report = runDataIntegrityValidation(companies);

console.log(formatValidationReport(report));

if (report.status === 'fail') {
  process.exitCode = 1;
}
