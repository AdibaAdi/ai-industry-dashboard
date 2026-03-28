const REQUIRED_FIELDS = [
  'id',
  'name',
  'domain',
  'subdomain',
  'growth_score',
  'influence_score',
  'power_score',
  'confidence_score',
  'last_updated',
];

const STATUS = Object.freeze({
  PASS: 'pass',
  WARN: 'warn',
  FAIL: 'fail',
});

const CONFIDENCE_LABELS = Object.freeze({
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
  UNKNOWN: 'Unknown',
});

const DEFAULT_OPTIONS = Object.freeze({
  duplicateThreshold: 4,
  confidenceLabelDominanceThreshold: 0.85,
  domainDominanceThreshold: 0.7,
  staleDaysThreshold: 120,
});

const toConfidenceLabel = (score) => {
  if (!Number.isFinite(score)) {
    return CONFIDENCE_LABELS.UNKNOWN;
  }

  if (score >= 0.8) {
    return CONFIDENCE_LABELS.HIGH;
  }

  if (score >= 0.5) {
    return CONFIDENCE_LABELS.MEDIUM;
  }

  return CONFIDENCE_LABELS.LOW;
};

const createDuplicateSummary = (companies, fieldName, threshold) => {
  const grouped = companies.reduce((acc, company) => {
    const value = company[fieldName];

    if (!Number.isFinite(value)) {
      return acc;
    }

    const key = value.toFixed(2);

    if (!acc.has(key)) {
      acc.set(key, []);
    }

    acc.get(key).push(company.id);

    return acc;
  }, new Map());

  const duplicates = [...grouped.entries()]
    .filter(([, ids]) => ids.length >= threshold)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([value, ids]) => ({ value: Number(value), count: ids.length, company_ids: ids }));

  return {
    duplicateGroups: duplicates.length,
    duplicateCompanies: duplicates.reduce((sum, duplicate) => sum + duplicate.count, 0),
    duplicates,
  };
};

const createConfidenceLabelSummary = (companies) => {
  const counts = companies.reduce((acc, company) => {
    const label = toConfidenceLabel(company.confidence_score);
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});

  const sortedCounts = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }));

  const dominant = sortedCounts[0] ?? { label: CONFIDENCE_LABELS.UNKNOWN, count: 0 };

  return {
    counts: sortedCounts,
    dominant,
    dominantRatio: companies.length > 0 ? dominant.count / companies.length : 0,
  };
};

const validateMissingRequiredFields = (companies) => {
  const missing = [];

  for (const company of companies) {
    const missingFields = REQUIRED_FIELDS.filter((field) => {
      const value = company[field];

      if (value === null || value === undefined) {
        return true;
      }

      if (typeof value === 'string' && !value.trim()) {
        return true;
      }

      return false;
    });

    if (missingFields.length > 0) {
      missing.push({ id: company.id ?? 'unknown', missing_fields: missingFields });
    }
  }

  if (missing.length > 0) {
    return {
      name: 'Required fields',
      status: STATUS.FAIL,
      message: `Found ${missing.length} companies with missing required fields.`,
      details: { affected_companies: missing.slice(0, 20), total_missing_companies: missing.length },
    };
  }

  return {
    name: 'Required fields',
    status: STATUS.PASS,
    message: 'All required fields are present.',
  };
};

const validatePercentages = (companies) => {
  const invalid = [];

  for (const company of companies) {
    const issues = [];
    const percentFields = ['growth_score', 'influence_score', 'power_score'];
    const fractionFields = ['confidence_score', 'classification_confidence'];

    for (const field of percentFields) {
      const value = company[field];

      if (!Number.isFinite(value) || value < 0 || value > 100) {
        issues.push({ field, value, expected: '0-100' });
      }
    }

    for (const field of fractionFields) {
      if (company[field] === undefined || company[field] === null) {
        continue;
      }

      const value = company[field];
      if (!Number.isFinite(value) || value < 0 || value > 1) {
        issues.push({ field, value, expected: '0-1' });
      }
    }

    if (issues.length > 0) {
      invalid.push({ id: company.id ?? 'unknown', issues });
    }
  }

  if (invalid.length > 0) {
    return {
      name: 'Numeric percentage ranges',
      status: STATUS.FAIL,
      message: `Found ${invalid.length} companies with invalid percentage values.`,
      details: { affected_companies: invalid.slice(0, 20), total_invalid_companies: invalid.length },
    };
  }

  return {
    name: 'Numeric percentage ranges',
    status: STATUS.PASS,
    message: 'All percentage and confidence values are within expected ranges.',
  };
};

const validateLastUpdated = (companies, staleDaysThreshold, now = new Date()) => {
  const staleCutoffTimestamp = now.getTime() - staleDaysThreshold * 24 * 60 * 60 * 1000;
  const invalid = [];
  const stale = [];

  for (const company of companies) {
    const lastUpdated = company.last_updated;

    if (!lastUpdated) {
      invalid.push({ id: company.id ?? 'unknown', reason: 'missing last_updated value' });
      continue;
    }

    const parsed = new Date(lastUpdated);
    const timestamp = parsed.getTime();

    if (Number.isNaN(timestamp)) {
      invalid.push({ id: company.id ?? 'unknown', reason: `invalid date format: ${String(lastUpdated)}` });
      continue;
    }

    if (timestamp > now.getTime()) {
      invalid.push({ id: company.id ?? 'unknown', reason: `future date: ${lastUpdated}` });
      continue;
    }

    if (timestamp < staleCutoffTimestamp) {
      stale.push({ id: company.id ?? 'unknown', last_updated: parsed.toISOString().slice(0, 10) });
    }
  }

  if (invalid.length > 0) {
    return {
      name: 'last_updated validity',
      status: STATUS.FAIL,
      message: `Found ${invalid.length} companies with invalid last_updated values.`,
      details: { affected_companies: invalid.slice(0, 20), total_invalid_companies: invalid.length },
    };
  }

  if (stale.length > 0) {
    return {
      name: 'last_updated recency',
      status: STATUS.WARN,
      message: `${stale.length} companies are older than ${staleDaysThreshold} days.`,
      details: { affected_companies: stale.slice(0, 20), total_stale_companies: stale.length },
    };
  }

  return {
    name: 'last_updated validity and recency',
    status: STATUS.PASS,
    message: 'All last_updated values are valid and recent.',
  };
};

const buildDuplicateCheck = (label, summary) => {
  if (summary.duplicateGroups > 0) {
    return {
      name: `${label} duplicates`,
      status: STATUS.WARN,
      message: `Detected ${summary.duplicateGroups} duplicate ${label.toLowerCase()} groups.`,
      details: summary,
    };
  }

  return {
    name: `${label} duplicates`,
    status: STATUS.PASS,
    message: `No suspicious duplicate ${label.toLowerCase()} values detected.`,
    details: summary,
  };
};

const buildConfidenceLabelCheck = (summary, dominanceThreshold, totalCompanies) => {
  if (summary.dominantRatio >= dominanceThreshold && totalCompanies > 0) {
    return {
      name: 'Confidence label distribution',
      status: STATUS.WARN,
      message: `Confidence labels are dominated by "${summary.dominant.label}" (${(summary.dominantRatio * 100).toFixed(1)}%).`,
      details: summary,
    };
  }

  return {
    name: 'Confidence label distribution',
    status: STATUS.PASS,
    message: 'Confidence labels are reasonably distributed.',
    details: summary,
  };
};

const buildDomainDistributionCheck = (companies, dominanceThreshold) => {
  const distribution = companies.reduce((acc, company) => {
    const classifiedDomain = typeof company.predicted_domain === 'string' && company.predicted_domain.trim()
      ? company.predicted_domain.trim()
      : '';
    const domain = classifiedDomain || (typeof company.domain === 'string' && company.domain.trim() ? company.domain.trim() : 'Unknown');
    acc[domain] = (acc[domain] ?? 0) + 1;
    return acc;
  }, {});

  const rankedDomains = Object.entries(distribution)
    .map(([domain, count]) => ({ domain, count, ratio: companies.length > 0 ? count / companies.length : 0 }))
    .sort((a, b) => b.count - a.count);

  const leader = rankedDomains[0] ?? { domain: 'Unknown', count: 0, ratio: 0 };
  const counts = rankedDomains.map((domain) => domain.count);
  const maxCount = counts.length ? Math.max(...counts) : 0;
  const minCount = counts.length ? Math.min(...counts) : 0;
  const meanCount = counts.length ? counts.reduce((sum, count) => sum + count, 0) / counts.length : 0;
  const variance = counts.length
    ? counts.reduce((sum, count) => sum + (count - meanCount) ** 2, 0) / counts.length
    : 0;
  const coefficientOfVariation = meanCount > 0 ? Math.sqrt(variance) / meanCount : 0;
  const spreadRatio = maxCount > 0 ? (maxCount - minCount) / maxCount : 0;

  const dominanceWarning = leader.ratio >= dominanceThreshold && companies.length > 0;
  const uniformityWarning = rankedDomains.length >= 3 && (spreadRatio <= 0.12 || coefficientOfVariation <= 0.1);

  if (dominanceWarning || uniformityWarning) {
    return {
      name: 'Domain distribution realism',
      status: STATUS.WARN,
      message: dominanceWarning
        ? `Domain distribution is heavily concentrated in "${leader.domain}" (${(leader.ratio * 100).toFixed(1)}% of companies).`
        : 'Domain distribution appears unnaturally uniform across domains.',
      details: {
        top_domain: leader,
        spread_ratio: Number(spreadRatio.toFixed(3)),
        coefficient_of_variation: Number(coefficientOfVariation.toFixed(3)),
        domain_counts: rankedDomains,
      },
    };
  }

  return {
    name: 'Domain distribution realism',
    status: STATUS.PASS,
    message: 'Domain distribution appears varied.',
    details: {
      top_domain: leader,
      spread_ratio: Number(spreadRatio.toFixed(3)),
      coefficient_of_variation: Number(coefficientOfVariation.toFixed(3)),
      domain_counts: rankedDomains,
    },
  };
};

export const runDataIntegrityValidation = (companies, options = {}) => {
  const config = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const influenceDuplicates = createDuplicateSummary(companies, 'influence_score', config.duplicateThreshold);
  const growthDuplicates = createDuplicateSummary(companies, 'growth_score', config.duplicateThreshold);
  const confidenceSummary = createConfidenceLabelSummary(companies);

  const checks = [
    validateMissingRequiredFields(companies),
    validatePercentages(companies),
    validateLastUpdated(companies, config.staleDaysThreshold, options.now ?? new Date()),
    buildDuplicateCheck('Influence score', influenceDuplicates),
    buildDuplicateCheck('Growth score', growthDuplicates),
    buildConfidenceLabelCheck(confidenceSummary, config.confidenceLabelDominanceThreshold, companies.length),
    buildDomainDistributionCheck(companies, config.domainDominanceThreshold),
  ];

  const summary = checks.reduce(
    (acc, check) => {
      if (check.status === STATUS.PASS) acc.passed += 1;
      if (check.status === STATUS.WARN) acc.warnings += 1;
      if (check.status === STATUS.FAIL) acc.failed += 1;
      return acc;
    },
    { passed: 0, warnings: 0, failed: 0 },
  );

  return {
    generated_at: new Date().toISOString(),
    total_companies: companies.length,
    status: summary.failed > 0 ? STATUS.FAIL : summary.warnings > 0 ? STATUS.WARN : STATUS.PASS,
    summary,
    duplicate_counts: {
      influence_score_duplicate_groups: influenceDuplicates.duplicateGroups,
      influence_score_duplicate_companies: influenceDuplicates.duplicateCompanies,
      growth_score_duplicate_groups: growthDuplicates.duplicateGroups,
      growth_score_duplicate_companies: growthDuplicates.duplicateCompanies,
      dominant_confidence_label: confidenceSummary.dominant.label,
      dominant_confidence_label_ratio: Number(confidenceSummary.dominantRatio.toFixed(4)),
    },
    checks,
  };
};

const statusLabel = {
  [STATUS.PASS]: 'PASS',
  [STATUS.WARN]: 'WARN',
  [STATUS.FAIL]: 'FAIL',
};

export const formatValidationReport = (report) => {
  const lines = [
    'AI Industry Dashboard - Data Integrity Validation Report',
    `Generated at: ${report.generated_at}`,
    `Overall status: ${statusLabel[report.status]}`,
    `Companies checked: ${report.total_companies}`,
    `Checks => pass: ${report.summary.passed}, warn: ${report.summary.warnings}, fail: ${report.summary.failed}`,
    '',
    'Suspicious duplicate counts:',
    `  - Influence score duplicate groups: ${report.duplicate_counts.influence_score_duplicate_groups}`,
    `  - Influence score duplicate companies: ${report.duplicate_counts.influence_score_duplicate_companies}`,
    `  - Growth score duplicate groups: ${report.duplicate_counts.growth_score_duplicate_groups}`,
    `  - Growth score duplicate companies: ${report.duplicate_counts.growth_score_duplicate_companies}`,
    `  - Dominant confidence label: ${report.duplicate_counts.dominant_confidence_label}`,
    `  - Dominant confidence ratio: ${(report.duplicate_counts.dominant_confidence_label_ratio * 100).toFixed(1)}%`,
    '',
    'Checks:',
  ];

  for (const check of report.checks) {
    lines.push(`  [${statusLabel[check.status]}] ${check.name}: ${check.message}`);
  }

  return lines.join('\n');
};
