const parseAllowedOrigins = (value) =>
  String(value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const isOriginAllowed = (origin, allowedOrigins) => {
  if (!origin) {
    return false;
  }

  return allowedOrigins.includes(origin);
};

export const buildCorsHeaders = (requestOrigin) => {
  const allowedOrigins = parseAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS);
  const fallbackOrigin = allowedOrigins[0] ?? '*';
  const accessControlAllowOrigin = isOriginAllowed(requestOrigin, allowedOrigins)
    ? requestOrigin
    : fallbackOrigin;

  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': accessControlAllowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
};

export const sendJson = (res, statusCode, payload, headers = {}) => {
  res.writeHead(statusCode, {
    ...headers,
    'Content-Type': 'application/json',
  });

  if (statusCode === 204) {
    res.end();
    return;
  }

  res.end(JSON.stringify(payload));
};

export const parseRequestUrl = (requestUrl, hostHeader) => new URL(requestUrl, `http://${hostHeader}`);

export const readJsonBody = async (req) => {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return null;
  }

  const bodyText = Buffer.concat(chunks).toString('utf8').trim();

  if (!bodyText) {
    return null;
  }

  return JSON.parse(bodyText);
};
