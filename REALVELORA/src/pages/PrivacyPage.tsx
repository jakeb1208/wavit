import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { API_BASE } from '../lib/api';

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

  useEffect(() => {
    fetch(`${API_BASE}/content/privacy`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setContent(data); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f7ff] pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors mb-8">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h1 className="text-2xl font-black text-gray-900 mb-1">Privacy Policy</h1>
          <p className="text-xs text-gray-400 mb-8">Last updated: {content.last_updated}</p>

          <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
            {content.body}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-gray-400 text-center">
            By using Wavit you also agree to our{' '}
            <Link to="/terms" className="text-violet-500 hover:underline font-semibold">Terms of Service</Link>.
          </div>
        </div>
      </div>
    </div>
  );
}
