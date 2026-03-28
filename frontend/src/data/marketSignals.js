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

const TREND_POINTS = 14;

const createSeededRng = (seed) => {
  let state = 0;
  for (let index = 0; index < seed.length; index += 1) {
    state = (state * 31 + seed.charCodeAt(index)) >>> 0;
  }

  if (state === 0) {
    state = 0x9e3779b9;
  }

  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
};

const buildSimulatedTrend = ({ companyId, latestPrice, points = TREND_POINTS }) => {
  if (!Number.isFinite(latestPrice) || latestPrice <= 0) {
    return [];
  }

  const random = createSeededRng(companyId);
  const biasSelector = random();
  const driftPercent = biasSelector < 0.33 ? -0.007 : biasSelector > 0.66 ? 0.007 : 0;
  const volatilityPercent = 0.004 + random() * 0.014;
  const phaseOffset = random() * Math.PI * 2;
  const prices = [latestPrice];

  for (let index = points - 1; index > 0; index -= 1) {
    const oscillation = Math.sin((index / (points - 1)) * Math.PI * 2 + phaseOffset) * 0.004;
    const randomShock = (random() - 0.5) * volatilityPercent;
    const changePercent = driftPercent + oscillation + randomShock;
    const previousPrice = prices[0] / (1 + changePercent);
    prices.unshift(Math.max(0.1, Number(previousPrice.toFixed(2))));
  }

  prices[prices.length - 1] = Number(latestPrice.toFixed(2));
  return prices;
};

const formatTrendSeries = (trend = []) => trend.map((value, index) => ({ point: `T-${trend.length - index - 1}`, price: value }));

export const getMarketSignalForCompany = (companyId) => {
  const signal = MOCK_PUBLIC_MARKET_FEED.companies[companyId];

  if (!signal) {
    return null;
  }

  const trend = buildSimulatedTrend({
    companyId,
    latestPrice: signal.price,
  });

  return {
    ...signal,
    trend,
    trendSeries: formatTrendSeries(trend),
    source: MOCK_PUBLIC_MARKET_FEED.source,
    asOf: MOCK_PUBLIC_MARKET_FEED.asOf,
  };
};

export const getPublicMarketCompanies = (companies = []) =>
  companies
    .map((company) => ({
      ...company,
      marketSignal: getMarketSignalForCompany(company.id),
    }))
    .filter((company) => Boolean(company.marketSignal?.ticker))
    .sort((a, b) => (b.marketSignal?.marketCapBillions ?? 0) - (a.marketSignal?.marketCapBillions ?? 0));

export const getPrivateMarketCompanies = (companies = []) =>
  companies
    .map((company) => ({
      ...company,
      marketSignal: getMarketSignalForCompany(company.id),
    }))
    .filter((company) => company.company_type === 'Private' && !company.marketSignal?.ticker)
    .sort((a, b) => (b.valuation ?? 0) - (a.valuation ?? 0));

export const getMarketFeedMeta = () => ({
  source: MOCK_PUBLIC_MARKET_FEED.source,
  asOf: MOCK_PUBLIC_MARKET_FEED.asOf,
});
