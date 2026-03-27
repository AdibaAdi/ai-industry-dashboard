import { searchCompanies } from '../../services/search/companySearchService.js';

const invalidQueryResponse = {
  statusCode: 400,
  payload: { error: 'Search query must be a non-empty string. Use /search?q=your+query.' },
};

export const getSearchHandler = ({ searchParams }) => {
  const query = searchParams.get('q');

  if (typeof query !== 'string' || !query.trim()) {
    return invalidQueryResponse;
  }

  const data = searchCompanies(query);

  return {
    statusCode: 200,
    payload: data,
  };
};

export const postSearchHandler = ({ body }) => {
  const query = body?.query;

  if (typeof query !== 'string' || !query.trim()) {
    return invalidQueryResponse;
  }

  const data = searchCompanies(query);

  return {
    statusCode: 200,
    payload: data,
  };
};
