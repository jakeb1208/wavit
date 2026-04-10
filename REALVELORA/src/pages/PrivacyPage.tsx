import { Link } from 'react-router-dom';

export default function PrivacyPage() {
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
          <p className="text-xs text-gray-400 mb-8">Last updated: April 2025 · Draft</p>

          <div className="prose prose-sm max-w-none space-y-6 text-gray-700">

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">1. Information We Collect</h2>
              <p className="text-sm leading-relaxed">When you join a queue, we collect your <strong>name</strong> and <strong>phone number</strong> solely to send queue status notifications. When a business registers, we collect the owner's name, business name, email address, phone number, and basic business details.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside text-sm leading-relaxed space-y-1">
                <li>To send SMS notifications about your place in a queue.</li>
                <li>To communicate with business owners about their Wavit account.</li>
                <li>To send optional analytics summary emails to registered businesses.</li>
                <li>To improve and operate the Wavit platform.</li>
              </ul>
              <p className="text-sm leading-relaxed mt-2">We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">3. SMS & Email Communications</h2>
              <p className="text-sm leading-relaxed">By providing your phone number to join a queue, you consent to receive SMS text messages from Wavit. <strong>Reply STOP to any message to permanently opt out.</strong> Standard message and data rates may apply.</p>
              <p className="text-sm leading-relaxed mt-2">For email communications sent to business owners, you may opt out by replying directly to any email or contacting us at <a href="mailto:support@wavit.app" className="text-violet-600 hover:underline">support@wavit.app</a>.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">4. Data Retention</h2>
              <p className="text-sm leading-relaxed">Queue records (name and phone number) are used only during the active queue session and are not retained long-term for marketing purposes. Business account information is retained for as long as the account is active.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">5. Third-Party Services</h2>
              <p className="text-sm leading-relaxed">We use the following third-party services to operate Wavit:</p>
              <ul className="list-disc list-inside text-sm leading-relaxed space-y-1 mt-2">
                <li><strong>Twilio</strong> — for SMS delivery. Your phone number is shared with Twilio solely to deliver queue notifications.</li>
                <li><strong>Resend</strong> — for transactional emails to business owners.</li>
                <li><strong>Replit / PostgreSQL</strong> — for hosting and database storage.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">6. Cookies</h2>
              <p className="text-sm leading-relaxed">Wavit does not currently use tracking cookies or third-party analytics. Basic browser session information may be used to maintain functionality.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">7. Children's Privacy</h2>
              <p className="text-sm leading-relaxed">The Service is not directed to children under 13. We do not knowingly collect personal information from children under 13.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">8. Your Rights</h2>
              <p className="text-sm leading-relaxed">You may request deletion of your personal information at any time by contacting us. We will respond within a reasonable timeframe.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">9. Changes to This Policy</h2>
              <p className="text-sm leading-relaxed">We may update this Privacy Policy periodically. We will post the updated version here with a revised date.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">10. Contact</h2>
              <p className="text-sm leading-relaxed">Privacy questions or requests: <a href="mailto:support@wavit.app" className="text-violet-600 hover:underline">support@wavit.app</a></p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
