import SectionHeading from '../components/SectionHeading';
import { buildDomainCardModels } from '../utils/dashboardDataBuilder';

const DomainsPage = ({ compactMode, domains, domainsMeta, domainWarnings }) => {
  const topDomain = domains[0] ?? null;
  const secondDomain = domains[1] ?? null;
  const totalCompanies = domainsMeta?.total_companies ?? domains.reduce((sum, domain) => sum + domain.total_companies, 0);

  return (
    <main className={`space-y-6 p-6 ${compactMode ? 'space-y-4 p-4' : ''}`}>
      <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
        <SectionHeading
          title="Domains"
          subtitle="Category-level concentration, momentum signals, and representative leaders."
        />
      </section>

      {domainWarnings?.length ? (
        <section className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 shadow-card">
          <p className="text-sm font-semibold text-amber-200">Backend validation warning</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-100">
            {domainWarnings.map((warning) => (
              <li key={warning.type}>{warning.message}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {buildDomainCardModels(domains).map((domainCard) => (
          <article key={domainCard.key} className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
            <h2 className="text-base font-semibold text-theme-primary">{domainCard.title}</h2>
            <p className="mt-3 text-sm text-theme-muted">Companies tracked</p>
            <p className="text-2xl font-semibold text-cyan-400">{domainCard.totalCompanies}</p>
            <p className="mt-2 text-sm text-emerald-400">{domainCard.shareLabel}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
        <SectionHeading title="Distribution Summary" subtitle="Computed directly from classified company records" />
        <div className="space-y-2 text-sm leading-6 text-theme-secondary">
          <p>
            Domain coverage is based on {totalCompanies} classified companies. The largest domain is{' '}
            <span className="font-medium text-theme-primary">{topDomain?.domain ?? '—'}</span> at{' '}
            <span className="font-medium text-theme-primary">{topDomain?.share ?? '—'}</span> ({topDomain?.total_companies ?? 0}{' '}
            companies).
          </p>
          <p>
            {secondDomain
              ? `The next-largest domain is ${secondDomain.domain} with ${secondDomain.share} (${secondDomain.total_companies} companies), showing the current concentration gradient.`
              : 'Additional domain concentration details will appear once at least two domains are available.'}
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
