import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { API_BASE } from '../lib/api';

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

  useEffect(() => {
    fetch(`${API_BASE}/content/terms`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && typeof data.body === 'string') setContent(data); })
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
          <h1 className="text-2xl font-black text-gray-900 mb-1">Terms of Service</h1>
          <p className="text-xs text-gray-400 mb-8">Last updated: {content.last_updated}</p>

          <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
            {content.body}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-gray-400 text-center">
            By using Wavit you also agree to our{' '}
            <Link to="/privacy" className="text-violet-500 hover:underline font-semibold">Privacy Policy</Link>.
          </div>
        </div>
      </div>
    </div>
  );
}
