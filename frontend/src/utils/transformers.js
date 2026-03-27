import { buildYearSeries } from './yearSeries';

export const toDomainChartData = (domains) => domains.map((item) => ({ name: item.domain, value: item.total_companies }));

export const toTopCompanies = (companies, count = 6) =>
  [...companies]
    .sort((a, b) => b.influence_score - a.influence_score)
    .slice(0, count)
    .map((company) => ({
      id: company.id,
      name: company.name,
      domain: company.domain,
      score: company.influence_score,
      growth: `+${Math.round(company.growth_score / 10)}%`,
    }));

export const toComparisonData = (companies, count = 5) =>
  [...companies]
    .filter((company) => typeof company.valuation === 'number')
    .sort((a, b) => b.valuation - a.valuation)
    .slice(0, count)
    .map((company) => ({
      company: company.name,
      valuation: Number((company.valuation / 1000).toFixed(1)),
    }));

export const toGrowthTrendData = (companies) => {
  const currentYear = new Date().getFullYear();
  const foundedYears = companies
    .map((company) => Number(company.founded_year))
    .filter((year) => Number.isInteger(year) && year > 0);

  const startYear = foundedYears.length > 0 ? Math.min(...foundedYears) : currentYear;
  const endYear = Math.max(currentYear, foundedYears.length > 0 ? Math.max(...foundedYears) : currentYear);

  const yearlyBuckets = companies.reduce((acc, company) => {
    const year = Number(company.founded_year);

    if (!Number.isInteger(year) || year < startYear || year > endYear) {
      return acc;
    }

    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {});

  return buildYearSeries(startYear, endYear).map((year) => ({
    month: String(year),
    startups: yearlyBuckets[year] ?? 0,
  }));
};
