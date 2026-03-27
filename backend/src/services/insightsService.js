const topN = (items, key, n = 3) => [...items].sort((a, b) => b[key] - a[key]).slice(0, n);

export const buildInsights = (companies, domains) => {
  const topGrowth = topN(companies, 'growth_score', 5);
  const topInfluence = topN(companies, 'influence_score', 5);
  const topDomain = domains[0];

  return {
    generated_at: new Date().toISOString(),
    stats: {
      total_companies: companies.length,
      unique_domains: domains.length,
      average_growth_score: Number((companies.reduce((sum, c) => sum + c.growth_score, 0) / companies.length).toFixed(1)),
      average_influence_score: Number((companies.reduce((sum, c) => sum + c.influence_score, 0) / companies.length).toFixed(1)),
      average_power_score: Number((companies.reduce((sum, c) => sum + c.power_score, 0) / companies.length).toFixed(1)),
    },
    highlights: [
      {
        id: 'top-domain-concentration',
        title: `${topDomain.domain} leads by company concentration`,
        summary: `${topDomain.domain} represents ${topDomain.share} of tracked companies in the intelligence layer.`,
        detail: `Top leaders in ${topDomain.domain} are ${topDomain.leaders.map((leader) => leader.name).join(', ')}.`,
      },
      {
        id: 'growth-leaders',
        title: 'High-growth cohort is led by frontier and infrastructure players',
        summary: `Top growth companies include ${topGrowth.slice(0, 3).map((c) => c.name).join(', ')}.`,
        detail: `The top 5 growth scores range from ${topGrowth[topGrowth.length - 1].growth_score.toFixed(1)} to ${topGrowth[0].growth_score.toFixed(1)}.`,
      },
      {
        id: 'influence-leaders',
        title: 'Influence remains concentrated among model and platform providers',
        summary: `Top influence companies are ${topInfluence.slice(0, 3).map((c) => c.name).join(', ')}.`,
        detail: `Platform dependency dynamics continue to favor providers with large developer and enterprise ecosystems.`,
      },
    ],
  };
};
