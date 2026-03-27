const kpis = [
  { label: 'Total Companies', value: '1,248', trend: '+8.4%' },
  { label: 'Top Domain', value: 'Generative AI', trend: '32% share' },
  { label: 'Top Score', value: '98.7', trend: 'OpenAI' },
];

const KPICards = () => {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {kpis.map((kpi) => (
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
