import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ScrollToTopButton from './components/ScrollToTopButton';
import DashboardPage from './pages/DashboardPage';
import CompaniesPage from './pages/CompaniesPage';
import DomainsPage from './pages/DomainsPage';
import InsightsPage from './pages/InsightsPage';
import AskAIPage from './pages/AskAIPage';
import SettingsPage from './pages/SettingsPage';
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

  const activeContent = useMemo(() => {
    switch (activeSection) {
      case 'Companies':
        return <CompaniesPage compactMode={compactMode} companies={intelligenceData.companies} />;
      case 'Domains':
        return <DomainsPage compactMode={compactMode} domains={intelligenceData.domains} />;
      case 'Insights':
        return <InsightsPage compactMode={compactMode} insights={intelligenceData.insights} />;
      case 'Ask AI':
        return (
          <AskAIPage
            compactMode={compactMode}
            companies={intelligenceData.companies}
            onNavigate={setActiveSection}
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
            data={intelligenceData}
          />
        );
    }
  }, [activeSection, appSettings, chartAnimations, compactMode, intelligenceData]);

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
    </div>
  );
};

export default App;
