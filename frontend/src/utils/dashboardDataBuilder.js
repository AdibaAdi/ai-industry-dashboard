import {
  toComparisonData,
  toDomainChartData,
  toGrowthTrendData,
  toTopCompanies,
} from './transformers.js';

export const buildDashboardDataFromApi = ({
  companiesResponse,
  domainsResponse,
  insightsResponse,
  investorModeResponse,
}) => {
  const companies = companiesResponse?.data ?? [];
  const domains = domainsResponse?.data ?? [];
  const domainsMeta = domainsResponse?.meta ?? null;
  const domainWarnings = domainsResponse?.warnings ?? [];

  return {
    companies,
    companiesMeta: companiesResponse?.meta ?? null,
    domains,
    domainsMeta,
    domainWarnings,
    insights: insightsResponse?.data ?? null,
    investorMode: investorModeResponse?.data ?? null,
    domainChartData: toDomainChartData(domains),
    topCompanies: toTopCompanies(companies),
    companyComparisonData: toComparisonData(companies),
    growthTrendData: toGrowthTrendData(companies),
    kpis: {
      totalCompanies: companies.length,
      topDomain: domains[0]?.domain ?? null,
      topScore: companies[0]?.power_score ?? null,
      topCompany: companies[0]?.name ?? null,
      freshness: companiesResponse?.meta?.refresh ?? null,
    },
  };
};

export const buildKpiCardModels = (kpis, loading) => {
  const coverageYear = kpis.freshness?.current_year_coverage?.year;
  const coverageRecords = kpis.freshness?.current_year_coverage?.covered_records ?? 0;
  const coveragePct = kpis.freshness?.current_year_coverage?.coverage_pct ?? 0;
  const topScoreValue = typeof kpis.topScore === 'number' ? Number(kpis.topScore).toFixed(1) : '—';
  const refreshSummary = `${kpis.freshness?.newly_added_companies ?? 0} new · ${kpis.freshness?.updated_records_count ?? 0} updated`;
  const coverageSummary =
    coverageYear && kpis.totalCompanies > 0
      ? `${coverageYear} coverage ${coverageRecords}/${kpis.totalCompanies} (${coveragePct}%)`
      : 'Coverage details unavailable';

  return [
    {
      label: 'Total Companies',
      value: loading ? '…' : kpis.totalCompanies.toLocaleString(),
      trend: 'Live from intelligence layer',
    },
    {
      label: 'Top Domain',
      value: loading ? '…' : kpis.topDomain ?? '—',
      trend: 'By active company count',
    },
    {
      label: 'Top Score',
      value: loading ? '…' : topScoreValue,
      trend: loading ? '...' : kpis.topCompany ?? '—',
    },
    {
      label: 'Refresh Status',
      value: loading ? '…' : refreshSummary,
      trend: loading ? '...' : coverageSummary,
    },
  ];
};

export const buildDomainCardModels = (domains, limit = 9) =>
  domains.slice(0, limit).map((domain) => ({
    key: domain.domain,
    title: domain.domain,
    totalCompanies: domain.total_companies,
    shareLabel: `${domain.share_percentage.toFixed(1)}% of tracked companies`,
  }));

export const buildAskAIResultViewModel = (response) => ({
  answer: response?.answer ?? null,
  retrievedCompanies: response?.retrieved_companies ?? [],
  supportingSnippets: response?.supporting_snippets ?? [],
  relevance: response?.relevance ?? null,
  reasoningSummary: response?.reasoning_summary ?? [],
});
