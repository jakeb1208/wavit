/**
 * Computes the estimated wait time (in minutes) for the NEXT person to join.
 *
 * Algorithm:
 * 1. Build a slots array: one entry per staff member, each holding the
 *    remaining minutes until that slot is free (0 if the slot is unoccupied).
 * 2. For each person currently waiting (not yet served), assign them to the
 *    slot that will open soonest, then advance that slot by avgServiceMinutes.
 * 3. The next joiner's wait = the minimum value across all slots after all
 *    current waiters have been placed.
 */
export function computeNextJoinerWaitMinutes(shop: {
  numStaff?: number;
  avgServiceMinutes?: number;
  queue: Array<{
    servedAt?: number | null;
    exitedAt?: number | null;
    joinedAt: number;
    partySize?: number;
  }>;
}): number {
  const numStaff = Math.max(1, shop.numStaff || 1);
  const avgSvc = Math.max(1, shop.avgServiceMinutes || 15);
  const now = Date.now();

  const activeQueue = shop.queue.filter(t => !t.exitedAt);

  // Remaining time on each currently-active serving slot
  const servingRemaining: number[] = [];
  const waitingTickets: typeof activeQueue = [];

  for (const t of activeQueue) {
    if (t.servedAt) {
      const elapsed = Math.max(0, (now - t.servedAt) / 60000);
      const remaining = Math.max(0, avgSvc - elapsed);
      if (remaining > 0) servingRemaining.push(remaining);
    } else {
      waitingTickets.push(t);
    }
  }

  // Fill out the slots array — free slots start at 0
  const slots: number[] = [...servingRemaining];
  while (slots.length < numStaff) slots.push(0);

  // Sort waiters by join order so we simulate in the right sequence
  waitingTickets.sort((a, b) => a.joinedAt - b.joinedAt);

  // Assign each waiter to the earliest-available slot
  for (const _t of waitingTickets) {
    const earliest = Math.min(...slots);
    const idx = slots.indexOf(earliest);
    slots[idx] += avgSvc;
  }

  // Next joiner steps into whichever slot opens soonest
  return Math.max(0, Math.min(...slots));
}

/** Returns a formatted ±33% wait range string for the next joiner. */
export function formatWaitRange(waitMinutes: number): string {
  if (waitMinutes <= 0) return 'No wait';
  const lo = Math.round(waitMinutes * 0.67);
  const hi = Math.round(waitMinutes * 1.33);
  return `${lo}–${hi} min`;
}
