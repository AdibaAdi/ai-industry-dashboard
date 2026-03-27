const KPICards = ({ kpis, loading }) => {
  const coverageYear = kpis.freshness?.current_year_coverage?.year;
  const coverageRecords = kpis.freshness?.current_year_coverage?.covered_records ?? 0;
  const coveragePct = kpis.freshness?.current_year_coverage?.coverage_pct ?? 0;

  const cards = [
    {
      label: 'Total Companies',
      value: loading ? '…' : kpis.totalCompanies.toLocaleString(),
      trend: 'Live from intelligence layer',
      trendClassName: 'text-emerald-400',
    },
    {
      label: 'Top Domain',
      value: loading ? '…' : kpis.topDomain,
      trend: 'By active company count',
      trendClassName: 'text-emerald-400',
    },
    {
      label: 'Top Score',
      value: loading ? '…' : Number(kpis.topScore).toFixed(1),
      trend: loading ? '...' : kpis.topCompany,
      trendClassName: 'text-emerald-400',
    },
    {
      label: 'Refresh Status',
      value: loading ? '…' : `${kpis.freshness?.newly_added_companies ?? 0} new · ${kpis.freshness?.updated_records_count ?? 0} updated`,
      trend: loading
        ? '...'
        : `${coverageYear ?? new Date().getFullYear()} coverage ${coverageRecords}/${kpis.totalCompanies} (${coveragePct}%)`,
      trendClassName: 'text-theme-secondary',
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((kpi) => (
        <article key={kpi.label} className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
          <p className="text-sm text-theme-muted">{kpi.label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-theme-primary">{kpi.value}</p>
          <p className={`mt-2 text-sm ${kpi.trendClassName}`}>{kpi.trend}</p>
        </article>
      ))}
    </section>
  );
};

export default KPICards;
