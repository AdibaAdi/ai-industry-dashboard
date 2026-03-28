const baseNavItems = ['Dashboard', 'Companies', 'Market View', 'Domains', 'Insights', 'Investor Mode', 'Ask AI', 'Settings'];

const Sidebar = ({ activeItem, onSelectItem, showDiagnostics = false }) => {
  const navItems = showDiagnostics ? [...baseNavItems, 'Data Diagnostics'] : baseNavItems;

  return (
    <aside className="hidden w-64 border-r border-theme-border bg-theme-sidebar px-4 py-6 lg:block">
      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = item === activeItem;

          return (
            <button
              key={item}
              type="button"
              onClick={() => onSelectItem(item)}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                isActive
                  ? 'bg-theme-chart text-theme-accent ring-1 ring-theme-accent/40'
                  : 'text-theme-secondary hover:bg-theme-card hover:text-theme-primary'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {item}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
