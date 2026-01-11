import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TradingPage from './pages/TradingPage';
import PortfolioPage from './pages/PortfolioPage';
import MarketsPage from './pages/MarketsPage';
import AIInsightsPage from './pages/AIInsightsPage';
import StakingPage from './pages/StakingPage';
import MiningPage from './pages/MiningPage';
import PremiumPage from './pages/PremiumPage';
import ProfilePage from './pages/ProfilePage';
import TransparencyPage from './pages/TransparencyPage';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Public Transparency Page - No auth required */}
      <Route path="/transparency" element={<TransparencyPage />} />
      
      <Route
        path="/"
        element={
          isAuthenticated ? <Layout /> : <Navigate to="/login" replace />
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="trade/:symbol?" element={<TradingPage />} />
        <Route path="portfolio" element={<PortfolioPage />} />
        <Route path="markets" element={<MarketsPage />} />
        <Route path="staking" element={<StakingPage />} />
        <Route path="mining" element={<MiningPage />} />          <Route path="/premium" element={<PremiumPage />} />        <Route path="ai-insights" element={<AIInsightsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
