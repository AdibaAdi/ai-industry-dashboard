const roundToSingleDecimal = (value) => Number(value.toFixed(1));

export const getDomainBreakdown = (companies) => {
  const total = companies.length;
  const grouped = companies.reduce((acc, company) => {
    if (!acc[company.domain]) {
      acc[company.domain] = {
        domain: company.domain,
        total_companies: 0,
        average_growth_score: 0,
        average_influence_score: 0,
        average_power_score: 0,
        leaders: [],
      };
    }

    const current = acc[company.domain];
    current.total_companies += 1;
    current.average_growth_score += company.growth_score;
    current.average_influence_score += company.influence_score;
    current.average_power_score += company.power_score;
    current.leaders.push({ id: company.id, name: company.name, power_score: company.power_score });

    return acc;
  }, {});

  return Object.values(grouped)
    .map((domain) => {
      const percentage = total ? (domain.total_companies / total) * 100 : 0;
      const roundedSharePercentage = roundToSingleDecimal(percentage);

      return {
        ...domain,
        share_percentage: roundedSharePercentage,
        share: `${roundedSharePercentage.toFixed(1)}%`,
        average_growth_score: Number((domain.average_growth_score / domain.total_companies).toFixed(1)),
        average_influence_score: Number((domain.average_influence_score / domain.total_companies).toFixed(1)),
        average_power_score: Number((domain.average_power_score / domain.total_companies).toFixed(1)),
        leaders: domain.leaders.sort((a, b) => b.power_score - a.power_score).slice(0, 3),
      };
    })
    .sort((a, b) => b.share_percentage - a.share_percentage);
};
