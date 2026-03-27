import { listCompanies, findCompanyById } from '../../services/companyService.js';
import { getRefreshStatus } from '../../services/refreshStatusService.js';

export const getCompaniesHandler = ({ searchParams }) => {
  const data = listCompanies(searchParams);
  const refreshStatus = getRefreshStatus();

  return {
    statusCode: 200,
    payload: {
      data,
      meta: {
        total: data.length,
        refresh: refreshStatus,
      },
    },
  };
};

export const getCompanyByIdHandler = ({ params }) => {
  const id = params.id;
  const company = findCompanyById(id);

  if (!company) {
    return {
      statusCode: 404,
      payload: { error: `Company with id "${id}" not found.` },
    };
  }

  return {
    statusCode: 200,
    payload: { data: company },
  };
};
