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

const validateProvider = (provider) => {
  if (!provider || typeof provider !== 'object') {
    throw new Error('Embedding provider must be an object.');
  }

  const isValid = typeof provider.name === 'string' && typeof provider.dimensions === 'number' && typeof provider.embedText === 'function';
  if (!isValid) {
    throw new Error('Embedding provider must define name, dimensions, and embedText(text).');
  }
};

export const createHashingEmbeddingProvider = (options = {}) => {
  const dimensions = options.dimensions ?? DEFAULT_DIMENSIONS;

  return {
    name: 'hashing-v1',
    dimensions,
    embedText: (text) => embedTextWithHashing(text, dimensions),
    embedBatch: (items) => items.map((item) => embedTextWithHashing(item, dimensions)),
  };
};

export const createEmbeddingProviderRegistry = (options = {}) => {
  const providers = new Map();

  const hashingProvider = createHashingEmbeddingProvider(options.hashing ?? options);
  providers.set(hashingProvider.name, hashingProvider);

  return {
    register(provider) {
      validateProvider(provider);
      providers.set(provider.name, provider);
    },
    get(providerName) {
      return providers.get(providerName) ?? null;
    },
    has(providerName) {
      return providers.has(providerName);
    },
  };
};

export const createEmbeddingService = (options = {}) => {
  const registry = options.registry ?? createEmbeddingProviderRegistry(options);
  const providerName = options.provider ?? 'hashing-v1';
  const provider = registry.get(providerName);

  if (!provider) {
    throw new Error(`Unsupported embedding provider: ${providerName}`);
  }

  return {
    provider: provider.name,
    dimensions: provider.dimensions,
    embedText(text) {
      return provider.embedText(text);
    },
    embedBatch(items) {
      if (typeof provider.embedBatch === 'function') {
        return provider.embedBatch(items);
      }

      return items.map((item) => provider.embedText(item));
    },
  };
};
