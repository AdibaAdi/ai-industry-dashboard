import { classifyCompanyRecords } from '../services/classificationService.js';

const sampleCompanies = [
  {
    id: 'sample-agent-ops',
    name: 'AgentOps Cloud',
    description: 'Platform for building and orchestrating autonomous AI agents for enterprise workflows.',
    tags: ['automation', 'copilot', 'workflow'],
  },
  {
    id: 'sample-med-vision',
    name: 'MedSight AI',
    description: 'Computer vision diagnostics platform analyzing radiology scans for clinical triage.',
    tags: ['clinical', 'imaging', 'diagnostics'],
  },
  {
    id: 'sample-gpu-infra',
    name: 'Nebula Compute',
    description: 'GPU cloud and model serving infrastructure optimized for low-latency inference.',
    tags: ['gpu', 'inference', 'cloud'],
  },
];

const printResults = (results) => {
  const printable = results.map((company) => ({
    id: company.id,
    name: company.name,
    domain: company.domain,
    subdomain: company.subdomain,
    predicted_domain: company.predicted_domain,
    predicted_subdomain: company.predicted_subdomain,
    classification_confidence: company.classification_confidence,
    classification_source: company.classification_source,
    classification_provider: company.classification_provider,
  }));

  console.table(printable);
};

const run = async () => {
  const results = await classifyCompanyRecords(sampleCompanies);
  printResults(results);
};

run().catch((error) => {
  console.error('Classification sample script failed.', error);
  process.exitCode = 1;
});
