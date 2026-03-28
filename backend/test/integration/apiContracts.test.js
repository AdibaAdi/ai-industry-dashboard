import test from 'node:test';
import assert from 'node:assert/strict';

import { createAppServer } from '../../src/app.js';

let server;
let baseUrl;

const getJson = async (path) => {
  const response = await fetch(`${baseUrl}${path}`);
  const body = await response.json();
  return { response, body };
};

const hasKeys = (value, keys) =>
  keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));

test.before(async () => {
  server = createAppServer();

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
});

test('GET /companies returns non-empty structured data with dynamic score distribution', async () => {
  const { response, body } = await getJson('/companies');

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(body.data));
  assert.ok(body.data.length > 0);

  const requiredFields = [
    'id',
    'name',
    'domain',
    'subdomain',
    'growth_score',
    'influence_score',
    'power_score',
    'confidence_score',
    'classification_confidence',
    'classification_source',
    'classification_provider',
    'predicted_domain',
    'predicted_subdomain',
    'sources',
    'source_urls',
    'last_updated',
  ];

  for (const company of body.data) {
    assert.ok(hasKeys(company, requiredFields), `Missing one or more required fields for ${company.id}`);
    assert.ok(Array.isArray(company.sources) && company.sources.length > 0, `${company.id} must include sources`);
    assert.ok(Array.isArray(company.source_urls) && company.source_urls.length > 0, `${company.id} must include source_urls`);
    assert.equal(typeof company.confidence_score, 'number');
    assert.equal(typeof company.classification_confidence, 'number');
    assert.equal(typeof company.classification_source, 'string');
    assert.equal(typeof company.classification_provider, 'string');
    assert.equal(typeof company.last_updated, 'string');
  }

  const uniquePowerScores = new Set(body.data.map((company) => company.power_score));
  assert.ok(uniquePowerScores.size > 1, 'power_score values should vary across companies');

  const uniqueGrowthScores = new Set(body.data.map((company) => company.growth_score));
  const uniqueInfluenceScores = new Set(body.data.map((company) => company.influence_score));
  assert.ok(uniqueGrowthScores.size > 1, 'growth_score values should vary across companies');
  assert.ok(uniqueInfluenceScores.size > 1, 'influence_score values should vary across companies');

  const confidenceCounts = body.data.reduce((acc, company) => {
    const score = company.confidence_score;
    const label = score >= 0.8 ? 'High' : score >= 0.5 ? 'Medium' : score >= 0 ? 'Low' : 'Unknown';
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});
  const observedConfidenceLabels = Object.values(confidenceCounts).filter((count) => count > 0).length;
  assert.ok(observedConfidenceLabels >= 2, 'confidence labels should not collapse to one class');

  const uniqueDomains = new Set(body.data.map((company) => company.domain));
  assert.ok(uniqueDomains.size > 1, 'companies should span multiple domains');

  assert.equal(typeof body.meta?.total, 'number');
  assert.equal(body.meta.total, body.data.length);
});

test('GET /companies/:id returns a specific company with contract fields', async () => {
  const listResult = await getJson('/companies');
  const sampleCompany = listResult.body.data[0];

  const { response, body } = await getJson(`/companies/${sampleCompany.id}`);

  assert.equal(response.status, 200);
  assert.ok(body.data);
  assert.equal(body.data.id, sampleCompany.id);
  assert.ok(hasKeys(body.data, ['confidence_score', 'classification_confidence', 'classification_source', 'sources', 'last_updated']));
});

test('GET /domains returns non-empty dynamically computed counts and percentages', async () => {
  const [{ body: companiesBody }, { response, body: domainsBody }] = await Promise.all([
    getJson('/companies'),
    getJson('/domains'),
  ]);

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(domainsBody.data));
  assert.ok(domainsBody.data.length > 0);

  const totalCompanies = companiesBody.data.length;
  const counted = domainsBody.data.reduce((sum, domain) => sum + domain.total_companies, 0);
  assert.equal(counted, totalCompanies);

  for (const domain of domainsBody.data) {
    assert.ok(hasKeys(domain, [
      'domain',
      'total_companies',
      'share_percentage',
      'share',
      'average_growth_score',
      'average_influence_score',
      'average_power_score',
      'leaders',
    ]));

    const expectedSharePercentage = Number(((domain.total_companies / totalCompanies) * 100).toFixed(1));
    assert.equal(domain.share_percentage, expectedSharePercentage);
    assert.equal(domain.share, `${expectedSharePercentage.toFixed(1)}%`);
    assert.ok(Array.isArray(domain.leaders));
  }

  const uniqueCounts = new Set(domainsBody.data.map((domain) => domain.total_companies));
  assert.ok(uniqueCounts.size > 1, 'domain totals should not be suspiciously uniform');

  assert.equal(domainsBody.meta.total_domains, domainsBody.data.length);
  assert.equal(domainsBody.meta.total_companies, totalCompanies);
  assert.ok(Array.isArray(domainsBody.warnings));
});

test('GET /insights returns generated insights with confidence and structured metrics', async () => {
  const { response, body } = await getJson('/insights');

  assert.equal(response.status, 200);
  assert.ok(body.data);
  assert.equal(typeof body.data.generated_at, 'string');
  assert.ok(body.data.stats);
  assert.equal(typeof body.data.stats.total_companies, 'number');

  assert.ok(Array.isArray(body.data.highlights));
  assert.ok(body.data.highlights.length > 0);

  for (const highlight of body.data.highlights) {
    assert.ok(hasKeys(highlight, ['id', 'title', 'short_summary', 'supporting_metrics', 'relevant_companies', 'confidence']));
    assert.ok(highlight.confidence);
    assert.equal(typeof highlight.confidence.level, 'string');
    assert.equal(typeof highlight.confidence.strength, 'number');
    assert.ok(Array.isArray(highlight.supporting_metrics));
  }
});

test('GET /investor-mode returns non-empty market/investor payload with required fields', async () => {
  const { response, body } = await getJson('/investor-mode');

  assert.equal(response.status, 200);
  assert.ok(body.data);
  assert.equal(typeof body.data.generated_at, 'string');

  assert.ok(Array.isArray(body.data.top_emerging_startups));
  assert.ok(body.data.top_emerging_startups.length > 0);
  assert.ok(Array.isArray(body.data.highest_momentum_sectors));
  assert.ok(body.data.highest_momentum_sectors.length > 0);
  assert.ok(Array.isArray(body.data.rising_companies_by_domain));
  assert.ok(body.data.rising_companies_by_domain.length > 0);

  const firstStartup = body.data.top_emerging_startups[0];
  assert.ok(hasKeys(firstStartup, [
    'id',
    'name',
    'domain',
    'investor_score',
    'confidence_score',
    'classification_confidence',
    'classification_source',
    'sources',
    'last_updated',
  ]));

  const firstRising = body.data.rising_companies_by_domain[0];
  assert.ok(hasKeys(firstRising, ['id', 'name', 'domain', 'confidence_score', 'sources', 'last_updated']));

  const investorScores = body.data.top_emerging_startups.map((company) => company.investor_score);
  assert.ok(new Set(investorScores).size > 1, 'investor scores should vary across startups');
});

test('GET /search returns RAG-grounded answer payload', async () => {
  const { response, body } = await getJson('/search?q=Which companies are strongest in foundation models?');

  assert.equal(response.status, 200);
  assert.equal(typeof body.query, 'string');
  assert.equal(typeof body.answer, 'string');
  assert.ok(Array.isArray(body.retrieved_companies));
  assert.ok(Array.isArray(body.supporting_snippets));
  assert.ok(Array.isArray(body.reasoning_summary));
  assert.ok(body.relevance);

  if (body.retrieved_companies.length > 0) {
    const company = body.retrieved_companies[0];
    assert.ok(hasKeys(company, ['id', 'name', 'domain', 'relevance_score', 'why_selected']));
  }

  if (body.supporting_snippets.length > 0) {
    const snippet = body.supporting_snippets[0];
    assert.ok(hasKeys(snippet, ['company_id', 'company_name', 'source_field', 'snippet', 'relevance_score']));
  }

  assert.ok(hasKeys(body.relevance, ['overall_confidence', 'top_relevance_score', 'avg_top3_relevance_score', 'grounding_coverage']));
});
