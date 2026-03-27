const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export const calculatePowerScore = (company) => {
  if (typeof company.power_score === 'number') {
    return company.power_score;
  }

  const weighted = company.growth_score * 0.4 + company.influence_score * 0.6;
  return clamp(Number(weighted.toFixed(1)));
};

export const normalizeCompanyScores = (companies) =>
  companies.map((company) => ({
    ...company,
    power_score: calculatePowerScore(company),
  }));
