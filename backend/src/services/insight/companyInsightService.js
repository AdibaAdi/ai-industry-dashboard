import { getCompanies, getCompanyById } from '../../data/repositories/companyRepository.js';

const trendLabel = (company) => {
  if (company.growth_score >= 90) {
    return 'accelerating';
  }

  if (company.growth_score >= 80) {
    return 'stable growth';
  }

  return 'emerging or volatile';
};

const toStrengths = (company) => {
  const strengths = [];

  if (company.power_score >= 90) {
    strengths.push('High power score indicates strong market position.');
  }

  if (company.influence_score >= 88) {
    strengths.push('Strong ecosystem influence and brand pull.');
  }

  if (company.tags?.length) {
    strengths.push(`Focused capability footprint: ${company.tags.slice(0, 3).join(', ')}.`);
  }

  if (!strengths.length) {
    strengths.push('Balanced execution across product and go-to-market indicators.');
  }

  return strengths;
};

const toRisks = (company) => {
  const risks = [];

  if (company.company_type === 'Private' && company.funding < 500) {
    risks.push('Lower disclosed funding may constrain scaling versus larger peers.');
  }

  if (company.power_score < 80) {
    risks.push('Power score suggests weaker positioning in highly competitive categories.');
  }

  if (company.domain === 'Generative AI' || company.domain === 'Foundation Models') {
    risks.push('Competes in rapidly commoditizing segments with fast model turnover.');
  }

  if (!risks.length) {
    risks.push('Execution risk tied to maintaining differentiation as category matures.');
  }

  return risks;
};

const relatedCompetitors = (company, companies) =>
  companies
    .filter((candidate) => candidate.id !== company.id)
    .map((candidate) => {
      const domainBonus = candidate.domain === company.domain ? 35 : 0;
      const subdomainBonus = candidate.subdomain === company.subdomain ? 20 : 0;
      const tagOverlap = candidate.tags.filter((tag) => company.tags.includes(tag)).length * 8;
      const scoreGapPenalty = Math.abs(candidate.power_score - company.power_score);

      return {
        id: candidate.id,
        name: candidate.name,
        domain: candidate.domain,
        power_score: candidate.power_score,
        similarity: domainBonus + subdomainBonus + tagOverlap - scoreGapPenalty,
      };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 4)
    .map(({ similarity, ...rest }) => rest);

export const buildCompanyInsight = (companyId) => {
  const company = getCompanyById(companyId);

  if (!company) {
    return null;
  }

  const competitors = relatedCompetitors(company, getCompanies());
  const trend = trendLabel(company);

  return {
    id: company.id,
    name: company.name,
    summary: `${company.name} operates in ${company.domain} (${company.subdomain}) with a power score of ${company.power_score.toFixed(1)} and growth score of ${company.growth_score.toFixed(1)}.`,
    strengths: toStrengths(company),
    risks: toRisks(company),
    trend,
    related_competitors: competitors,
  };
};
