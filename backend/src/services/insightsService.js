const average = (values) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);

const averageBy = (items, accessor) => average(items.map(accessor));

const stdDeviation = (values) => {
  if (!values.length) {
    return 0;
  }

  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
};

const topN = (items, metric, n = 3) => [...items].sort((a, b) => b[metric] - a[metric]).slice(0, n);

const shareText = (part, total) => `${((part / total) * 100).toFixed(1)}%`;

const domainMapFromCompanies = (companies) =>
  companies.reduce((acc, company) => {
    if (!acc[company.domain]) {
      acc[company.domain] = [];
    }
    acc[company.domain].push(company);
    return acc;
  }, {});

const formatMetric = (value) => Number(value.toFixed(1));

const confidenceFromSample = (sampleSize, maxSize) => {
  const ratio = maxSize ? sampleSize / maxSize : 0;
  if (ratio >= 0.8) {
    return { level: 'High', strength: 0.9 };
  }
  if (ratio >= 0.45) {
    return { level: 'Medium', strength: 0.7 };
  }
  return { level: 'Directional', strength: 0.55 };
};

const toCompanyRef = (company) => ({
  id: company.id,
  name: company.name,
  domain: company.domain,
  growth_score: company.growth_score,
  power_score: company.power_score,
});

const createConcentrationInsight = ({ companies, domains, byDomain }) => {
  const leadingDomain = domains[0];
  if (!leadingDomain) {
    return null;
  }

  const leadingCompanies = topN(byDomain[leadingDomain.domain] ?? [], 'power_score', 5);

  return {
    id: 'dominant-domain-by-count',
    title: `${leadingDomain.domain} is the dominant domain by coverage`,
    short_summary: `${leadingDomain.domain} accounts for ${leadingDomain.share} of tracked companies, giving it the broadest footprint in the dataset.`,
    detailed_explanation:
      `${leadingDomain.domain} has ${leadingDomain.total_companies} tracked companies versus a dataset average of `
      + `${formatMetric(companies.length / Math.max(domains.length, 1))} per domain. The breadth suggests outsized founder activity and capital formation in this segment.`,
    why_it_matters:
      'A dominant company count typically translates into denser talent movement, more product experimentation, and faster competitive iteration for investors and operators to track.',
    supporting_metrics: [
      { label: 'Domain company count', value: leadingDomain.total_companies },
      { label: 'Share of tracked market', value: leadingDomain.share },
      {
        label: 'Companies vs. average domain',
        value: `+${formatMetric(leadingDomain.total_companies - companies.length / Math.max(domains.length, 1))}`,
      },
    ],
    relevant_companies: leadingCompanies.map(toCompanyRef),
    related_domain: leadingDomain.domain,
    confidence: confidenceFromSample(leadingDomain.total_companies, companies.length),
  };
};

const createFastestGrowingInsight = ({ domains, byDomain }) => {
  if (!domains.length) {
    return null;
  }

  const rankedByGrowth = [...domains].sort((a, b) => b.average_growth_score - a.average_growth_score);
  const growthLeader = rankedByGrowth[0];
  const second = rankedByGrowth[1];
  const spread = growthLeader.average_growth_score - (second?.average_growth_score ?? growthLeader.average_growth_score);

  return {
    id: 'fastest-growing-sector',
    title: `${growthLeader.domain} is currently the fastest-growing sector`,
    short_summary: `${growthLeader.domain} leads average growth with a score of ${growthLeader.average_growth_score.toFixed(1)}.`,
    detailed_explanation:
      `${growthLeader.domain} outperforms the next domain by ${spread.toFixed(1)} points on average growth score. Top movers include `
      + `${topN(byDomain[growthLeader.domain] ?? [], 'growth_score', 4).map((company) => company.name).join(', ')}.`,
    why_it_matters:
      'Higher aggregate growth scores point to acceleration in adoption and distribution. This is often where category leaders are still being formed rather than merely defended.',
    supporting_metrics: [
      { label: 'Average growth score', value: growthLeader.average_growth_score.toFixed(1) },
      { label: 'Lead vs. #2 sector', value: `${spread.toFixed(1)} pts` },
      { label: 'Sector company count', value: growthLeader.total_companies },
    ],
    relevant_companies: topN(byDomain[growthLeader.domain] ?? [], 'growth_score', 5).map(toCompanyRef),
    related_domain: growthLeader.domain,
    confidence: confidenceFromSample(growthLeader.total_companies, Math.max(...domains.map((domain) => domain.total_companies))),
  };
};

const createHighestPowerSectorInsight = ({ domains, byDomain }) => {
  if (!domains.length) {
    return null;
  }

  const rankedByPower = [...domains].sort((a, b) => b.average_power_score - a.average_power_score);
  const powerLeader = rankedByPower[0];

  return {
    id: 'highest-average-power-sector',
    title: `${powerLeader.domain} leads on average power score`,
    short_summary: `The domain posts an average power score of ${powerLeader.average_power_score.toFixed(1)}, the highest in the platform.`,
    detailed_explanation:
      `${powerLeader.domain} combines high influence and high growth, indicating a rare concentration of execution quality and ecosystem leverage.`,
    why_it_matters:
      'For recruiting and commercial partnerships, high-power sectors are often where talent density and customer pull are strongest.',
    supporting_metrics: [
      { label: 'Average power score', value: powerLeader.average_power_score.toFixed(1) },
      { label: 'Average influence score', value: powerLeader.average_influence_score.toFixed(1) },
      { label: 'Average growth score', value: powerLeader.average_growth_score.toFixed(1) },
    ],
    relevant_companies: topN(byDomain[powerLeader.domain] ?? [], 'power_score', 5).map(toCompanyRef),
    related_domain: powerLeader.domain,
    confidence: confidenceFromSample(powerLeader.total_companies, Math.max(...domains.map((domain) => domain.total_companies))),
  };
};

const createMostConcentratedSectorInsight = ({ domains, byDomain }) => {
  const eligible = domains.filter((domain) => domain.total_companies >= 5);
  if (!eligible.length) {
    return null;
  }

  const concentrationRanked = eligible
    .map((domain) => {
      const scores = (byDomain[domain.domain] ?? []).map((company) => company.power_score);
      return {
        ...domain,
        score_std_dev: stdDeviation(scores),
      };
    })
    .sort((a, b) => a.score_std_dev - b.score_std_dev);

  const concentrated = concentrationRanked[0];

  return {
    id: 'most-concentrated-sector',
    title: `${concentrated.domain} shows the tightest power-score clustering`,
    short_summary: `${concentrated.domain} has the lowest power-score dispersion, signaling an unusually concentrated competitive band.`,
    detailed_explanation:
      `Power-score standard deviation is ${concentrated.score_std_dev.toFixed(2)}, indicating that leading and mid-tier companies in this domain are performing within a narrow band.`,
    why_it_matters:
      'Concentrated sectors can become winner-take-most quickly: small execution differences can re-order leadership and create fast-moving M&A windows.',
    supporting_metrics: [
      { label: 'Power score std. deviation', value: concentrated.score_std_dev.toFixed(2) },
      { label: 'Company count considered', value: concentrated.total_companies },
      { label: 'Average power score', value: concentrated.average_power_score.toFixed(1) },
    ],
    relevant_companies: topN(byDomain[concentrated.domain] ?? [], 'power_score', 5).map(toCompanyRef),
    related_domain: concentrated.domain,
    confidence: { level: 'Medium', strength: 0.72 },
  };
};

const createEmergingLeadersInsight = ({ companies }) => {
  const emerging = companies
    .filter((company) => company.founded_year >= 2022)
    .sort((a, b) => b.power_score - a.power_score)
    .slice(0, 5);

  if (!emerging.length) {
    return null;
  }

  return {
    id: 'strongest-emerging-companies',
    title: 'Strongest emerging companies are scaling fast after 2022 formation',
    short_summary: `${emerging.map((company) => company.name).slice(0, 3).join(', ')} lead the newest company cohort on power score.`,
    detailed_explanation:
      `This cohort averages ${formatMetric(averageBy(emerging, (company) => company.power_score))} in power score despite being recently founded, indicating unusually fast capability and distribution ramp.`,
    why_it_matters:
      'Emerging leaders are often where future category breakouts happen first, before valuations fully absorb momentum.',
    supporting_metrics: [
      { label: 'Cohort definition', value: 'Founded in/after 2022' },
      { label: 'Average cohort power score', value: formatMetric(averageBy(emerging, (company) => company.power_score)) },
      { label: 'Top emerging company', value: `${emerging[0].name} (${emerging[0].power_score.toFixed(1)})` },
    ],
    relevant_companies: emerging.map(toCompanyRef),
    related_domain: 'Cross-domain',
    confidence: { level: 'Medium', strength: 0.68 },
  };
};

const createUnderTheRadarInsight = ({ companies }) => {
  const underTheRadar = companies
    .filter((company) => company.valuation && company.valuation <= 1000 && company.growth_score >= 85)
    .sort((a, b) => b.growth_score - a.growth_score)
    .slice(0, 5);

  if (!underTheRadar.length) {
    return null;
  }

  return {
    id: 'under-the-radar-high-growth',
    title: 'Under-the-radar companies with high growth are surfacing',
    short_summary: `${underTheRadar.map((company) => company.name).slice(0, 3).join(', ')} combine strong growth with sub-$1B valuation profiles.`,
    detailed_explanation:
      `These companies average ${formatMetric(averageBy(underTheRadar, (company) => company.growth_score))} in growth score while remaining below $1B valuation, creating asymmetric upside profiles compared with crowded mega-cap narratives.`,
    why_it_matters:
      'For investors and talent, this is where upside per unit of consensus attention is often highest.',
    supporting_metrics: [
      { label: 'Valuation screen', value: '≤ $1.0B' },
      { label: 'Growth threshold', value: '≥ 85.0' },
      { label: 'Qualified companies', value: underTheRadar.length },
    ],
    relevant_companies: underTheRadar.map(toCompanyRef),
    related_domain: 'Cross-domain',
    confidence: { level: 'Directional', strength: 0.6 },
  };
};

const createMomentumInsight = ({ domains }) => {
  if (!domains.length) {
    return null;
  }

  const momentumDomains = domains
    .map((domain) => ({
      ...domain,
      momentum_index: (domain.average_growth_score * 0.6) + (domain.average_influence_score * 0.4),
    }))
    .sort((a, b) => b.momentum_index - a.momentum_index);

  const leader = momentumDomains[0];
  const runnerUp = momentumDomains[1];

  return {
    id: 'domain-momentum',
    title: `${leader.domain} has the strongest recent momentum signal`,
    short_summary: `${leader.domain} leads a blended momentum index that combines growth and influence.`,
    detailed_explanation:
      `Momentum index: ${(leader.momentum_index).toFixed(1)} vs ${(runnerUp?.momentum_index ?? leader.momentum_index).toFixed(1)} for the next domain. This is a directional proxy because the platform currently scores cross-sectional performance rather than true time series.`,
    why_it_matters:
      'Momentum-led domains are often where customer demand, distribution leverage, and competitive signaling reinforce each other the fastest.',
    supporting_metrics: [
      { label: 'Momentum index leader', value: leader.momentum_index.toFixed(1) },
      { label: 'Momentum spread vs #2', value: `${(leader.momentum_index - (runnerUp?.momentum_index ?? leader.momentum_index)).toFixed(1)} pts` },
      { label: 'Leader domain share', value: leader.share },
    ],
    relevant_companies: leader.leaders.map((company) => ({ id: company.id, name: company.name, domain: leader.domain })),
    related_domain: leader.domain,
    confidence: { level: 'Directional', strength: 0.58 },
  };
};

const insightGenerators = [
  createConcentrationInsight,
  createFastestGrowingInsight,
  createHighestPowerSectorInsight,
  createMostConcentratedSectorInsight,
  createEmergingLeadersInsight,
  createUnderTheRadarInsight,
  createMomentumInsight,
];

export const buildInsights = (companies, domains) => {
  const byDomain = domainMapFromCompanies(companies);
  const highlights = insightGenerators
    .map((generator) => generator({ companies, domains, byDomain }))
    .filter(Boolean);

  return {
    generated_at: new Date().toISOString(),
    stats: {
      total_companies: companies.length,
      unique_domains: domains.length,
      average_growth_score: formatMetric(averageBy(companies, (company) => company.growth_score)),
      average_influence_score: formatMetric(averageBy(companies, (company) => company.influence_score)),
      average_power_score: formatMetric(averageBy(companies, (company) => company.power_score)),
      median_domain_share: domains.length ? shareText(1, domains.length) : '0.0%',
    },
    highlights,
  };
};
