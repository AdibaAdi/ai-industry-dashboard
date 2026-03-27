import { calculatePowerScore } from '../scoringService.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const fallbackGrowthScore = (company) => {
  if (company.growth_score > 0) {
    return company.growth_score;
  }

  const fundingSignal = clamp(Math.log10(Math.max(company.funding, 1)) * 18);
  const valuationSignal = clamp(Math.log10(Math.max(company.valuation ?? 1, 1)) * 14);
  return Number(((fundingSignal + valuationSignal) / 2).toFixed(1));
};

const fallbackInfluenceScore = (company) => {
  if (company.influence_score > 0) {
    return company.influence_score;
  }

  const sourceSignal = clamp(company.source_urls.length * 15);
  const tagSignal = clamp(company.tags.length * 8);
  return Number(((sourceSignal + tagSignal) / 2).toFixed(1));
};

export const recomputeCompanyScores = (company) => {
  const growth_score = fallbackGrowthScore(company);
  const influence_score = fallbackInfluenceScore(company);

  return {
    ...company,
    growth_score,
    influence_score,
    power_score: calculatePowerScore({ ...company, growth_score, influence_score }),
    ingestion_status: 'scored',
  };
};

export const recomputeCompanyScoresBatch = (companies) => companies.map(recomputeCompanyScores);
