import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-pacifico text-xl text-blue-600">wavit</span>
            <span className="text-xs text-gray-400">· Waive the Wait</span>
          </div>

          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-semibold text-gray-500">
            <Link to="/" className="hover:text-gray-800 transition-colors">Home</Link>
            <Link to="/search" className="hover:text-gray-800 transition-colors">Search</Link>
            <Link to="/register" className="hover:text-gray-800 transition-colors">Register</Link>
            <Link to="/about" className="hover:text-gray-800 transition-colors">About</Link>
            <Link to="/terms" className="hover:text-violet-700 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-violet-700 transition-colors">Privacy</Link>
          </nav>
        </div>

        <div className="mt-6 pt-5 border-t border-gray-200 text-center">
          <p className="text-[11px] text-gray-400 leading-relaxed">
            By using Wavit, you agree to our{' '}
            <Link to="/terms" className="text-violet-500 hover:underline font-semibold">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-violet-500 hover:underline font-semibold">Privacy Policy</Link>.
            {' '}SMS notifications are sent to customers who join a queue. Reply <strong className="text-gray-500">STOP</strong> to any text to unsubscribe.
          </p>
          <p className="text-[11px] text-gray-400 mt-1">&copy; {new Date().getFullYear()} Wavit. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
