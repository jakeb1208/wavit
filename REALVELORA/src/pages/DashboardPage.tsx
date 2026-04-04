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

  useEffect(() => {
    fetchTicket();
    const interval = setInterval(fetchTicket, 3000);
    return () => clearInterval(interval);
  }, [fetchTicket]);

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

  if (result === undefined) {
    return (
      <div className="min-h-screen bg-violet-50/50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin w-8 h-8 text-violet-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500">Loading your spot...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-violet-50/50 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-3xl border border-violet-100 shadow-sm max-w-sm w-full">
          <div className="w-14 h-14 bg-violet-50 text-violet-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Ticket Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">
            This ticket may have expired or already been removed.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-3 bg-violet-600 text-white rounded-2xl font-bold text-sm hover:bg-violet-700 transition-colors"
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

  let serviceProgress = 0;
  let serviceRemaining = '';
  if (isBeingServed && ticket.servedAt) {
    const serviceElapsed = now - ticket.servedAt;
    serviceProgress = Math.min(100, (serviceElapsed / avgMs) * 100);
    const serviceRemainingMs = Math.max(0, avgMs - serviceElapsed);
    const serviceRemainingMin = Math.ceil(serviceRemainingMs / 60000);
    serviceRemaining = serviceRemainingMin > 0 ? `~${serviceRemainingMin} min remaining` : 'Almost done!';
  }

  const timeSinceJoined = now - ticket.joinedAt;
  const joinedStr = timeSinceJoined < 60000
    ? 'Just now'
    : timeSinceJoined < 3600000
      ? `${Math.floor(timeSinceJoined / 60000)}m ago`
      : `${Math.floor(timeSinceJoined / 3600000)}h ${Math.floor((timeSinceJoined % 3600000) / 60000)}m ago`;

  const isNext = position === 1 && shop.currentServiceStartedAt && !isBeingServed;

  return (
    <div className="min-h-screen bg-violet-50/50 pb-24 sm:pb-8">
      {ticketId && <ToastContainer ticketId={ticketId} />}

      {/* Top bar */}
      <div className="bg-white border-b border-violet-100/60 px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-violet-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Home
        </Link>
        <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
          #{ticket.id.slice(0, 8).toUpperCase()}
        </span>
      </div>

      <div className="max-w-md mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* Shop info */}
        <div className="bg-white rounded-2xl border border-violet-100/60 p-5 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">{shop.name}</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {shop.category} · Joined {joinedStr}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Avg service</p>
            <p className="text-sm font-bold text-gray-700">{shop.avgServiceMinutes} min</p>
          </div>
        </div>

        {/* Main status card */}
        {isBeingServed ? (
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-7 text-white text-center shadow-lg shadow-emerald-500/30 animate-fade-up">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-2xl font-black mb-1">You're Up!</h2>
            <p className="text-emerald-100 text-sm mb-5">Head in now — the shop is ready for you</p>
            <div className="bg-white/20 rounded-2xl p-3 backdrop-blur-sm">
              <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                <div
                  className="bg-white rounded-full h-2 transition-all duration-1000"
                  style={{ width: `${serviceProgress}%` }}
                />
              </div>
              <p className="text-xs text-emerald-100">{serviceRemaining}</p>
            </div>
          </div>
        ) : isNext ? (
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-7 text-white text-center shadow-lg shadow-amber-500/30 animate-pulse-ring">
            <div className="text-5xl font-black mb-2 leading-none">
              <span className="text-amber-200">→</span> 1
            </div>
            <h2 className="text-xl font-black mb-1">You're Next!</h2>
            <p className="text-amber-100 text-sm">Head back to the shop now</p>
            {etaSeconds > 0 && (
              <div className="mt-4 bg-white/15 rounded-2xl px-4 py-3">
                <p className="text-2xl font-mono font-bold">
                  {String(Math.floor(etaSeconds / 60)).padStart(2, '0')}:
                  {String(etaSeconds % 60).padStart(2, '0')}
                </p>
                <p className="text-xs text-amber-200 mt-0.5">estimated wait</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl p-7 text-white text-center shadow-lg shadow-violet-500/30">
            <p className="text-violet-300 text-xs font-semibold tracking-widest uppercase mb-2">Your Position</p>
            <div className="text-7xl font-black mb-2 leading-none">#{position}</div>
            <h2 className="text-lg font-bold mb-1">{etaStr} wait</h2>
            <p className="text-violet-300 text-xs">
              {Math.max(0, position - 1)} {position - 1 === 1 ? 'person' : 'people'} ahead of you
            </p>

            {etaSeconds > 0 && (
              <div className="mt-5 bg-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm">
                <p className="text-3xl font-mono font-bold">
                  {String(Math.floor(etaSeconds / 3600)).padStart(2, '0')}:
                  {String(Math.floor((etaSeconds % 3600) / 60)).padStart(2, '0')}:
                  {String(etaSeconds % 60).padStart(2, '0')}
                </p>
                <p className="text-xs text-violet-300 mt-1">estimated time remaining</p>
              </div>
            )}
          </div>
        )}

        {/* Being served — done button */}
        {isBeingServed && !waitingForExit && (
          <button
            onClick={handleSignOut}
            className="w-full py-4 bg-emerald-600 text-white font-bold text-sm rounded-2xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-400/20"
          >
            ✓ I'm Done — Sign Out
          </button>
        )}

        {/* Reminder / still there? */}
        {waitingForExit && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-800 mb-1">Still there?</h3>
                <p className="text-sm text-amber-700 mb-4">
                  We texted you asking if you're still at {shop.name}.
                  You'll be auto-removed in 5 min without a reply.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleReplyExit}
                    className="flex-1 py-2.5 bg-amber-600 text-white font-bold text-sm rounded-xl hover:bg-amber-700 transition-colors"
                  >
                    Leave Queue
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex-1 py-2.5 bg-white text-gray-700 font-bold text-sm rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    I'm Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Queue info */}
        {!isBeingServed && (
          <div className="bg-white rounded-2xl border border-violet-100/60 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Queue Details</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Your position', value: `#${position}` },
                { label: 'People ahead', value: `${Math.max(0, position - 1)}` },
                { label: 'Estimated wait', value: etaStr },
                { label: 'Total in queue', value: `${shop.queue.filter(t => !t.exitedAt).length}` },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{row.label}</span>
                  <span className="text-sm font-bold text-gray-900">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leave button */}
        {!isBeingServed && (
          <button
            onClick={() => setShowExitConfirm(true)}
            className="w-full py-3.5 text-red-600 bg-red-50 font-semibold text-sm rounded-2xl hover:bg-red-100 transition-colors border border-red-100"
          >
            Leave Queue
          </button>
        )}

        <p className="text-xs text-gray-400 text-center leading-relaxed pb-2">
          Keep this page open to track your live position.
        </p>
      </div>

      {/* Exit confirm modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowExitConfirm(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Leave the queue?</h3>
            <p className="text-sm text-gray-500 mb-6">
              You'll lose your spot at {shop.name}. This can't be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold text-sm rounded-2xl hover:bg-gray-200 transition-colors"
              >
                Stay
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 py-3 bg-red-600 text-white font-bold text-sm rounded-2xl hover:bg-red-700 transition-colors"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
