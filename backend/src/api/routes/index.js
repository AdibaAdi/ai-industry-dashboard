import { getCompaniesHandler, getCompanyByIdHandler } from '../controllers/companyController.js';
import { getDomainsHandler } from '../controllers/domainController.js';
import { getHealthHandler } from '../controllers/healthController.js';
import { getInsightsHandler } from '../controllers/insightController.js';

const routes = [
  { method: 'GET', path: '/health', handler: getHealthHandler },
  { method: 'GET', path: '/companies', handler: getCompaniesHandler },
  { method: 'GET', path: '/companies/:id', handler: getCompanyByIdHandler },
  { method: 'GET', path: '/domains', handler: getDomainsHandler },
  { method: 'GET', path: '/insights', handler: getInsightsHandler },
];

export const matchRoute = (method, pathname) => {
  if (method !== 'GET') {
    return null;
  }

  if (pathname.startsWith('/companies/')) {
    return routes.find((route) => route.path === '/companies/:id') ?? null;
  }

  return routes.find((route) => route.path === pathname) ?? null;
};
