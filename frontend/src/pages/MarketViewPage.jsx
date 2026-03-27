import SectionHeading from '../components/SectionHeading';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { getMarketFeedMeta, getPublicMarketCompanies } from '../data/marketSignals';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const marketCapFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
});

const PriceTrendSparkline = ({ data }) => {
  if (!data?.length) {
    return <p className="text-xs text-theme-muted">Trend unavailable</p>;
  }

  const firstPrice = data[0].price;
  const lastPrice = data[data.length - 1].price;
  const isPositive = lastPrice >= firstPrice;

  return (
    <div className="h-16 w-full rounded-lg bg-theme-chart px-1 py-1">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="price"
            stroke={isPositive ? 'var(--theme-accent)' : '#f87171'}
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const MarketViewPage = ({ compactMode, companies, onOpenCompany }) => {
  const publicCompanies = getPublicMarketCompanies(companies);
  const marketFeedMeta = getMarketFeedMeta();

  return (
    <main className={`space-y-6 p-6 ${compactMode ? 'space-y-4 p-4' : ''}`}>
      <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
        <SectionHeading
          title="Market View"
          subtitle="Public-market signals for AI companies and comparables across tracked domains."
        />
        <p className="mt-3 text-sm text-theme-secondary">
          Data source: <span className="font-semibold text-theme-primary capitalize">{marketFeedMeta.source}</span> feed (live-ready fallback).
          Values are indicative and structured for future market API integration.
        </p>
      </section>

      <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-theme-muted">
            Showing <span className="font-semibold text-theme-primary">{publicCompanies.length}</span> public companies.
          </p>
          <p className="text-xs text-theme-muted">Snapshot as of {new Date(marketFeedMeta.asOf).toLocaleString()}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-theme-border text-left text-theme-muted">
                <th className="pb-3 font-medium">Company</th>
                <th className="pb-3 font-medium">Ticker</th>
                <th className="pb-3 font-medium">Latest Price</th>
                <th className="pb-3 font-medium">Price Trend</th>
                <th className="pb-3 font-medium">Market Cap</th>
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
                  <td className="py-3 font-mono text-theme-primary">{company.marketSignal?.ticker ?? 'No ticker'}</td>
                  <td className="py-3 text-theme-primary">
                    {typeof company.marketSignal?.price === 'number' ? currency.format(company.marketSignal.price) : 'N/A'}
                  </td>
                  <td className="py-3">
                    <PriceTrendSparkline data={company.marketSignal?.trendSeries} />
                  </td>
                  <td className="py-3 text-theme-primary">
                    {typeof company.marketSignal?.marketCapBillions === 'number'
                      ? `$${marketCapFormatter.format(company.marketSignal.marketCapBillions)}B`
                      : 'N/A'}
                  </td>
                  <td className="py-3">{company.domain}</td>
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
