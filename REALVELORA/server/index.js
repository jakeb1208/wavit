import express from 'express';
import cors from 'cors';
import pg from 'pg';
import twilio from 'twilio';

const { Pool } = pg;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Twilio client — only active if credentials are set
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;
const APP_DOWNLOAD_LINK = process.env.APP_DOWNLOAD_LINK || 'https://wavit.app';

let twilioClient = null;
if (TWILIO_SID && TWILIO_TOKEN && TWILIO_PHONE) {
  twilioClient = twilio(TWILIO_SID, TWILIO_TOKEN);
  console.log('Twilio SMS enabled');
} else {
  console.log('Twilio credentials not set — SMS will be skipped');
}

async function sendSMS(to, body) {
  if (!twilioClient) return;
  try {
    await twilioClient.messages.create({ from: TWILIO_PHONE, to, body });
    console.log(`SMS sent to ${to}`);
  } catch (err) {
    console.error(`SMS failed to ${to}:`, err.message);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

async function getShopWithQueue(shopId) {
  const shopRes = await pool.query('SELECT * FROM shops WHERE id = $1', [shopId]);
  if (shopRes.rows.length === 0) return null;
  const shop = shopRes.rows[0];

  const ticketRes = await pool.query(
    'SELECT * FROM tickets WHERE shop_id = $1 AND exited_at IS NULL ORDER BY joined_at ASC',
    [shopId]
  );

  return { ...shop, queue: ticketRes.rows };
}

function calcWaitRange(shop) {
  const activeQueue = shop.queue.filter(t => !t.served_at);
  const queueLen = activeQueue.length;
  const avgMs = shop.avg_service_minutes * 60 * 1000;

  if (queueLen === 0 && shop.current_service_started_at) {
    const elapsed = Date.now() - Number(shop.current_service_started_at);
    const remaining = Math.max(0, avgMs - elapsed);
    return `~${Math.ceil(remaining / 60000)} min`;
  }
  if (queueLen === 0) return 'No wait';

  let totalWait = 0;
  if (shop.current_service_started_at) {
    const elapsed = Date.now() - Number(shop.current_service_started_at);
    totalWait = Math.max(0, avgMs - elapsed) + avgMs * (queueLen - 1);
  } else {
    totalWait = avgMs * queueLen;
  }

  const est = totalWait / 60000;
  const min = Math.max(0, Math.round(est * 0.8));
  const max = Math.round(est * 1.2);
  return `${min}–${max} min`;
}

// ── Routes ───────────────────────────────────────────────────────────────────

// GET /api/shops
app.get('/api/shops', async (req, res) => {
  try {
    const shopsRes = await pool.query('SELECT * FROM shops ORDER BY name ASC');
    const shops = await Promise.all(shopsRes.rows.map(async shop => {
      const ticketRes = await pool.query(
        'SELECT * FROM tickets WHERE shop_id = $1 AND exited_at IS NULL ORDER BY joined_at ASC',
        [shop.id]
      );
      return { ...shop, queue: ticketRes.rows, waitRange: calcWaitRange({ ...shop, queue: ticketRes.rows }) };
    }));
    res.json(shops);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/shops/:id
app.get('/api/shops/:id', async (req, res) => {
  try {
    const shop = await getShopWithQueue(req.params.id);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    res.json({ ...shop, waitRange: calcWaitRange(shop) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/tickets — join queue
app.post('/api/tickets', async (req, res) => {
  const { shopId, name, phone } = req.body;
  if (!shopId || !name || !phone) {
    return res.status(400).json({ error: 'shopId, name, and phone are required' });
  }

  try {
    const shop = await getShopWithQueue(shopId);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    const waitRange = calcWaitRange(shop);
    const id = generateId();
    const now = Date.now();

    await pool.query(
      'INSERT INTO tickets (id, shop_id, name, phone, joined_at) VALUES ($1, $2, $3, $4, $5)',
      [id, shopId, name.trim(), phone.trim(), now]
    );

    // Send join confirmation SMS
    await sendSMS(
      phone.trim(),
      `Welcome to Wavit! You've joined the queue at ${shop.name}. Estimated wait: ${waitRange}. Track your spot: ${APP_DOWNLOAD_LINK}`
    );

    const ticketRes = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
    res.json(ticketRes.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/tickets/:shopId/:ticketId
app.get('/api/tickets/:shopId/:ticketId', async (req, res) => {
  try {
    const { shopId, ticketId } = req.params;
    const shop = await getShopWithQueue(shopId);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    const ticketRes = await pool.query('SELECT * FROM tickets WHERE id = $1', [ticketId]);
    if (ticketRes.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });

    const ticket = ticketRes.rows[0];
    const activeQueue = shop.queue.filter(t => !t.served_at);
    const position = activeQueue.findIndex(t => t.id === ticketId) + 1;

    res.json({ ticket, position: position || null, shop: { ...shop, waitRange: calcWaitRange(shop) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/tickets/:shopId/:ticketId — leave queue
app.delete('/api/tickets/:shopId/:ticketId', async (req, res) => {
  try {
    const { shopId, ticketId } = req.params;
    const ticketRes = await pool.query('SELECT * FROM tickets WHERE id = $1 AND shop_id = $2', [ticketId, shopId]);
    if (ticketRes.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });

    await pool.query('UPDATE tickets SET exited_at = $1 WHERE id = $2', [Date.now(), ticketId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Admin Routes ─────────────────────────────────────────────────────────────

// GET /api/admin/:shopId/:secret — live queue for shop owner
app.get('/api/admin/:shopId/:secret', async (req, res) => {
  try {
    const { shopId, secret } = req.params;
    const shopRes = await pool.query('SELECT * FROM shops WHERE id = $1', [shopId]);
    if (shopRes.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });
    const shop = shopRes.rows[0];
    if (shop.admin_secret !== secret) return res.status(403).json({ error: 'Invalid admin link' });

    const ticketRes = await pool.query(
      'SELECT * FROM tickets WHERE shop_id = $1 ORDER BY joined_at ASC',
      [shopId]
    );

    const allTickets = ticketRes.rows;
    const active = allTickets.filter(t => !t.exited_at);
    const recent = allTickets.filter(t => t.exited_at).slice(-20);

    res.json({
      shop: { ...shop, waitRange: calcWaitRange({ ...shop, queue: active }) },
      queue: active,
      recentlyServed: recent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/:shopId/:secret/serve/:ticketId — mark as served/done
app.post('/api/admin/:shopId/:secret/serve/:ticketId', async (req, res) => {
  try {
    const { shopId, secret, ticketId } = req.params;
    const shopRes = await pool.query('SELECT * FROM shops WHERE id = $1', [shopId]);
    if (shopRes.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });
    if (shopRes.rows[0].admin_secret !== secret) return res.status(403).json({ error: 'Invalid admin link' });

    await pool.query('UPDATE tickets SET exited_at = $1, served_at = COALESCE(served_at, $1) WHERE id = $2 AND shop_id = $3', [Date.now(), ticketId, shopId]);
    await pool.query('UPDATE shops SET current_service_started_at = NULL WHERE id = $1', [shopId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/:shopId/:secret/tickets/:ticketId — remove from queue
app.delete('/api/admin/:shopId/:secret/tickets/:ticketId', async (req, res) => {
  try {
    const { shopId, secret, ticketId } = req.params;
    const shopRes = await pool.query('SELECT * FROM shops WHERE id = $1', [shopId]);
    if (shopRes.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });
    if (shopRes.rows[0].admin_secret !== secret) return res.status(403).json({ error: 'Invalid admin link' });

    await pool.query('UPDATE tickets SET exited_at = $1 WHERE id = $2 AND shop_id = $3', [Date.now(), ticketId, shopId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/sms/webhook — Twilio inbound SMS (YES/NO replies)
app.post('/api/sms/webhook', async (req, res) => {
  const body = (req.body.Body || '').trim().toUpperCase();
  const from = req.body.From;

  res.set('Content-Type', 'text/xml');

  if (!from) return res.send('<Response></Response>');

  try {
    // Find the most recent active ticket for this phone number
    const ticketRes = await pool.query(
      `SELECT t.*, s.name as shop_name FROM tickets t
       JOIN shops s ON t.shop_id = s.id
       WHERE t.phone = $1 AND t.exited_at IS NULL AND t.reminder_sent_at IS NOT NULL
       ORDER BY t.joined_at DESC LIMIT 1`,
      [from]
    );

    if (ticketRes.rows.length === 0) {
      return res.send('<Response></Response>');
    }

    const ticket = ticketRes.rows[0];

    if (body === 'YES' || body === 'Y') {
      // User confirms they're still there — extend their time by resetting reminder
      await pool.query('UPDATE tickets SET reminder_sent_at = NULL WHERE id = $1', [ticket.id]);
      await sendSMS(from, `Got it! You're still in the queue at ${ticket.shop_name}. We'll keep your spot.`);
    } else if (body === 'NO' || body === 'N' || body === 'EXIT' || body === 'STOP') {
      await pool.query('UPDATE tickets SET exited_at = $1 WHERE id = $2', [Date.now(), ticket.id]);
      await sendSMS(from, `You've been removed from the queue at ${ticket.shop_name}. Thanks for visiting — come back soon!`);
    }
  } catch (err) {
    console.error('Webhook error:', err);
  }

  res.send('<Response></Response>');
});

// ── Queue Tick ────────────────────────────────────────────────────────────────

async function tick() {
  const now = Date.now();

  try {
    const shopsRes = await pool.query('SELECT * FROM shops');

    for (const shop of shopsRes.rows) {
      const avgMs = shop.avg_service_minutes * 60 * 1000;

      // Get active tickets (not exited)
      const ticketRes = await pool.query(
        'SELECT * FROM tickets WHERE shop_id = $1 AND exited_at IS NULL ORDER BY joined_at ASC',
        [shop.id]
      );
      const queue = ticketRes.rows;
      const activeQueue = queue.filter(t => !t.served_at);
      const serving = queue.find(t => t.served_at && !t.exited_at);

      // Start serving the next person if nobody is being served
      if (!serving && activeQueue.length > 0) {
        const next = activeQueue[0];
        await pool.query(
          'UPDATE tickets SET served_at = $1 WHERE id = $2',
          [now, next.id]
        );
        await pool.query(
          'UPDATE shops SET current_service_started_at = $1 WHERE id = $2',
          [now, shop.id]
        );

        // Send "your turn" SMS
        await sendSMS(
          next.phone,
          `It's your turn at ${shop.name}! Please head to the front now.`
        );

        // Notify next in line (approaching)
        if (activeQueue.length > 1) {
          const nextUp = activeQueue[1];
          const alreadySentRes = await pool.query(
            'SELECT approaching_sent_at FROM tickets WHERE id = $1',
            [nextUp.id]
          );
          if (!alreadySentRes.rows[0]?.approaching_sent_at) {
            await pool.query(
              'UPDATE tickets SET approaching_sent_at = $1 WHERE id = $2',
              [now, nextUp.id]
            );
            await sendSMS(
              nextUp.phone,
              `Heads up! You're next in line at ${shop.name}. Get ready to head over.`
            );
          }
        }
      }

      // Handle person currently being served
      if (serving && shop.current_service_started_at) {
        const serviceStart = Number(shop.current_service_started_at);
        const elapsed = now - serviceStart;

        if (elapsed >= avgMs) {
          const servedFor = elapsed - avgMs;

          // Send reminder 10 min after expected finish time
          if (servedFor >= 10 * 60 * 1000 && !serving.reminder_sent_at) {
            await pool.query(
              'UPDATE tickets SET reminder_sent_at = $1 WHERE id = $2',
              [now, serving.id]
            );
            await sendSMS(
              serving.phone,
              `Hi ${serving.name}, are you still at ${shop.name}? Reply YES to keep your spot or NO to leave. If we don't hear back in 5 minutes, you'll be automatically removed.`
            );
          }

          // Auto-remove 5 min after reminder (10+5 = 15 min after finish)
          if (servedFor >= 15 * 60 * 1000 && serving.reminder_sent_at && !serving.exited_at) {
            await pool.query(
              'UPDATE tickets SET exited_at = $1 WHERE id = $2',
              [now, serving.id]
            );
            await pool.query(
              'UPDATE shops SET current_service_started_at = NULL WHERE id = $1',
              [shop.id]
            );
            await sendSMS(
              serving.phone,
              `You've been automatically removed from the queue at ${shop.name}. Thanks for your visit!`
            );
          }

          // Clear service slot if served person exited
          if (serving.exited_at || serving.reminder_sent_at) {
            const updatedServing = await pool.query('SELECT * FROM tickets WHERE id = $1', [serving.id]);
            if (updatedServing.rows[0]?.exited_at) {
              await pool.query(
                'UPDATE shops SET current_service_started_at = NULL WHERE id = $1',
                [shop.id]
              );
            }
          }
        } else {
          // Still being served — send "approaching" to next in line at 80%
          const progress = elapsed / avgMs;
          if (progress >= 0.8 && activeQueue.length > 0) {
            const nextUp = activeQueue[0];
            if (!nextUp.approaching_sent_at) {
              await pool.query(
                'UPDATE tickets SET approaching_sent_at = $1 WHERE id = $2',
                [now, nextUp.id]
              );
              await sendSMS(
                nextUp.phone,
                `Heads up! You're next in line at ${shop.name}. Get ready to head over.`
              );
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Tick error:', err);
  }
}

// Run tick every 10 seconds
setInterval(tick, 10000);

// ── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Wavit API running on port ${PORT}`);
});
