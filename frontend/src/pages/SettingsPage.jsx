import SectionHeading from '../components/SectionHeading';

const ToggleControl = ({ label, description, checked, onChange }) => (
  <label className="flex items-start justify-between gap-3 rounded-xl border border-theme-border bg-theme-chart p-4">
    <div>
      <p className="text-sm font-medium text-theme-primary">{label}</p>
      <p className="mt-1 text-xs text-theme-muted">{description}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-theme-accent' : 'bg-slate-500/50'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? 'left-[22px]' : 'left-0.5'}`}
      />
    </button>
  </label>
);

const SettingsPage = ({ settings, compactMode }) => {
  const {
    theme,
    setTheme,
    setCompactMode,
    chartAnimations,
    setChartAnimations,
    notificationsEnabled,
    setNotificationsEnabled,
  } = settings;

  return (
    <main className={`space-y-6 p-6 ${compactMode ? 'space-y-4 p-4' : ''}`}>
      <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
        <SectionHeading
          title="Settings"
          subtitle="Personalize display, interaction density, and dashboard behavior."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <label className="rounded-xl border border-theme-border bg-theme-chart p-4 text-sm text-theme-muted">
            Theme preference
            <select
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
              className="mt-2 w-full rounded-lg border border-theme-border bg-theme-card px-3 py-2 text-theme-primary"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </label>

          <ToggleControl
            label="Compact mode"
            description="Reduce spacing for denser information views"
            checked={compactMode}
            onChange={() => setCompactMode((prev) => !prev)}
          />
          <ToggleControl
            label="Chart animation"
            description="Enable smooth transitions in chart rendering"
            checked={chartAnimations}
            onChange={() => setChartAnimations((prev) => !prev)}
          />
          <ToggleControl
            label="Notifications"
            description="Receive trend and KPI threshold alerts"
            checked={notificationsEnabled}
            onChange={() => setNotificationsEnabled((prev) => !prev)}
          />
        </div>
      </section>
    </main>
  );
};

export default SettingsPage;
