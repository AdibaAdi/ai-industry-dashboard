import { normalizeCompanyScores } from './scoringService.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const dayInMs = 1000 * 60 * 60 * 24;

const toRecencyBoost = (lastUpdated) => {
  if (!lastUpdated) {
    return 0;
  }

  const updatedAt = new Date(lastUpdated);
  if (Number.isNaN(updatedAt.getTime())) {
    return 0;
  }

  const ageDays = Math.max(0, (Date.now() - updatedAt.getTime()) / dayInMs);
  return clamp(100 - ageDays * 2.2, 0, 100);
};

const toDomainMomentumMap = (companies) => {
  const grouped = companies.reduce((acc, company) => {
    if (!acc[company.domain]) {
      acc[company.domain] = {
        domain: company.domain,
        totalCompanies: 0,
        growth: 0,
        influence: 0,
        power: 0,
      };
    }

    acc[company.domain].totalCompanies += 1;
    acc[company.domain].growth += company.growth_score;
    acc[company.domain].influence += company.influence_score;
    acc[company.domain].power += company.power_score;

    return acc;
  }, {});

  return Object.values(grouped).reduce((acc, domain) => {
    const total = domain.totalCompanies;
    const momentum = domain.growth / total * 0.5 + domain.influence / total * 0.2 + domain.power / total * 0.3;
    acc[domain.domain] = {
      domain: domain.domain,
      total_companies: total,
      average_growth_score: Number((domain.growth / total).toFixed(1)),
      average_influence_score: Number((domain.influence / total).toFixed(1)),
      average_power_score: Number((domain.power / total).toFixed(1)),
      domain_momentum: Number(momentum.toFixed(1)),
    };
    return acc;
  }, {});
};

const toDomainRankMap = (companies) =>
  Object.values(
    companies.reduce((acc, company) => {
      if (!acc[company.domain]) {
        acc[company.domain] = [];
      }

      acc[company.domain].push(company);
      return acc;
    }, {}),
  ).reduce((rankMap, domainCompanies) => {
    domainCompanies
      .sort((a, b) => b.power_score - a.power_score)
      .forEach((company, index) => {
        rankMap[company.id] = index + 1;
      });
    return rankMap;
  }, {});

const toInvestorReasons = (company, metrics) => {
  const reasons = [];

  if (company.growth_score >= 88 && metrics.domainMomentum >= 84) {
    reasons.push('strong growth in a rising category');
  }

  if (company.influence_score - company.power_score > -2) {
    reasons.push('high influence relative to peers');
  }

  if (metrics.underexposureScore >= 55) {
    reasons.push('strong positioning in an undercrowded sector');
  }

  if (metrics.domainRank > 1) {
    reasons.push(`upside optionality as #${metrics.domainRank} in ${company.domain}`);
  }

  return reasons.slice(0, 3);
};

const toInvestorCompany = (company, domainMomentumMap, domainRankMap) => {
  const domainData = domainMomentumMap[company.domain];
  const domainCompanies = domainData?.total_companies ?? 1;
  const domainRank = domainRankMap[company.id] ?? 1;
  const dominancePenalty = domainRank === 1 ? 8 : 0;
  const underexposureScore = clamp(((domainRank - 1) / Math.max(1, domainCompanies - 1)) * 100);
  const recencyBoost = toRecencyBoost(company.last_updated);
  const domainMomentum = domainData?.domain_momentum ?? 0;

  const investorScore = clamp(
    company.growth_score * 0.25 +
      company.influence_score * 0.2 +
      company.power_score * 0.25 +
      domainMomentum * 0.2 +
      underexposureScore * 0.08 +
      recencyBoost * 0.02 -
      dominancePenalty,
  );

  return {
    ...company,
    investor_score: Number(investorScore.toFixed(1)),
    domain_momentum: domainMomentum,
    underexposure_score: Number(underexposureScore.toFixed(1)),
    domain_rank: domainRank,
    recency_boost: Number(recencyBoost.toFixed(1)),
    investor_reasons: toInvestorReasons(company, {
      domainMomentum,
      underexposureScore,
      domainRank,
    }),
  };
};

const byInvestorScore = (a, b) => b.investor_score - a.investor_score;

export const getInvestorModeSnapshot = (rawCompanies) => {
  const companies = normalizeCompanyScores(rawCompanies);
  const domainMomentumMap = toDomainMomentumMap(companies);

  const domainRankMap = toDomainRankMap(companies);

  const investorCompanies = companies
    .map((company) => toInvestorCompany(company, domainMomentumMap, domainRankMap))
    .sort(byInvestorScore);

  const sectorMomentum = Object.values(domainMomentumMap)
    .map((domain) => ({
      ...domain,
      leading_companies: investorCompanies
        .filter((company) => company.domain === domain.domain)
        .slice(0, 3)
        .map((company) => ({
          id: company.id,
          name: company.name,
          investor_score: company.investor_score,
        })),
    }))
    .sort((a, b) => b.domain_momentum - a.domain_momentum);

  const risingByDomain = Object.values(
    investorCompanies.reduce((acc, company) => {
      if (!acc[company.domain]) {
        acc[company.domain] = [];
      }
      acc[company.domain].push(company);
      return acc;
    }, {}),
  )
    .map((domainCompanies) =>
      domainCompanies
        .sort(byInvestorScore)
        .slice(0, 3)
        .map((company) => ({
          id: company.id,
          name: company.name,
          domain: company.domain,
          investor_score: company.investor_score,
          confidence_score: company.confidence_score,
          sources: company.sources,
          last_updated: company.last_updated,
          reason: company.investor_reasons[0] ?? 'multi-factor momentum signal',
        })),
    )
    .flat();

  const hiddenGems = investorCompanies
    .filter((company) => company.domain_rank > 1 && company.underexposure_score >= 40)
    .slice(0, 12);

  return {
    generated_at: new Date().toISOString(),
    top_emerging_startups: investorCompanies.slice(0, 15),
    highest_momentum_sectors: sectorMomentum.slice(0, 8),
    rising_companies_by_domain: risingByDomain,
    hidden_gems: hiddenGems,
    investor_takeaways: [
      'Emerging winners blend top-tier growth with strong influence in sectors where momentum is compounding.',
      'The highest-scoring opportunities are often #2 or #3 players in domains with elevated domain momentum.',
      'Underexposed contenders with recent updates can offer asymmetrical upside before category leadership consolidates.',
    ],
  };
};
