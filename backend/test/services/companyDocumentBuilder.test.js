import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCompanyDocument } from '../../src/services/retrieval/companyDocumentBuilder.js';

test('buildCompanyDocument includes all RAG semantic fields and optional notes', () => {
  const company = {
    id: 'acme-ai',
    name: 'Acme AI',
    description: 'Builds AI copilots for supply-chain planning.',
    domain: 'Enterprise AI',
    predicted_domain: 'Enterprise AI',
    subdomain: 'Planning Copilots',
    predicted_subdomain: 'Planning Copilots',
    tags: ['copilot', 'supply-chain'],
    strengths: ['Strong enterprise GTM', 'Fast deployment'],
    risks: ['Customer concentration'],
    trend: 'accelerating',
    investor_notes: 'Healthy expansion revenue and low churn.',
    market_notes: ['Growing demand in logistics', 'Long sales cycles'],
    growth_score: 88,
    influence_score: 76,
    power_score: 83,
  };

  const document = buildCompanyDocument(company);

  assert.equal(document.id, company.id);
  assert.equal(document.metadata.name, company.name);
  assert.equal(document.chunks.predicted_domain, company.predicted_domain);
  assert.equal(document.chunks.predicted_subdomain, company.predicted_subdomain);
  assert.deepEqual(document.chunks.strengths, company.strengths);
  assert.deepEqual(document.chunks.risks, company.risks);
  assert.equal(document.chunks.trend, company.trend);
  assert.equal(document.chunks.investor_notes, company.investor_notes);
  assert.deepEqual(document.chunks.market_notes, company.market_notes);

  assert.match(document.text, /Company name: Acme AI/);
  assert.match(document.text, /Predicted domain: Enterprise AI/);
  assert.match(document.text, /Strengths: Strong enterprise GTM; Fast deployment/);
  assert.match(document.text, /Investor notes: Healthy expansion revenue and low churn\./);
  assert.match(document.text, /Market notes: Growing demand in logistics; Long sales cycles/);
});
