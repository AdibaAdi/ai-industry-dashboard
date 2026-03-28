import SectionHeading from '../components/SectionHeading';
import ConfidenceBadge from '../components/ConfidenceBadge';

const marketCapFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
});

const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const MarketViewPage = ({ compactMode, companies, onOpenCompany }) => {
  const publicCompanies = companies
    .filter((company) => company.company_type === 'Public')
    .sort((a, b) => (b.valuation ?? 0) - (a.valuation ?? 0));

  const privateCompanies = companies
    .filter((company) => company.company_type === 'Private')
    .sort((a, b) => (b.valuation ?? 0) - (a.valuation ?? 0));

  return (
    <main className={`space-y-6 p-6 ${compactMode ? 'space-y-4 p-4' : ''}`}>
      <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
        <SectionHeading
          title="Market View"
          subtitle="Public-market signals for AI companies and comparables across tracked domains."
        />
        <p className="mt-3 text-sm text-theme-secondary">
          Data source: <span className="font-semibold text-theme-primary">API company dataset</span>.
          This view renders public/private company market context directly from backend fields.
        </p>
      </section>

      <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
        <SectionHeading
          title="Public Market Leaders"
          subtitle="Public AI companies with active tickers and market signal coverage."
        />
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-theme-muted">
            Showing <span className="font-semibold text-theme-primary">{publicCompanies.length}</span> public companies.
          </p>
          <p className="text-xs text-theme-muted">Sorted by valuation from current API payload.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-theme-border text-left text-theme-muted">
                <th className="pb-3 font-medium">Company</th>
                <th className="pb-3 font-medium">Power Score</th>
                <th className="pb-3 font-medium">Market Cap</th>
                <th className="pb-3 font-medium">Funding</th>
                <th className="pb-3 font-medium">Confidence</th>
                <th className="pb-3 font-medium">AI Domain</th>
              </tr>
            </thead>
            <tbody>
              {publicCompanies.map((company) => (
                <tr
                  key={company.id}
                  className="cursor-pointer border-b border-theme-border text-theme-secondary transition hover:bg-theme-surface/50 last:border-b-0"
                  onClick={() => onOpenCompany?.(company.id, 'Market View')}
                >
                  <td className="py-3 font-medium text-theme-primary">{company.name}</td>
                  <td className="py-3 text-theme-primary">
                    {typeof company.power_score === 'number' ? company.power_score.toFixed(1) : 'N/A'}
                  </td>
                  <td className="py-3 text-theme-primary">
                    {typeof company.valuation === 'number'
                      ? `$${marketCapFormatter.format(company.valuation / 1000)}B`
                      : 'N/A'}
                  </td>
                  <td className="py-3 text-theme-primary">
                    {typeof company.funding === 'number' ? compactCurrency.format(company.funding * 1_000_000) : 'N/A'}
                  </td>
                  <td className="py-3">
                    <ConfidenceBadge
                      score={company.confidence_score}
                      sources={company.sources}
                      lastUpdated={company.last_updated}
                      compact
                    />
                  </td>
                  <td className="py-3">{company.domain} · {company.subdomain}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
        <SectionHeading
          title="Private AI Companies"
          subtitle="Private AI companies without public-market tickers."
        />
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-theme-muted">
            Showing <span className="font-semibold text-theme-primary">{privateCompanies.length}</span> private companies.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-theme-border text-left text-theme-muted">
                <th className="pb-3 font-medium">Company</th>
                <th className="pb-3 font-medium">Valuation</th>
                <th className="pb-3 font-medium">Funding</th>
                <th className="pb-3 font-medium">Growth Score</th>
                <th className="pb-3 font-medium">Last Updated</th>
                <th className="pb-3 font-medium">Confidence</th>
                <th className="pb-3 font-medium">AI Domain</th>
              </tr>
            </thead>
            <tbody>
              {privateCompanies.map((company) => (
                <tr
                  key={company.id}
                  className="cursor-pointer border-b border-theme-border text-theme-secondary transition hover:bg-theme-surface/50 last:border-b-0"
                  onClick={() => onOpenCompany?.(company.id, 'Market View')}
                >
                  <td className="py-3 font-medium text-theme-primary">{company.name}</td>
                  <td className="py-3 text-theme-primary">
                    {typeof company.valuation === 'number' ? compactCurrency.format(company.valuation * 1_000_000) : 'N/A'}
                  </td>
                  <td className="py-3 text-theme-primary">
                    {typeof company.funding === 'number' ? compactCurrency.format(company.funding * 1_000_000) : 'N/A'}
                  </td>
                  <td className="py-3 text-theme-primary">{typeof company.growth_score === 'number' ? company.growth_score.toFixed(1) : 'N/A'}</td>
                  <td className="py-3">{company.last_updated ?? 'N/A'}</td>
                  <td className="py-3">
                    <ConfidenceBadge
                      score={company.confidence_score}
                      sources={company.sources}
                      lastUpdated={company.last_updated}
                      compact
                    />
                  </td>
                  <td className="py-3">{company.domain} · {company.subdomain}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default MarketViewPage;
