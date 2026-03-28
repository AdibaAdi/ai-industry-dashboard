import { buildConfidenceTooltip, getConfidenceMeta, formatDate } from '../utils/confidence';

const ConfidenceBadge = ({ score, sources = [], lastUpdated, compact = false }) => {
  const meta = getConfidenceMeta(score);
  const tooltip = buildConfidenceTooltip({ score, sources, lastUpdated });

  return (
    <div className="group relative inline-flex items-center" title={tooltip}>
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${meta.colorClass}`}
        aria-label={`Confidence: ${meta.label}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} aria-hidden="true" />
        {compact ? meta.label : `Confidence: ${meta.label}`}
      </span>
      <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-72 rounded-lg border border-theme-border bg-theme-card p-3 text-xs text-theme-secondary shadow-xl group-hover:block">
        <p className="font-semibold text-theme-primary">Data sources</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          {(sources.length ? sources : ['Not available']).map((source) => (
            <li key={source}>{source}</li>
          ))}
        </ul>
        <p className="mt-2 text-theme-muted">Last updated: {formatDate(lastUpdated)}</p>
        <p className="mt-1 text-theme-muted">{meta.explanation}</p>
      </div>
    </div>
  );
};

export default ConfidenceBadge;
