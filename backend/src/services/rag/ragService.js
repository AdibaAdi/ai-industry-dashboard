import { getCompanies } from '../../data/repositories/companyRepository.js';
import { retrieveRelevantCompanyDocuments, getSemanticRetrievalInfo } from '../retrieval/companySemanticRetrievalService.js';

const DEFAULT_RETRIEVAL_LIMIT = 8;
const DEFAULT_SNIPPET_LIMIT = 8;

const STOPWORDS = new Set([
  'the', 'a', 'an', 'for', 'with', 'and', 'or', 'of', 'to', 'in', 'on', 'at', 'is', 'are', 'was', 'were',
  'which', 'what', 'who', 'how', 'why', 'when', 'companies', 'company', 'ai', 'about', 'show', 'me',
]);

const normalize = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const tokenize = (value) =>
  normalize(value)
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));

const unique = (items) => [...new Set(items)];

const toPercent = (value) => `${Math.round(value * 100)}%`;

const getFieldText = (company, field) => {
  switch (field) {
    case 'description':
      return company.description ?? '';
    case 'domain':
      return company.domain ?? '';
    case 'subdomain':
      return company.subdomain ?? '';
    case 'tags':
      return (company.tags ?? []).join(', ');
    default:
      return '';
  }
};

const buildEvidenceSnippetsForCompany = (company, queryTokens, relevanceScore) => {
  const fields = ['description', 'domain', 'subdomain', 'tags'];

  const snippets = fields
    .map((field) => {
      const text = getFieldText(company, field);
      const normalizedText = normalize(text);
      const matchedTerms = queryTokens.filter((token) => normalizedText.includes(token));

      if (!text || !matchedTerms.length) {
        return null;
      }

      return {
        company_id: company.id,
        company_name: company.name,
        source_field: field,
        snippet: text,
        matched_terms: unique(matchedTerms),
        relevance_score: relevanceScore,
      };
    })
    .filter(Boolean);

  if (snippets.length) {
    return snippets;
  }

  return [
    {
      company_id: company.id,
      company_name: company.name,
      source_field: 'description',
      snippet: company.description,
      matched_terms: [],
      relevance_score: relevanceScore,
    },
  ];
};

const buildSelectionReason = (company, queryTokens, semanticScore) => {
  const matched = [];
  const domainText = normalize(`${company.domain} ${company.subdomain}`);
  const tagText = normalize((company.tags ?? []).join(' '));
  const descriptionText = normalize(company.description);

  if (queryTokens.some((token) => domainText.includes(token))) {
    matched.push('domain/subdomain overlap');
  }

  if (queryTokens.some((token) => tagText.includes(token))) {
    matched.push('tag overlap');
  }

  if (queryTokens.some((token) => descriptionText.includes(token))) {
    matched.push('description overlap');
  }

  if (!matched.length) {
    matched.push('semantic similarity match');
  }

  return `${matched.join(', ')} · semantic relevance ${toPercent(semanticScore)}`;
};

const buildContextBundle = ({ query, queryTokens, matchesById }) => {
  const retrievedCompanies = matchesById.map(({ company, score }) => ({
    id: company.id,
    name: company.name,
    domain: company.domain,
    subdomain: company.subdomain,
    relevance_score: Number(score.toFixed(3)),
    power_score: company.power_score,
    growth_score: company.growth_score,
    influence_score: company.influence_score,
    why_selected: buildSelectionReason(company, queryTokens, score),
  }));

  const supportingSnippets = matchesById
    .flatMap(({ company, score }) => buildEvidenceSnippetsForCompany(company, queryTokens, Number(score.toFixed(3))))
    .slice(0, DEFAULT_SNIPPET_LIMIT);

  return {
    query,
    query_tokens: queryTokens,
    retrieved_companies: retrievedCompanies,
    supporting_snippets: supportingSnippets,
  };
};

const summarizeDomains = (companies) => {
  const counts = companies.reduce((acc, company) => {
    acc[company.domain] = (acc[company.domain] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([domain, count]) => `${domain} (${count})`)
    .join(', ');
};

const buildGroundedAnswer = (contextBundle, query) => {
  const top = contextBundle.retrieved_companies.slice(0, 3);

  if (!top.length) {
    return {
      answer: `I could not find enough grounded evidence in the current company dataset to answer: "${query}".`,
      reasoning_summary: [
        'No retrieved company passed the semantic relevance threshold.',
        'Answer generation was skipped to avoid unsupported claims.',
      ],
    };
  }

  const topNames = top.map((company) => company.name).join(', ');
  const avgPower = top.reduce((sum, company) => sum + company.power_score, 0) / top.length;
  const avgGrowth = top.reduce((sum, company) => sum + company.growth_score, 0) / top.length;
  const dominantDomains = summarizeDomains(top);

  const answer = [
    `Based on retrieved company evidence, the most relevant matches for "${query}" are ${topNames}.`,
    `These retrieved companies cluster in ${dominantDomains} and show strong aggregate signals (avg power ${avgPower.toFixed(1)}, avg growth ${avgGrowth.toFixed(1)}).`,
    'This response is grounded only in the retrieved profiles, tags, domains, and score metadata from the current dataset.',
  ].join(' ');

  return {
    answer,
    reasoning_summary: [
      `Retrieved ${contextBundle.retrieved_companies.length} semantically similar company profiles from the vector index.`,
      'Constructed evidence snippets from description/domain/subdomain/tags fields for grounding.',
      'Generated final answer only from retrieved evidence and score metadata.',
    ],
  };
};

const buildRelevanceMetadata = ({ retrievedCompanies, retrievalInfo }) => {
  if (!retrievedCompanies.length) {
    return {
      overall_confidence: 'low',
      top_relevance_score: 0,
      avg_top3_relevance_score: 0,
      grounding_coverage: 0,
      retrieval: {
        strategy: 'embedding_top_k',
        provider: retrievalInfo.provider,
        model: retrievalInfo.model,
        dimensions: retrievalInfo.dimensions,
      },
    };
  }

  const topScore = retrievedCompanies[0].relevance_score;
  const top3 = retrievedCompanies.slice(0, 3);
  const avgTop3 = top3.reduce((sum, item) => sum + item.relevance_score, 0) / top3.length;
  const confidence = avgTop3 >= 0.55 ? 'high' : avgTop3 >= 0.35 ? 'medium' : 'low';

  return {
    overall_confidence: confidence,
    top_relevance_score: Number(topScore.toFixed(3)),
    avg_top3_relevance_score: Number(avgTop3.toFixed(3)),
    grounding_coverage: Number((top3.length / Math.max(retrievedCompanies.length, 1)).toFixed(3)),
    retrieval: {
      strategy: 'embedding_top_k',
      provider: retrievalInfo.provider,
      model: retrievalInfo.model,
      dimensions: retrievalInfo.dimensions,
    },
  };
};

export const runCompanyRagQuery = async (query, options = {}) => {
  const normalizedQuery = typeof query === 'string' ? query.trim() : '';

  if (!normalizedQuery) {
    return {
      query: normalizedQuery,
      answer: 'Please provide a non-empty question.',
      retrieved_companies: [],
      supporting_snippets: [],
      relevance: {
        overall_confidence: 'low',
        top_relevance_score: 0,
        avg_top3_relevance_score: 0,
        grounding_coverage: 0,
      },
      reasoning_summary: ['No query was provided.'],
    };
  }

  const companies = getCompanies();
  const queryTokens = tokenize(normalizedQuery);
  const retrievalLimit = options.retrievalLimit ?? DEFAULT_RETRIEVAL_LIMIT;

  let matches = [];
  let retrievalFallbackUsed = false;

  try {
    matches = await retrieveRelevantCompanyDocuments({
      companies,
      query: normalizedQuery,
      limit: retrievalLimit,
      minSimilarity: 0.05,
    });
  } catch {
    retrievalFallbackUsed = true;

    const lexicalMatches = companies
      .map((company) => {
        const candidateText = normalize(`${company.name} ${company.description} ${company.domain} ${company.subdomain} ${(company.tags ?? []).join(' ')}`);
        const overlapCount = queryTokens.filter((token) => candidateText.includes(token)).length;
        return {
          company,
          score: overlapCount > 0 ? overlapCount / Math.max(queryTokens.length, 1) : 0,
        };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, retrievalLimit)
      .map((entry) => ({ id: entry.company.id, score: entry.score }));

    matches = lexicalMatches;
  }

  const companiesById = new Map(companies.map((company) => [company.id, company]));
  const matchesById = matches
    .map((entry) => ({
      company: companiesById.get(entry.id),
      score: entry.score,
      metadata: entry.metadata,
      document: entry.document,
    }))
    .filter((entry) => entry.company);

  const contextBundle = buildContextBundle({ query: normalizedQuery, queryTokens, matchesById });
  const generation = buildGroundedAnswer(contextBundle, normalizedQuery);
  const retrievalInfo = getSemanticRetrievalInfo();

  return {
    query: normalizedQuery,
    answer: generation.answer,
    retrieved_companies: contextBundle.retrieved_companies,
    supporting_snippets: contextBundle.supporting_snippets,
    relevance: {
      ...buildRelevanceMetadata({
        retrievedCompanies: contextBundle.retrieved_companies,
        retrievalInfo,
      }),
      retrieval_fallback_used: retrievalFallbackUsed,
    },
    reasoning_summary: generation.reasoning_summary,
  };
};
