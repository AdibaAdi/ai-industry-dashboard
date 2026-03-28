import SectionHeading from './SectionHeading';
import ConfidenceBadge from './ConfidenceBadge';

const CompanyTable = ({ companies, onViewAll, onOpenCompany }) => {
  return (
    <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
      <SectionHeading
        title="Top Companies"
        action={
          <button
            type="button"
            onClick={onViewAll}
            className="text-sm font-medium text-theme-accent transition hover:text-theme-primary"
          >
            View all
          </button>
        }
      />
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-theme-border text-left text-theme-muted">
              <th className="pb-3 font-medium">Company</th>
              <th className="pb-3 font-medium">Domain</th>
              <th className="pb-3 font-medium">Influence</th>
              <th className="pb-3 font-medium">Growth</th>
              <th className="pb-3 font-medium">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr
                key={company.id}
                className="cursor-pointer border-b border-theme-border text-theme-secondary transition hover:bg-theme-surface/50 last:border-b-0"
                onClick={() => onOpenCompany?.(company.id, 'Dashboard · Top companies')}
              >
                <td className="py-3 font-medium text-theme-primary">{company.name}</td>
                <td className="py-3">{company.domain}</td>
                <td className="py-3">{company.score.toFixed(1)}</td>
                <td className="py-3 text-emerald-400">
                  {typeof company.growth_score === 'number' ? company.growth_score.toFixed(1) : 'N/A'}
                </td>
                <td className="py-3">
                  <ConfidenceBadge
                    score={company.confidence_score}
                    sources={company.sources}
                    lastUpdated={company.last_updated}
                    compact
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default CompanyTable;
