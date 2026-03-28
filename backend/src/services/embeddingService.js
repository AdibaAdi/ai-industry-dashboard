const OPENAI_BASE_URL = 'https://api.openai.com/v1';
const OPENAI_DEFAULT_MODEL = 'text-embedding-3-small';
const HF_DEFAULT_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';

const normalizeVector = (vector) => {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + (value * value), 0));
  if (!magnitude) {
    return vector;
  }
  return vector.map((value) => value / magnitude);
};

const averageVectors = (vectors) => {
  if (!vectors.length) {
    return [];
  }

  const dimensions = vectors[0].length;
  const totals = new Array(dimensions).fill(0);

  for (const vector of vectors) {
    for (let index = 0; index < dimensions; index += 1) {
      totals[index] += vector[index] ?? 0;
    }
  }

  return totals.map((value) => value / vectors.length);
};

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Embedding request failed (${response.status}): ${body.slice(0, 240)}`);
  }

  return response.json();
};

const createOpenAIEmbeddingProvider = (options = {}) => {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const baseUrl = (options.baseUrl ?? process.env.OPENAI_EMBEDDING_BASE_URL ?? OPENAI_BASE_URL).replace(/\/$/, '');
  const model = options.model ?? process.env.OPENAI_EMBEDDING_MODEL ?? OPENAI_DEFAULT_MODEL;

  return {
    name: 'openai-embeddings',
    model,
    dimensions: options.dimensions ?? null,
    async embedBatch(items) {
      const payload = await requestJson(`${baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: items,
        }),
      });

      const vectors = payload.data
        .sort((a, b) => a.index - b.index)
        .map((entry) => normalizeVector(entry.embedding));

      this.dimensions = this.dimensions ?? vectors[0]?.length ?? null;
      return vectors;
    },
    async embedText(text) {
      const [vector] = await this.embedBatch([text]);
      return vector;
    },
  };
};

const createHuggingFaceEmbeddingProvider = (options = {}) => {
  const apiKey = options.apiKey ?? process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = options.model ?? process.env.HUGGINGFACE_EMBEDDING_MODEL ?? HF_DEFAULT_MODEL;
  const endpoint = options.endpoint
    ?? process.env.HUGGINGFACE_EMBEDDING_ENDPOINT
    ?? `https://api-inference.huggingface.co/pipeline/feature-extraction/${model}`;

  const toVector = (result) => {
    if (!Array.isArray(result)) {
      return [];
    }

    if (Array.isArray(result[0])) {
      return normalizeVector(averageVectors(result));
    }

    return normalizeVector(result);
  };

  return {
    name: 'huggingface-inference-embeddings',
    model,
    dimensions: options.dimensions ?? null,
    async embedText(text) {
      const payload = await requestJson(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          inputs: text,
          options: { wait_for_model: true },
        }),
      });

      const vector = toVector(payload);
      this.dimensions = this.dimensions ?? vector.length ?? null;
      return vector;
    },
    async embedBatch(items) {
      const vectors = [];
      for (const item of items) {
        vectors.push(await this.embedText(item));
      }
      return vectors;
    },
  };
};

const validateProvider = (provider) => {
  if (!provider || typeof provider !== 'object') {
    throw new Error('Embedding provider must be an object.');
  }

  const isValid = typeof provider.name === 'string' && typeof provider.embedText === 'function';
  if (!isValid) {
    throw new Error('Embedding provider must define name and embedText(text).');
  }
};

export const createEmbeddingProviderRegistry = (options = {}) => {
  const providers = new Map();

  const openAIProvider = createOpenAIEmbeddingProvider(options.openai ?? options);
  const huggingFaceProvider = createHuggingFaceEmbeddingProvider(options.huggingface ?? options);

  if (openAIProvider) {
    providers.set(openAIProvider.name, openAIProvider);
  }

  if (huggingFaceProvider) {
    providers.set(huggingFaceProvider.name, huggingFaceProvider);
  }

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
    first() {
      return providers.values().next().value ?? null;
    },
    list() {
      return [...providers.keys()];
    },
  };
};

export const createEmbeddingService = (options = {}) => {
  const registry = options.registry ?? createEmbeddingProviderRegistry(options);
  const configuredProvider = options.provider ?? process.env.EMBEDDING_PROVIDER ?? null;
  const provider = configuredProvider ? registry.get(configuredProvider) : registry.first();

  if (!provider) {
    const message = 'No semantic embedding provider configured. Set OPENAI_API_KEY or HUGGINGFACE_API_KEY to enable embeddings.';
    return {
      provider: 'unconfigured',
      model: null,
      dimensions: null,
      availableProviders: registry.list(),
      async embedText() {
        throw new Error(message);
      },
      async embedBatch() {
        throw new Error(message);
      },
      clearCache() {},
    };
  }

  const cache = new Map();

  const cacheKey = (text) => `${provider.name}:${text}`;

  const embedAndCache = async (text) => {
    const key = cacheKey(text);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const vector = normalizeVector(await provider.embedText(text));
    cache.set(key, vector);
    return vector;
  };

  return {
    provider: provider.name,
    model: provider.model,
    get dimensions() {
      return provider.dimensions ?? null;
    },
    availableProviders: registry.list(),
    async embedText(text) {
      return embedAndCache(text);
    },
    async embedBatch(items) {
      const vectors = new Array(items.length);
      const uncached = [];
      const uncachedIndexes = [];

      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        const key = cacheKey(item);

        if (cache.has(key)) {
          vectors[index] = cache.get(key);
        } else {
          uncached.push(item);
          uncachedIndexes.push(index);
        }
      }

      if (uncached.length) {
        const freshVectors = typeof provider.embedBatch === 'function'
          ? await provider.embedBatch(uncached)
          : await Promise.all(uncached.map((item) => provider.embedText(item)));

        for (let index = 0; index < freshVectors.length; index += 1) {
          const normalized = normalizeVector(freshVectors[index]);
          const originalText = uncached[index];
          const originalIndex = uncachedIndexes[index];
          cache.set(cacheKey(originalText), normalized);
          vectors[originalIndex] = normalized;
        }
      }

      provider.dimensions = provider.dimensions ?? vectors[0]?.length ?? null;
      return vectors;
    },
    clearCache() {
      cache.clear();
    },
  };
};
