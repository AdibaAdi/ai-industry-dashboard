import { createEmbeddingService } from '../embeddings/embeddingService.js';
import { buildCompanyDocuments } from '../retrieval/companyDocumentBuilder.js';
import { InMemoryVectorStore } from './inMemoryVectorStore.js';

const vectorStore = new InMemoryVectorStore();
const embeddingService = createEmbeddingService();

let indexedSignature = null;

const buildSignature = (companies) => companies.map((company) => `${company.id}:${company.last_updated}`).join('|');

export const ensureCompanyVectorIndex = (companies) => {
  const signature = buildSignature(companies);

  if (signature === indexedSignature) {
    return;
  }

  const documents = buildCompanyDocuments(companies);
  const vectors = embeddingService.embedBatch(documents.map((document) => document.text));

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
};

export const searchCompanyVectors = (query, options = {}) => {
  const queryVector = embeddingService.embedText(query);
  return vectorStore.searchByVector(queryVector, options);
};

export const getVectorRetrievalInfo = () => ({
  provider: embeddingService.provider,
  dimensions: embeddingService.dimensions,
  indexed: indexedSignature !== null,
});

export const upsertEmbeddings = async (_documents) => ({
  status: 'ready',
  message: 'In-memory vector store adapter is available. Swap embeddingService/vectorStore for external providers when needed.',
  provider: embeddingService.provider,
});
