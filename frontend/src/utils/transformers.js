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
  const yearlyBuckets = companies.reduce((acc, company) => {
    const year = company.founded_year;
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(yearlyBuckets)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .slice(-8)
    .map(([year, startups]) => ({ month: year, startups }));
};
