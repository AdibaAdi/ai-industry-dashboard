import { useState } from 'react';
import SectionHeading from '../components/SectionHeading';

const insights = [
  {
    title: 'Foundation model momentum remains strong',
    summary: 'Top model providers maintained double-digit quarterly growth driven by enterprise demand.',
    detail:
      'Enterprise workloads are consolidating around fewer trusted model providers. Security controls, lower latency tiers, and reliable eval benchmarks are expanding average contract values across finance, legal, and support automation.',
  },
  {
    title: 'Infrastructure leaders gained influence',
    summary: 'GPU and model hosting companies saw higher influence scores due to ecosystem dependency.',
    detail:
      'Inference routing, model serving, and GPU access are now strategic dependencies. Companies that reduce deployment friction and optimize cost-per-token are becoming default vendors in multi-model stacks.',
  },
  {
    title: 'Data platforms outpaced expectations',
    summary: 'Data tooling vendors recorded stronger growth scores as model evaluation needs increased.',
    detail:
      'As quality and safety standards rise, teams are investing in synthetic data, annotation feedback loops, and rigorous regression testing. This is driving demand for integrated data and MLOps platforms.',
  },
  {
    title: 'Domain diversification is accelerating',
    summary: 'Healthcare and robotics categories are growing faster relative to their current market share.',
    detail:
      'Vertical AI companies with direct outcome ownership are capturing defensible value. High-switching-cost domains such as healthcare operations and robotics are seeing stronger retention curves and expansion revenue.',
  },
];

const InsightsPage = ({ compactMode }) => {
  const [activeInsight, setActiveInsight] = useState(null);

  return (
    <main className={`space-y-6 p-6 ${compactMode ? 'space-y-4 p-4' : ''}`}>
      <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
        <SectionHeading
          title="Insights"
          subtitle="Interactive analyst-style observations from mock portfolio intelligence."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {insights.map((insight) => (
          <button
            key={insight.title}
            type="button"
            onClick={() => setActiveInsight(insight)}
            className="rounded-2xl border border-theme-border bg-theme-card p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:border-theme-accent"
          >
            <h2 className="text-base font-semibold text-theme-primary">{insight.title}</h2>
            <p className="mt-2 text-sm text-theme-muted">{insight.summary}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.15em] text-theme-accent">Click for details</p>
          </button>
        ))}
      </section>

      {activeInsight ? (
        <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-theme-primary">{activeInsight.title}</h3>
            <button
              type="button"
              onClick={() => setActiveInsight(null)}
              className="rounded-lg border border-theme-border px-3 py-1.5 text-sm text-theme-muted hover:border-theme-accent hover:text-theme-accent"
            >
              Close
            </button>
          </div>
          <p className="mt-3 text-sm leading-6 text-theme-secondary">{activeInsight.detail}</p>
        </section>
      ) : null}
    </main>
  );
};

export default InsightsPage;
