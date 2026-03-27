import { getCompaniesHandler, getCompanyByIdHandler } from '../controllers/companyController.js';
import { getDomainsHandler } from '../controllers/domainController.js';
import { getHealthHandler } from '../controllers/healthController.js';
import { getCompanyInsightHandler, getInsightsHandler } from '../controllers/insightController.js';
import { postSearchHandler } from '../controllers/searchController.js';

const routes = [
  { method: 'GET', path: '/health', handler: getHealthHandler },
  { method: 'GET', path: '/companies', handler: getCompaniesHandler },
  { method: 'GET', path: '/companies/:id/insight', handler: getCompanyInsightHandler },
  { method: 'GET', path: '/companies/:id', handler: getCompanyByIdHandler },
  { method: 'GET', path: '/domains', handler: getDomainsHandler },
  { method: 'GET', path: '/insights', handler: getInsightsHandler },
  { method: 'POST', path: '/search', handler: postSearchHandler },
];

const toSegments = (value) => value.split('/').filter(Boolean);

const matchPath = (routePath, pathname) => {
  const routeSegments = toSegments(routePath);
  const pathSegments = toSegments(pathname);

  if (routeSegments.length !== pathSegments.length) {
    return null;
  }

  const params = {};

  for (let index = 0; index < routeSegments.length; index += 1) {
    const routeSegment = routeSegments[index];
    const pathSegment = pathSegments[index];

    if (routeSegment.startsWith(':')) {
      params[routeSegment.slice(1)] = pathSegment;
      continue;
    }

    if (routeSegment !== pathSegment) {
      return null;
    }
  }

  return params;
};

export const matchRoute = (method, pathname) => {
  for (const route of routes) {
    if (route.method !== method) {
      continue;
    }

    const params = matchPath(route.path, pathname);
    if (params) {
      return {
        handler: route.handler,
        params,
      };
    }
  }

  return null;
};
