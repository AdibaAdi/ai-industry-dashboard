export const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });

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
