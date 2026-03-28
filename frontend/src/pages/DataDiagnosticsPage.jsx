import { useEffect, useMemo, useState } from 'react';
import SectionHeading from '../components/SectionHeading';
import { API_BASE_URL, apiClient } from '../api/client';
import { getConfidenceMeta } from '../utils/confidence';

const cardClass = 'rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card';

const toNumericSummary = (values) => {
  const numericValues = values.filter((value) => Number.isFinite(value));

  if (numericValues.length === 0) {
    return {
      count: 0,
      min: null,
      max: null,
      average: null,
      uniqueCount: 0,
      dominantValue: null,
      dominantPct: 0,
    };
  }

  const uniqueCount = new Set(numericValues).size;
  const total = numericValues.reduce((sum, value) => sum + value, 0);
  const frequency = numericValues.reduce((acc, value) => {
    const key = String(value);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const [dominantValue, dominantCount] = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])[0];

  return {
    count: numericValues.length,
    min: Math.min(...numericValues),
    max: Math.max(...numericValues),
    average: total / numericValues.length,
    uniqueCount,
    dominantValue: Number(dominantValue),
    dominantPct: dominantCount / numericValues.length,
  };
};

const formatNumber = (value, digits = 1) => (Number.isFinite(value) ? value.toFixed(digits) : '—');

const DataDiagnosticsPage = ({ compactMode, data }) => {
  const [health, setHealth] = useState({ loading: true, payload: null, error: null });
  const [validation, setValidation] = useState({ loading: true, payload: null, error: null });

  useEffect(() => {
    let isMounted = true;

    const loadHealth = async () => {
      try {
        const payload = await apiClient.getHealth();
        if (!isMounted) return;
        setHealth({ loading: false, payload, error: null });
      } catch (error) {
        if (!isMounted) return;
        setHealth({
          loading: false,
          payload: null,
          error: error instanceof Error ? error.message : 'Unable to fetch backend health.',
        });
      }
    };

    const loadValidation = async () => {
      try {
        const payload = await apiClient.getDevValidationReport();
        if (!isMounted) return;
        setValidation({ loading: false, payload: payload.data, error: null });
      } catch (error) {
        if (!isMounted) return;
        setValidation({
          loading: false,
          payload: null,
          error: error instanceof Error ? error.message : 'Unable to fetch validation report.',
        });
      }
    };

    loadHealth();
    loadValidation();

    return () => {
      isMounted = false;
    };
  }, []);

  const diagnostics = useMemo(() => {
    const companies = data?.companies ?? [];
    const domains = data?.domains ?? [];
    const topCompanies = data?.topCompanies ?? [];

    const confidenceDistribution = companies.reduce(
      (acc, company) => {
        const label = getConfidenceMeta(company.confidence_score).label;
        acc[label] = (acc[label] ?? 0) + 1;
        return acc;
      },
      { High: 0, Medium: 0, Low: 0, Unknown: 0 },
    );

    const scoreSummary = {
      growth: toNumericSummary(companies.map((company) => company.growth_score)),
      influence: toNumericSummary(companies.map((company) => company.influence_score)),
      power: toNumericSummary(companies.map((company) => company.power_score)),
    };

    const domainCounts = domains.map((domain) => domain.total_companies);
    const domainSummary = {
      totalDomains: domains.length,
      uniqueCountValues: new Set(domainCounts).size,
      topDomain: domains[0]?.domain ?? null,
      topDomainCount: domains[0]?.total_companies ?? null,
    };

    const latestCompanyUpdate = companies
      .map((company) => company.last_updated)
      .filter(Boolean)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

    const allConfidenceHigh = companies.length > 0 && companies.every((company) => getConfidenceMeta(company.confidence_score).label === 'High');
    const allTopGrowthIdentical =
      topCompanies.length > 1 && new Set(topCompanies.map((company) => company.growth_score)).size === 1;
    const allDomainCountsIdentical = domainCounts.length > 1 && new Set(domainCounts).size === 1;

    const repeatedChartValues = [
      {
        label: 'Growth trend chart',
        repeated: new Set((data?.growthTrendData ?? []).map((point) => point.startups)).size <= 1,
      },
      {
        label: 'Domain distribution chart',
        repeated: new Set((data?.domainChartData ?? []).map((point) => point.value)).size <= 1,
      },
      {
        label: 'Company comparison chart',
        repeated: new Set((data?.companyComparisonData ?? []).map((point) => point.valuation)).size <= 1,
      },
    ].filter((item) => item.repeated);

    const suspiciousIssues = [
      allConfidenceHigh ? 'All confidence badges resolve to High.' : null,
      allTopGrowthIdentical ? 'All top companies have identical growth scores.' : null,
      allDomainCountsIdentical ? 'All domains have identical company counts.' : null,
      ...repeatedChartValues.map((item) => `${item.label} has repeated values.`),
      scoreSummary.power.dominantPct >= 0.8
        ? `Power scores are highly uniform (${Math.round(scoreSummary.power.dominantPct * 100)}% share ${scoreSummary.power.dominantValue}).`
        : null,
      scoreSummary.growth.dominantPct >= 0.8
        ? `Growth scores are highly uniform (${Math.round(scoreSummary.growth.dominantPct * 100)}% share ${scoreSummary.growth.dominantValue}).`
        : null,
    ].filter(Boolean);

    return {
      scoreSummary,
      confidenceDistribution,
      domainSummary,
      latestCompanyUpdate,
      suspiciousIssues,
    };
  }, [data]);

  return (
    <main className={`space-y-6 p-6 ${compactMode ? 'space-y-4 p-4' : ''}`}>
      <section className={cardClass}>
        <SectionHeading
          title="Data Diagnostics"
          subtitle="Developer-focused checks for API wiring, data freshness, and suspiciously uniform values."
        />

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-theme-border bg-theme-chart p-3">
            <p className="text-xs text-theme-muted">API Base URL</p>
            <p className="mt-1 break-all text-sm font-semibold text-theme-primary">{API_BASE_URL || '(same origin)'}</p>
          </div>
          <div className="rounded-xl border border-theme-border bg-theme-chart p-3">
            <p className="text-xs text-theme-muted">Backend health</p>
            <p className="mt-1 text-sm font-semibold text-theme-primary">
              {health.loading ? 'Checking…' : health.error ? `Unhealthy (${health.error})` : health.payload?.status ?? 'Unknown'}
            </p>
          </div>
          <div className="rounded-xl border border-theme-border bg-theme-chart p-3">
            <p className="text-xs text-theme-muted">Total company count</p>
            <p className="mt-1 text-sm font-semibold text-theme-primary">{data?.companies?.length ?? 0}</p>
          </div>
          <div className="rounded-xl border border-theme-border bg-theme-chart p-3">
            <p className="text-xs text-theme-muted">Last updated timestamp</p>
            <p className="mt-1 text-sm font-semibold text-theme-primary">
              {data?.kpis?.freshness?.last_updated_at ?? diagnostics.latestCompanyUpdate ?? 'Unknown'}
            </p>
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <h3 className="text-base font-semibold text-theme-primary">Distribution summary</h3>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <div className="rounded-xl border border-theme-border bg-theme-chart p-4 text-sm text-theme-secondary">
            <p className="font-medium text-theme-primary">Score distribution summary</p>
            <ul className="mt-2 space-y-1">
              {Object.entries(diagnostics.scoreSummary).map(([key, summary]) => (
                <li key={key}>
                  <span className="capitalize">{key}</span>: min {formatNumber(summary.min)}, max {formatNumber(summary.max)}, avg{' '}
                  {formatNumber(summary.average)}, unique {summary.uniqueCount}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-theme-border bg-theme-chart p-4 text-sm text-theme-secondary">
            <p className="font-medium text-theme-primary">Confidence distribution summary</p>
            <ul className="mt-2 space-y-1">
              {Object.entries(diagnostics.confidenceDistribution).map(([label, count]) => (
                <li key={label}>
                  {label}: {count}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-theme-border bg-theme-chart p-4 text-sm text-theme-secondary">
            <p className="font-medium text-theme-primary">Domain distribution summary</p>
            <ul className="mt-2 space-y-1">
              <li>Total domains: {diagnostics.domainSummary.totalDomains}</li>
              <li>Unique count values: {diagnostics.domainSummary.uniqueCountValues}</li>
              <li>
                Top domain: {diagnostics.domainSummary.topDomain ?? '—'} ({diagnostics.domainSummary.topDomainCount ?? 0})
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <h3 className="text-base font-semibold text-theme-primary">Suspicious data issue flags</h3>
        {diagnostics.suspiciousIssues.length > 0 ? (
          <ul className="mt-4 space-y-2 text-sm text-amber-200">
            {diagnostics.suspiciousIssues.map((issue) => (
              <li key={issue} className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                ⚠ {issue}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            No suspicious uniformity patterns detected from current API payloads.
          </p>
        )}
      </section>

      <section className={cardClass}>
        <h3 className="text-base font-semibold text-theme-primary">Backend validation endpoint</h3>
        <p className="mt-1 text-xs text-theme-muted">Endpoint: /dev/validation/report (expected to be disabled in production).</p>
        <div className="mt-4 rounded-xl border border-theme-border bg-theme-chart p-4 text-xs text-theme-secondary">
          {validation.loading ? (
            <p>Loading validation report…</p>
          ) : validation.error ? (
            <p className="text-amber-200">Unable to read dev validation report: {validation.error}</p>
          ) : (
            <pre className="overflow-auto whitespace-pre-wrap break-words">{JSON.stringify(validation.payload, null, 2)}</pre>
          )}
        </div>
      </section>
    </main>
  );
};

export default DataDiagnosticsPage;
