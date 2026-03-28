const HUGGING_FACE_MODEL = process.env.HUGGING_FACE_CLASSIFICATION_MODEL ?? 'facebook/bart-large-mnli';
const HUGGING_FACE_API_URL = `https://router.huggingface.co/hf-inference/models/${HUGGING_FACE_MODEL}`;

const DOMAIN_TAXONOMY = {
  'Foundation Models': {
    subdomains: ['General-purpose LLMs', 'Multimodal Foundation Models', 'Small Language Models', 'Open-weight Models'],
    tags: ['llm', 'foundation-models', 'reasoning', 'multimodal'],
    keywords: ['foundation model', 'llm', 'language model', 'reasoning model', 'multimodal', 'open-weight'],
  },
  'Generative AI': {
    subdomains: ['GenAI Applications', 'Creative AI', 'Search and Assistants', 'Marketing and Content Generation'],
    tags: ['genai', 'creative-ai', 'assistants'],
    keywords: ['image generation', 'video generation', 'creative ai', 'assistant', 'answer engine', 'content generation'],
  },
  'AI Agents': {
    subdomains: ['Task Automation Agents', 'Enterprise Agents', 'Agent Orchestration', 'Vertical Agents'],
    tags: ['agents', 'automation', 'copilot', 'workflow'],
    keywords: ['agent', 'copilot', 'autonomous workflow', 'task automation', 'multi-agent'],
  },
  Infrastructure: {
    subdomains: ['AI Cloud Infrastructure', 'Inference Infrastructure', 'GPU Platforms', 'Model Serving'],
    tags: ['infrastructure', 'inference', 'gpu', 'compute'],
    keywords: ['gpu', 'compute', 'inference', 'cloud infrastructure', 'accelerator', 'serving'],
  },
  'Developer Tools': {
    subdomains: ['AI Developer Platform', 'AI Observability', 'MLOps Tooling', 'Prompt Engineering Tooling'],
    tags: ['developer-tools', 'mlops', 'observability', 'sdk'],
    keywords: ['sdk', 'framework', 'developer tool', 'observability', 'prompt management', 'mlops'],
  },
  'Healthcare AI': {
    subdomains: ['Clinical and Biotech AI', 'Diagnostics AI', 'Medical Workflow AI', 'Drug Discovery AI'],
    tags: ['healthcare-ai', 'clinical', 'biotech', 'diagnostics'],
    keywords: ['drug discovery', 'clinical', 'healthcare', 'diagnostic', 'medical', 'hospital'],
  },
  Robotics: {
    subdomains: ['Embodied AI', 'Industrial Robotics', 'Autonomous Systems', 'Humanoid Robotics'],
    tags: ['robotics', 'autonomous-systems', 'embodied-ai'],
    keywords: ['robot', 'humanoid', 'autonomous system', 'embodied', 'warehouse robotics'],
  },
  'Defense AI': {
    subdomains: ['Autonomous Defense Systems', 'Intelligence and Surveillance AI', 'Defense Decision Support'],
    tags: ['defense-ai', 'autonomy', 'surveillance'],
    keywords: ['defense', 'military', 'surveillance', 'battlefield', 'national security'],
  },
  'Data Platforms': {
    subdomains: ['Data and Vector Platforms', 'Model Evaluation', 'Data Labeling', 'Synthetic Data'],
    tags: ['data-platform', 'vector-db', 'evaluation', 'labeling'],
    keywords: ['vector', 'dataset', 'labeling', 'evaluation', 'data platform', 'synthetic data'],
  },
  'Computer Vision': {
    subdomains: ['Vision Foundation Models', 'Industrial Vision', 'Video Intelligence', 'Edge Vision AI'],
    tags: ['computer-vision', 'video-ai', 'perception'],
    keywords: ['computer vision', 'image recognition', 'video analytics', 'visual inspection', 'perception'],
  },
  'Enterprise AI': {
    subdomains: ['Enterprise Automation', 'AI Knowledge Management', 'Customer Support AI', 'Business Intelligence AI'],
    tags: ['enterprise-ai', 'productivity', 'workflow-ai'],
    keywords: ['enterprise', 'workflow', 'automation', 'customer support', 'business intelligence'],
  },
};

const FALLBACK_CLASSIFICATION = {
  domain: 'Generative AI',
  subdomain: 'GenAI Applications',
  confidence: 0.6,
  source: 'keyword-fallback',
  provider: 'local-keywords',
};

const cleanText = (value) => String(value ?? '').trim();

const buildClassificationText = (company) =>
  [company.name, company.description, ...(company.tags ?? [])].filter(Boolean).join(' ').trim();

const normalizeTag = (tag) => cleanText(tag).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const domainLabels = Object.keys(DOMAIN_TAXONOMY);

const keywordMatchScore = (text, keywords) => keywords.reduce((score, keyword) => (text.includes(keyword) ? score + 1 : score), 0);

const inferWithKeywords = (inputText) => {
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
      ...FALLBACK_CLASSIFICATION,
      predicted_domain: FALLBACK_CLASSIFICATION.domain,
      predicted_subdomain: FALLBACK_CLASSIFICATION.subdomain,
    };
  }

  const confidence = Math.min(0.92, 0.62 + best.score * 0.07);
  const subdomains = DOMAIN_TAXONOMY[best.domain]?.subdomains ?? [FALLBACK_CLASSIFICATION.subdomain];

  return {
    source: 'keyword-fallback',
    provider: 'local-keywords',
    confidence,
    predicted_domain: best.domain,
    predicted_subdomain: subdomains[0],
  };
};

const createHuggingFaceZeroShotProvider = () => ({
  name: 'hugging-face-zero-shot',
  async classify(inputText, domainCandidates, subdomainCandidates = null) {
    const token = process.env.HUGGING_FACE_API_TOKEN;

    if (!token || !inputText) {
      return null;
    }

    const classifyLabels = async (candidateLabels) => {
      const response = await fetch(HUGGING_FACE_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: inputText,
          parameters: {
            candidate_labels: candidateLabels,
            multi_label: false,
          },
        }),
      });

      if (!response.ok) {
        return null;
      }

      const payload = await response.json();
      const label = payload?.labels?.[0];
      const confidence = payload?.scores?.[0];

      if (!label || typeof confidence !== 'number') {
        return null;
      }

      return { label, confidence };
    };

    try {
      const domainResult = await classifyLabels(domainCandidates);
      if (!domainResult) {
        return null;
      }

      const candidateSubdomains = subdomainCandidates ?? DOMAIN_TAXONOMY[domainResult.label]?.subdomains ?? [];
      const subdomainResult = candidateSubdomains.length ? await classifyLabels(candidateSubdomains) : null;

      return {
        source: 'ml-hugging-face',
        provider: HUGGING_FACE_MODEL,
        confidence: Number((subdomainResult ? (domainResult.confidence + subdomainResult.confidence) / 2 : domainResult.confidence).toFixed(4)),
        predicted_domain: domainResult.label,
        predicted_subdomain: subdomainResult?.label ?? candidateSubdomains[0] ?? FALLBACK_CLASSIFICATION.subdomain,
      };
    } catch {
      return null;
    }
  },
});

const classificationProviders = [createHuggingFaceZeroShotProvider()];

const runProviderChain = async (inputText) => {
  for (const provider of classificationProviders) {
    const result = await provider.classify(inputText, domainLabels);

    if (result?.predicted_domain) {
      return result;
    }
  }

  return inferWithKeywords(inputText);
};

const chooseSubdomain = (domain, inputText, existingSubdomain, predictedSubdomain) => {
  const catalog = DOMAIN_TAXONOMY[domain]?.subdomains ?? [FALLBACK_CLASSIFICATION.subdomain];

  if (existingSubdomain && catalog.includes(existingSubdomain)) {
    return existingSubdomain;
  }

  if (predictedSubdomain && catalog.includes(predictedSubdomain)) {
    return predictedSubdomain;
  }

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

const preserveExistingClassification = (company, predicted) => {
  const hasExistingDomain = cleanText(company.domain) && DOMAIN_TAXONOMY[cleanText(company.domain)];

  if (hasExistingDomain && predicted.source !== 'ml-hugging-face') {
    return {
      domain: cleanText(company.domain),
      subdomain: chooseSubdomain(cleanText(company.domain), buildClassificationText(company), cleanText(company.subdomain), predicted.predicted_subdomain),
      source: 'manual-fallback',
    };
  }

  return {
    domain: predicted.predicted_domain,
    subdomain: chooseSubdomain(predicted.predicted_domain, buildClassificationText(company), cleanText(company.subdomain), predicted.predicted_subdomain),
    source: predicted.source,
  };
};

export const classifyCompanyRecord = async (company) => {
  const text = buildClassificationText(company);
  const predicted = await runProviderChain(text);
  const resolved = preserveExistingClassification(company, predicted);
  const tags = assignTags(company, resolved.domain, resolved.subdomain, text);
  const classificationConfidence = Number((predicted.confidence ?? FALLBACK_CLASSIFICATION.confidence).toFixed(2));

  return {
    ...company,
    domain: resolved.domain,
    subdomain: resolved.subdomain,
    predicted_domain: predicted.predicted_domain,
    predicted_subdomain: predicted.predicted_subdomain,
    classification_confidence: classificationConfidence,
    classification_source: resolved.source,
    classification_provider: predicted.provider,
    tags,
    confidence_score: Number((company.confidence_score ? Math.max(company.confidence_score, classificationConfidence) : classificationConfidence).toFixed(2)),
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

export const getSupportedClassificationDomains = () => domainLabels;
