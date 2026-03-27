import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const companyData = [
  { company: 'OpenAI', valuation: 86, employees: 3500 },
  { company: 'Anthropic', valuation: 38, employees: 1500 },
  { company: 'Databricks', valuation: 43, employees: 7000 },
  { company: 'Cohere', valuation: 12, employees: 900 },
  { company: 'Hugging Face', valuation: 5, employees: 400 },
];

const CompanyComparisonChart = () => {
  return (
    <section className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-card">
      <h2 className="mb-4 text-lg font-semibold text-slate-100">Company Comparison</h2>
      <p className="mb-4 text-sm text-dashboard-muted">Mock valuation data (USD billions)</p>
      <div className="h-80 rounded-xl bg-slate-900/40 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={companyData} margin={{ top: 12, right: 16, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="company" stroke="#94a3b8" tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(value) => [`$${value}B`, 'Valuation']}
              contentStyle={{
                border: '1px solid #334155',
                borderRadius: '0.75rem',
                backgroundColor: '#0f172acc',
                color: '#e2e8f0',
              }}
              cursor={{ fill: '#1e293b88' }}
            />
            <Bar dataKey="valuation" radius={[8, 8, 0, 0]} fill="#818cf8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default CompanyComparisonChart;
