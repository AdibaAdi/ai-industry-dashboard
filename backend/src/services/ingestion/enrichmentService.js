const generateDescription = (company) => {
  if (company.description) {
    return company.description;
  }

  const domainLabel = company.domain || 'AI';
  return `${company.name} is an ${domainLabel} company tracked by the dashboard ingestion pipeline.`;
};

const addDerivedTags = (company) => {
  const tagSet = new Set(company.tags);

  if (company.domain) {
    tagSet.add(company.domain.toLowerCase().replace(/\s+/g, '-'));
  }

  if (company.subdomain) {
    tagSet.add(company.subdomain.toLowerCase().replace(/\s+/g, '-'));
  }

  return [...tagSet];
};

export const enrichCompanyRecord = (company) => ({
  ...company,
  description: generateDescription(company),
  tags: addDerivedTags(company),
  source_urls: company.source_urls.length ? company.source_urls : [company.website].filter(Boolean),
  ingestion_status: 'enriched',
});

export const enrichCompanyRecords = (companies) => companies.map(enrichCompanyRecord);
