const domains = [
  { name: 'Generative AI', companies: 402, share: '32%' },
  { name: 'Infrastructure', companies: 268, share: '21%' },
  { name: 'Data Platforms', companies: 221, share: '18%' },
  { name: 'Robotics', companies: 167, share: '13%' },
  { name: 'Healthcare AI', companies: 190, share: '16%' },
];

const DomainsPage = () => {
  return (
    <main className="flex-1 space-y-6 p-6">
      <section className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-card">
        <h1 className="text-xl font-semibold text-slate-100">Domains</h1>
        <p className="mt-1 text-sm text-dashboard-muted">Category-level distribution of AI company activity.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {domains.map((domain) => (
          <article
            key={domain.name}
            className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-card"
          >
            <h2 className="text-base font-semibold text-slate-100">{domain.name}</h2>
            <p className="mt-3 text-sm text-dashboard-muted">Companies tracked</p>
            <p className="text-2xl font-semibold text-cyan-300">{domain.companies}</p>
            <p className="mt-2 text-sm text-emerald-300">{domain.share} market share</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-card">
        <h2 className="text-lg font-semibold text-slate-100">Distribution Summary</h2>
        <p className="mt-2 text-sm text-dashboard-muted">
          Generative AI and infrastructure remain the largest concentration areas, while healthcare AI and robotics
          continue to expand their footprint.
        </p>
      </section>
    </main>
  );
};

export default DomainsPage;
