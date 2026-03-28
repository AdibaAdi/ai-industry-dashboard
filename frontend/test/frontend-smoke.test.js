import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAskAIResultViewModel,
  buildDashboardDataFromApi,
  buildDomainCardModels,
  buildKpiCardModels,
} from '../src/utils/dashboardDataBuilder.js';
import { toTopCompanies } from '../src/utils/transformers.js';
import { buildConfidenceTooltip, getConfidenceMeta } from '../src/utils/confidence.js';

const mockCompaniesResponse = {
  data: [
    {
      id: 'c2',
      name: 'Beta Compute',
      domain: 'Infrastructure',
      growth_score: 72.4,
      influence_score: 95.2,
      power_score: 91.3,
      confidence_score: 0.91,
      sources: ['Crunchbase', 'Company filing'],
      last_updated: '2026-02-14T00:00:00.000Z',
      valuation: 12000,
      founded_year: 2018,
    },
    {
      id: 'c1',
      name: 'Alpha Health AI',
      domain: 'Healthcare',
      growth_score: 88.2,
      influence_score: 89.4,
      power_score: 84.8,
      confidence_score: 0.62,
      sources: ['Press release'],
      last_updated: '2026-02-10T00:00:00.000Z',
      valuation: 6200,
      founded_year: 2021,
    },
  ],
  meta: {
    refresh: {
      newly_added_companies: 2,
      updated_records_count: 11,
      current_year_coverage: {
        year: 2026,
        covered_records: 2,
        coverage_pct: 100,
      },
    },
  },
};

const mockDomainsResponse = {
  data: [
    {
      domain: 'Infrastructure',
      total_companies: 14,
      share_percentage: 35.5,
      average_power_score: 86.1,
      leaders: [{ name: 'Beta Compute' }],
    },
    {
      domain: 'Healthcare',
      total_companies: 9,
      share_percentage: 22.8,
      average_power_score: 81.7,
      leaders: [{ name: 'Alpha Health AI' }],
    },
  ],
};

const mockInsightsResponse = { data: { highlights: ['Demand is increasing'] } };
const mockInvestorModeResponse = { data: { watchlist: ['c2'] } };

test('dashboard KPI models are derived from mocked API payloads', () => {
  const dashboardData = buildDashboardDataFromApi({
    companiesResponse: mockCompaniesResponse,
    domainsResponse: mockDomainsResponse,
    insightsResponse: mockInsightsResponse,
    investorModeResponse: mockInvestorModeResponse,
  });

  const kpiCards = buildKpiCardModels(dashboardData.kpis, false);

  assert.equal(kpiCards[0].value, '2');
  assert.equal(kpiCards[1].value, 'Infrastructure');
  assert.equal(kpiCards[2].value, '91.3');
  assert.equal(kpiCards[2].trend, 'Beta Compute');
  assert.equal(kpiCards[3].value, '2 new · 11 updated');
  assert.equal(kpiCards[3].trend, '2026 coverage 2/2 (100%)');
});

test('companies table rows are sourced from mocked backend company list', () => {
  const tableRows = toTopCompanies(mockCompaniesResponse.data);

  assert.deepEqual(
    tableRows.map((row) => row.name),
    ['Beta Compute', 'Alpha Health AI'],
  );
  assert.equal(tableRows[0].score, 95.2);
  assert.equal(tableRows[0].confidence_score, 0.91);
});

test('domain card models render backend domain counts and percentages', () => {
  const cards = buildDomainCardModels(mockDomainsResponse.data);

  assert.deepEqual(cards[0], {
    key: 'Infrastructure',
    title: 'Infrastructure',
    totalCompanies: 14,
    shareLabel: '35.5% of tracked companies',
  });
});

test('confidence badge metadata and tooltip copy use API confidence values', () => {
  const confidenceMeta = getConfidenceMeta(0.91);
  const tooltip = buildConfidenceTooltip({
    score: 0.91,
    sources: ['Crunchbase', 'Company filing'],
    lastUpdated: '2026-02-14T00:00:00.000Z',
  });

  assert.equal(confidenceMeta.label, 'High');
  assert.match(tooltip, /Data Sources: Crunchbase, Company filing/);
  assert.match(tooltip, /Confidence explanation: Based on multiple verified sources/);
});

test('ask AI result view model exposes backend response fields used by the UI', () => {
  const viewModel = buildAskAIResultViewModel({
    answer: 'Infrastructure leaders are outpacing peers.',
    intent: 'company_comparison',
    analysis: {
      key_finding: 'Beta Compute has the strongest combined signal.',
      strongest_matching_companies: [{ id: 'c2', rank: 1, name: 'Beta Compute', domain: 'Infrastructure', power_score: 91.3 }],
    },
    results: [{ id: 'c2', name: 'Beta Compute', power_score: 91.3, relevance_score: 0.88 }],
    supporting_snippets: ['Beta Compute added 400 enterprise accounts in 2025.'],
  });

  assert.equal(viewModel.answer, 'Infrastructure leaders are outpacing peers.');
  assert.equal(viewModel.intentLabel, 'company comparison');
  assert.equal(viewModel.keyFinding, 'Beta Compute has the strongest combined signal.');
  assert.equal(viewModel.strongestCompanies[0].name, 'Beta Compute');
  assert.equal(viewModel.rankedResults[0].id, 'c2');
  assert.equal(viewModel.supportingSnippets[0], 'Beta Compute added 400 enterprise accounts in 2025.');
});
