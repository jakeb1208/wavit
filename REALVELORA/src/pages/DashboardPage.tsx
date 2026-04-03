import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQueueStore } from '../store/queueStore';
import { ApiShop } from '../store/queueStore';
import ToastContainer from '../components/Toast';
import { Ticket } from '../types';

interface TicketResult {
  ticket: Ticket;
  position: number;
  shop: ApiShop;
}

export default function DashboardPage() {
  const { shopId, ticketId } = useParams<{ shopId: string; ticketId: string }>();
  const navigate = useNavigate();
  const getTicketFromApi = useQueueStore(s => s.getTicketFromApi);
  const signOut = useQueueStore(s => s.signOut);
  const replyExit = useQueueStore(s => s.replyExit);

  const [result, setResult] = useState<TicketResult | null | undefined>(undefined);
  const [now, setNow] = useState(Date.now());
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const fetchTicket = useCallback(async () => {
    if (!shopId || !ticketId) return;
    const data = await getTicketFromApi(shopId, ticketId);
    setResult(data);
  }, [shopId, ticketId, getTicketFromApi]);

  // Poll ticket status every 3 seconds
  useEffect(() => {
    fetchTicket();
    const interval = setInterval(fetchTicket, 3000);
    return () => clearInterval(interval);
  }, [fetchTicket]);

  // Update "now" every second for the countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = useCallback(async () => {
    if (shopId && ticketId) {
      await signOut(shopId, ticketId);
      navigate('/');
    }
  }, [shopId, ticketId, signOut, navigate]);

  const handleReplyExit = useCallback(async () => {
    if (shopId && ticketId) {
      await replyExit(shopId, ticketId);
      navigate('/');
    }
  }, [shopId, ticketId, replyExit, navigate]);

  // Still loading
  if (result === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin w-8 h-8 text-blue-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500">Loading your queue status...</p>
        </div>
      </div>
    );
  }

  // Ticket not found or exited
  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-md mx-4">
          <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ticket Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">
            This ticket may have expired or been removed from the queue.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
        {ticketId && <ToastContainer ticketId={ticketId} />}
      </div>
    );
  }

  const { ticket, position, shop } = result;
  const isBeingServed = ticket.servedAt && !ticket.exitedAt;
  const waitingForExit = ticket.reminderSentAt && !ticket.exitedAt;

  // Calculate ETA
  const avgMs = shop.avgServiceMinutes * 60 * 1000;
  let etaMs = 0;
  if (shop.currentServiceStartedAt) {
    const elapsed = now - shop.currentServiceStartedAt;
    etaMs = Math.max(0, avgMs - elapsed) + avgMs * Math.max(0, position - 1);
  } else {
    etaMs = avgMs * position;
  }

  if (isBeingServed) etaMs = 0;

  const etaMinutes = Math.ceil(etaMs / 60000);
  const etaSeconds = Math.ceil(etaMs / 1000);
  const etaStr = isBeingServed
    ? "It's your turn!"
    : etaMinutes > 0
      ? `${Math.floor(etaMinutes / 60) > 0 ? `${Math.floor(etaMinutes / 60)}h ` : ''}${etaMinutes % 60}m`
      : 'Less than 1 min';

  // Service progress
  let serviceProgress = 0;
  let serviceRemaining = '';
  if (isBeingServed && ticket.servedAt) {
    const serviceElapsed = now - ticket.servedAt;
    serviceProgress = Math.min(100, (serviceElapsed / avgMs) * 100);
    const serviceRemainingMs = Math.max(0, avgMs - serviceElapsed);
    const serviceRemainingMin = Math.ceil(serviceRemainingMs / 60000);
    serviceRemaining = serviceRemainingMin > 0 ? `~${serviceRemainingMin} min remaining` : 'Almost done!';
  }

  // Time since joined
  const timeSinceJoined = now - ticket.joinedAt;
  const joinedStr = timeSinceJoined < 60000
    ? 'Just now'
    : timeSinceJoined < 3600000
      ? `${Math.floor(timeSinceJoined / 60000)}m ago`
      : `${Math.floor(timeSinceJoined / 3600000)}h ${Math.floor((timeSinceJoined % 3600000) / 60000)}m ago`;

  // Status color
  let statusColor = 'bg-blue-600';
  let statusText = `Position #${position}`;
  let statusSubtext = `Estimated wait: ${etaStr}`;

  if (isBeingServed) {
    statusColor = 'bg-emerald-600';
    statusText = 'Being Served';
    statusSubtext = serviceRemaining;
  } else if (position === 1 && shop.currentServiceStartedAt) {
    statusColor = 'bg-amber-500';
    statusText = "You're Next!";
    statusSubtext = `Wait: ${etaStr}`;
  } else if (position === 2) {
    statusColor = 'bg-orange-500';
    statusText = `Position #${position}`;
    statusSubtext = `Estimated wait: ${etaStr}`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {ticketId && <ToastContainer ticketId={ticketId} />}

      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
          ← Home
        </Link>
        <span className="text-xs text-gray-400">Ticket #{ticket.id.toUpperCase()}</span>
      </div>

      <div className="max-w-md mx-auto px-4 py-8 space-y-5">
        {/* Shop info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h1 className="text-xl font-bold text-gray-900">{shop.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Joined {joinedStr} · {shop.category}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Avg service time: {shop.avgServiceMinutes} min
          </p>
        </div>

        {/* Main status card */}
        <div className={`${statusColor} rounded-2xl p-6 text-white text-center shadow-lg`}>
          <div className="text-5xl sm:text-6xl font-bold mb-2">
            {isBeingServed ? '🎉' : `#${position}`}
          </div>
          <h2 className="text-xl font-bold mb-1">{statusText}</h2>
          <p className="text-sm opacity-90">{statusSubtext}</p>

          {isBeingServed && (
            <div className="mt-4">
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2 transition-all duration-1000"
                  style={{ width: `${serviceProgress}%` }}
                />
              </div>
              <p className="text-xs opacity-75 mt-2">Service progress</p>
            </div>
          )}

          {!isBeingServed && etaSeconds > 0 && (
            <div className="mt-4 bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
              <p className="text-2xl font-mono font-bold">
                {String(Math.floor(etaSeconds / 3600)).padStart(2, '0')}:
                {String(Math.floor((etaSeconds % 3600) / 60)).padStart(2, '0')}:
                {String(etaSeconds % 60).padStart(2, '0')}
              </p>
              <p className="text-xs opacity-75 mt-1">Estimated time remaining</p>
            </div>
          )}
        </div>

        {/* Being served — sign out option */}
        {isBeingServed && !waitingForExit && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
            <h3 className="font-semibold text-emerald-800 mb-1">You're being served!</h3>
            <p className="text-sm text-emerald-600 mb-4">
              When you're finished, tap below to sign out of the queue.
            </p>
            <button
              onClick={handleSignOut}
              className="w-full py-3 bg-emerald-600 text-white font-semibold text-sm rounded-xl hover:bg-emerald-700 transition-colors"
            >
              ✓ I'm Done — Sign Out
            </button>
          </div>
        )}

        {/* Waiting for exit reply */}
        {waitingForExit && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 mb-1">Are you still there?</h3>
                <p className="text-sm text-amber-700 mb-4">
                  We sent a text to your phone asking if you're still at {shop.name}.
                  Reply YES to keep your spot or NO to leave. You'll be automatically removed in 5 minutes if no response.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleReplyExit}
                    className="flex-1 py-2.5 bg-amber-600 text-white font-semibold text-sm rounded-xl hover:bg-amber-700 transition-colors"
                  >
                    Leave Queue
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex-1 py-2.5 bg-white text-gray-700 font-semibold text-sm rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Waiting info */}
        {!isBeingServed && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Queue Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Your position</span>
                <span className="font-medium text-gray-900">#{position}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">People ahead</span>
                <span className="font-medium text-gray-900">{Math.max(0, position - 1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estimated wait</span>
                <span className="font-medium text-gray-900">{etaStr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total in queue</span>
                <span className="font-medium text-gray-900">
                  {shop.queue.filter(t => !t.exitedAt).length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Leave queue button (when waiting) */}
        {!isBeingServed && (
          <button
            onClick={() => setShowExitConfirm(true)}
            className="w-full py-3 text-red-600 bg-red-50 font-semibold text-sm rounded-xl hover:bg-red-100 transition-colors border border-red-100"
          >
            Leave Queue
          </button>
        )}

        {/* Exit confirmation modal */}
        {showExitConfirm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowExitConfirm(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Leave Queue?</h3>
              <p className="text-sm text-gray-500 mb-6">
                You'll lose your position in line at {shop.name}. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Stay
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex-1 py-2.5 bg-red-600 text-white font-semibold text-sm rounded-xl hover:bg-red-700 transition-colors"
                >
                  Leave
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center leading-relaxed">
          SMS notifications will be sent to your phone number at key moments.
        </p>
      </div>
    </div>
  );
}
