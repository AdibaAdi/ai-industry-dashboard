const KPICards = ({ kpis, loading }) => {
  const cards = [
    {
      label: 'Total Companies',
      value: loading ? '…' : kpis.totalCompanies.toLocaleString(),
      trend: 'Live from intelligence layer',
    },
    {
      label: 'Top Domain',
      value: loading ? '…' : kpis.topDomain,
      trend: 'By active company count',
    },
    {
      label: 'Top Score',
      value: loading ? '…' : Number(kpis.topScore).toFixed(1),
      trend: loading ? '...' : kpis.topCompany,
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {cards.map((kpi) => (
        <article key={kpi.label} className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
          <p className="text-sm text-theme-muted">{kpi.label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-theme-primary">{kpi.value}</p>
          <p className="mt-2 text-sm text-emerald-400">{kpi.trend}</p>
        </article>
      ))}
    </section>
  );
};

export default KPICards;
