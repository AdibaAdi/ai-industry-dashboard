import { createServer } from 'node:http';
import { matchRoute } from './api/routes/index.js';
import { parseRequestUrl, readJsonBody, sendJson } from './utils/http.js';

export const createAppServer = () =>
  createServer(async (req, res) => {
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

    let body = null;
    if (req.method === 'POST') {
      try {
        body = await readJsonBody(req);
      } catch (_error) {
        sendJson(res, 400, { error: 'Invalid JSON body.' });
        return;
      }
    }

    const response = await route.handler({
      pathname,
      searchParams,
      params: route.params,
      body,
    });

    sendJson(res, response.statusCode, response.payload);
  });
