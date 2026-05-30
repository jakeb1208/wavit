import { useEffect, useState } from 'react';
import { API_BASE } from '../lib/api';

interface WebDevContent { body: string; }

const DEFAULT: WebDevContent = {
  body: 'Web development content coming soon.',
};

const BG = '#070b14';
const GLASS = 'rgba(255,255,255,0.04)';
const BORDER = 'rgba(255,255,255,0.08)';
const TEXT = '#f0f4ff';
const TEXTSUB = 'rgba(148,163,184,0.7)';

export default function WebDevPage() {
  const [content, setContent] = useState<WebDevContent>(DEFAULT);

  useEffect(() => {
    fetch(`${API_BASE}/content/web_dev`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && typeof data.body === 'string') setContent(data); })
      .catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: "'Inter', system-ui, sans-serif", paddingTop: '80px' }}>
      <div style={{ position: 'fixed', top: '-8%', left: '-8%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '25%', right: '-18%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(90px)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 20px 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: '20px', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '32px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: TEXT, marginBottom: '24px', letterSpacing: '-0.03em' }}>Web Development</h1>
          <div style={{ fontSize: '15px', color: TEXTSUB, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {content.body}
          </div>
        </div>
      </div>
    </div>
  );
}
