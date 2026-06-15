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
import WebDevPage from './pages/WebDevPage';
import ShopProfilePage from './pages/ShopProfilePage';
import WidgetPage from './pages/WidgetPage';
import FounderNetworkPage from './pages/FounderNetworkPage';
import { useQueueStore } from './store/queueStore';
import { isNative } from './lib/platform';

/* ── Particle definitions ─────────────────────────────────────────── */
type ParticleAnim = 'rise' | 'left' | 'right' | 'wave' | 'orb';

interface Particle {
  left: string; top: string; size: number;
  color: string; delay: string; dur: string; type: ParticleAnim;
}

const PARTICLES: Particle[] = [
  /* Electric blue — rise */
  { left:'5%',  top:'78%', size:2.5, color:'rgba(59,130,246,0.75)',  delay:'0s',     dur:'9s',  type:'rise'  },
  { left:'14%', top:'55%', size:1.5, color:'rgba(96,165,250,0.65)',  delay:'-3.2s',  dur:'12s', type:'rise'  },
  { left:'23%', top:'35%', size:3,   color:'rgba(59,130,246,0.6)',   delay:'-6s',    dur:'8s',  type:'rise'  },
  { left:'37%', top:'82%', size:2,   color:'rgba(96,165,250,0.7)',   delay:'-1.5s',  dur:'10s', type:'rise'  },
  { left:'51%', top:'60%', size:1.5, color:'rgba(59,130,246,0.55)',  delay:'-8s',    dur:'14s', type:'rise'  },
  { left:'65%', top:'40%', size:2.5, color:'rgba(96,165,250,0.65)',  delay:'-4s',    dur:'9s',  type:'rise'  },
  { left:'79%', top:'72%', size:2,   color:'rgba(59,130,246,0.7)',   delay:'-2.5s',  dur:'11s', type:'rise'  },
  { left:'91%', top:'30%', size:1.5, color:'rgba(96,165,250,0.6)',   delay:'-7s',    dur:'13s', type:'rise'  },
  /* Soft purple — drift left */
  { left:'10%', top:'25%', size:2,   color:'rgba(139,92,246,0.65)',  delay:'-1s',    dur:'10s', type:'left'  },
  { left:'29%', top:'65%', size:3,   color:'rgba(167,139,250,0.6)',  delay:'-5.5s',  dur:'8s',  type:'left'  },
  { left:'47%', top:'18%', size:1.5, color:'rgba(139,92,246,0.7)',   delay:'-9s',    dur:'12s', type:'left'  },
  { left:'68%', top:'85%', size:2.5, color:'rgba(167,139,250,0.55)', delay:'-3s',    dur:'9s',  type:'left'  },
  { left:'84%', top:'48%', size:2,   color:'rgba(139,92,246,0.65)',  delay:'-6.5s',  dur:'11s', type:'left'  },
  /* Cyan — drift right */
  { left:'7%',  top:'42%', size:2,   color:'rgba(6,182,212,0.65)',   delay:'-2s',    dur:'11s', type:'right' },
  { left:'21%', top:'88%', size:1.5, color:'rgba(34,211,238,0.6)',   delay:'-7.5s',  dur:'8s',  type:'right' },
  { left:'42%', top:'52%', size:2.5, color:'rgba(6,182,212,0.7)',    delay:'-4.5s',  dur:'10s', type:'right' },
  { left:'58%', top:'25%', size:2,   color:'rgba(34,211,238,0.55)',  delay:'-0.5s',  dur:'13s', type:'right' },
  { left:'76%', top:'62%', size:1.5, color:'rgba(6,182,212,0.65)',   delay:'-8.5s',  dur:'9s',  type:'right' },
  { left:'94%', top:'15%', size:2,   color:'rgba(34,211,238,0.6)',   delay:'-3.8s',  dur:'12s', type:'right' },
  /* White highlights — wave */
  { left:'18%', top:'14%', size:1,   color:'rgba(255,255,255,0.5)',  delay:'-1.8s',  dur:'10s', type:'wave'  },
  { left:'55%', top:'92%', size:1,   color:'rgba(255,255,255,0.45)', delay:'-5s',    dur:'13s', type:'wave'  },
  { left:'82%', top:'38%', size:1,   color:'rgba(255,255,255,0.5)',  delay:'-9.5s',  dur:'9s',  type:'wave'  },
  { left:'33%', top:'7%',  size:1,   color:'rgba(255,255,255,0.4)',  delay:'-2.8s',  dur:'11s', type:'wave'  },
  { left:'71%', top:'78%', size:1,   color:'rgba(255,255,255,0.45)', delay:'-6.8s',  dur:'8s',  type:'wave'  },
  /* Large orbs — slow float */
  { left:'12%', top:'30%', size:5,   color:'rgba(59,130,246,0.22)',  delay:'0s',     dur:'18s', type:'orb'   },
  { left:'60%', top:'10%', size:6,   color:'rgba(139,92,246,0.18)',  delay:'-8s',    dur:'22s', type:'orb'   },
  { left:'85%', top:'65%', size:4,   color:'rgba(6,182,212,0.2)',    delay:'-4s',    dur:'16s', type:'orb'   },
  { left:'40%', top:'75%', size:5,   color:'rgba(96,165,250,0.18)',  delay:'-12s',   dur:'20s', type:'orb'   },
  { left:'25%', top:'50%', size:4,   color:'rgba(167,139,250,0.2)',  delay:'-6s',    dur:'24s', type:'orb'   },
  /* More electric blue */
  { left:'3%',  top:'90%', size:2,   color:'rgba(59,130,246,0.6)',   delay:'-10s',   dur:'9s',  type:'rise'  },
  { left:'50%', top:'5%',  size:2.5, color:'rgba(96,165,250,0.65)',  delay:'-0.8s',  dur:'11s', type:'rise'  },
  { left:'88%', top:'80%', size:1.5, color:'rgba(59,130,246,0.55)',  delay:'-13s',   dur:'10s', type:'rise'  },
  /* Extra cyan */
  { left:'35%', top:'45%', size:2,   color:'rgba(6,182,212,0.6)',    delay:'-11s',   dur:'8s',  type:'right' },
  { left:'62%', top:'55%', size:1.5, color:'rgba(34,211,238,0.65)',  delay:'-14s',   dur:'12s', type:'left'  },
];

const RIPPLES = [
  { left:'20%', top:'35%', size:8, delay:'0s',    dur:'8s',  color:'rgba(59,130,246,0.18)'  },
  { left:'70%', top:'20%', size:6, delay:'-3s',   dur:'10s', color:'rgba(139,92,246,0.15)'  },
  { left:'45%', top:'70%', size:7, delay:'-6s',   dur:'9s',  color:'rgba(6,182,212,0.14)'   },
  { left:'80%', top:'55%', size:5, delay:'-1.5s', dur:'11s', color:'rgba(59,130,246,0.12)'  },
  { left:'10%', top:'60%', size:6, delay:'-7s',   dur:'8s',  color:'rgba(167,139,250,0.13)' },
];

const ANIM_CLASS: Record<ParticleAnim, string> = {
  rise:  'gbl-p-rise',
  left:  'gbl-p-left',
  right: 'gbl-p-right',
  wave:  'gbl-p-wave',
  orb:   'gbl-p-orb',
};

function AmbientBackground() {
  return (
    <>
      {/* Depth blobs */}
      <div className="gbl-blob gbl-blob-1" />
      <div className="gbl-blob gbl-blob-2" />
      <div className="gbl-blob gbl-blob-3" />
      <div className="gbl-blob gbl-blob-4" />
      <div className="gbl-blob gbl-blob-5" />

      {/* Ripple rings */}
      {RIPPLES.map((r, i) => (
        <div
          key={`r${i}`}
          className="gbl-ripple"
          style={{
            left: r.left, top: r.top,
            width: `${r.size}px`, height: `${r.size}px`,
            borderColor: r.color,
            animationDelay: r.delay,
            animationDuration: r.dur,
            marginLeft: `-${r.size / 2}px`,
            marginTop: `-${r.size / 2}px`,
          }}
        />
      ))}

      {/* Particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={`p${i}`}
          className={`gbl-particle ${ANIM_CLASS[p.type]}`}
          style={{
            left: p.left, top: p.top,
            width: `${p.size}px`, height: `${p.size}px`,
            background: p.color,
            boxShadow: `0 0 ${p.size * 5}px ${p.size * 2}px ${p.color}`,
            animationDelay: p.delay,
            animationDuration: p.dur,
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
        <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', background: '#070b14', minHeight: '100vh', color: '#f0f4ff' }}>
          <h1 style={{ color: '#f87171', fontSize: '24px', marginBottom: '12px' }}>Something went wrong</h1>
          <pre style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', fontSize: '13px', overflowX: 'auto', whiteSpace: 'pre-wrap', color: '#94a3b8' }}>
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
      {/* Widget route — no navbar, embeddable iframe */}
      <Route path="/widget/:shopId" element={<WidgetPage />} />

      {/* Admin routes — no global navbar, own ambient */}
      <Route path="/admin/:shopId" element={<AdminPage />} />
      <Route path="/superadmin" element={<SuperAdminPage />} />
      <Route path="/superadmin-login" element={<SuperAdminLoginPage />} />

      {/* Public app */}
      <Route path="*" element={
        <>
          {!native && <AmbientBackground />}
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
            <Route path="/web-development" element={<WebDevPage />} />
            <Route path="/founder-network" element={<FounderNetworkPage />} />
            <Route path="/:slug" element={<ShopProfilePage />} />
          </Routes>
          {!native && <Footer />}
          <BottomTabBar />
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
