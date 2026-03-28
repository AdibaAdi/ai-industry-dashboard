import { classifyCompanyRecords } from '../../services/classificationService.js';

const isProduction = () => process.env.NODE_ENV === 'production';

const productionError = {
  statusCode: 403,
  payload: { error: 'Dev classification endpoints are disabled in production.' },
};

export const postClassifyPreviewHandler = ({ body }) => {
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

  return classifyCompanyRecords(records).then((result) => ({
    statusCode: 200,
    payload: {
      data: result,
      meta: {
        count: result.length,
      },
    },
  }));
};
