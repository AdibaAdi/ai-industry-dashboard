import { getCompanies } from '../../data/repositories/companyRepository.js';
import { getInvestorModeSnapshot } from '../../services/investorModeService.js';

export const getInvestorModeHandler = () => {
  const data = getInvestorModeSnapshot(getCompanies());

  return {
    statusCode: 200,
    payload: { data },
  };
};
