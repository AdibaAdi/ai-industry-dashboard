const domains = [
  { name: 'Generative AI', value: 32 },
  { name: 'Infrastructure', value: 24 },
  { name: 'Robotics', value: 19 },
  { name: 'Data Tools', value: 15 },
  { name: 'Other', value: 10 },
];

const DomainDistributionChart = () => {
  return (
    <section className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-card">
      <h2 className="mb-4 text-lg font-semibold text-slate-100">Domain Distribution</h2>
      <div className="space-y-4">
        {domains.map((domain) => (
          <div key={domain.name}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-slate-300">{domain.name}</span>
              <span className="text-dashboard-muted">{domain.value}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                style={{ width: `${domain.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DomainDistributionChart;
