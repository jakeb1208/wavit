import { Link } from 'react-router-dom';

export default function TermsPage() {
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
          <p className="text-xs text-gray-400 mb-8">Last updated: April 2025 · Draft</p>

          <div className="prose prose-sm max-w-none space-y-6 text-gray-700">

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">1. Acceptance of Terms</h2>
              <p className="text-sm leading-relaxed">By accessing or using Wavit ("the Service," "we," "us"), you agree to be bound by these Terms of Service. If you do not agree, please do not use Wavit. These terms apply to all visitors, customers, and registered businesses.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">2. Description of Service</h2>
              <p className="text-sm leading-relaxed">Wavit is a digital queue management platform that lets local businesses manage wait lines and allows their customers to join virtual queues and receive status updates via SMS.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">3. SMS Notifications & Consent</h2>
              <p className="text-sm leading-relaxed">By joining a queue, you consent to receive SMS text messages from Wavit regarding your queue position and status at the business you joined. Message frequency varies. Message and data rates may apply.</p>
              <p className="text-sm leading-relaxed mt-2"><strong>To stop receiving messages at any time, reply STOP to any text message from us.</strong> After opting out, you will receive one final confirmation message and no further messages will be sent. You may re-opt-in at any time by joining a queue again.</p>
              <p className="text-sm leading-relaxed mt-2">For help, reply HELP to any message or contact us at support@wavit.app.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">4. Business Accounts</h2>
              <p className="text-sm leading-relaxed">Businesses that apply to use Wavit must provide accurate information. Wavit reserves the right to approve, reject, or suspend any business account at our sole discretion. Business owners are responsible for keeping their account information current and for all activity on their account.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">5. Acceptable Use</h2>
              <p className="text-sm leading-relaxed">You agree not to misuse the Service — including but not limited to: joining queues with false information, attempting to disrupt or overload the platform, or using the Service for any unlawful purpose.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">6. Limitation of Liability</h2>
              <p className="text-sm leading-relaxed">Wavit is provided "as is." We do not guarantee uninterrupted service, the accuracy of wait times, or that businesses will be available. To the maximum extent permitted by law, Wavit shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">7. Privacy</h2>
              <p className="text-sm leading-relaxed">Your use of the Service is also governed by our <Link to="/privacy" className="text-violet-600 font-semibold hover:underline">Privacy Policy</Link>, which is incorporated into these Terms by reference.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">8. Changes to Terms</h2>
              <p className="text-sm leading-relaxed">We may update these Terms from time to time. Continued use of the Service after changes are posted constitutes acceptance of the revised Terms.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2">9. Contact</h2>
              <p className="text-sm leading-relaxed">Questions about these Terms? Email us at <a href="mailto:support@wavit.app" className="text-violet-600 hover:underline">support@wavit.app</a>.</p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
