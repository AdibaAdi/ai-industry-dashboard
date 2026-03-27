import { useState } from 'react';
import DomainDistributionChart from '../charts/DomainDistributionChart';
import GrowthChart from '../charts/GrowthChart';
import CompanyComparisonChart from '../charts/CompanyComparisonChart';
import CompanyTable from '../components/CompanyTable';
import KPICards from '../components/KPICards';
import ScoringHowItWorksModal from '../components/ScoringHowItWorksModal';

const DashboardPage = ({ onOpenCompanies, onOpenCompany, chartAnimations, compactMode, data }) => {
  const [showScoringModal, setShowScoringModal] = useState(false);

  return (
    <main className={`space-y-6 p-6 ${compactMode ? 'space-y-4 p-4' : ''}`}>
      <section className="rounded-2xl border border-theme-border bg-theme-card p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-theme-primary">Need context on the scorecards?</p>
            <p className="text-xs text-theme-muted">Open the transparency panel for definitions, intent, and weighted breakdowns.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowScoringModal(true)}
            className="rounded-lg border border-theme-border bg-theme-chart px-4 py-2 text-sm font-medium text-theme-accent transition hover:border-theme-accent hover:text-theme-primary"
          >
            How scoring works
          </button>
        </div>
      </section>

      <KPICards kpis={data.kpis} loading={data.loading} />
      <section className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <GrowthChart chartAnimations={chartAnimations} growthData={data.growthTrendData} />
        </div>
        <div>
          <DomainDistributionChart chartAnimations={chartAnimations} domainData={data.domainChartData} />
        </div>
      </section>
      <CompanyComparisonChart chartAnimations={chartAnimations} companyData={data.companyComparisonData} />
      <CompanyTable companies={data.topCompanies} onViewAll={onOpenCompanies} onOpenCompany={onOpenCompany} />

      <ScoringHowItWorksModal
        isOpen={showScoringModal}
        onClose={() => setShowScoringModal(false)}
        scoreKeys={['growth', 'influence', 'power', 'investor']}
      />
    </main>
  );
};

export default DashboardPage;
