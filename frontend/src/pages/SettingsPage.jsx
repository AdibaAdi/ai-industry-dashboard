const settingsCards = [
  {
    title: 'Profile Preferences',
    description: 'Manage account profile details, team visibility, and dashboard display preferences.',
  },
  {
    title: 'Notification Controls',
    description: 'Configure update cadence for KPI alerts, trend summaries, and weekly intelligence digests.',
  },
  {
    title: 'Data Source Integrations',
    description: 'Placeholder for connecting external analytics, market feeds, and proprietary scoring data.',
  },
];

const SettingsPage = () => {
  return (
    <main className="flex-1 space-y-6 p-6">
      <section className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-card">
        <h1 className="text-xl font-semibold text-slate-100">Settings</h1>
        <p className="mt-1 text-sm text-dashboard-muted">Configuration placeholders for future platform controls.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {settingsCards.map((card) => (
          <article key={card.title} className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-card">
            <h2 className="text-base font-semibold text-slate-100">{card.title}</h2>
            <p className="mt-2 text-sm text-dashboard-muted">{card.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
};

export default SettingsPage;
