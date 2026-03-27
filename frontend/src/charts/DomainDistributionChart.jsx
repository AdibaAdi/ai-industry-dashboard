import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const domainData = [
  { name: 'Generative AI', value: 32 },
  { name: 'Infrastructure', value: 24 },
  { name: 'Robotics', value: 19 },
  { name: 'Data Tools', value: 15 },
  { name: 'Other', value: 10 },
];

const COLORS = ['#22d3ee', '#818cf8', '#a78bfa', '#34d399', '#f59e0b'];

const DomainDistributionChart = () => {
  return (
    <section className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-card">
      <h2 className="mb-4 text-lg font-semibold text-slate-100">Domain Distribution</h2>
      <div className="h-72 rounded-xl bg-slate-900/40 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={domainData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={96}
              paddingAngle={3}
            >
              {domainData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `${value}%`}
              contentStyle={{
                border: '1px solid #334155',
                borderRadius: '0.75rem',
                backgroundColor: '#0f172acc',
                color: '#e2e8f0',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        {domainData.map((domain, index) => (
          <div key={domain.name} className="flex items-center gap-2 text-slate-300">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span>{domain.name}</span>
            <span className="ml-auto text-dashboard-muted">{domain.value}%</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DomainDistributionChart;
