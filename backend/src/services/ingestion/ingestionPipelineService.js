import { runClassificationPipeline } from '../pipeline/classificationService.js';
import { enrichCompanyRecords } from './enrichmentService.js';
import { normalizeCompanyRecords } from './normalizationService.js';
import { persistIngestedCompanies } from './persistenceService.js';
import { ingestRawSourceRecords } from './rawSourceIngestionService.js';
import { recomputeCompanyScoresBatch } from './scoringPipelineService.js';
import { sampleRawCompanyRecords } from './devIngestionFixtures.js';

export const runCompanyIngestionPipeline = async (rawCompanies, options = {}) => {
  const receivedRecords = ingestRawSourceRecords(rawCompanies, options);
  const normalizedRecords = normalizeCompanyRecords(receivedRecords);
  const enrichedRecords = enrichCompanyRecords(normalizedRecords);
  const classificationResult = await runClassificationPipeline(enrichedRecords);
  const classifiedRecords = classificationResult.records;
  const scoredRecords = recomputeCompanyScoresBatch(classifiedRecords);
  const persistenceResult = persistIngestedCompanies(scoredRecords);

  return {
    summary: {
      received: receivedRecords.length,
      normalized: normalizedRecords.length,
      enriched: enrichedRecords.length,
      classified: classifiedRecords.length,
      scored: scoredRecords.length,
      inserted: persistenceResult.inserted.length,
      updated: persistenceResult.updated.length,
    },
    records: persistenceResult.records,
  };
};

export const runDevSimulationIngestion = () =>
  runCompanyIngestionPipeline(sampleRawCompanyRecords, { dataSource: 'dev-simulation' });
