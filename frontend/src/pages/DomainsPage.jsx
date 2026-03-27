import { useMemo } from 'react';
import SectionHeading from '../components/SectionHeading';
import { companies, domainLeaders } from '../data/companies';

const DomainsPage = ({ compactMode }) => {
  const domains = useMemo(() => {
    const counts = companies.reduce((acc, company) => {
      acc[company.domain] = (acc[company.domain] || 0) + 1;
      return acc;
    }, {});

    const total = companies.length;
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        companies: count,
        share: `${Math.round((count / total) * 100)}%`,
      }))
      .sort((a, b) => b.companies - a.companies);
  }, []);

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
          <article key={domain.name} className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
            <h2 className="text-base font-semibold text-theme-primary">{domain.name}</h2>
            <p className="mt-3 text-sm text-theme-muted">Companies tracked</p>
            <p className="text-2xl font-semibold text-cyan-400">{domain.companies}</p>
            <p className="mt-2 text-sm text-emerald-400">{domain.share} share of tracked set</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
        <SectionHeading title="Distribution Summary" subtitle="Executive readout" />
        <div className="space-y-2 text-sm leading-6 text-theme-secondary">
          <p>
            Foundation-model and generative ecosystems still dominate market mindshare, but enterprise-specific
            categories are catching up through workflow integration and reliability gains.
          </p>
          <p>
            Infrastructure and data-platform players remain critical force multipliers, especially where deployment,
            evaluation, and governance are mandatory for regulated use cases.
          </p>
          <p>
            Robotics and healthcare clusters show durable growth with tighter model-to-outcome loops, indicating
            stronger defensibility than broad horizontal tooling.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
        <SectionHeading title="Top Companies by Domain" subtitle="Representative leaders in each segment" />
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-theme-border text-left text-theme-muted">
                <th className="pb-3 font-medium">Domain</th>
                <th className="pb-3 font-medium">Top Companies</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(domainLeaders).map(([domain, leaders]) => (
                <tr key={domain} className="border-b border-theme-border text-theme-secondary last:border-b-0">
                  <td className="py-3 font-medium text-theme-primary">{domain}</td>
                  <td className="py-3">{leaders.join(' • ')}</td>
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
