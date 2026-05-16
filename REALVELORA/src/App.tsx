import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, Component, ReactNode } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BottomTabBar from './components/BottomTabBar';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import AboutPage from './pages/AboutPage';
import JoinPage from './pages/JoinPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import SuperAdminPage from './pages/SuperAdminPage';
import SuperAdminLoginPage from './pages/SuperAdminLoginPage';
import ForgotPinPage from './pages/ForgotPinPage';
import ResetPinPage from './pages/ResetPinPage';
import HowToUsePage from './pages/HowToUsePage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import BannerAd from './components/BannerAd';
import { useQueueStore } from './store/queueStore';
import { isNative } from './lib/platform';

const AMBIENT_PARTICLES = [
  { left: '8%',  top: '22%', size: 2,   color: 'rgba(96,165,250,0.55)',  delay: '0s',    dur: '8s'  },
  { left: '18%', top: '58%', size: 1.5, color: 'rgba(167,139,250,0.5)', delay: '-2.5s', dur: '11s' },
  { left: '33%', top: '38%', size: 2,   color: 'rgba(6,182,212,0.5)',   delay: '-5s',   dur: '7s'  },
  { left: '50%', top: '14%', size: 1,   color: 'rgba(96,165,250,0.4)',  delay: '-1.2s', dur: '12s' },
  { left: '62%', top: '68%', size: 2,   color: 'rgba(139,92,246,0.5)',  delay: '-3.5s', dur: '9s'  },
  { left: '74%', top: '33%', size: 1.5, color: 'rgba(6,182,212,0.4)',   delay: '-7s',   dur: '8s'  },
  { left: '87%', top: '52%', size: 1,   color: 'rgba(96,165,250,0.5)',  delay: '-4.5s', dur: '13s' },
  { left: '44%', top: '78%', size: 2,   color: 'rgba(167,139,250,0.4)', delay: '-6s',   dur: '10s' },
  { left: '91%', top: '24%', size: 1.5, color: 'rgba(59,130,246,0.4)',  delay: '-9s',   dur: '11s' },
  { left: '5%',  top: '72%', size: 1,   color: 'rgba(139,92,246,0.45)', delay: '-2.8s', dur: '9s'  },
  { left: '26%', top: '88%', size: 1.5, color: 'rgba(6,182,212,0.35)',  delay: '-0.8s', dur: '14s' },
  { left: '70%', top: '10%', size: 1,   color: 'rgba(167,139,250,0.4)', delay: '-5.5s', dur: '10s' },
];

function AmbientBackground() {
  return (
    <>
      <div className="gbl-blob gbl-blob-1" />
      <div className="gbl-blob gbl-blob-2" />
      <div className="gbl-blob gbl-blob-3" />
      {AMBIENT_PARTICLES.map((p, i) => (
        <div
          key={i}
          className="gbl-particle"
          style={{
            left: p.left, top: p.top,
            width: `${p.size}px`, height: `${p.size}px`,
            background: p.color,
            boxShadow: `0 0 ${p.size * 4}px ${p.color}`,
            animationDelay: p.delay, animationDuration: p.dur,
          }}
        />
      ))}
    </>
  );
}

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
  const native = isNative();

  useEffect(() => {
    fetchShops();
    const interval = setInterval(fetchShops, 5000);
    return () => clearInterval(interval);
  }, [fetchShops]);

  useEffect(() => {
    if (native) {
      document.body.classList.add('native-app');
      document.documentElement.style.background = '#070b14';
    } else {
      document.body.classList.remove('native-app');
      document.documentElement.style.background = '';
    }
    return () => {
      document.body.classList.remove('native-app');
      document.documentElement.style.background = '';
    };
  }, [native]);

  return (
    <Routes>
      {/* No-navbar routes */}
      <Route path="/admin/:shopId" element={<AdminPage />} />
      <Route path="/superadmin" element={<SuperAdminPage />} />
      <Route path="/superadmin-login" element={<SuperAdminLoginPage />} />

      {/* Public app */}
      <Route path="*" element={
        <>
          {!native && <AmbientBackground />}
          {/* Top navbar — hidden on native (uses bottom tab bar instead) */}
          <Navbar />

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-pin" element={<ForgotPinPage />} />
            <Route path="/reset-pin" element={<ResetPinPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/join/:shopId" element={<JoinPage />} />
            <Route path="/queue/:shopId/:ticketId" element={<DashboardPage />} />
            <Route path="/how-to-use" element={<HowToUsePage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
          </Routes>

          {/* Footer — hidden on native apps */}
          {!native && <Footer />}

          {/* Bottom tab bar — only visible on iOS / Android */}
          <BottomTabBar />

          {/* Banner ad — only on web */}
          {!native && <BannerAd />}
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
