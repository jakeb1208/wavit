import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { API_BASE } from '../lib/api';
import { isNative } from '../lib/platform';

interface TermsContent { last_updated: string; body: string; }

const DEFAULT: TermsContent = {
  last_updated: "April 2025",
  body: `1. Acceptance of Terms
By accessing or using Wavit ("the Service," "we," "us"), you agree to be bound by these Terms of Service. If you do not agree, please do not use Wavit. These terms apply to all visitors, customers, and registered businesses.

2. Description of Service
Wavit is a digital queue management platform that lets local businesses manage wait lines and allows their customers to join virtual queues and receive status updates via SMS.

3. SMS Notifications & Consent
By joining a queue, you consent to receive SMS text messages from Wavit regarding your queue position and status at the business you joined. Message frequency varies. Message and data rates may apply.

To stop receiving messages at any time, reply STOP to any text message from us. After opting out, you will receive one final confirmation message and no further messages will be sent. You may re-opt-in at any time by joining a queue again.

For help, reply HELP to any message or contact us at wavitapp@gmail.com.

4. Business Accounts
Businesses that apply to use Wavit must provide accurate information. Wavit reserves the right to approve, reject, or suspend any business account at our sole discretion. Business owners are responsible for keeping their account information current and for all activity on their account.

5. Acceptable Use
You agree not to misuse the Service — including but not limited to: joining queues with false information, attempting to disrupt or overload the platform, or using the Service for any unlawful purpose.

6. Limitation of Liability
Wavit is provided "as is." We do not guarantee uninterrupted service, the accuracy of wait times, or that businesses will be available. To the maximum extent permitted by law, Wavit shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.

7. Privacy
Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference.

8. Changes to Terms
We may update these Terms from time to time. Continued use of the Service after changes are posted constitutes acceptance of the revised Terms.

9. Contact
Questions about these Terms? Email us at wavitapp@gmail.com.`,
};

export default function TermsPage() {
  const [content, setContent] = useState<TermsContent>(DEFAULT);
  const native = isNative();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/content/terms`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && typeof data.body === 'string') setContent(data); })
      .catch(() => {});
  }, []);

  if (native) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(30,58,138,0.28) 0%, #070b14 55%)',
          color: '#f0f4ff',
          paddingBottom: '32px',
        }}
      >
        {/* Back header */}
        <div style={{ padding: '20px 16px 8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '8px 14px',
              color: '#93c5fd',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        <div style={{ padding: '8px 16px 0' }}>
          {/* Title card */}
          <div
            style={{
              background: 'rgba(255,255,255,0.055)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '12px',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(99,102,241,0.25))',
                  border: '1px solid rgba(99,140,255,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg style={{ width: '18px', height: '18px', color: '#93c5fd' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.4px', margin: 0 }}>
                  Terms of Service
                </h1>
                <p style={{ fontSize: '11px', color: 'rgba(148,163,184,0.55)', fontWeight: 500, margin: '2px 0 0' }}>
                  Last updated: {content.last_updated}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '20px',
              padding: '20px',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                lineHeight: 1.75,
                color: 'rgba(203,213,225,0.85)',
                whiteSpace: 'pre-wrap',
                fontWeight: 400,
              }}
            >
              {content.body}
            </div>
          </div>

          {/* Cross-link */}
          <div
            style={{
              textAlign: 'center',
              padding: '16px',
              fontSize: '12px',
              color: 'rgba(148,163,184,0.45)',
            }}
          >
            Also read our{' '}
            <Link
              to="/privacy"
              style={{ color: '#93c5fd', fontWeight: 700, textDecoration: 'none' }}
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(30,58,138,0.28) 0%, #070b14 55%)', color: '#f0f4ff', paddingBottom: '48px' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-10">
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#93c5fd', textDecoration: 'none', marginBottom: '24px', background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '12px', padding: '8px 14px' }}>
          <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        <div style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '24px', padding: '32px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(99,102,241,0.2))', border: '1px solid rgba(99,140,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg style={{ width: '22px', height: '22px', color: '#93c5fd' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.4px', margin: 0 }}>Terms of Service</h1>
              <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.5)', marginTop: '3px' }}>Last updated: {content.last_updated}</p>
            </div>
          </div>

          <div style={{ fontSize: '14px', lineHeight: 1.75, color: 'rgba(203,213,225,0.85)', whiteSpace: 'pre-wrap', fontWeight: 400 }}>
            {content.body}
          </div>

          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '12px', color: 'rgba(148,163,184,0.45)', textAlign: 'center' }}>
            By using Wavit you also agree to our{' '}
            <Link to="/privacy" style={{ color: '#93c5fd', fontWeight: 700, textDecoration: 'none' }}>Privacy Policy</Link>.
          </div>
        </div>
      </div>
    </div>
  );
}
