import { buildKpiCardModels } from '../utils/dashboardDataBuilder';

const KPICards = ({ kpis, loading }) => {
  const cards = buildKpiCardModels(kpis, loading).map((card) => ({
    ...card,
    trendClassName: card.label === 'Refresh Status' ? 'text-theme-secondary' : 'text-emerald-400',
  }));

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
