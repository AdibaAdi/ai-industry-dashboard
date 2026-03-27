import { createServer } from 'node:http';
import { URL } from 'node:url';
import { getCompanies, getCompanyById } from './services/companyRepository.js';
import { getDomainBreakdown } from './services/domainService.js';
import { buildInsights } from './services/insightsService.js';

const port = Number(process.env.PORT ?? 4000);

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
};

const parseSortedCompanies = (searchParams) => {
  const domain = searchParams.get('domain');
  const search = searchParams.get('search')?.toLowerCase().trim() ?? '';
  const sortBy = searchParams.get('sortBy') ?? 'power_score';
  const order = searchParams.get('order') ?? 'desc';

  const filtered = getCompanies()
    .filter((company) => (domain ? company.domain === domain : true))
    .filter((company) =>
      search
        ? company.name.toLowerCase().includes(search) ||
          company.description.toLowerCase().includes(search) ||
          company.tags.some((tag) => tag.toLowerCase().includes(search))
        : true,
    );

  return [...filtered].sort((a, b) => {
    const aVal = a[sortBy] ?? 0;
    const bVal = b[sortBy] ?? 0;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return order === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
    }
    return order === 'desc' ? bVal - aVal : aVal - bVal;
  });
};

const server = createServer((req, res) => {
  if (!req.url || !req.method) {
    sendJson(res, 400, { error: 'Invalid request.' });
    return;
  }

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const { pathname, searchParams } = parsedUrl;

  if (req.method === 'GET' && pathname === '/health') {
    sendJson(res, 200, { status: 'ok', service: 'ai-industry-dashboard-api' });
    return;
  }

  if (req.method === 'GET' && pathname === '/companies') {
    const data = parseSortedCompanies(searchParams);
    sendJson(res, 200, { data, meta: { total: data.length } });
    return;
  }

  if (req.method === 'GET' && pathname.startsWith('/companies/')) {
    const id = pathname.split('/')[2];
    const company = getCompanyById(id);

    if (!company) {
      sendJson(res, 404, { error: `Company with id "${id}" not found.` });
      return;
    }

    sendJson(res, 200, { data: company });
    return;
  }

  if (req.method === 'GET' && pathname === '/domains') {
    const data = getDomainBreakdown(getCompanies());
    sendJson(res, 200, { data, meta: { total: data.length } });
    return;
  }

  if (req.method === 'GET' && pathname === '/insights') {
    const companies = getCompanies();
    const domains = getDomainBreakdown(companies);
    const data = buildInsights(companies, domains);
    sendJson(res, 200, { data });
    return;
  }

  sendJson(res, 404, { error: 'Route not found.' });
});

server.listen(port, () => {
  console.log(`AI Industry Dashboard API running on port ${port}`);
});
