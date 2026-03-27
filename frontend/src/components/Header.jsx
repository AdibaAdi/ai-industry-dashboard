const Header = ({ theme, onToggleTheme }) => {
  return (
    <header className="sticky top-0 z-20 border-b border-theme-border bg-theme-header px-6 py-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-theme-muted">Industry Intelligence</p>
          <h1 className="text-2xl font-semibold tracking-tight text-theme-primary">AI Industry Dashboard</h1>
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
