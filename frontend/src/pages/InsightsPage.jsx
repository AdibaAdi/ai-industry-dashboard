import { useMemo, useState } from 'react';
import SectionHeading from '../components/SectionHeading';

const strengthTone = (strength = 0.5) => {
  if (strength >= 0.8) {
    return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  }

  if (strength >= 0.65) {
    return 'text-amber-300 border-amber-500/30 bg-amber-500/10';
  }

  return 'text-sky-300 border-sky-500/30 bg-sky-500/10';
};

const InsightsPage = ({ compactMode, insights, onOpenCompany }) => {
  const [activeInsightId, setActiveInsightId] = useState(null);

  const highlights = useMemo(() => insights?.highlights ?? [], [insights]);

  const activeInsight = useMemo(
    () => highlights.find((insight) => insight.id === activeInsightId) ?? highlights[0] ?? null,
    [activeInsightId, highlights],
  );

  return (
    <main className={`space-y-6 p-6 ${compactMode ? 'space-y-4 p-4' : ''}`}>
      <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
        <SectionHeading
          title="Analyst Intelligence"
          subtitle="Evidence-backed market observations generated from the AI industry dataset."
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="grid gap-4 md:grid-cols-2">
          {highlights.map((insight) => (
            <button
              key={insight.id}
              type="button"
              onClick={() => setActiveInsightId(insight.id)}
              className={`rounded-2xl border bg-theme-card p-5 text-left shadow-card transition ${
                activeInsight?.id === insight.id
                  ? 'border-theme-accent ring-1 ring-theme-accent/40'
                  : 'border-theme-border hover:-translate-y-0.5 hover:border-theme-accent'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold text-theme-primary">{insight.title}</h2>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${strengthTone(
                    insight.confidence?.strength,
                  )}`}
                >
                  {insight.confidence?.level ?? 'Signal'}
                </span>
              </div>
              <p className="mt-2 text-sm text-theme-muted">{insight.short_summary}</p>

              <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-theme-secondary">
                {insight.supporting_metrics?.slice(0, 2).map((metric) => (
                  <div key={`${insight.id}-${metric.label}`} className="flex items-center justify-between rounded-lg border border-theme-border px-3 py-2">
                    <span>{metric.label}</span>
                    <span className="font-semibold text-theme-primary">{metric.value}</span>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>

        {activeInsight ? (
          <aside className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-theme-accent">Executive Brief</p>
                <h3 className="mt-2 text-lg font-semibold text-theme-primary">{activeInsight.title}</h3>
              </div>
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${strengthTone(
                  activeInsight.confidence?.strength,
                )}`}
              >
                {activeInsight.confidence?.level ?? 'Signal'}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-theme-secondary">{activeInsight.detailed_explanation}</p>

            <div className="mt-4 rounded-xl border border-theme-border bg-theme-chart px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-theme-muted">Why it matters</p>
              <p className="mt-2 text-sm leading-6 text-theme-secondary">{activeInsight.why_it_matters}</p>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {activeInsight.supporting_metrics?.map((metric) => (
                <div key={`${activeInsight.id}-${metric.label}`} className="rounded-lg border border-theme-border px-3 py-2">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-theme-muted">{metric.label}</p>
                  <p className="mt-1 text-base font-semibold text-theme-primary">{metric.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-theme-muted">Relevant companies</p>
                <span className="rounded-full border border-theme-border px-2 py-0.5 text-[11px] text-theme-secondary">
                  {activeInsight.related_domain}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeInsight.relevant_companies?.map((company) => (
                  <button
                    key={`${activeInsight.id}-${company.id}`}
                    type="button"
                    onClick={() => onOpenCompany?.(company.id, `Insight: ${activeInsight.title}`)}
                    className="rounded-full border border-theme-border bg-theme-chart px-3 py-1.5 text-xs text-theme-secondary transition hover:border-theme-accent hover:text-theme-accent"
                  >
                    {company.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        ) : null}
      </section>
    </main>
  );
};

export default InsightsPage;
