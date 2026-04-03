import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import AboutPage from './pages/AboutPage';
import JoinPage from './pages/JoinPage';
import DashboardPage from './pages/DashboardPage';
import { useQueueStore } from './store/queueStore';

function AppContent() {
  const tick = useQueueStore(s => s.tick);

  // Global tick to keep queue state updated across all pages
  useEffect(() => {
    const interval = setInterval(tick, 3000);
    return () => clearInterval(interval);
  }, [tick]);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/join/:shopId" element={<JoinPage />} />
        <Route path="/queue/:shopId/:ticketId" element={<DashboardPage />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
