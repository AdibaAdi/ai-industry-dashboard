// TODO: Replace MOCK_PUBLIC_MARKET_FEED with a live provider adapter when market API is enabled.
const MOCK_PUBLIC_MARKET_FEED = {
  source: 'mock',
  asOf: '2026-03-27T16:00:00Z',
  companies: {
    nvidia: {
      ticker: 'NVDA',
      price: 126.42,
      marketCapBillions: 3110,
      trend: [112.1, 114.6, 117.8, 121.2, 123.9, 125.5, 126.42],
    },
    palantir: {
      ticker: 'PLTR',
      price: 32.88,
      marketCapBillions: 74.1,
      trend: [27.3, 28.1, 28.6, 29.9, 30.4, 31.7, 32.88],
    },
    'c3-ai': {
      ticker: 'AI',
      price: 35.11,
      marketCapBillions: 4.5,
      trend: [28.9, 29.4, 30.8, 32.1, 33.5, 34.2, 35.11],
    },
    'bigbear-ai': {
      ticker: 'BBAI',
      price: 3.27,
      marketCapBillions: 1.5,
      trend: [2.1, 2.4, 2.6, 2.9, 3.0, 3.2, 3.27],
    },
    'serve-robotics': {
      ticker: 'SERV',
      price: 10.62,
      marketCapBillions: 0.43,
      trend: [7.2, 7.8, 8.7, 9.3, 9.8, 10.1, 10.62],
    },
    aerovironment: {
      ticker: 'AVAV',
      price: 183.54,
      marketCapBillions: 8.7,
      trend: [164.3, 168.1, 170.5, 175.4, 178.6, 181.9, 183.54],
    },
  },
};

const formatTrendSeries = (trend = []) => trend.map((value, index) => ({ point: `T-${trend.length - index - 1}`, price: value }));

export const getMarketSignalForCompany = (companyId) => {
  const signal = MOCK_PUBLIC_MARKET_FEED.companies[companyId];

  if (!signal) {
    return null;
  }

  return {
    ...signal,
    trendSeries: formatTrendSeries(signal.trend),
    source: MOCK_PUBLIC_MARKET_FEED.source,
    asOf: MOCK_PUBLIC_MARKET_FEED.asOf,
  };
};

export const getPublicMarketCompanies = (companies = []) =>
  companies
    .filter((company) => company.company_type === 'Public')
    .map((company) => ({
      ...company,
      marketSignal: getMarketSignalForCompany(company.id),
    }))
    .sort((a, b) => (b.marketSignal?.marketCapBillions ?? 0) - (a.marketSignal?.marketCapBillions ?? 0));

export const getMarketFeedMeta = () => ({
  source: MOCK_PUBLIC_MARKET_FEED.source,
  asOf: MOCK_PUBLIC_MARKET_FEED.asOf,
});
