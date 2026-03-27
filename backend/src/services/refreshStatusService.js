import { getCompanies } from '../data/repositories/companyRepository.js';

const dayInMs = 24 * 60 * 60 * 1000;

const toTimestamp = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const deriveLastUpdatedAt = (companies) => {
  const newestDate = companies.reduce((latest, company) => {
    const candidate = toTimestamp(company.updated_at ?? company.last_updated);
    if (!candidate) {
      return latest;
    }

    if (!latest || candidate.getTime() > latest.getTime()) {
      return candidate;
    }

    return latest;
  }, null);

  return newestDate ?? new Date();
};

const deriveCurrentYearCoverage = (companies, year) => {
  if (companies.length === 0) {
    return {
      year,
      covered_records: 0,
      coverage_pct: 0,
    };
  }

  const coveredRecords = companies.filter((company) => {
    const lastUpdated = toTimestamp(company.last_updated ?? company.updated_at);
    return lastUpdated ? lastUpdated.getUTCFullYear() === year : false;
  }).length;

  return {
    year,
    covered_records: coveredRecords,
    coverage_pct: Number(((coveredRecords / companies.length) * 100).toFixed(1)),
  };
};

const toFreshnessStatus = (lastUpdatedAt) => {
  const ageDays = Math.max(0, (Date.now() - lastUpdatedAt.getTime()) / dayInMs);
  if (ageDays <= 2) {
    return 'fresh';
  }
  if (ageDays <= 14) {
    return 'aging';
  }
  return 'stale';
};

const latestRefreshState = {
  completed_at: null,
  inserted_count: 0,
  updated_count: 0,
  refresh_type: 'seed_bootstrap',
  refresh_source: 'seed-data',
  next_scheduled_refresh_at: null,
};

const hydrateFromDataset = () => {
  const companies = getCompanies();
  const latestTimestamp = deriveLastUpdatedAt(companies).toISOString();

  latestRefreshState.completed_at = latestTimestamp;
  latestRefreshState.refresh_source = companies[0]?.data_source ?? latestRefreshState.refresh_source;
};

hydrateFromDataset();

export const recordRefreshRun = ({
  completedAt,
  insertedCount,
  updatedCount,
  refreshType = 'manual_ingestion',
  refreshSource,
  nextScheduledRefreshAt = latestRefreshState.next_scheduled_refresh_at,
}) => {
  latestRefreshState.completed_at = completedAt ?? new Date().toISOString();
  latestRefreshState.inserted_count = insertedCount ?? 0;
  latestRefreshState.updated_count = updatedCount ?? 0;
  latestRefreshState.refresh_type = refreshType;
  latestRefreshState.refresh_source = refreshSource ?? latestRefreshState.refresh_source;
  latestRefreshState.next_scheduled_refresh_at = nextScheduledRefreshAt;
};

export const getRefreshStatus = () => {
  const companies = getCompanies();
  const nowYear = new Date().getUTCFullYear();
  const lastUpdatedAt = toTimestamp(latestRefreshState.completed_at) ?? deriveLastUpdatedAt(companies);
  const currentYearCoverage = deriveCurrentYearCoverage(companies, nowYear);

  return {
    last_updated_at: lastUpdatedAt.toISOString(),
    freshness_status: toFreshnessStatus(lastUpdatedAt),
    total_companies_tracked: companies.length,
    newly_added_companies: latestRefreshState.inserted_count,
    updated_records_count: latestRefreshState.updated_count,
    current_year_coverage: currentYearCoverage,
    refresh_type: latestRefreshState.refresh_type,
    refresh_source: latestRefreshState.refresh_source,
    scheduler_ready: true,
    next_scheduled_refresh_at: latestRefreshState.next_scheduled_refresh_at,
  };
};
