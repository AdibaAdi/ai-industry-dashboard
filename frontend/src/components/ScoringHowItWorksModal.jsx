import { defaultScoreOrder, scoreDefinitions } from './scoreInfo';

const ScoringHowItWorksModal = ({ isOpen, onClose, scoreKeys = defaultScoreOrder }) => {
  if (!isOpen) return null;

  const visibleScores = scoreKeys
    .map((scoreKey) => scoreDefinitions[scoreKey])
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-theme-border bg-theme-card shadow-card">
        <div className="flex items-start justify-between gap-4 border-b border-theme-border px-6 py-4">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-theme-accent">Scoring Transparency</p>
            <h2 className="mt-1 text-xl font-semibold text-theme-primary">How scoring works</h2>
            <p className="mt-1 text-sm text-theme-muted">Designed for readability: directional scores, weighted components, and why each metric matters.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-theme-border px-3 py-1.5 text-sm text-theme-muted transition hover:border-theme-accent hover:text-theme-primary"
          >
            Close
          </button>
        </div>

        <div className="max-h-[72vh] space-y-4 overflow-y-auto px-6 py-5">
          {visibleScores.map((score) => (
            <article key={score.key} className="rounded-xl border border-theme-border bg-theme-chart p-4">
              <h3 className="text-base font-semibold text-theme-primary">{score.name}</h3>
              <p className="mt-1 text-sm text-theme-secondary">{score.shortExplanation}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-theme-border bg-theme-surface/40 p-3">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-theme-accent">Intended to measure</p>
                  <p className="mt-2 text-sm text-theme-secondary">{score.intendedMeasure}</p>
                </div>
                <div className="rounded-lg border border-theme-border bg-theme-surface/40 p-3">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-theme-accent">Why it matters</p>
                  <p className="mt-2 text-sm text-theme-secondary">{score.whyItMatters}</p>
                </div>
              </div>

              <div className="mt-3 rounded-lg border border-theme-border bg-theme-surface/40 p-3">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-theme-accent">Simple formula</p>
                <p className="mt-2 text-sm font-medium text-theme-primary">{score.formula}</p>
                <ul className="mt-3 space-y-1.5 text-sm text-theme-secondary">
                  {score.weightedBreakdown.map((item) => (
                    <li key={`${score.key}-${item.label}`} className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex min-w-12 justify-center rounded-full border border-theme-border px-2 py-0.5 text-xs font-semibold text-theme-accent">
                        {item.weight}
                      </span>
                      <span className="font-medium text-theme-primary">{item.label}:</span>
                      <span className="text-theme-muted">{item.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScoringHowItWorksModal;
