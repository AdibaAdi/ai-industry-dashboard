const DEFAULT_DIMENSIONS = 96;

const normalize = (vector) => {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

  if (!magnitude) {
    return vector;
  }

  return vector.map((value) => value / magnitude);
};

const hashToken = (token, dimensions) => {
  let hash = 0;
  for (let index = 0; index < token.length; index += 1) {
    hash = (hash * 31 + token.charCodeAt(index)) >>> 0;
  }

  return hash % dimensions;
};

const tokenize = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1);

const embedTextWithHashing = (text, dimensions = DEFAULT_DIMENSIONS) => {
  const vector = new Array(dimensions).fill(0);
  const tokens = tokenize(text);

  for (const token of tokens) {
    const slot = hashToken(token, dimensions);
    vector[slot] += 1;
  }

  return normalize(vector);
};

export const createHashingEmbeddingService = (options = {}) => {
  const dimensions = options.dimensions ?? DEFAULT_DIMENSIONS;

  return {
    provider: 'hashing-v1',
    dimensions,
    embedText: (text) => embedTextWithHashing(text, dimensions),
    embedBatch: (items) => items.map((item) => embedTextWithHashing(item, dimensions)),
  };
};

export const createEmbeddingService = (options = {}) => {
  const provider = options.provider ?? 'hashing-v1';

  if (provider === 'hashing-v1') {
    return createHashingEmbeddingService(options);
  }

  throw new Error(`Unsupported embedding provider: ${provider}`);
};
