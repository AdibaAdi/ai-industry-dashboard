import { useMemo, useState } from 'react';
import SectionHeading from '../components/SectionHeading';

const sortOptions = [
  { key: 'growth_score-desc', label: 'Growth: High to low' },
  { key: 'growth_score-asc', label: 'Growth: Low to high' },
  { key: 'influence_score-desc', label: 'Influence: High to low' },
  { key: 'influence_score-asc', label: 'Influence: Low to high' },
  { key: 'power_score-desc', label: 'Power: High to low' },
];

const CompaniesPage = ({ compactMode, companies, onOpenCompany }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('All domains');
  const [sortBy, setSortBy] = useState(sortOptions[0].key);

  const domains = useMemo(
    () => ['All domains', ...new Set(companies.map((company) => company.domain))],
    [companies],
  );

  const filteredCompanies = useMemo(() => {
    const [field, direction] = sortBy.split('-');

    return companies
      .filter((company) => company.name.toLowerCase().includes(searchTerm.toLowerCase().trim()))
      .filter((company) => (domainFilter === 'All domains' ? true : company.domain === domainFilter))
      .sort((a, b) => (direction === 'desc' ? b[field] - a[field] : a[field] - b[field]));
  }, [companies, domainFilter, searchTerm, sortBy]);

  return (
    <main className={`space-y-6 p-6 ${compactMode ? 'space-y-4 p-4' : ''}`}>
      <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
        <SectionHeading
          title="Companies"
          subtitle="Search, segment, and benchmark high-momentum AI companies across domains."
        />

        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm text-theme-muted">
            Search
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by company name"
              className="mt-1 w-full rounded-lg border border-theme-border bg-theme-chart px-3 py-2 text-theme-primary outline-none ring-theme-accent/50 focus:ring"
            />
          </label>
          <label className="text-sm text-theme-muted">
            Domain
            <select
              value={domainFilter}
              onChange={(event) => setDomainFilter(event.target.value)}
              className="mt-1 w-full rounded-lg border border-theme-border bg-theme-chart px-3 py-2 text-theme-primary outline-none ring-theme-accent/50 focus:ring"
            >
              {domains.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-theme-muted">
            Sort by
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="mt-1 w-full rounded-lg border border-theme-border bg-theme-chart px-3 py-2 text-theme-primary outline-none ring-theme-accent/50 focus:ring"
            >
              {sortOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-theme-border bg-theme-card p-5 shadow-card">
        <p className="mb-3 text-sm text-theme-muted">
          Showing <span className="font-semibold text-theme-primary">{filteredCompanies.length}</span> companies
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-theme-border text-left text-theme-muted">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Domain</th>
                <th className="pb-3 font-medium">Growth Score</th>
                <th className="pb-3 font-medium">Influence Score</th>
                <th className="pb-3 font-medium">Power Score</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => (
                <tr
                  key={company.id}
                  className="cursor-pointer border-b border-theme-border text-theme-secondary transition hover:bg-theme-surface/50 last:border-b-0"
                  onClick={() => onOpenCompany?.(company.id, 'Companies table')}
                >
                  <td className="py-3 font-medium text-theme-primary">{company.name}</td>
                  <td className="py-3">{company.domain}</td>
                  <td className="py-3 text-emerald-400">{company.growth_score.toFixed(1)}</td>
                  <td className="py-3 text-cyan-400">{company.influence_score.toFixed(1)}</td>
                  <td className="py-3 text-theme-primary">{company.power_score.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default CompaniesPage;
