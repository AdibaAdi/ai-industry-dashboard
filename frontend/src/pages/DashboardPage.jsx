import DomainDistributionChart from '../charts/DomainDistributionChart';
import GrowthChart from '../charts/GrowthChart';
import CompanyComparisonChart from '../charts/CompanyComparisonChart';
import CompanyTable from '../components/CompanyTable';
import KPICards from '../components/KPICards';

const DashboardPage = ({ onOpenCompanies, onOpenCompany, chartAnimations, compactMode, data }) => {
  return (
    <main className={`space-y-6 p-6 ${compactMode ? 'space-y-4 p-4' : ''}`}>
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
    </main>
  );
};

export default DashboardPage;
