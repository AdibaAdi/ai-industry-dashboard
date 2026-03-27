import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import SectionHeading from '../components/SectionHeading';

const COLORS = ['#00E5FF', '#7C83FF', '#FF74D4', '#2DD4BF', '#F9C74F', '#A78BFA', '#F97316'];

const DomainDistributionChart = ({ chartAnimations, domainData }) => {
  return (
    <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
      <SectionHeading title="Domain Distribution" subtitle="Share of tracked companies by strategic category" />
      <div className="h-72 rounded-xl bg-theme-chart p-3">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              isAnimationActive={chartAnimations}
              data={domainData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={96}
              paddingAngle={3}
              stroke="var(--theme-chart)"
              strokeWidth={2}
            >
              {domainData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `${value} companies`}
              contentStyle={{
                border: '1px solid var(--theme-border)',
                borderRadius: '0.75rem',
                backgroundColor: 'var(--theme-tooltip)',
                color: 'var(--theme-primary)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        {domainData.map((domain, index) => (
          <div key={domain.name} className="flex items-center gap-2 text-theme-secondary">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
            <span>{domain.name}</span>
            <span className="ml-auto text-theme-muted">{domain.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DomainDistributionChart;
