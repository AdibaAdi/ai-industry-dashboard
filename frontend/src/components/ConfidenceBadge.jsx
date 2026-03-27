const confidenceBands = {
  high: {
    label: 'High',
    colorClass: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10',
    dotClass: 'bg-emerald-400',
    explanation: 'Based on multiple verified sources with recent updates.',
  },
  medium: {
    label: 'Medium',
    colorClass: 'text-amber-200 border-amber-400/40 bg-amber-500/10',
    dotClass: 'bg-amber-300',
    explanation: 'Based on partial source coverage and moderate recency.',
  },
  low: {
    label: 'Low',
    colorClass: 'text-rose-200 border-rose-500/40 bg-rose-500/10',
    dotClass: 'bg-rose-400',
    explanation: 'Based on limited or stale sources and should be reviewed.',
  },
};

export const getConfidenceMeta = (score = 0) => {
  if (score >= 0.8) return confidenceBands.high;
  if (score >= 0.5) return confidenceBands.medium;
  return confidenceBands.low;
};

const formatDate = (value) => {
  if (!value) return 'Unknown';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const ConfidenceBadge = ({ score = 0, sources = [], lastUpdated, compact = false }) => {
  const meta = getConfidenceMeta(score);
  const tooltip = [
    `Data Sources: ${sources.length ? sources.join(', ') : 'Not available'}`,
    `Last Updated: ${formatDate(lastUpdated)}`,
    `Confidence explanation: ${meta.explanation}`,
  ].join('\n');

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
