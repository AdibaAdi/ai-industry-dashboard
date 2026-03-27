const cosineSimilarity = (left, right) => {
  if (!left?.length || !right?.length || left.length !== right.length) {
    return 0;
  }

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }

  if (!leftMagnitude || !rightMagnitude) {
    return 0;
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
};

const matchesMetadata = (entryMetadata, filter = {}) => {
  const conditions = Object.entries(filter);

  if (!conditions.length) {
    return true;
  }

  return conditions.every(([key, expected]) => {
    const actual = entryMetadata?.[key];

    if (Array.isArray(expected)) {
      if (Array.isArray(actual)) {
        return expected.some((value) => actual.includes(value));
      }

      return expected.includes(actual);
    }

    if (Array.isArray(actual)) {
      return actual.includes(expected);
    }

    return actual === expected;
  });
};

export class InMemoryVectorStore {
  constructor() {
    this.entries = new Map();
  }

  clear() {
    this.entries.clear();
  }

  upsert(items) {
    for (const item of items) {
      this.entries.set(item.id, item);
    }
  }

  searchByVector(vector, options = {}) {
    const limit = options.limit ?? 8;
    const minSimilarity = options.minSimilarity ?? 0;
    const metadataFilter = options.metadataFilter ?? {};

    return [...this.entries.values()]
      .filter((entry) => matchesMetadata(entry.metadata, metadataFilter))
      .map((item) => ({
        id: item.id,
        score: cosineSimilarity(vector, item.vector),
        document: item.document,
        metadata: item.metadata,
      }))
      .filter((item) => item.score >= minSimilarity)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

export const createInMemoryVectorStore = () => new InMemoryVectorStore();
