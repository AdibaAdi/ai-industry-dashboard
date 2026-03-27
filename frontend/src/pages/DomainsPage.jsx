import SectionHeading from '../components/SectionHeading';

const DomainsPage = ({ compactMode, domains }) => {
  return (
    <main className={`space-y-6 p-6 ${compactMode ? 'space-y-4 p-4' : ''}`}>
      <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
        <SectionHeading
          title="Domains"
          subtitle="Category-level concentration, momentum signals, and representative leaders."
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {domains.slice(0, 9).map((domain) => (
          <article key={domain.domain} className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
            <h2 className="text-base font-semibold text-theme-primary">{domain.domain}</h2>
            <p className="mt-3 text-sm text-theme-muted">Companies tracked</p>
            <p className="text-2xl font-semibold text-cyan-400">{domain.total_companies}</p>
            <p className="mt-2 text-sm text-emerald-400">{domain.share} share of tracked set</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
        <SectionHeading title="Distribution Summary" subtitle="API-generated executive readout" />
        <div className="space-y-2 text-sm leading-6 text-theme-secondary">
          <p>
            The current API dataset highlights domain concentration around high-capex model and infrastructure clusters,
            while verticals like healthcare and robotics continue to build defensible, outcome-driven traction.
          </p>
          <p>
            Segment-level averages make it easy to compare domain maturity and can later power automated trend alerts,
            retrieval workflows, and forecasting pipelines.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
        <SectionHeading title="Top Companies by Domain" subtitle="Representative leaders from API aggregation" />
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-theme-border text-left text-theme-muted">
                <th className="pb-3 font-medium">Domain</th>
                <th className="pb-3 font-medium">Top Companies</th>
                <th className="pb-3 font-medium">Avg Power Score</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((domain) => (
                <tr key={domain.domain} className="border-b border-theme-border text-theme-secondary last:border-b-0">
                  <td className="py-3 font-medium text-theme-primary">{domain.domain}</td>
                  <td className="py-3">{domain.leaders.map((leader) => leader.name).join(' • ')}</td>
                  <td className="py-3">{domain.average_power_score.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default DomainsPage;
