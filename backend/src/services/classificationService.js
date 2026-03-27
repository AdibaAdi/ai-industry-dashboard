const HUGGING_FACE_MODEL = 'facebook/bart-large-mnli';
const HUGGING_FACE_API_URL = `https://router.huggingface.co/hf-inference/models/${HUGGING_FACE_MODEL}`;

const DOMAIN_TAXONOMY = {
  'Foundation Models': {
    subdomains: ['General-purpose LLMs', 'Multimodal Foundation Models', 'Small Language Models'],
    tags: ['llm', 'foundation-models', 'reasoning', 'multimodal'],
    keywords: ['foundation model', 'llm', 'language model', 'reasoning model', 'multimodal'],
  },
  'AI Agents': {
    subdomains: ['Task Automation Agents', 'Enterprise Agents', 'Agent Orchestration'],
    tags: ['agents', 'automation', 'copilot', 'workflow'],
    keywords: ['agent', 'copilot', 'autonomous workflow', 'task automation'],
  },
  Infrastructure: {
    subdomains: ['AI Cloud Infrastructure', 'Inference Infrastructure', 'GPU Platforms'],
    tags: ['infrastructure', 'inference', 'gpu', 'compute'],
    keywords: ['gpu', 'compute', 'inference', 'cloud infrastructure', 'accelerator'],
  },
  'Data Platforms': {
    subdomains: ['Data and Vector Platforms', 'Model Evaluation', 'Data Labeling'],
    tags: ['data-platform', 'vector-db', 'evaluation', 'labeling'],
    keywords: ['vector', 'dataset', 'labeling', 'evaluation', 'data platform'],
  },
  'Healthcare AI': {
    subdomains: ['Clinical and Biotech AI', 'Diagnostics AI', 'Medical Workflow AI'],
    tags: ['healthcare-ai', 'clinical', 'biotech', 'diagnostics'],
    keywords: ['drug discovery', 'clinical', 'healthcare', 'diagnostic', 'medical'],
  },
  Robotics: {
    subdomains: ['Embodied AI', 'Industrial Robotics', 'Autonomous Systems'],
    tags: ['robotics', 'autonomous-systems', 'embodied-ai'],
    keywords: ['robot', 'humanoid', 'autonomous system', 'embodied'],
  },
  'Developer Tools': {
    subdomains: ['AI Developer Platform', 'AI Observability', 'MLOps Tooling'],
    tags: ['developer-tools', 'mlops', 'observability', 'sdk'],
    keywords: ['sdk', 'framework', 'developer tool', 'observability', 'prompt management'],
  },
  'Generative AI': {
    subdomains: ['GenAI Applications', 'Creative AI', 'Search and Assistants'],
    tags: ['genai', 'creative-ai', 'assistants'],
    keywords: ['image generation', 'video generation', 'creative ai', 'assistant', 'answer engine'],
  },
};

const FALLBACK_CLASSIFICATION = {
  domain: 'Generative AI',
  subdomain: 'GenAI Applications',
  confidence_score: 0.6,
};

const cleanText = (value) => String(value ?? '').trim();

const buildClassificationText = (company) =>
  [company.name, company.description, ...(company.tags ?? [])].filter(Boolean).join(' ').trim();

const normalizeTag = (tag) => cleanText(tag).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const domainLabels = Object.keys(DOMAIN_TAXONOMY);

const keywordMatchScore = (text, keywords) => keywords.reduce((score, keyword) => (text.includes(keyword) ? score + 1 : score), 0);

const classifyWithKeywords = (inputText) => {
  const corpus = inputText.toLowerCase();
  const ranked = domainLabels
    .map((domain) => ({
      domain,
      score: keywordMatchScore(corpus, DOMAIN_TAXONOMY[domain].keywords),
    }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score === 0) {
    return {
      label: FALLBACK_CLASSIFICATION.domain,
      score: FALLBACK_CLASSIFICATION.confidence_score,
      provider: 'keyword-fallback',
    };
  }

  return {
    label: best.domain,
    score: Math.min(0.99, 0.65 + best.score * 0.08),
    provider: 'keyword-fallback',
  };
};

const classifyDomainWithHuggingFace = async (inputText) => {
  const token = process.env.HUGGING_FACE_API_TOKEN;

  if (!token || !inputText) {
    return classifyWithKeywords(inputText);
  }

  try {
    const response = await fetch(HUGGING_FACE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: inputText,
        parameters: {
          candidate_labels: domainLabels,
          multi_label: false,
        },
      }),
    });

    if (!response.ok) {
      return classifyWithKeywords(inputText);
    }

    const payload = await response.json();
    const label = payload?.labels?.[0];
    const score = payload?.scores?.[0];

    if (!label || typeof score !== 'number') {
      return classifyWithKeywords(inputText);
    }

    return {
      label,
      score,
      provider: HUGGING_FACE_MODEL,
    };
  } catch {
    return classifyWithKeywords(inputText);
  }
};

const chooseSubdomain = (domain, inputText, existingSubdomain) => {
  if (existingSubdomain && DOMAIN_TAXONOMY[domain]?.subdomains?.includes(existingSubdomain)) {
    return existingSubdomain;
  }

  const catalog = DOMAIN_TAXONOMY[domain]?.subdomains ?? [FALLBACK_CLASSIFICATION.subdomain];
  const lowerText = inputText.toLowerCase();
  const keywordChoice = catalog.find((entry) => lowerText.includes(entry.toLowerCase().replace(/[^a-z0-9]+/g, ' ')));

  return keywordChoice ?? catalog[0] ?? FALLBACK_CLASSIFICATION.subdomain;
};

const assignTags = (company, domain, subdomain, text) => {
  const inferredTags = new Set((company.tags ?? []).map(normalizeTag).filter(Boolean));

  for (const tag of DOMAIN_TAXONOMY[domain]?.tags ?? []) {
    inferredTags.add(normalizeTag(tag));
  }

  inferredTags.add(normalizeTag(domain));
  inferredTags.add(normalizeTag(subdomain));

  const lowerText = text.toLowerCase();
  for (const keyword of DOMAIN_TAXONOMY[domain]?.keywords ?? []) {
    if (lowerText.includes(keyword)) {
      inferredTags.add(normalizeTag(keyword));
    }
  }

  return [...inferredTags];
};

const resolveDomain = (existingDomain, inferredDomain, confidenceScore) => {
  if (!existingDomain) {
    return inferredDomain;
  }

  if (!DOMAIN_TAXONOMY[existingDomain]) {
    return inferredDomain;
  }

  return confidenceScore >= 0.55 ? inferredDomain : existingDomain;
};

export const classifyCompanyRecord = async (company) => {
  const text = buildClassificationText(company);
  const classification = await classifyDomainWithHuggingFace(text);
  const inferredDomain = classification.label;
  const domain = resolveDomain(cleanText(company.domain), inferredDomain, classification.score);
  const subdomain = chooseSubdomain(domain, text, cleanText(company.subdomain));
  const tags = assignTags(company, domain, subdomain, text);

  return {
    ...company,
    domain,
    subdomain,
    tags,
    confidence_score: Number((company.confidence_score ? Math.max(company.confidence_score, classification.score) : classification.score).toFixed(2)),
    classification_provider: classification.provider,
    ingestion_status: 'classified',
  };
};

export const classifyCompanyRecords = async (companies) => Promise.all(companies.map((company) => classifyCompanyRecord(company)));

export const runClassificationPipeline = async (records) => {
  const classifiedRecords = await classifyCompanyRecords(records);

  return {
    status: 'completed',
    count: classifiedRecords.length,
    records: classifiedRecords,
  };
};
