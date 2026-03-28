const roundToSingleDecimal = (value) => Number(value.toFixed(1));

const resolveDomain = (company) => {
  const classifiedDomain = typeof company.predicted_domain === 'string' ? company.predicted_domain.trim() : '';
  if (classifiedDomain) {
    return classifiedDomain;
  }

  const sourceDomain = typeof company.domain === 'string' ? company.domain.trim() : '';
  return sourceDomain || 'Unknown';
};

const coefficientOfVariation = (values) => {
  if (!values.length) {
    return 0;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (mean === 0) {
    return 0;
  }

  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / mean;
};

export const getDomainBreakdown = (companies) => {
  const totalCompanies = companies.length;
  const grouped = companies.reduce((acc, company) => {
    const domainKey = resolveDomain(company);

    if (!acc[domainKey]) {
      acc[domainKey] = {
        domain: domainKey,
        total_companies: 0,
        average_growth_score: 0,
        average_influence_score: 0,
        average_power_score: 0,
        leaders: [],
      };
    }

    const current = acc[domainKey];
    current.total_companies += 1;
    current.average_growth_score += company.growth_score;
    current.average_influence_score += company.influence_score;
    current.average_power_score += company.power_score;
    current.leaders.push({ id: company.id, name: company.name, power_score: company.power_score });

    return acc;
  }, {});

  return Object.values(grouped)
    .map((domain) => {
      const percentage = totalCompanies > 0 ? (domain.total_companies / totalCompanies) * 100 : 0;
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
    .sort((a, b) => b.total_companies - a.total_companies || b.share_percentage - a.share_percentage || a.domain.localeCompare(b.domain));
};

export const getDomainDistributionWarning = (domainBreakdown, totalCompanies) => {
  if (!domainBreakdown.length || totalCompanies <= 0) {
    return null;
  }

  const counts = domainBreakdown.map((domain) => domain.total_companies);
  const maxCount = Math.max(...counts);
  const minCount = Math.min(...counts);
  const spreadRatio = maxCount > 0 ? (maxCount - minCount) / maxCount : 0;
  const cv = coefficientOfVariation(counts);

  const isUnnaturallyUniform = domainBreakdown.length >= 3 && (spreadRatio <= 0.12 || cv <= 0.1);

  if (!isUnnaturallyUniform) {
    return null;
  }

  return {
    type: 'domain_distribution_uniformity',
    severity: 'warning',
    message:
      'Domain distribution appears unusually uniform. Verify ingestion/classification pipelines are not equalizing domain counts.',
    metrics: {
      domain_count: domainBreakdown.length,
      total_companies: totalCompanies,
      min_companies_per_domain: minCount,
      max_companies_per_domain: maxCount,
      spread_ratio: Number(spreadRatio.toFixed(3)),
      coefficient_of_variation: Number(cv.toFixed(3)),
    },
  };
};
