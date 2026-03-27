const statusTheme = {
  fresh: {
    label: 'Fresh',
    ring: 'ring-emerald-400/30',
    dot: 'bg-emerald-400',
    text: 'text-emerald-300',
  },
  aging: {
    label: 'Aging',
    ring: 'ring-amber-400/30',
    dot: 'bg-amber-400',
    text: 'text-amber-300',
  },
  stale: {
    label: 'Stale',
    ring: 'ring-rose-400/30',
    dot: 'bg-rose-400',
    text: 'text-rose-300',
  },
};

const formatLastUpdated = (isoTimestamp) => {
  if (!isoTimestamp) {
    return 'Awaiting refresh';
  }

  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
};

const Header = ({ theme, freshness, onToggleTheme }) => {
  const freshnessStatus = statusTheme[freshness?.freshness_status] ?? statusTheme.aging;

  return (
    <header className="sticky top-0 z-20 border-b border-theme-border bg-theme-header px-6 py-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-theme-muted">Industry Intelligence</p>
          <h1 className="text-2xl font-semibold tracking-tight text-theme-primary">AI Industry Dashboard</h1>
          <div className="mt-2 flex items-center gap-3 text-xs text-theme-muted">
            <p>
              Last Updated:{' '}
              <span className="font-medium text-theme-secondary">{formatLastUpdated(freshness?.last_updated_at)}</span>
            </p>
            <span
              className={`inline-flex items-center gap-2 rounded-full border border-theme-border px-2.5 py-1 ring-1 ${freshnessStatus.ring}`}
            >
              <span className={`h-2 w-2 rounded-full ${freshnessStatus.dot}`} />
              <span className={`font-medium ${freshnessStatus.text}`}>{freshnessStatus.label}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="rounded-lg border border-theme-border bg-theme-card px-3 py-2 text-sm text-theme-primary transition hover:border-theme-accent hover:text-theme-accent"
          >
            {theme === 'dark' ? '☀ Light mode' : '🌙 Dark mode'}
          </button>
          <button className="rounded-lg border border-theme-border bg-theme-card px-4 py-2 text-sm text-theme-primary transition hover:border-theme-accent hover:text-theme-accent">
            Export Report
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
