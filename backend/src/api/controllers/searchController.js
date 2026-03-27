import { searchCompanies } from '../../services/search/companySearchService.js';

export const postSearchHandler = ({ body }) => {
  const query = body?.query;

  if (typeof query !== 'string' || !query.trim()) {
    return {
      statusCode: 400,
      payload: { error: 'Request body must include a non-empty "query" string.' },
    };
  }

  const data = searchCompanies(query);

  return {
    statusCode: 200,
    payload: data,
  };
};
