import { createServer } from 'node:http';
import { matchRoute } from './api/routes/index.js';
import { parseRequestUrl, sendJson } from './utils/http.js';

export const createAppServer = () =>
  createServer((req, res) => {
    if (!req.url || !req.method) {
      sendJson(res, 400, { error: 'Invalid request.' });
      return;
    }

    if (req.method === 'OPTIONS') {
      sendJson(res, 204, {});
      return;
    }

    const { pathname, searchParams } = parseRequestUrl(req.url, req.headers.host);
    const route = matchRoute(req.method, pathname);

    if (!route) {
      sendJson(res, 404, { error: 'Route not found.' });
      return;
    }

    const { statusCode, payload } = route.handler({ pathname, searchParams });
    sendJson(res, statusCode, payload);
  });
