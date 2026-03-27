import { scoreDefinitions } from './scoreInfo';

const ScoreInfoTooltip = ({ scoreKey }) => {
  const score = scoreDefinitions[scoreKey];

  if (!score) return null;

  return (
    <span className="group relative inline-flex items-center">
      <button
        type="button"
        aria-label={`Learn more about ${score.name}`}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-theme-border text-[0.65rem] font-semibold text-theme-muted transition hover:border-theme-accent hover:text-theme-accent"
      >
        i
      </button>
      <span className="pointer-events-none absolute left-1/2 top-6 z-20 hidden w-72 -translate-x-1/2 rounded-xl border border-theme-border bg-theme-chart p-3 text-left text-xs text-theme-secondary shadow-card group-hover:block group-focus-within:block">
        <span className="block font-semibold text-theme-primary">{score.name}</span>
        <span className="mt-1 block text-theme-muted">{score.shortExplanation}</span>
      </span>
    </span>
  );
};

export default ScoreInfoTooltip;
