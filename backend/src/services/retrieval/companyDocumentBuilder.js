const trendLabel = (company) => {
  if (company.growth_score >= 90) {
    return 'accelerating';
  }

  if (company.growth_score >= 80) {
    return 'stable growth';
  }

  return 'emerging';
};

const generatedInsightText = (company) => {
  const summary = `${company.name} in ${company.domain}/${company.subdomain} has power ${company.power_score.toFixed(1)} with growth ${company.growth_score.toFixed(1)} and influence ${company.influence_score.toFixed(1)}.`;
  const trend = `${company.name} trend signal: ${trendLabel(company)} momentum.`;
  return `${summary} ${trend}`;
};

const asText = (company) => {
  const tags = company.tags.join(', ');
  const insight = generatedInsightText(company);

  return [
    `Company: ${company.name}`,
    `Description: ${company.description}`,
    `Domain: ${company.domain}`,
    `Subdomain: ${company.subdomain}`,
    `Tags: ${tags}`,
    `Generated insight: ${insight}`,
  ].join('\n');
};

export const buildCompanyDocument = (company) => ({
  id: company.id,
  text: asText(company),
  metadata: {
    company_id: company.id,
    name: company.name,
    domain: company.domain,
    subdomain: company.subdomain,
    tags: company.tags,
  },
  chunks: {
    name: company.name,
    description: company.description,
    domain: company.domain,
    subdomain: company.subdomain,
    tags: company.tags,
    insight: generatedInsightText(company),
  },
});

export const buildCompanyDocuments = (companies) => companies.map((company) => buildCompanyDocument(company));
