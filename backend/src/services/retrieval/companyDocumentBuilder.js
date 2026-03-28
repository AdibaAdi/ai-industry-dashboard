import { buildCompanyInsight } from '../insight/companyInsightService.js';

const trendLabel = (company) => {
  if (company.growth_score >= 90) {
    return 'accelerating';
  }

  if (company.growth_score >= 80) {
    return 'stable growth';
  }

  return 'emerging';
};

const toJoinedText = (value, fallback = 'None') => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join('; ') || fallback;
  }

  if (typeof value === 'string') {
    return value.trim() || fallback;
  }

  return fallback;
};

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  return [];
};

const fallbackInsight = (company) => ({
  summary: `${company.name} in ${company.domain}/${company.subdomain} has power ${company.power_score.toFixed(1)} with growth ${company.growth_score.toFixed(1)} and influence ${company.influence_score.toFixed(1)}.`,
  trend: `${trendLabel(company)} momentum`,
  strengths: ['Balanced execution across product and go-to-market indicators.'],
  risks: ['Execution risk tied to maintaining differentiation as category matures.'],
});

const getDocumentSignals = (company) => {
  const insight = buildCompanyInsight(company.id) ?? fallbackInsight(company);

  const investorNotes = company.investor_notes
    ?? company.investor_note
    ?? company.investor_thesis
    ?? company.investor_reasons
    ?? null;

  const marketNotes = company.market_notes
    ?? company.market_note
    ?? company.market_signal
    ?? company.market_signals
    ?? null;

  const strengths = toArray(company.strengths);
  const risks = toArray(company.risks);

  return {
    trend: company.trend ?? insight.trend ?? trendLabel(company),
    strengths: strengths.length ? strengths : (insight.strengths ?? []),
    risks: risks.length ? risks : (insight.risks ?? []),
    summary: insight.summary ?? '',
    investorNotes,
    marketNotes,
  };
};

const asText = (company, signals) => {
  const tags = toJoinedText(company.tags, 'None');

  return [
    `Company name: ${company.name}`,
    `Description: ${company.description}`,
    `Domain: ${company.domain}`,
    `Predicted domain: ${company.predicted_domain ?? company.domain}`,
    `Subdomain: ${company.subdomain}`,
    `Predicted subdomain: ${company.predicted_subdomain ?? company.subdomain}`,
    `Tags: ${tags}`,
    `Strengths: ${toJoinedText(signals.strengths)}`,
    `Risks: ${toJoinedText(signals.risks)}`,
    `Trend: ${signals.trend}`,
    `Investor notes: ${toJoinedText(signals.investorNotes)}`,
    `Market notes: ${toJoinedText(signals.marketNotes)}`,
    `Insight summary: ${signals.summary}`,
  ].join('\n');
};

export const buildCompanyDocument = (company) => {
  const signals = getDocumentSignals(company);

  return {
    id: company.id,
    text: asText(company, signals),
    metadata: {
      company_id: company.id,
      name: company.name,
      domain: company.domain,
      predicted_domain: company.predicted_domain ?? company.domain,
      subdomain: company.subdomain,
      predicted_subdomain: company.predicted_subdomain ?? company.subdomain,
      tags: company.tags,
    },
    chunks: {
      name: company.name,
      description: company.description,
      domain: company.domain,
      predicted_domain: company.predicted_domain ?? company.domain,
      subdomain: company.subdomain,
      predicted_subdomain: company.predicted_subdomain ?? company.subdomain,
      tags: company.tags,
      strengths: signals.strengths,
      risks: signals.risks,
      trend: signals.trend,
      investor_notes: signals.investorNotes,
      market_notes: signals.marketNotes,
      insight_summary: signals.summary,
    },
  };
};

export const buildCompanyDocuments = (companies) => companies.map((company) => buildCompanyDocument(company));
