const Header = () => {
  return (
    <header className="sticky top-0 z-20 border-b border-dashboard-border bg-slate-900/80 px-6 py-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-dashboard-muted">Industry Intelligence</p>
          <h1 className="text-2xl font-semibold text-slate-100">AI Industry Dashboard</h1>
        </div>
        <button className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300">
          Export Report
        </button>
      </div>
    </header>
  );
};

export default Header;
