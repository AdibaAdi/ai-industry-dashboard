import { getCompanies } from '../../data/repositories/companyRepository.js';
import { runClassificationPipeline } from '../classificationService.js';
import { enrichCompanyRecords } from './enrichmentService.js';
import { normalizeCompanyRecords } from './normalizationService.js';
import { persistIngestedCompanies } from './persistenceService.js';
import { ingestRawSourceRecords } from './rawSourceIngestionService.js';
import { recomputeCompanyScoresBatch } from './scoringPipelineService.js';
import { sampleRawCompanyRecords } from './devIngestionFixtures.js';
import { recordRefreshRun } from '../refreshStatusService.js';

const splitByNewCompanies = (records) => {
  const existingIds = new Set(getCompanies().map((company) => company.id));

  return records.reduce(
    (acc, record) => {
      if (existingIds.has(record.id)) {
        acc.existing.push(record);
      } else {
        acc.newCompanies.push(record);
      }
      return acc;
    },
    { newCompanies: [], existing: [] },
  );
};

export const runCompanyIngestionPipeline = async (rawCompanies, options = {}) => {
  const receivedRecords = ingestRawSourceRecords(rawCompanies, options);
  const normalizedRecords = normalizeCompanyRecords(receivedRecords);
  const enrichedRecords = enrichCompanyRecords(normalizedRecords);

  const { newCompanies, existing } = splitByNewCompanies(enrichedRecords);
  const classificationResult = await runClassificationPipeline(newCompanies);
  const classifiedRecords = [...classificationResult.records, ...existing.map((record) => ({ ...record, ingestion_status: 'enriched' }))];

  const scoredRecords = recomputeCompanyScoresBatch(classifiedRecords);
  const persistenceResult = persistIngestedCompanies(scoredRecords);
  const completedAt = new Date().toISOString();

  recordRefreshRun({
    completedAt,
    insertedCount: persistenceResult.inserted.length,
    updatedCount: persistenceResult.updated.length,
    refreshType: 'manual_ingestion',
    refreshSource: options.dataSource,
  });

  return {
    summary: {
      completed_at: completedAt,
      received: receivedRecords.length,
      normalized: normalizedRecords.length,
      enriched: enrichedRecords.length,
      classified: classificationResult.records.length,
      reused_existing_classification: existing.length,
      scored: scoredRecords.length,
      inserted: persistenceResult.inserted.length,
      updated: persistenceResult.updated.length,
    },
    records: persistenceResult.records,
  };
};

export const runDevSimulationIngestion = () =>
  runCompanyIngestionPipeline(sampleRawCompanyRecords, { dataSource: 'dev-simulation' });
