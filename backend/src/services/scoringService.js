const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const CONFIDENCE_MIN = 0;
const CONFIDENCE_MAX = 1;
const dayInMs = 1000 * 60 * 60 * 24;

const hashString = (input) => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const seededJitter = (seed, amplitude) => {
  const normalized = (hashString(seed) % 1000) / 999;
  return (normalized * 2 - 1) * amplitude;
};

const scaleLog = (value, floor = 0) => {
  const safe = Math.max(floor, Number(value) || 0);
  return Math.log10(safe + 1);
};

const linearScale = (value, min, max, fallback = 0.5) => {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) {
    return fallback;
  }

  if (Math.abs(max - min) < 1e-9) {
    return fallback;
  }

  return clamp((value - min) / (max - min), 0, 1);
};

const toPublicSignal = (companyType) => {
  if (companyType === 'Public') return 1;
  if (companyType === 'Subsidiary') return 0.75;
  if (companyType === 'Nonprofit') return 0.45;
  return 0.6;
};

const toSourceConfidence = (company) => {
  const sourceCount = Array.isArray(company.sources) ? company.sources.length : 0;
  const urlCount = Array.isArray(company.source_urls) ? company.source_urls.length : 0;

  const sourceBreadth = clamp(sourceCount / 5, 0, 1);
  const sourceTraceability = clamp(urlCount / 4, 0, 1);

  const sourceTokens = [
    company.classification_source,
    company.classification_provider,
    company.data_source,
  ].map((value) => String(value ?? '').trim().toLowerCase());

  const hasExternalProvider = sourceTokens.some((token) =>
    ['huggingface', 'llm', 'inference', 'api', 'external'].some((needle) => token.includes(needle)));
  const hasManualOnly = sourceTokens.every((token) => !token || token.includes('seed') || token.includes('manual'));

  const providerSignal = hasExternalProvider ? 0.88 : hasManualOnly ? 0.62 : 0.75;

  return clamp(sourceBreadth * 0.45 + sourceTraceability * 0.35 + providerSignal * 0.2, 0, 1);
};

const toRecencySignal = (lastUpdated, maxTimestamp, minTimestamp) => {
  if (!lastUpdated) {
    return 0.25;
  }

  const timestamp = new Date(lastUpdated).getTime();
  if (Number.isNaN(timestamp)) {
    return 0.25;
  }

  // Dataset-relative recency keeps behavior deterministic for testing.
  const datasetRecency = linearScale(timestamp, minTimestamp, maxTimestamp, 0.5);

  // Also include absolute age in days with graceful decay.
  const ageDays = Math.max(0, (maxTimestamp - timestamp) / dayInMs);
  const freshness = clamp(1 - ageDays / 365, 0, 1);

  return clamp(datasetRecency * 0.55 + freshness * 0.45, 0, 1);
};

const summarizeDomainStats = (companies) => {
  const grouped = companies.reduce((acc, company) => {
    if (!acc[company.domain]) {
      acc[company.domain] = { count: 0, fundingLogTotal: 0, valuationLogTotal: 0 };
    }

    acc[company.domain].count += 1;
    acc[company.domain].fundingLogTotal += scaleLog(company.funding);
    acc[company.domain].valuationLogTotal += scaleLog(company.valuation);
    return acc;
  }, {});

  const domainCounts = Object.values(grouped).map((domain) => domain.count);
  const minCount = Math.min(...domainCounts);
  const maxCount = Math.max(...domainCounts);

  return Object.entries(grouped).reduce((acc, [domain, stats]) => {
    const scarcity = 1 - linearScale(stats.count, minCount, maxCount, 0.5);
    const avgFunding = stats.fundingLogTotal / stats.count;
    const avgValuation = stats.valuationLogTotal / stats.count;

    acc[domain] = {
      scarcity,
      capitalIntensity: clamp((avgFunding * 0.5 + avgValuation * 0.5) / 4.5, 0, 1),
      size: stats.count,
    };

    return acc;
  }, {});
};

const toConfidenceScore = (company, context) => {
  const baseConfidence = Number.isFinite(company.confidence_score) ? company.confidence_score : 0.58;
  const classificationConfidence = Number.isFinite(company.classification_confidence)
    ? company.classification_confidence
    : baseConfidence;
  const sourceConfidence = toSourceConfidence(company);
  const recencySignal = toRecencySignal(company.last_updated, context.maxTimestamp, context.minTimestamp);

  const jitter = seededJitter(`${company.id}:confidence`, 0.09);

  const blended =
    (baseConfidence * 0.3) +
    (classificationConfidence * 0.3) +
    (sourceConfidence * 0.23) +
    (recencySignal * 0.17);

  const calibrated = blended
    + ((classificationConfidence - 0.5) * 0.18)
    + ((sourceConfidence - 0.5) * 0.16)
    + ((recencySignal - 0.5) * 0.12)
    + jitter;

  return clamp(calibrated, CONFIDENCE_MIN, CONFIDENCE_MAX);
};

const toCompanySignals = (company, context) => {
  const ageYears = Math.max(0, context.currentYear - (Number(company.founded_year) || context.currentYear));
  const youthSignal = clamp(1 - ageYears / 22, 0, 1);
  const fundingSignal = linearScale(scaleLog(company.funding), context.minFundingLog, context.maxFundingLog, 0.35);
  const valuationSignal = linearScale(scaleLog(company.valuation), context.minValuationLog, context.maxValuationLog, 0.35);
  const confidenceSignal = toConfidenceScore(company, context);
  const publicSignal = toPublicSignal(company.company_type);
  const sourceSignal = toSourceConfidence(company);
  const recencySignal = toRecencySignal(company.last_updated, context.maxTimestamp, context.minTimestamp);

  const domainMeta = context.domainStats[company.domain] ?? { scarcity: 0.5, capitalIntensity: 0.5 };
  const domainWeight = clamp(domainMeta.capitalIntensity * 0.65 + domainMeta.scarcity * 0.35, 0, 1);

  return {
    ageYears,
    youthSignal,
    fundingSignal,
    valuationSignal,
    confidenceSignal,
    publicSignal,
    sourceSignal,
    recencySignal,
    domainWeight,
    domainScarcity: domainMeta.scarcity,
  };
};

const toRangeScore = (normalized, floor, ceiling, seed, amplitude = 2.5) => {
  const jitter = seededJitter(seed, amplitude);
  const scored = floor + normalized * (ceiling - floor) + jitter;
  return Number(clamp(scored, floor, ceiling).toFixed(1));
};

export const calculatePowerScore = (company) => {
  const weighted = company.growth_score * 0.46 + company.influence_score * 0.54;
  return Number(clamp(weighted, 0, 100).toFixed(1));
};

export const normalizeCompanyScores = (companies) => {
  if (!Array.isArray(companies) || companies.length === 0) {
    return [];
  }

  const timestamps = companies
    .map((company) => new Date(company.last_updated).getTime())
    .filter((timestamp) => Number.isFinite(timestamp));

  const maxTimestamp = timestamps.length ? Math.max(...timestamps) : Date.now();
  const minTimestamp = timestamps.length ? Math.min(...timestamps) : maxTimestamp;

  const fundingLogs = companies.map((company) => scaleLog(company.funding));
  const valuationLogs = companies.map((company) => scaleLog(company.valuation));

  const context = {
    currentYear: new Date(maxTimestamp).getUTCFullYear(),
    minFundingLog: Math.min(...fundingLogs),
    maxFundingLog: Math.max(...fundingLogs),
    minValuationLog: Math.min(...valuationLogs),
    maxValuationLog: Math.max(...valuationLogs),
    domainStats: summarizeDomainStats(companies),
    minTimestamp,
    maxTimestamp,
  };

  return companies.map((company) => {
    const signals = toCompanySignals(company, context);

    const influenceNormalized = clamp(
      signals.fundingSignal * 0.22 +
        signals.valuationSignal * 0.24 +
        signals.publicSignal * 0.14 +
        signals.domainWeight * 0.12 +
        signals.confidenceSignal * 0.18 +
        signals.sourceSignal * 0.1,
      0,
      1,
    );

    const growthNormalized = clamp(
      signals.youthSignal * 0.26 +
        signals.recencySignal * 0.24 +
        signals.fundingSignal * 0.16 +
        signals.domainWeight * 0.1 +
        signals.confidenceSignal * 0.14 +
        signals.sourceSignal * 0.1,
      0,
      1,
    );

    const influenceScore = toRangeScore(influenceNormalized, 41, 98, `${company.id}:influence`, 3.4);
    const growthScore = toRangeScore(growthNormalized, 39, 97, `${company.id}:growth`, 3.8);

    const powerBase = (growthScore * 0.48) + (influenceScore * 0.52);
    const powerScore = Number(clamp(powerBase + seededJitter(`${company.id}:power`, 1.6), 35, 99).toFixed(1));

    // Favor high-quality, high-momentum companies that are not already fully priced.
    const valuationOpportunity = clamp((1 - signals.valuationSignal) * 0.6 + signals.domainScarcity * 0.4, 0, 1);
    const investorNormalized = clamp(
      growthNormalized * 0.24 +
        influenceNormalized * 0.15 +
        linearScale(powerScore, 35, 99, 0.5) * 0.24 +
        valuationOpportunity * 0.2 +
        signals.recencySignal * 0.1 +
        signals.confidenceSignal * 0.07,
      0,
      1,
    );

    const investorScore = toRangeScore(investorNormalized, 36, 98, `${company.id}:investor`, 2.7);
    const confidenceScore = Number(toConfidenceScore(company, context).toFixed(2));

    return {
      ...company,
      growth_score: growthScore,
      influence_score: influenceScore,
      power_score: powerScore,
      investor_score: investorScore,
      confidence_score: confidenceScore,
      classification_confidence: Number(
        clamp(
          Number.isFinite(company.classification_confidence)
            ? company.classification_confidence
            : confidenceScore - 0.03 + seededJitter(`${company.id}:classification`, 0.02),
          CONFIDENCE_MIN,
          CONFIDENCE_MAX,
        ).toFixed(2),
      ),
    };
  });
};
