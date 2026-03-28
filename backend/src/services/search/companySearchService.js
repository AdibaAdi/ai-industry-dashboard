import { runCompanyRagQuery } from '../rag/ragService.js';

export const searchCompanies = async (query) => runCompanyRagQuery(query);
