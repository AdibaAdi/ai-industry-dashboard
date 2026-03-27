import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';

const App = () => {
  return (
    <div className="min-h-screen bg-dashboard-bg text-slate-100">
      <Header />
      <div className="mx-auto flex w-full max-w-7xl">
        <Sidebar />
        <DashboardPage />
      </div>
    </div>
  );
};

export default App;
