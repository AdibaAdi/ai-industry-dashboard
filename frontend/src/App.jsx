import { useMemo, useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import CompaniesPage from './pages/CompaniesPage';
import DomainsPage from './pages/DomainsPage';
import InsightsPage from './pages/InsightsPage';
import SettingsPage from './pages/SettingsPage';

const App = () => {
  const [activeSection, setActiveSection] = useState('Dashboard');

  const activeContent = useMemo(() => {
    switch (activeSection) {
      case 'Companies':
        return <CompaniesPage />;
      case 'Domains':
        return <DomainsPage />;
      case 'Insights':
        return <InsightsPage />;
      case 'Settings':
        return <SettingsPage />;
      case 'Dashboard':
      default:
        return <DashboardPage />;
    }
  }, [activeSection]);

  return (
    <div className="min-h-screen bg-dashboard-bg text-slate-100">
      <Header />
      <div className="mx-auto flex w-full max-w-7xl">
        <Sidebar activeItem={activeSection} onSelectItem={setActiveSection} />
        {activeContent}
      </div>
    </div>
  );
};

export default App;
