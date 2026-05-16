import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { API_BASE } from '../lib/api';
import { isNative } from '../lib/platform';

interface PrivacyContent { last_updated: string; body: string; }

const DEFAULT: PrivacyContent = {
  last_updated: "April 2025",
  body: `1. Information We Collect
When you join a queue, we collect your name and phone number solely to send queue status notifications. When a business registers, we collect the owner's name, business name, email address, phone number, and basic business details.

2. How We Use Your Information
- To send SMS notifications about your place in a queue.
- To communicate with business owners about their Wavit account.
- To send optional analytics summary emails to registered businesses.
- To improve and operate the Wavit platform.

We do not sell, rent, or share your personal information with third parties for marketing purposes.

3. SMS & Email Communications
By providing your phone number to join a queue, you consent to receive SMS text messages from Wavit. Reply STOP to any message to permanently opt out. Standard message and data rates may apply.

For email communications sent to business owners, you may opt out by replying directly to any email or contacting us at wavitapp@gmail.com.

4. Data Retention
Queue records (name and phone number) are used only during the active queue session and are not retained long-term for marketing purposes. Business account information is retained for as long as the account is active.

5. Third-Party Services
We use the following third-party services to operate Wavit:
- Twilio — for SMS delivery. Your phone number is shared with Twilio solely to deliver queue notifications.
- Resend — for transactional emails to business owners.
- Replit / PostgreSQL — for hosting and database storage.

6. Cookies
Wavit does not currently use tracking cookies or third-party analytics. Basic browser session information may be used to maintain functionality.

7. Children's Privacy
The Service is not directed to children under 13. We do not knowingly collect personal information from children under 13.

8. Your Rights
You may request deletion of your personal information at any time by contacting us. We will respond within a reasonable timeframe.

9. Changes to This Policy
We may update this Privacy Policy periodically. We will post the updated version here with a revised date.

10. Contact
Privacy questions or requests: wavitapp@gmail.com`,
};

export default function PrivacyPage() {
  const [content, setContent] = useState<PrivacyContent>(DEFAULT);
  const native = isNative();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/content/privacy`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setContent(data); })
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
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(59,130,246,0.2))',
                  border: '1px solid rgba(16,185,129,0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg style={{ width: '18px', height: '18px', color: '#34d399' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.4px', margin: 0 }}>
                  Privacy Policy
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
              to="/terms"
              style={{ color: '#93c5fd', fontWeight: 700, textDecoration: 'none' }}
            >
              Terms of Service
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
            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(59,130,246,0.15))', border: '1px solid rgba(16,185,129,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg style={{ width: '22px', height: '22px', color: '#34d399' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.4px', margin: 0 }}>Privacy Policy</h1>
              <p style={{ fontSize: '12px', color: 'rgba(148,163,184,0.5)', marginTop: '3px' }}>Last updated: {content.last_updated}</p>
            </div>
          </div>

          <div style={{ fontSize: '14px', lineHeight: 1.75, color: 'rgba(203,213,225,0.85)', whiteSpace: 'pre-wrap', fontWeight: 400 }}>
            {content.body}
          </div>

          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '12px', color: 'rgba(148,163,184,0.45)', textAlign: 'center' }}>
            By using Wavit you also agree to our{' '}
            <Link to="/terms" style={{ color: '#93c5fd', fontWeight: 700, textDecoration: 'none' }}>Terms of Service</Link>.
          </div>
        </div>
      </div>
    </div>
  );
}
