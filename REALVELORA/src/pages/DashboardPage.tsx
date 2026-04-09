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
    if (shopId && ticketId) { await signOut(shopId, ticketId); navigate('/'); }
  }, [shopId, ticketId, signOut, navigate]);

  const handleReplyExit = useCallback(async () => {
    if (shopId && ticketId) { await replyExit(shopId, ticketId); navigate('/'); }
  }, [shopId, ticketId, replyExit, navigate]);

  if (result === undefined) {
    return (
      <div className="min-h-screen bg-[#f8f7ff] flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin w-7 h-7 text-violet-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-400 font-medium">Loading your spot...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#f8f7ff] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-sm w-full">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Ticket Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">This ticket may have expired or already been removed.</p>
          <Link to="/" className="inline-flex items-center justify-center px-5 py-3 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 transition-colors">
            Back to Home
          </Link>
        </div>
        {ticketId && <ToastContainer ticketId={ticketId} />}
      </div>
    );
  }

  const { ticket, position, shop } = result;

  // Ticket is fully closed out — show appropriate end screen
  if (ticket.exitedAt) {
    const wasServed = !!ticket.servedAt;
    return (
      <div className="min-h-screen bg-[#f8f7ff] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-sm w-full">
          <div className={`w-14 h-14 ${wasServed ? 'bg-emerald-100' : 'bg-red-100'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            {wasServed ? (
              <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            {wasServed ? 'Thanks for visiting!' : 'You were removed from the queue'}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {wasServed
              ? `Hope to see you again at ${shop.name}.`
              : `Your spot at ${shop.name} has been released.`}
          </p>
          <div className="flex flex-col gap-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-5 py-3 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 transition-colors"
            >
              Back to Home
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
            >
              About
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isBeingServed = ticket.servedAt && !ticket.exitedAt;
  const waitingForExit = ticket.reminderSentAt && !ticket.exitedAt;

  const avgMs = shop.avgServiceMinutes * 60 * 1000;
  const numStaff = Math.max(1, shop.numStaff || 1);
  // With n staff, person at queue position p is in "wave" ceil(p / n)
  const wave = Math.ceil(position / numStaff);
  let etaMs = 0;
  if (shop.currentServiceStartedAt) {
    const elapsed = now - shop.currentServiceStartedAt;
    const remaining = Math.max(0, avgMs - elapsed);
    etaMs = remaining + avgMs * (wave - 1);
  } else {
    etaMs = avgMs * wave;
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

  const formatCountdown = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      {ticketId && <ToastContainer ticketId={ticketId} />}

      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <div className="w-7 h-7 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 3L4 14h7v7l9-11h-7V3z" />
            </svg>
          </div>
          wav<span className="text-violet-600">it</span>
        </Link>
        <span className="text-[11px] font-mono font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg tracking-wider">
          #{ticket.id.slice(0, 8).toUpperCase()}
        </span>
      </div>

      <div className="max-w-md mx-auto px-4 sm:px-6 py-5 space-y-3">
        {/* Shop row */}
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-[15px] font-bold text-gray-900">{shop.name}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{shop.category} · Joined {joinedStr}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-gray-400">Avg service</p>
            <p className="text-sm font-bold text-gray-700">{shop.avgServiceMinutes} min</p>
          </div>
        </div>

        {/* Main status card */}
        {isBeingServed ? (
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-7 text-white text-center shadow-lg shadow-emerald-400/30 animate-fade-up">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4"><svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg></div>
            <h2 className="text-2xl font-black mb-1.5">You're Up!</h2>
            <p className="text-emerald-100 text-sm mb-6">Head in now — the shop is ready for you</p>
            {serviceProgress > 0 && (
              <div className="bg-black/10 rounded-xl p-4">
                <div className="w-full bg-white/20 rounded-full h-2 mb-2.5">
                  <div
                    className="bg-white rounded-full h-2 transition-all duration-1000"
                    style={{ width: `${serviceProgress}%` }}
                  />
                </div>
                <p className="text-xs text-emerald-100 font-medium">{serviceRemaining}</p>
              </div>
            )}
          </div>
        ) : isNext ? (
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-7 text-white text-center shadow-lg shadow-amber-400/30 animate-pulse-ring">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-200 mb-3">Coming Up</p>
            <div className="text-6xl font-black mb-2 leading-none">#1</div>
            <h2 className="text-xl font-black mb-1.5">You're Next!</h2>
            <p className="text-amber-100 text-sm mb-4">Head back to the shop now</p>
            {etaSeconds > 0 && (
              <div className="bg-black/10 rounded-xl px-4 py-3">
                <p className="text-3xl font-mono font-black">{formatCountdown(etaSeconds)}</p>
                <p className="text-xs text-amber-200 mt-0.5 font-medium">estimated wait</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-7 text-white text-center shadow-lg shadow-violet-500/30">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-300 mb-4">Your Position</p>
            <div className="text-8xl font-black mb-2 leading-none">
              {position}
            </div>
            <h2 className="text-base font-bold mb-1 text-violet-100">{etaStr} estimated wait</h2>
            <p className="text-violet-400 text-xs font-medium">
              {Math.max(0, position - 1)} {position - 1 === 1 ? 'person' : 'people'} ahead
            </p>

            {etaSeconds > 0 && (
              <div className="mt-5 bg-white/10 rounded-xl px-4 py-3">
                <p className="text-3xl font-mono font-black">{formatCountdown(etaSeconds)}</p>
                <p className="text-xs text-violet-300 mt-1 font-medium">time remaining</p>
              </div>
            )}
          </div>
        )}

        {/* Done button */}
        {isBeingServed && !waitingForExit && (
          <button
            onClick={handleSignOut}
            className="w-full py-4 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
          >
            ✓ I'm Done — Sign Out
          </button>
        )}

        {/* Reminder card */}
        {waitingForExit && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-amber-100 bg-amber-100 rounded-xl flex items-center justify-center shrink-0"><svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg></div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-900 mb-1">Still there?</h3>
                <p className="text-sm text-amber-700 mb-4 leading-relaxed">
                  We texted you asking if you're still at {shop.name}. You'll be auto-removed in 5 min without a reply.
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

        {/* Queue details */}
        {!isBeingServed && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Queue Details</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Your position', value: `#${position}` },
                { label: 'People ahead', value: `${Math.max(0, position - 1)}` },
                { label: 'Estimated wait', value: etaStr },
                { label: 'Total in queue', value: `${shop.queue.filter((t: any) => !t.exitedAt).length}` },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{row.label}</span>
                  <span className="text-sm font-bold text-gray-900">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isBeingServed && (
          <button
            onClick={() => setShowExitConfirm(true)}
            className="w-full py-3.5 text-red-600 bg-white font-semibold text-sm rounded-xl hover:bg-red-50 transition-colors border border-gray-200"
          >
            Leave Queue
          </button>
        )}

        <p className="text-xs text-gray-400 text-center pb-2">
          Keep this page open to track your position live.
        </p>
      </div>

      {/* Exit confirm modal */}
      {showExitConfirm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowExitConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-up"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-1.5">Leave the queue?</h3>
            <p className="text-sm text-gray-500 mb-6">
              You'll lose your spot at {shop.name}. This can't be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors"
              >
                Stay
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 py-3 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors"
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
