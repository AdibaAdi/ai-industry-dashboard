import { useMemo, useState } from 'react';
import SectionHeading from '../components/SectionHeading';

const InsightsPage = ({ compactMode, insights }) => {
  const [activeInsight, setActiveInsight] = useState(null);

  const highlights = useMemo(() => insights?.highlights ?? [], [insights]);

  return (
    <main className={`space-y-6 p-6 ${compactMode ? 'space-y-4 p-4' : ''}`}>
      <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
        <SectionHeading
          title="Insights"
          subtitle="Interactive analyst-style observations generated from API intelligence."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {highlights.map((insight) => (
          <button
            key={insight.id}
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
