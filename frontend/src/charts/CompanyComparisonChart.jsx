import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import SectionHeading from '../components/SectionHeading';

const companyData = [
  { company: 'OpenAI', valuation: 86, employees: 3500 },
  { company: 'Anthropic', valuation: 38, employees: 1500 },
  { company: 'Databricks', valuation: 43, employees: 7000 },
  { company: 'Cohere', valuation: 12, employees: 900 },
  { company: 'Hugging Face', valuation: 5, employees: 400 },
];

const CompanyComparisonChart = ({ chartAnimations }) => {
  return (
    <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
      <SectionHeading title="Company Comparison" subtitle="Mock valuation data (USD billions)" />
      <div className="h-80 rounded-xl bg-theme-chart p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={companyData} margin={{ top: 12, right: 16, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-grid)" />
            <XAxis dataKey="company" stroke="var(--theme-muted)" tickLine={false} axisLine={false} />
            <YAxis stroke="var(--theme-muted)" tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(value) => [`$${value}B`, 'Valuation']}
              contentStyle={{
                border: '1px solid var(--theme-border)',
                borderRadius: '0.75rem',
                backgroundColor: 'var(--theme-tooltip)',
                color: 'var(--theme-primary)',
              }}
              cursor={{ fill: 'var(--theme-grid-fade)' }}
            />
            <Bar isAnimationActive={chartAnimations} dataKey="valuation" radius={[8, 8, 0, 0]} fill="var(--theme-purple)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default CompanyComparisonChart;
