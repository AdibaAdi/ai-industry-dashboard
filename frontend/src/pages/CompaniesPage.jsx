const companies = [
  { name: 'OpenAI', domain: 'Generative AI', growthScore: 98.7, influenceScore: 99.1 },
  { name: 'Anthropic', domain: 'Foundation Models', growthScore: 96.2, influenceScore: 95.8 },
  { name: 'NVIDIA', domain: 'Infrastructure', growthScore: 94.9, influenceScore: 98.4 },
  { name: 'Scale AI', domain: 'Data Platforms', growthScore: 90.3, influenceScore: 89.7 },
  { name: 'Cohere', domain: 'Enterprise LLMs', growthScore: 88.6, influenceScore: 86.9 },
  { name: 'Mistral AI', domain: 'Open-weight Models', growthScore: 89.8, influenceScore: 87.5 },
];

const CompaniesPage = () => {
  return (
    <main className="flex-1 space-y-6 p-6">
      <section className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-card">
        <h1 className="text-xl font-semibold text-slate-100">Companies</h1>
        <p className="mt-1 text-sm text-dashboard-muted">Mock AI company performance and influence overview.</p>
      </section>

      <section className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-card">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50 text-left text-dashboard-muted">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Domain</th>
                <th className="pb-3 font-medium">Growth Score</th>
                <th className="pb-3 font-medium">Influence Score</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.name} className="border-b border-slate-800/80 text-slate-200 last:border-b-0">
                  <td className="py-3 font-medium">{company.name}</td>
                  <td className="py-3">{company.domain}</td>
                  <td className="py-3 text-emerald-300">{company.growthScore}</td>
                  <td className="py-3 text-cyan-300">{company.influenceScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default CompaniesPage;
