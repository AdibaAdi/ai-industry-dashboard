import DomainDistributionChart from '../charts/DomainDistributionChart';
import GrowthChart from '../charts/GrowthChart';
import CompanyComparisonChart from '../charts/CompanyComparisonChart';
import CompanyTable from '../components/CompanyTable';
import KPICards from '../components/KPICards';

const DashboardPage = () => {
  return (
    <main className="flex-1 space-y-6 p-6">
      <KPICards />
      <section className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <GrowthChart />
        </div>
        <div>
          <DomainDistributionChart />
        </div>
      </section>
      <CompanyComparisonChart />
      <CompanyTable />
    </main>
  );
};

export default DashboardPage;
