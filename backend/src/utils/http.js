export const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });

  res.end(JSON.stringify(payload));
};

export const parseRequestUrl = (requestUrl, hostHeader) => new URL(requestUrl, `http://${hostHeader}`);
