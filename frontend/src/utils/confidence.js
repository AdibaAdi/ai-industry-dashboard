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
  if (!Number.isFinite(score)) {
    return {
      label: 'Unknown',
      colorClass: 'text-theme-secondary border-theme-border bg-theme-surface',
      dotClass: 'bg-theme-muted',
      explanation: 'Confidence data is not available for this record yet.',
    };
  }

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

export const buildConfidenceTooltip = ({ score, sources = [], lastUpdated }) => {
  const meta = getConfidenceMeta(score);

  return [
    `Data Sources: ${sources.length ? sources.join(', ') : 'Not available'}`,
    `Last Updated: ${formatDate(lastUpdated)}`,
    `Confidence explanation: ${meta.explanation}`,
  ].join('\n');
};

export { formatDate };
