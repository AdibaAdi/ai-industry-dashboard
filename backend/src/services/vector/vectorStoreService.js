import { createEmbeddingService } from '../embeddingService.js';
import { buildCompanyDocuments } from '../retrieval/companyDocumentBuilder.js';
import { createInMemoryVectorStore } from './inMemoryVectorStore.js';

const createVectorStore = (provider = 'memory') => {
  if (provider === 'memory') {
    return createInMemoryVectorStore();
  }

  throw new Error(`Unsupported vector store provider: ${provider}`);
};

const vectorStore = createVectorStore();
const embeddingService = createEmbeddingService();

let indexedSignature = null;
let indexingPromise = null;

const buildSignature = (companies) => companies.map((company) => `${company.id}:${company.last_updated}`).join('|');

export const ensureCompanyVectorIndex = async (companies) => {
  const signature = buildSignature(companies);

  if (signature === indexedSignature) {
    return;
  }

  if (indexingPromise) {
    await indexingPromise;
    if (signature === indexedSignature) {
      return;
    }
  }

  indexingPromise = (async () => {
    const documents = buildCompanyDocuments(companies);
    const vectors = await embeddingService.embedBatch(documents.map((document) => document.text));

    vectorStore.clear();
    vectorStore.upsert(
      documents.map((document, index) => ({
        id: document.id,
        vector: vectors[index],
        document,
        metadata: document.metadata,
      })),
    );

    indexedSignature = signature;
  })();

  try {
    await indexingPromise;
  } finally {
    indexingPromise = null;
  }
};

export const searchCompanyVectors = async (query, options = {}) => {
  const queryVector = await embeddingService.embedText(query);
  return vectorStore.searchByVector(queryVector, options);
};

export const getVectorRetrievalInfo = () => ({
  provider: embeddingService.provider,
  model: embeddingService.model,
  dimensions: embeddingService.dimensions,
  indexed: indexedSignature !== null,
});

export const upsertEmbeddings = async (_documents) => ({
  status: 'ready',
  message: 'In-memory vector store adapter is available. Swap embeddingService/vectorStore for external providers when needed.',
  provider: embeddingService.provider,
});
