import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const growthData = [
  { month: 'Jan', startups: 120 },
  { month: 'Feb', startups: 138 },
  { month: 'Mar', startups: 146 },
  { month: 'Apr', startups: 172 },
  { month: 'May', startups: 188 },
  { month: 'Jun', startups: 205 },
  { month: 'Jul', startups: 226 },
];

const GrowthChart = () => {
  return (
    <section className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-card">
      <h2 className="mb-4 text-lg font-semibold text-slate-100">Growth Trend</h2>
      <div className="h-72 rounded-xl bg-slate-900/40 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={growthData} margin={{ top: 16, right: 18, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                border: '1px solid #334155',
                borderRadius: '0.75rem',
                backgroundColor: '#0f172acc',
                color: '#e2e8f0',
              }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Line
              type="monotone"
              dataKey="startups"
              stroke="#22d3ee"
              strokeWidth={3}
              dot={{ r: 4, fill: '#22d3ee' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default GrowthChart;
