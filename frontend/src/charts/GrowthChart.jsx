import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import SectionHeading from '../components/SectionHeading';

const growthData = [
  { month: 'Jan', startups: 120 },
  { month: 'Feb', startups: 138 },
  { month: 'Mar', startups: 146 },
  { month: 'Apr', startups: 172 },
  { month: 'May', startups: 188 },
  { month: 'Jun', startups: 205 },
  { month: 'Jul', startups: 226 },
];

const GrowthChart = ({ chartAnimations }) => {
  return (
    <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
      <SectionHeading title="Growth Trend" subtitle="Monthly tracked startup velocity across the sector" />
      <div className="h-72 rounded-xl bg-theme-chart p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={growthData} margin={{ top: 16, right: 18, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-grid)" />
            <XAxis dataKey="month" stroke="var(--theme-muted)" tickLine={false} axisLine={false} />
            <YAxis stroke="var(--theme-muted)" tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                border: '1px solid var(--theme-border)',
                borderRadius: '0.75rem',
                backgroundColor: 'var(--theme-tooltip)',
                color: 'var(--theme-primary)',
              }}
              labelStyle={{ color: 'var(--theme-primary)' }}
            />
            <Line
              isAnimationActive={chartAnimations}
              type="monotone"
              dataKey="startups"
              stroke="var(--theme-accent)"
              strokeWidth={3}
              dot={{ r: 4, fill: 'var(--theme-accent)' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default GrowthChart;
