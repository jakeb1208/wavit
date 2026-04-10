import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, Component, ReactNode } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import AboutPage from './pages/AboutPage';
import JoinPage from './pages/JoinPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import RegisterPage from './pages/RegisterPage';
import SuperAdminPage from './pages/SuperAdminPage';
import BannerAd from './components/BannerAd';
import { useQueueStore } from './store/queueStore';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', background: '#fff', minHeight: '100vh' }}>
          <h1 style={{ color: '#dc2626', fontSize: '24px', marginBottom: '12px' }}>Something went wrong</h1>
          <pre style={{ background: '#f3f4f6', padding: '16px', borderRadius: '8px', fontSize: '13px', overflowX: 'auto', whiteSpace: 'pre-wrap', color: '#111' }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const fetchShops = useQueueStore(s => s.fetchShops);

  // Fetch shops on mount and poll every 5 seconds
  useEffect(() => {
    fetchShops();
    const interval = setInterval(fetchShops, 5000);
    return () => clearInterval(interval);
  }, [fetchShops]);

  return (
    <Routes>
      {/* No-navbar routes */}
      <Route path="/admin/:shopId/:secret" element={<AdminPage />} />
      <Route path="/superadmin/:secret" element={<SuperAdminPage />} />

      {/* Public app — with navbar + banner ad */}
      <Route path="*" element={
        <>
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/join/:shopId" element={<JoinPage />} />
            <Route path="/queue/:shopId/:ticketId" element={<DashboardPage />} />
          </Routes>
          <BannerAd />
        </>
      } />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
