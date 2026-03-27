import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ScrollToTopButton from './components/ScrollToTopButton';
import DashboardPage from './pages/DashboardPage';
import CompaniesPage from './pages/CompaniesPage';
import DomainsPage from './pages/DomainsPage';
import InsightsPage from './pages/InsightsPage';
import AskAIPage from './pages/AskAIPage';
import InvestorModePage from './pages/InvestorModePage';
import SettingsPage from './pages/SettingsPage';
import CompanyDetailDrawer from './components/CompanyDetailDrawer';
import { useDashboardData } from './hooks/useDashboardData';

const readPref = (key, fallback) => {
  const value = localStorage.getItem(key);
  return value === null ? fallback : value === 'true';
};

const App = () => {
  const [activeSection, setActiveSection] = useState('Dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('aid-theme') || 'dark');
  const [compactMode, setCompactMode] = useState(() => readPref('aid-compact-mode', false));
  const [chartAnimations, setChartAnimations] = useState(() => readPref('aid-chart-animations', true));
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => readPref('aid-notifications', true));
  const intelligenceData = useDashboardData();
  const [activeCompanyDetail, setActiveCompanyDetail] = useState(null);

  useEffect(() => {
    localStorage.setItem('aid-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('aid-compact-mode', String(compactMode));
  }, [compactMode]);

  useEffect(() => {
    localStorage.setItem('aid-chart-animations', String(chartAnimations));
  }, [chartAnimations]);

  useEffect(() => {
    localStorage.setItem('aid-notifications', String(notificationsEnabled));
  }, [notificationsEnabled]);

  const appSettings = useMemo(
    () => ({
      theme,
      setTheme,
      compactMode,
      setCompactMode,
      chartAnimations,
      setChartAnimations,
      notificationsEnabled,
      setNotificationsEnabled,
    }),
    [theme, compactMode, chartAnimations, notificationsEnabled],
  );

  const openCompanyDetail = useCallback((companyId, contextLabel) => {
    setActiveCompanyDetail({ id: companyId, contextLabel });
  }, []);

  const activeContent = useMemo(() => {
    switch (activeSection) {
      case 'Companies':
        return (
          <CompaniesPage
            compactMode={compactMode}
            companies={intelligenceData.companies}
            onOpenCompany={openCompanyDetail}
          />
        );
      case 'Domains':
        return <DomainsPage compactMode={compactMode} domains={intelligenceData.domains} />;
      case 'Insights':
        return <InsightsPage compactMode={compactMode} insights={intelligenceData.insights} />;
      case 'Investor Mode':
        return (
          <InvestorModePage
            compactMode={compactMode}
            investorMode={intelligenceData.investorMode}
            loading={intelligenceData.loading}
            onOpenCompany={openCompanyDetail}
          />
        );
      case 'Ask AI':
        return (
          <AskAIPage
            compactMode={compactMode}
            companies={intelligenceData.companies}
            onNavigate={setActiveSection}
            onOpenCompany={openCompanyDetail}
          />
        );
      case 'Settings':
        return <SettingsPage settings={appSettings} compactMode={compactMode} />;
      case 'Dashboard':
      default:
        return (
          <DashboardPage
            compactMode={compactMode}
            chartAnimations={chartAnimations}
            onOpenCompanies={() => setActiveSection('Companies')}
            onOpenCompany={openCompanyDetail}
            data={intelligenceData}
          />
        );
    }
  }, [activeSection, appSettings, chartAnimations, compactMode, intelligenceData, openCompanyDetail]);

  return (
    <div className={`app-shell min-h-screen ${theme === 'light' ? 'theme-light' : 'theme-dark'}`}>
      <Header theme={theme} onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))} />
      <div className="mx-auto flex w-full max-w-7xl">
        <Sidebar activeItem={activeSection} onSelectItem={setActiveSection} />
        <div className={`flex-1 ${compactMode ? 'compact-mode' : ''}`}>
          {intelligenceData.error ? (
            <div className="m-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">
              Failed to load API data: {intelligenceData.error}
            </div>
          ) : null}
          {activeContent}
        </div>
      </div>
      <ScrollToTopButton />

      {activeCompanyDetail ? (
        <CompanyDetailDrawer
          companyId={activeCompanyDetail.id}
          contextLabel={activeCompanyDetail.contextLabel}
          onClose={() => setActiveCompanyDetail(null)}
          onNavigateCompanies={() => setActiveSection('Companies')}
        />
      ) : null}
    </div>
  );
};

export default App;
