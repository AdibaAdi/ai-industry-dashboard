export const ingestRawSourceRecords = (rawCompanies, options = {}) => {
  const ingestedAt = options.ingestedAt ?? new Date().toISOString();
  const dataSource = options.dataSource ?? 'manual';

  return rawCompanies.map((rawCompany) => ({
    ...rawCompany,
    data_source: rawCompany.data_source ?? dataSource,
    ingestion_status: 'received',
    _ingested_at: ingestedAt,
  }));
};
