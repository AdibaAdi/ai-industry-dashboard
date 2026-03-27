import SectionHeading from '../components/SectionHeading';

const scoreTone = (value) => {
  if (value >= 90) return 'text-emerald-400';
  if (value >= 82) return 'text-cyan-400';
  return 'text-amber-300';
};

const InvestorModePage = ({ compactMode, investorMode, loading, onOpenCompany }) => {
  const topStartups = investorMode?.top_emerging_startups ?? [];
  const risingByDomain = investorMode?.rising_companies_by_domain ?? [];
  const sectorMomentum = investorMode?.highest_momentum_sectors ?? [];
  const hiddenGems = investorMode?.hidden_gems ?? [];
  const takeaways = investorMode?.investor_takeaways ?? [];

  return (
    <main className={`space-y-6 p-6 ${compactMode ? 'space-y-4 p-4' : ''}`}>
      <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
        <SectionHeading
          title="Investor Mode"
          subtitle="Signal-driven intelligence on emerging AI startups, momentum sectors, and under-the-radar opportunities."
        />
        <p className="text-sm text-theme-muted">
          Derived investor_score blends growth, influence, power, domain momentum, underexposure, and recency weighting.
        </p>
      </section>

      <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
        <SectionHeading title="Top Emerging Startups" subtitle="High conviction names ranked by investor_score." />
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-theme-border text-left text-theme-muted">
                <th className="pb-3 font-medium">Company</th>
                <th className="pb-3 font-medium">Domain</th>
                <th className="pb-3 font-medium">Investor Score</th>
                <th className="pb-3 font-medium">Why flagged</th>
              </tr>
            </thead>
            <tbody>
              {(loading ? [] : topStartups).slice(0, 10).map((company) => (
                <tr
                  key={company.id}
                  onClick={() => onOpenCompany?.(company.id, 'Investor Mode: Top Emerging Startups')}
                  className="cursor-pointer border-b border-theme-border text-theme-secondary transition hover:bg-theme-surface/50 last:border-b-0"
                >
                  <td className="py-3 font-medium text-theme-primary">{company.name}</td>
                  <td className="py-3">{company.domain}</td>
                  <td className={`py-3 font-semibold ${scoreTone(company.investor_score)}`}>{company.investor_score.toFixed(1)}</td>
                  <td className="py-3 text-xs text-theme-muted">{company.investor_reasons?.join(' • ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
          <SectionHeading title="Rising by Domain" subtitle="Top up-and-coming companies per category." />
          <div className="space-y-3">
            {risingByDomain.slice(0, 12).map((company) => (
              <button
                key={`${company.domain}-${company.id}`}
                type="button"
                onClick={() => onOpenCompany?.(company.id, 'Investor Mode: Rising by Domain')}
                className="w-full rounded-xl border border-theme-border bg-theme-chart p-3 text-left transition hover:border-theme-accent"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-theme-primary">{company.name}</p>
                  <p className={`text-sm font-semibold ${scoreTone(company.investor_score)}`}>{company.investor_score.toFixed(1)}</p>
                </div>
                <p className="mt-1 text-xs uppercase tracking-wide text-theme-accent">{company.domain}</p>
                <p className="mt-1 text-xs text-theme-muted">{company.reason}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
          <SectionHeading title="Sector Momentum Snapshot" subtitle="Where macro momentum is compounding fastest." />
          <div className="space-y-3">
            {sectorMomentum.slice(0, 8).map((sector) => (
              <div key={sector.domain} className="rounded-xl border border-theme-border bg-theme-chart p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-theme-primary">{sector.domain}</p>
                  <p className={`text-sm font-semibold ${scoreTone(sector.domain_momentum)}`}>{sector.domain_momentum.toFixed(1)}</p>
                </div>
                <p className="mt-1 text-xs text-theme-muted">
                  {sector.total_companies} tracked · avg growth {sector.average_growth_score.toFixed(1)} · avg power {sector.average_power_score.toFixed(1)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
        <SectionHeading
          title="Undervalued / Under-the-radar Companies"
          subtitle="Strong momentum with lower category dominance and higher optionality."
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {hiddenGems.slice(0, 9).map((company) => (
            <button
              key={company.id}
              type="button"
              onClick={() => onOpenCompany?.(company.id, 'Investor Mode: Hidden Gems')}
              className="rounded-xl border border-theme-border bg-theme-chart p-4 text-left transition hover:-translate-y-0.5 hover:border-theme-accent"
            >
              <p className="text-sm font-semibold text-theme-primary">{company.name}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-theme-accent">{company.domain}</p>
              <p className="mt-2 text-xs text-theme-muted">Underexposure: {company.underexposure_score.toFixed(1)}</p>
              <p className={`mt-2 text-sm font-semibold ${scoreTone(company.investor_score)}`}>
                investor_score {company.investor_score.toFixed(1)}
              </p>
              <p className="mt-2 text-xs text-theme-muted">{company.investor_reasons?.[0]}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
        <SectionHeading title="Investor Takeaways" subtitle="Portfolio-level observations from current intelligence signals." />
        <ul className="space-y-2 text-sm text-theme-secondary">
          {takeaways.map((takeaway) => (
            <li key={takeaway} className="rounded-lg border border-theme-border bg-theme-chart px-3 py-2">
              {takeaway}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
};

export default InvestorModePage;
