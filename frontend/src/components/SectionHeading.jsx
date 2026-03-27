const SectionHeading = ({ title, subtitle, action }) => {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-theme-accent">Analytics</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-theme-primary">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-theme-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
};

export default SectionHeading;
