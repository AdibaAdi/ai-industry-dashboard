import { runCompanyIngestionPipeline, runDevSimulationIngestion } from '../../services/ingestion/ingestionPipelineService.js';

const isProduction = () => process.env.NODE_ENV === 'production';

const productionError = {
  statusCode: 403,
  payload: { error: 'Dev ingestion endpoints are disabled in production.' },
};

export const postIngestCompaniesHandler = ({ body }) => {
  if (isProduction()) {
    return productionError;
  }

  const records = body?.records;

  if (!Array.isArray(records) || records.length === 0) {
    return {
      statusCode: 400,
      payload: { error: 'Body must include a non-empty "records" array.' },
    };
  }

  return runCompanyIngestionPipeline(records, { dataSource: body.data_source ?? 'dev-manual' }).then((result) => ({
    statusCode: 202,
    payload: {
      data: result.records,
      meta: result.summary,
    },
  }));
};

export const postSimulateIngestionHandler = () => {
  if (isProduction()) {
    return productionError;
  }

  return runDevSimulationIngestion().then((result) => ({
    statusCode: 202,
    payload: {
      data: result.records,
      meta: result.summary,
    },
  }));
};
