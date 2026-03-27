const domainRules = [
  {
    domain: 'Foundation Models',
    subdomain: 'General-purpose LLMs',
    confidence: 0.92,
    keywords: ['foundation model', 'llm', 'reasoning model', 'multimodal'],
  },
  {
    domain: 'AI Agents',
    subdomain: 'Task Automation Agents',
    confidence: 0.88,
    keywords: ['agent', 'automation', 'workflow assistant', 'copilot'],
  },
  {
    domain: 'Infrastructure',
    subdomain: 'AI Cloud Infrastructure',
    confidence: 0.9,
    keywords: ['gpu', 'inference', 'cloud', 'compute'],
  },
  {
    domain: 'Data Platforms',
    subdomain: 'Data and Vector Platforms',
    confidence: 0.85,
    keywords: ['vector', 'dataset', 'labeling', 'data platform', 'lakehouse'],
  },
  {
    domain: 'Healthcare AI',
    subdomain: 'Clinical and Biotech AI',
    confidence: 0.86,
    keywords: ['drug discovery', 'clinical', 'healthcare', 'diagnostic'],
  },
  {
    domain: 'Robotics',
    subdomain: 'Embodied AI',
    confidence: 0.87,
    keywords: ['robot', 'humanoid', 'autonomous system', 'embodied'],
  },
  {
    domain: 'Developer Tools',
    subdomain: 'AI Developer Platform',
    confidence: 0.8,
    keywords: ['sdk', 'framework', 'developer', 'observability'],
  },
  {
    domain: 'Generative AI',
    subdomain: 'GenAI Applications',
    confidence: 0.78,
    keywords: ['image generation', 'video generation', 'creative ai', 'answer engine'],
  },
];

const defaultClassification = {
  domain: 'Generative AI',
  subdomain: 'General GenAI',
  confidence_score: 0.6,
};

const getTextCorpus = (company) =>
  [company.name, company.description, ...(company.tags ?? [])].filter(Boolean).join(' ').toLowerCase();

export const classifyCompanyRecord = (company) => {
  const corpus = getTextCorpus(company);
  const matched = domainRules.find((rule) => rule.keywords.some((keyword) => corpus.includes(keyword)));

  if (!matched) {
    return {
      domain: company.domain || defaultClassification.domain,
      subdomain: company.subdomain || defaultClassification.subdomain,
      confidence_score: Number((company.confidence_score ?? defaultClassification.confidence_score).toFixed(2)),
    };
  }

  return {
    domain: company.domain || matched.domain,
    subdomain: company.subdomain || matched.subdomain,
    confidence_score: Number((company.confidence_score ?? matched.confidence).toFixed(2)),
  };
};

export const runClassificationPipeline = async (records) => {
  const classified = records.map((record) => ({
    ...record,
    ...classifyCompanyRecord(record),
    ingestion_status: 'classified',
  }));

  return {
    status: 'completed',
    count: classified.length,
    records: classified,
  };
};
