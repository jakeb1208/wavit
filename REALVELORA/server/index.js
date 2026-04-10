import express from 'express';
import cors from 'cors';
import pg from 'pg';
import twilio from 'twilio';
import { Resend } from 'resend';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const isExternalDB = process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes('localhost') &&
  !process.env.DATABASE_URL.includes('127.0.0.1') &&
  !process.env.DATABASE_URL.includes('helium');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(isExternalDB ? { ssl: { rejectUnauthorized: false } } : {}),
});

// ── Database schema init ──────────────────────────────────────────────────────
async function initSchema() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shops (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'General',
        description TEXT,
        address TEXT,
        zip_code TEXT,
        phone TEXT,
        email TEXT,
        logo_url TEXT,
        admin_secret TEXT NOT NULL,
        queue_open BOOLEAN NOT NULL DEFAULT true,
        num_staff INTEGER NOT NULL DEFAULT 1,
        avg_service_minutes INTEGER NOT NULL DEFAULT 15,
        opening_time TEXT DEFAULT '09:00',
        closing_time TEXT DEFAULT '17:00',
        current_service_started_at BIGINT,
        created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
        analytics_email TEXT,
        analytics_enabled BOOLEAN NOT NULL DEFAULT false,
        last_analytics_sent BIGINT
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        shop_id TEXT NOT NULL REFERENCES shops(id),
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        joined_at BIGINT NOT NULL,
        served_at BIGINT,
        exited_at BIGINT,
        reminder_sent_at BIGINT,
        approaching_sent_at BIGINT
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shop_registrations (
        id TEXT PRIMARY KEY,
        business_name TEXT NOT NULL,
        owner_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        category TEXT NOT NULL,
        zip_code TEXT,
        num_staff INTEGER NOT NULL DEFAULT 1,
        avg_service_minutes INTEGER NOT NULL DEFAULT 15,
        message TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        admin_note TEXT,
        submitted_at BIGINT NOT NULL,
        reviewed_at BIGINT
      )
    `);
    // Safe migrations — add any columns that may be missing from pre-existing tables
    const shopMigrations = [
      `ALTER TABLE shops ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'General'`,
      `ALTER TABLE shops ADD COLUMN IF NOT EXISTS description TEXT`,
      `ALTER TABLE shops ADD COLUMN IF NOT EXISTS address TEXT`,
      `ALTER TABLE shops ADD COLUMN IF NOT EXISTS zip_code TEXT`,
      `ALTER TABLE shops ADD COLUMN IF NOT EXISTS phone TEXT`,
      `ALTER TABLE shops ADD COLUMN IF NOT EXISTS email TEXT`,
      `ALTER TABLE shops ADD COLUMN IF NOT EXISTS logo_url TEXT`,
      `ALTER TABLE shops ADD COLUMN IF NOT EXISTS queue_open BOOLEAN NOT NULL DEFAULT true`,
      `ALTER TABLE shops ADD COLUMN IF NOT EXISTS num_staff INTEGER NOT NULL DEFAULT 1`,
      `ALTER TABLE shops ADD COLUMN IF NOT EXISTS avg_service_minutes INTEGER NOT NULL DEFAULT 15`,
      `ALTER TABLE shops ADD COLUMN IF NOT EXISTS opening_time TEXT DEFAULT '09:00'`,
      `ALTER TABLE shops ADD COLUMN IF NOT EXISTS closing_time TEXT DEFAULT '17:00'`,
      `ALTER TABLE shops ADD COLUMN IF NOT EXISTS current_service_started_at BIGINT`,
      `ALTER TABLE shops ADD COLUMN IF NOT EXISTS created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT`,
      `ALTER TABLE shops ADD COLUMN IF NOT EXISTS analytics_email TEXT`,
      `ALTER TABLE shops ADD COLUMN IF NOT EXISTS analytics_enabled BOOLEAN NOT NULL DEFAULT false`,
      `ALTER TABLE shops ADD COLUMN IF NOT EXISTS last_analytics_sent BIGINT`,
      `ALTER TABLE shops ADD COLUMN IF NOT EXISTS allow_remote_join BOOLEAN NOT NULL DEFAULT true`,
    ];
    const ticketMigrations = [
      `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS served_at BIGINT`,
      `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS exited_at BIGINT`,
      `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS reminder_sent_at BIGINT`,
      `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS approaching_sent_at BIGINT`,
    ];
    const regMigrations = [
      `ALTER TABLE shop_registrations ADD COLUMN IF NOT EXISTS zip_code TEXT`,
      `ALTER TABLE shop_registrations ADD COLUMN IF NOT EXISTS num_staff INTEGER NOT NULL DEFAULT 1`,
      `ALTER TABLE shop_registrations ADD COLUMN IF NOT EXISTS avg_service_minutes INTEGER NOT NULL DEFAULT 15`,
      `ALTER TABLE shop_registrations ADD COLUMN IF NOT EXISTS message TEXT`,
      `ALTER TABLE shop_registrations ADD COLUMN IF NOT EXISTS admin_note TEXT`,
      `ALTER TABLE shop_registrations ADD COLUMN IF NOT EXISTS reviewed_at BIGINT`,
      `ALTER TABLE shop_registrations ADD COLUMN IF NOT EXISTS allow_remote_join BOOLEAN NOT NULL DEFAULT true`,
    ];
    for (const sql of [...shopMigrations, ...ticketMigrations, ...regMigrations]) {
      await pool.query(sql);
    }

    console.log('Database schema ready');
  } catch (err) {
    console.error('Schema init error:', err.message);
  }
}
initSchema();

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

// Resend email client
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Wavit Analytics <onboarding@resend.dev>';
let resend = null;
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
  console.log('Resend email enabled');
} else {
  console.log('RESEND_API_KEY not set — analytics emails will be skipped');
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
  const numStaff = Math.max(1, shop.num_staff || 1);

  if (queueLen === 0 && shop.current_service_started_at) {
    const elapsed = Date.now() - Number(shop.current_service_started_at);
    const remaining = Math.max(0, avgMs - elapsed);
    return remaining > 0 ? `~${Math.ceil(remaining / 60000)} min` : 'No wait';
  }
  if (queueLen === 0) return 'No wait';

  // With n staff, people are served in "waves" of n at a time.
  // Last person in queue is in wave ceil(queueLen / n).
  const lastWave = Math.ceil(queueLen / numStaff);
  let totalWait = 0;
  if (shop.current_service_started_at) {
    const elapsed = Date.now() - Number(shop.current_service_started_at);
    const remaining = Math.max(0, avgMs - elapsed);
    totalWait = remaining + avgMs * (lastWave - 1);
  } else {
    totalWait = avgMs * lastWave;
  }

  const est = totalWait / 60000;
  const min = Math.max(0, Math.round(est * 0.8));
  const max = Math.round(est * 1.2);
  return `${min}–${max} min`;
}

// ── Routes ───────────────────────────────────────────────────────────────────

// GET /health — Railway healthcheck (no DB dependency)
app.get('/health', (req, res) => res.json({ status: 'ok' }));

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
    if (shop.queue_open === false) return res.status(403).json({ error: 'Queue is currently closed' });

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

    // Check if the active queue is now empty and reset current_service_started_at
    const remainingRes = await pool.query(
      'SELECT id FROM tickets WHERE shop_id = $1 AND exited_at IS NULL',
      [shopId]
    );
    if (remainingRes.rows.length === 0) {
      await pool.query('UPDATE shops SET current_service_started_at = NULL WHERE id = $1', [shopId]);
    }

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

// PATCH /api/admin/:shopId/:secret/settings — update shop settings
app.patch('/api/admin/:shopId/:secret/settings', async (req, res) => {
  try {
    const { shopId, secret } = req.params;
    const shopRes = await pool.query('SELECT * FROM shops WHERE id = $1', [shopId]);
    if (shopRes.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });
    if (shopRes.rows[0].admin_secret !== secret) return res.status(403).json({ error: 'Invalid admin link' });

    const { numStaff, avgServiceMinutes, queueOpen, openingTime, closingTime, allowRemoteJoin } = req.body;
    const updates = [];
    const values = [];
    let idx = 1;

    if (numStaff !== undefined) {
      const n = Math.max(1, Math.min(20, parseInt(numStaff, 10) || 1));
      updates.push(`num_staff = $${idx++}`);
      values.push(n);
    }
    if (avgServiceMinutes !== undefined) {
      const m = Math.max(1, Math.min(120, parseInt(avgServiceMinutes, 10) || 15));
      updates.push(`avg_service_minutes = $${idx++}`);
      values.push(m);
    }
    if (queueOpen !== undefined) {
      updates.push(`queue_open = $${idx++}`);
      values.push(!!queueOpen);
    }
    if (openingTime !== undefined) {
      updates.push(`opening_time = $${idx++}`);
      values.push(openingTime);
    }
    if (closingTime !== undefined) {
      updates.push(`closing_time = $${idx++}`);
      values.push(closingTime);
    }
    if (allowRemoteJoin !== undefined) {
      updates.push(`allow_remote_join = $${idx++}`);
      values.push(!!allowRemoteJoin);
    }

    if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    values.push(shopId);
    await pool.query(`UPDATE shops SET ${updates.join(', ')} WHERE id = $${idx}`, values);
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

// ── Analytics ────────────────────────────────────────────────────────────────

async function computeAnalytics(shopId, days = 14) {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const res = await pool.query(
    'SELECT * FROM tickets WHERE shop_id = $1 AND joined_at >= $2',
    [shopId, since]
  );
  const tickets = res.rows;
  const total = tickets.length;
  const served = tickets.filter(t => t.served_at).length;
  const leftBeforeServed = tickets.filter(t => t.exited_at && !t.served_at).length;
  const noShowRate = total > 0 ? Math.round((leftBeforeServed / total) * 100) : 0;
  const avgWaitMs = served > 0
    ? tickets.filter(t => t.served_at).reduce((sum, t) => sum + (Number(t.served_at) - Number(t.joined_at)), 0) / served
    : 0;
  const avgWaitMin = Math.round(avgWaitMs / 60000);
  return { total, served, leftBeforeServed, noShowRate, avgWaitMin, days };
}

// Get competitor analytics: same category + same zip_code, excluding this shop
async function computeCompetitorAnalytics(shop, days = 14) {
  if (!shop.zip_code || !shop.category) return null;

  const competitorRes = await pool.query(
    'SELECT * FROM shops WHERE category = $1 AND zip_code = $2 AND id != $3',
    [shop.category, shop.zip_code, shop.id]
  );
  const competitors = competitorRes.rows;
  if (competitors.length === 0) return null;

  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const competitorStats = [];

  for (const comp of competitors) {
    const ticketRes = await pool.query(
      'SELECT * FROM tickets WHERE shop_id = $1 AND joined_at >= $2',
      [comp.id, since]
    );
    const tickets = ticketRes.rows;
    const total = tickets.length;
    const served = tickets.filter(t => t.served_at).length;
    const leftBeforeServed = tickets.filter(t => t.exited_at && !t.served_at).length;
    const noShowRate = total > 0 ? Math.round((leftBeforeServed / total) * 100) : 0;
    const avgWaitMs = served > 0
      ? tickets.filter(t => t.served_at).reduce((sum, t) => sum + (Number(t.served_at) - Number(t.joined_at)), 0) / served
      : 0;
    const avgWaitMin = Math.round(avgWaitMs / 60000);
    competitorStats.push({ total, served, noShowRate, avgWaitMin, leftBeforeServed });
  }

  const count = competitorStats.length;
  const avg = (key) => Math.round(competitorStats.reduce((s, c) => s + c[key], 0) / count);

  return {
    count,
    zipCode: shop.zip_code,
    category: shop.category,
    avgTotal: avg('total'),
    avgServed: avg('served'),
    avgNoShowRate: avg('noShowRate'),
    avgWaitMin: avg('avgWaitMin'),
    avgLeftEarly: avg('leftBeforeServed'),
  };
}

function buildAnalyticsEmail(shop, analytics, competitors) {
  const { total, served, leftBeforeServed, noShowRate, avgWaitMin, days } = analytics;

  const vsColor = (mine, theirs, lowerIsBetter = false) => {
    if (theirs === 0) return '#6b7280';
    const better = lowerIsBetter ? mine < theirs : mine > theirs;
    return better ? '#059669' : mine === theirs ? '#6b7280' : '#dc2626';
  };

  const vsLabel = (mine, theirs, unit = '', lowerIsBetter = false) => {
    if (theirs === 0) return '—';
    const diff = mine - theirs;
    if (diff === 0) return `= avg`;
    const better = lowerIsBetter ? diff < 0 : diff > 0;
    return `${better ? '▲' : '▼'} ${Math.abs(diff)}${unit} vs avg`;
  };

  const competitorSection = competitors ? `
  <div style="margin-top:28px;padding-top:24px;border-top:1px solid #e5e7eb;">
    <h3 style="color:#111827;font-size:16px;font-weight:800;margin:0 0 4px 0;">🏘 Local Competition</h3>
    <p style="color:#6b7280;font-size:13px;margin:0 0 16px 0;">
      ${competitors.count} other ${competitors.category} shop${competitors.count > 1 ? 's' : ''} in ZIP ${competitors.zipCode} — last ${days} days
    </p>

    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:10px 12px;text-align:left;color:#6b7280;font-weight:600;font-size:12px;border-radius:8px 0 0 8px;">Metric</th>
          <th style="padding:10px 12px;text-align:center;color:#6b7280;font-weight:600;font-size:12px;">You</th>
          <th style="padding:10px 12px;text-align:center;color:#6b7280;font-weight:600;font-size:12px;">Area Avg</th>
          <th style="padding:10px 12px;text-align:center;color:#6b7280;font-weight:600;font-size:12px;border-radius:0 8px 8px 0;">vs Competitors</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom:1px solid #f3f4f6;">
          <td style="padding:10px 12px;color:#374151;font-weight:500;">Total Joins</td>
          <td style="padding:10px 12px;text-align:center;font-weight:700;color:#111827;">${total}</td>
          <td style="padding:10px 12px;text-align:center;color:#6b7280;">${competitors.avgTotal}</td>
          <td style="padding:10px 12px;text-align:center;font-weight:600;color:${vsColor(total, competitors.avgTotal)};">${vsLabel(total, competitors.avgTotal)}</td>
        </tr>
        <tr style="border-bottom:1px solid #f3f4f6;">
          <td style="padding:10px 12px;color:#374151;font-weight:500;">Customers Served</td>
          <td style="padding:10px 12px;text-align:center;font-weight:700;color:#111827;">${served}</td>
          <td style="padding:10px 12px;text-align:center;color:#6b7280;">${competitors.avgServed}</td>
          <td style="padding:10px 12px;text-align:center;font-weight:600;color:${vsColor(served, competitors.avgServed)};">${vsLabel(served, competitors.avgServed)}</td>
        </tr>
        <tr style="border-bottom:1px solid #f3f4f6;">
          <td style="padding:10px 12px;color:#374151;font-weight:500;">No-Show Rate</td>
          <td style="padding:10px 12px;text-align:center;font-weight:700;color:#111827;">${noShowRate}%</td>
          <td style="padding:10px 12px;text-align:center;color:#6b7280;">${competitors.avgNoShowRate}%</td>
          <td style="padding:10px 12px;text-align:center;font-weight:600;color:${vsColor(noShowRate, competitors.avgNoShowRate, true)};">${vsLabel(noShowRate, competitors.avgNoShowRate, '%', true)}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;color:#374151;font-weight:500;">Avg Wait Time</td>
          <td style="padding:10px 12px;text-align:center;font-weight:700;color:#111827;">${avgWaitMin}m</td>
          <td style="padding:10px 12px;text-align:center;color:#6b7280;">${competitors.avgWaitMin}m</td>
          <td style="padding:10px 12px;text-align:center;font-weight:600;color:${vsColor(avgWaitMin, competitors.avgWaitMin, true)};">${vsLabel(avgWaitMin, competitors.avgWaitMin, 'm', true)}</td>
        </tr>
      </tbody>
    </table>

    ${noShowRate > competitors.avgNoShowRate
      ? `<p style="background:#fef2f2;border-radius:8px;padding:12px;color:#991b1b;font-size:13px;margin-top:12px;">⚠️ Your no-show rate is above the local average. Nearby ${competitors.category}s are retaining more customers — consider adjusting your queue size or sending earlier reminders.</p>`
      : noShowRate < competitors.avgNoShowRate
        ? `<p style="background:#f0fdf4;border-radius:8px;padding:12px;color:#166534;font-size:13px;margin-top:12px;">✅ Your no-show rate is better than nearby competitors. Keep it up — your customers are more engaged than the local average.</p>`
        : ''
    }
    ${total > competitors.avgTotal
      ? `<p style="background:#f0fdf4;border-radius:8px;padding:12px;color:#166534;font-size:13px;margin-top:8px;">✅ You're attracting more customers than the average ${competitors.category} in your area. Strong local demand.</p>`
      : total < competitors.avgTotal
        ? `<p style="background:#fffbeb;border-radius:8px;padding:12px;color:#92400e;font-size:13px;margin-top:8px;">💡 Nearby ${competitors.category}s are seeing more joins on average. Consider visibility improvements — QR code placement, social media, or local promotions.</p>`
        : ''
    }
  </div>` : (shop.zip_code ? `
  <div style="margin-top:28px;padding-top:24px;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:13px;">No other ${shop.category} shops found in ZIP ${shop.zip_code} on Wavit yet — you're the first!</p>
  </div>` : '');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, 'Inter', system-ui, sans-serif; background: #f5f3ff; margin: 0; padding: 24px; }
  .card { background: white; border-radius: 16px; padding: 32px; max-width: 580px; margin: 0 auto; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #1a0845, #3b1fa3); border-radius: 12px; padding: 24px; color: white; margin-bottom: 24px; }
  .logo { font-size: 22px; font-weight: 900; margin-bottom: 4px; letter-spacing: -0.5px; }
  .subtitle { color: #a78bfa; font-size: 13px; }
  .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 8px; }
  .stat { background: #f5f3ff; border-radius: 10px; padding: 14px 12px; text-align: center; }
  .stat-value { font-size: 26px; font-weight: 900; color: #5b21b6; }
  .stat-label { font-size: 11px; color: #6b7280; margin-top: 3px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.3px; }
  .footer { color: #9ca3af; font-size: 12px; margin-top: 28px; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 20px; }
</style></head>
<body>
<div class="card">
  <div class="header">
    <div class="logo">wavit</div>
    <div class="subtitle">Biweekly Analytics Report</div>
  </div>
  <h2 style="color:#111827;margin:0 0 4px 0;font-size:20px;">${shop.name}</h2>
  <p style="color:#6b7280;font-size:13px;margin:0 0 20px 0;">
    Last ${days} days · ${shop.category}${shop.zip_code ? ` · ZIP ${shop.zip_code}` : ''}
  </p>

  <h3 style="color:#374151;font-size:14px;font-weight:700;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:0.5px;">Your Performance</h3>
  <div class="stat-grid">
    <div class="stat"><div class="stat-value">${total}</div><div class="stat-label">Total Joins</div></div>
    <div class="stat"><div class="stat-value">${served}</div><div class="stat-label">Served</div></div>
    <div class="stat"><div class="stat-value" style="color:${noShowRate > 30 ? '#dc2626' : noShowRate > 15 ? '#d97706' : '#059669'}">${noShowRate}%</div><div class="stat-label">No-Show Rate</div></div>
    <div class="stat"><div class="stat-value">${avgWaitMin}m</div><div class="stat-label">Avg Wait</div></div>
    <div class="stat"><div class="stat-value">${leftBeforeServed}</div><div class="stat-label">Left Early</div></div>
  </div>

  ${noShowRate > 30 && !competitors ? '<p style="background:#fef2f2;border-radius:8px;padding:12px;color:#991b1b;font-size:13px;margin-top:8px;">⚠️ High no-show rate — consider reducing your queue size or sending earlier reminders.</p>' : ''}

  ${competitorSection}

  <div class="footer">
    Powered by wavit · <a href="https://wavit.app" style="color:#7c3aed;text-decoration:none;">wavit.app</a><br>
    To unsubscribe, disable analytics reports in your admin dashboard.
  </div>
</div>
</body>
</html>`;
}

// GET /api/admin/:shopId/:secret/analytics
app.get('/api/admin/:shopId/:secret/analytics', async (req, res) => {
  try {
    const { shopId, secret } = req.params;
    const shopRes = await pool.query('SELECT * FROM shops WHERE id = $1', [shopId]);
    if (shopRes.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });
    if (shopRes.rows[0].admin_secret !== secret) return res.status(403).json({ error: 'Invalid admin link' });
    const analytics = await computeAnalytics(shopId, 14);
    const competitors = await computeCompetitorAnalytics(shopRes.rows[0], 14);
    res.json({ ...analytics, competitors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/:shopId/:secret/analytics/toggle
app.post('/api/admin/:shopId/:secret/analytics/toggle', async (req, res) => {
  try {
    const { shopId, secret } = req.params;
    const { enabled, email } = req.body;
    const shopRes = await pool.query('SELECT * FROM shops WHERE id = $1', [shopId]);
    if (shopRes.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });
    if (shopRes.rows[0].admin_secret !== secret) return res.status(403).json({ error: 'Invalid admin link' });
    await pool.query(
      'UPDATE shops SET analytics_enabled = $1, analytics_email = COALESCE($2, analytics_email) WHERE id = $3',
      [enabled, email || null, shopId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/:shopId/:secret/analytics/send — send report now
app.post('/api/admin/:shopId/:secret/analytics/send', async (req, res) => {
  try {
    const { shopId, secret } = req.params;
    const shopRes = await pool.query('SELECT * FROM shops WHERE id = $1', [shopId]);
    if (shopRes.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });
    if (shopRes.rows[0].admin_secret !== secret) return res.status(403).json({ error: 'Invalid admin link' });
    const shop = shopRes.rows[0];
    if (!shop.analytics_email) return res.status(400).json({ error: 'No email address set' });
    if (!resend) return res.status(503).json({ error: 'Email not configured (RESEND_API_KEY missing)' });
    const analytics = await computeAnalytics(shopId, 14);
    const competitors = await computeCompetitorAnalytics(shop, 14);
    await resend.emails.send({
      from: EMAIL_FROM,
      to: shop.analytics_email,
      subject: `Wavit Analytics — ${shop.name}`,
      html: buildAnalyticsEmail(shop, analytics, competitors),
    });
    await pool.query('UPDATE shops SET last_analytics_sent = $1 WHERE id = $2', [Date.now(), shopId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Biweekly analytics scheduler — runs every hour, sends if 14+ days since last send
async function analyticsScheduler() {
  if (!resend) return;
  const now = Date.now();
  const fourteenDays = 14 * 24 * 60 * 60 * 1000;
  try {
    const shopsRes = await pool.query(
      'SELECT * FROM shops WHERE analytics_enabled = TRUE AND analytics_email IS NOT NULL'
    );
    for (const shop of shopsRes.rows) {
      const lastSent = Number(shop.last_analytics_sent) || 0;
      if (now - lastSent >= fourteenDays) {
        const analytics = await computeAnalytics(shop.id, 14);
        const competitors = await computeCompetitorAnalytics(shop, 14);
        await resend.emails.send({
          from: EMAIL_FROM,
          to: shop.analytics_email,
          subject: `Wavit Analytics — ${shop.name}`,
          html: buildAnalyticsEmail(shop, analytics, competitors),
        });
        await pool.query('UPDATE shops SET last_analytics_sent = $1 WHERE id = $2', [now, shop.id]);
        console.log(`Analytics email sent to ${shop.analytics_email} for ${shop.name}`);
      }
    }
  } catch (err) {
    console.error('Analytics scheduler error:', err.message);
  }
}

setInterval(analyticsScheduler, 60 * 60 * 1000); // check every hour

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

// ── Business Registration ─────────────────────────────────────────────────────

// POST /api/register — public business registration submission
app.post('/api/register', async (req, res) => {
  try {
    const { businessName, ownerName, email, phone, category, zipCode, numStaff, avgServiceMinutes, message, allowRemoteJoin } = req.body;
    if (!businessName || !ownerName || !email || !phone || !category) {
      return res.status(400).json({ error: 'businessName, ownerName, email, phone, and category are required' });
    }
    const id = generateId();
    await pool.query(
      `INSERT INTO shop_registrations
        (id, business_name, owner_name, email, phone, category, zip_code, num_staff, avg_service_minutes, message, status, submitted_at, allow_remote_join)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending',$11,$12)`,
      [id, businessName.trim(), ownerName.trim(), email.trim(), phone.trim(), category.trim(),
       zipCode?.trim() || null, parseInt(numStaff, 10) || 1, parseInt(avgServiceMinutes, 10) || 15,
       message?.trim() || null, Date.now(), allowRemoteJoin !== false]
    );
    res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Super Admin ───────────────────────────────────────────────────────────────

const SUPERADMIN_SECRET = process.env.SUPERADMIN_SECRET;

function checkSuperAdmin(req, res) {
  const { secret } = req.params;
  if (!SUPERADMIN_SECRET) {
    res.status(503).json({ error: 'SUPERADMIN_SECRET not configured' });
    return false;
  }
  if (secret !== SUPERADMIN_SECRET) {
    res.status(403).json({ error: 'Invalid super-admin secret' });
    return false;
  }
  return true;
}

// GET /api/superadmin/:secret/registrations
app.get('/api/superadmin/:secret/registrations', async (req, res) => {
  if (!checkSuperAdmin(req, res)) return;
  try {
    const result = await pool.query(
      'SELECT * FROM shop_registrations ORDER BY submitted_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/superadmin/:secret/registrations/:id/approve
app.post('/api/superadmin/:secret/registrations/:id/approve', async (req, res) => {
  if (!checkSuperAdmin(req, res)) return;
  try {
    const regRes = await pool.query('SELECT * FROM shop_registrations WHERE id = $1', [req.params.id]);
    if (regRes.rows.length === 0) return res.status(404).json({ error: 'Registration not found' });
    const reg = regRes.rows[0];
    if (reg.status !== 'pending') return res.status(400).json({ error: 'Registration is not pending' });

    const shopId = generateId();
    const adminSecret = generateId() + generateId();

    await pool.query(
      `INSERT INTO shops (id, name, phone, category, zip_code, avg_service_minutes, num_staff, admin_secret, allow_remote_join)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [shopId, reg.business_name, reg.phone, reg.category, reg.zip_code,
       reg.avg_service_minutes, reg.num_staff, adminSecret, reg.allow_remote_join !== false]
    );

    await pool.query(
      'UPDATE shop_registrations SET status=$1, reviewed_at=$2 WHERE id=$3',
      ['approved', Date.now(), reg.id]
    );

    res.json({ success: true, shopId, adminSecret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/superadmin/:secret/registrations/:id/reject
app.post('/api/superadmin/:secret/registrations/:id/reject', async (req, res) => {
  if (!checkSuperAdmin(req, res)) return;
  try {
    const { note } = req.body;
    const regRes = await pool.query('SELECT * FROM shop_registrations WHERE id = $1', [req.params.id]);
    if (regRes.rows.length === 0) return res.status(404).json({ error: 'Registration not found' });
    if (regRes.rows[0].status !== 'pending') return res.status(400).json({ error: 'Registration is not pending' });

    await pool.query(
      'UPDATE shop_registrations SET status=$1, reviewed_at=$2, admin_note=$3 WHERE id=$4',
      ['rejected', Date.now(), note?.trim() || null, req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/superadmin/:secret/shops — list all approved shops
app.get('/api/superadmin/:secret/shops', async (req, res) => {
  if (!checkSuperAdmin(req, res)) return;
  try {
    const result = await pool.query('SELECT * FROM shops ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/superadmin/:secret/shops/:shopId — update shop settings
app.patch('/api/superadmin/:secret/shops/:shopId', async (req, res) => {
  if (!checkSuperAdmin(req, res)) return;
  try {
    const { shopId } = req.params;
    const shopRes = await pool.query('SELECT id FROM shops WHERE id = $1', [shopId]);
    if (shopRes.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });

    const { name, category, numStaff, avgServiceMinutes, queueOpen, allowRemoteJoin, openingTime, closingTime } = req.body;
    const updates = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name.trim()); }
    if (category !== undefined) { updates.push(`category = $${idx++}`); values.push(category.trim()); }
    if (numStaff !== undefined) { updates.push(`num_staff = $${idx++}`); values.push(Math.max(1, Math.min(20, parseInt(numStaff, 10) || 1))); }
    if (avgServiceMinutes !== undefined) { updates.push(`avg_service_minutes = $${idx++}`); values.push(Math.max(1, Math.min(120, parseInt(avgServiceMinutes, 10) || 15))); }
    if (queueOpen !== undefined) { updates.push(`queue_open = $${idx++}`); values.push(!!queueOpen); }
    if (allowRemoteJoin !== undefined) { updates.push(`allow_remote_join = $${idx++}`); values.push(!!allowRemoteJoin); }
    if (openingTime !== undefined) { updates.push(`opening_time = $${idx++}`); values.push(openingTime); }
    if (closingTime !== undefined) { updates.push(`closing_time = $${idx++}`); values.push(closingTime); }

    if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    values.push(shopId);
    await pool.query(`UPDATE shops SET ${updates.join(', ')} WHERE id = $${idx}`, values);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/superadmin/:secret/shops/:shopId — permanently delete shop and its tickets
app.delete('/api/superadmin/:secret/shops/:shopId', async (req, res) => {
  if (!checkSuperAdmin(req, res)) return;
  try {
    const { shopId } = req.params;
    const shopRes = await pool.query('SELECT id FROM shops WHERE id = $1', [shopId]);
    if (shopRes.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });

    await pool.query('DELETE FROM tickets WHERE shop_id = $1', [shopId]);
    await pool.query('DELETE FROM shops WHERE id = $1', [shopId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Static frontend (production) ─────────────────────────────────────────────

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('/{*splat}', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

// ── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || process.env.API_PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Wavit API running on port ${PORT}`);
});
