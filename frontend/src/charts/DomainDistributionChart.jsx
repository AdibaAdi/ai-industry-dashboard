import { useCallback, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from 'recharts';
import SectionHeading from '../components/SectionHeading';

const COLORS = ['#00E5FF', '#7C83FF', '#FF74D4', '#2DD4BF', '#F9C74F', '#A78BFA', '#F97316'];

const DomainTooltipContent = ({ active, payload, coordinate, viewBox }) => {
  if (!active || !payload?.length) return null;

  const [entry] = payload;
  const label = entry?.name ?? '';
  const value = entry?.value ?? 0;
  const color = entry?.color ?? '#00E5FF';

  const centerX = (viewBox?.x ?? 0) + (viewBox?.width ?? 0) / 2;
  const centerY = (viewBox?.y ?? 0) + (viewBox?.height ?? 0) / 2;
  const isNearCenter =
    coordinate &&
    Math.abs((coordinate.x ?? 0) - centerX) < 56 &&
    Math.abs((coordinate.y ?? 0) - centerY) < 56;

  const translateX = isNearCenter && coordinate?.x >= centerX ? 12 : 0;
  const translateY = isNearCenter ? -12 : 0;

  return (
    <div
      className="domain-tooltip"
      style={{
        transform: `translate(${translateX}px, ${translateY}px)`,
      }}
    >
      <div className="domain-tooltip-inner">
        <div className="mb-1 flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm font-medium text-theme-secondary">{label}</span>
        </div>
        <div className="text-base font-semibold text-theme-primary">{value} companies</div>
      </div>
    </div>
  );
};

const renderActiveShape = ({ outerRadius, ...shapeProps }) => (
  <Sector
    {...shapeProps}
    outerRadius={outerRadius + 6}
    stroke="var(--theme-domain-active-stroke)"
    strokeWidth={3}
    style={{
      filter: 'drop-shadow(var(--theme-domain-active-shadow))',
      transition: 'all 200ms ease',
    }}
  />
);

const DomainDistributionChart = ({ chartAnimations, domainData }) => {
  const [activeIndex, setActiveIndex] = useState(-1);

  const handleSliceEnter = useCallback((_, index) => {
    setActiveIndex(index);
  }, []);

  const handleSliceLeave = useCallback(() => {
    setActiveIndex(-1);
  }, []);

  return (
    <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
      <SectionHeading title="Domain Distribution" subtitle="Share of tracked companies by strategic category" />
      <div className="h-72 rounded-xl bg-theme-chart p-3">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              isAnimationActive={chartAnimations}
              animationDuration={420}
              animationEasing="ease-out"
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
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={handleSliceEnter}
              onMouseLeave={handleSliceLeave}
            >
              {domainData.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={activeIndex === -1 || activeIndex === index ? 1 : 0.45}
                  style={{
                    transition: 'fill-opacity 220ms ease, filter 220ms ease',
                    filter: activeIndex === index ? 'drop-shadow(var(--theme-domain-cell-hover-shadow))' : 'none',
                  }}
                />
              ))}
            </Pie>
            <Tooltip
              cursor={false}
              offset={16}
              content={<DomainTooltipContent />}
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
