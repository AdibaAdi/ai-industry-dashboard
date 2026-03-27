const companies = [
  { name: 'OpenAI', domain: 'Generative AI', score: 98.7, growth: '+14%' },
  { name: 'Anthropic', domain: 'Foundation Models', score: 96.2, growth: '+11%' },
  { name: 'NVIDIA', domain: 'Infrastructure', score: 94.9, growth: '+9%' },
  { name: 'Scale AI', domain: 'Data Platforms', score: 90.3, growth: '+7%' },
];

const CompanyTable = () => {
  return (
    <section className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Top Companies</h2>
        <button className="text-sm text-cyan-300 hover:text-cyan-200">View all</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50 text-left text-dashboard-muted">
              <th className="pb-3 font-medium">Company</th>
              <th className="pb-3 font-medium">Domain</th>
              <th className="pb-3 font-medium">Score</th>
              <th className="pb-3 font-medium">Growth</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.name} className="border-b border-slate-800/80 text-slate-200 last:border-b-0">
                <td className="py-3 font-medium">{company.name}</td>
                <td className="py-3">{company.domain}</td>
                <td className="py-3">{company.score}</td>
                <td className="py-3 text-emerald-300">{company.growth}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default CompanyTable;
