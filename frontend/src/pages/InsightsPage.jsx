const insights = [
  {
    title: 'Foundation model momentum remains strong',
    summary: 'Top model providers maintained double-digit quarterly growth driven by enterprise demand.',
  },
  {
    title: 'Infrastructure leaders gained influence',
    summary: 'GPU and model hosting companies saw higher influence scores due to ecosystem dependency.',
  },
  {
    title: 'Data platforms outpaced expectations',
    summary: 'Data tooling vendors recorded stronger growth scores as model evaluation needs increased.',
  },
  {
    title: 'Domain diversification is accelerating',
    summary: 'Healthcare and robotics categories are growing faster relative to their current market share.',
  },
];

const InsightsPage = () => {
  return (
    <main className="flex-1 space-y-6 p-6">
      <section className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-card">
        <h1 className="text-xl font-semibold text-slate-100">Insights</h1>
        <p className="mt-1 text-sm text-dashboard-muted">Short analytics observations from mock portfolio intelligence.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {insights.map((insight) => (
          <article
            key={insight.title}
            className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-card"
          >
            <h2 className="text-base font-semibold text-slate-100">{insight.title}</h2>
            <p className="mt-2 text-sm text-dashboard-muted">{insight.summary}</p>
          </article>
        ))}
      </section>
    </main>
  );
};

export default InsightsPage;
