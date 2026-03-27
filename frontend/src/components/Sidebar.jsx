const navItems = ['Dashboard', 'Companies', 'Domains', 'Insights', 'Settings'];

const Sidebar = () => {
  return (
    <aside className="hidden w-64 border-r border-dashboard-border bg-slate-950/60 px-4 py-6 lg:block">
      <nav className="space-y-2">
        {navItems.map((item, index) => (
          <button
            key={item}
            className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
              index === 0
                ? 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/40'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
