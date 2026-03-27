const GrowthChart = () => {
  const points = [20, 28, 26, 35, 44, 40, 52];

  return (
    <section className="rounded-2xl border border-dashboard-border bg-dashboard-card p-5 shadow-card">
      <h2 className="mb-4 text-lg font-semibold text-slate-100">Growth Trend</h2>
      <div className="flex h-52 items-end gap-3 rounded-xl bg-slate-900/40 p-4">
        {points.map((point, index) => (
          <div key={index} className="group flex flex-1 flex-col items-center justify-end gap-2">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-cyan-500 to-indigo-400 transition group-hover:from-cyan-400"
              style={{ height: `${point * 3}px` }}
            />
            <span className="text-xs text-dashboard-muted">W{index + 1}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default GrowthChart;
