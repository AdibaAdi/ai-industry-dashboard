import DomainDistributionChart from '../charts/DomainDistributionChart';
import GrowthChart from '../charts/GrowthChart';
import CompanyComparisonChart from '../charts/CompanyComparisonChart';
import CompanyTable from '../components/CompanyTable';
import KPICards from '../components/KPICards';

const DashboardPage = ({ onOpenCompanies, chartAnimations, compactMode }) => {
  return (
    <main className={`space-y-6 p-6 ${compactMode ? 'space-y-4 p-4' : ''}`}>
      <KPICards />
      <section className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <GrowthChart chartAnimations={chartAnimations} />
        </div>
        <div>
          <DomainDistributionChart chartAnimations={chartAnimations} />
        </div>
      </section>
      <CompanyComparisonChart chartAnimations={chartAnimations} />
      <CompanyTable onViewAll={onOpenCompanies} />
    </main>
  );
};

export default DashboardPage;
