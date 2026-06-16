import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import pg from 'pg';
import twilio from 'twilio';
import { Resend } from 'resend';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// ── Session Management ────────────────────────────────────────────────────────
const adminSessions = new Map();      // token -> { shopId, expires }
const superadminSessions = new Map(); // token -> { expires }
const pinResetTokens = new Map();     // token -> { shopId, expiresAt }
const ADMIN_SESSION_TTL = 7 * 24 * 60 * 60 * 1000;      // 7 days
const SUPERADMIN_SESSION_TTL = 24 * 60 * 60 * 1000;      // 24 hours
const PIN_RESET_TTL = 30 * 60 * 1000;                    // 30 minutes

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      const key = parts.shift().trim();
      list[key] = decodeURIComponent(parts.join('=').trim());
    });
  }
  return list;
}

function createAdminSession(shopId) {
  const token = crypto.randomBytes(32).toString('hex');
  adminSessions.set(token, { shopId, expires: Date.now() + ADMIN_SESSION_TTL });
  return token;
}

function createSuperadminSession() {
  const token = crypto.randomBytes(32).toString('hex');
  superadminSessions.set(token, { expires: Date.now() + SUPERADMIN_SESSION_TTL });
  return token;
}

function checkAdminSession(req, res, shopId) {
  const cookies = parseCookies(req);
  // Accept token from cookie OR X-Admin-Token header (needed for Capacitor WebView)
  const token = cookies['admin_token'] || req.headers['x-admin-token'];
  if (!token) { res.status(401).json({ error: 'Not authenticated' }); return false; }
  const session = adminSessions.get(token);
  if (!session || session.expires < Date.now()) {
    adminSessions.delete(token);
    res.status(401).json({ error: 'Session expired — please log in again' });
    return false;
  }
  if (session.shopId !== shopId) { res.status(403).json({ error: 'Access denied' }); return false; }
  return true;
}

function checkSuperAdminSession(req, res) {
  if (!process.env.SUPERADMIN_SECRET) {
    res.status(503).json({ error: 'SUPERADMIN_SECRET not configured' });
    return false;
  }
  const cookies = parseCookies(req);
  // Accept token from cookie OR X-Superadmin-Token header (needed for Capacitor WebView)
  const token = cookies['superadmin_token'] || req.headers['x-superadmin-token'];
  if (!token) { res.status(401).json({ error: 'Not authenticated' }); return false; }
  const session = superadminSessions.get(token);
  if (!session || session.expires < Date.now()) {
    superadminSessions.delete(token);
    res.status(401).json({ error: 'Session expired — please log in again' });
    return false;
  }
  return true;
}

// ── AES-256-GCM field encryption ──────────────────────────────────────────────
const ENC_KEY_HEX = process.env.TICKET_ENCRYPTION_KEY;
if (!ENC_KEY_HEX || ENC_KEY_HEX.length !== 64) {
  console.error('FATAL: TICKET_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Exiting.');
  process.exit(1);
}
const ENC_KEY = Buffer.from(ENC_KEY_HEX, 'hex');
const ENC_PREFIX = 'enc:';

function encryptField(plaintext) {
  if (!plaintext) return plaintext;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ENC_PREFIX + Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decryptField(ciphertext) {
  if (!ciphertext) return ciphertext;
  if (!String(ciphertext).startsWith(ENC_PREFIX)) return ciphertext; // plaintext legacy value
  try {
    const buf = Buffer.from(String(ciphertext).slice(ENC_PREFIX.length), 'base64');
    const iv  = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, iv);
    decipher.setAuthTag(tag);
    return decipher.update(enc) + decipher.final('utf8');
  } catch {
    return '[decryption error]';
  }
}

function decryptTicket(ticket) {
  if (!ticket) return ticket;
  return { ...ticket, name: decryptField(ticket.name), phone: decryptField(ticket.phone) };
}

function decryptTickets(rows) {
  return rows.map(decryptTicket);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const app = express();

// ── Trust Replit's proxy so rate-limit can read the real client IP ─────────────
app.set('trust proxy', 1);

// ── Security headers (helmet) ─────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // disabled — React SPA manages its own CSP
  crossOriginEmbedderPolicy: false,
}));

// ── Allow widget route to be embedded in external iframes ─────────────────────
app.use((req, res, next) => {
  if (req.path.startsWith('/widget/')) {
    res.removeHeader('X-Frame-Options');
    res.setHeader('Content-Security-Policy', "frame-ancestors *");
  }
  next();
});

// ── CORS ──────────────────────────────────────────────────────────────────────
// Capacitor Android loads from capacitor://localhost or https://localhost.
// We must explicitly allow those origins (plus any Railway/Replit prod domain)
// so that credentialed cross-origin requests (cookies) work correctly.
const CAPACITOR_ORIGINS = [
  'capacitor://localhost',
  'https://localhost',
  'http://localhost',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no Origin header (e.g. server-to-server, curl)
    if (!origin) return callback(null, true);
    // Always allow known Capacitor WebView origins
    if (CAPACITOR_ORIGINS.includes(origin)) return callback(null, true);
    // Allow any localhost port (dev)
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
    // Allow any Railway, Replit, or custom domain configured via env
    const allowedDomain = process.env.ALLOWED_ORIGIN;
    if (allowedDomain && origin === allowedDomain) return callback(null, true);
    // Allow all other origins in development; restrict in production
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    // In production, mirror the origin (permissive — tighten by setting ALLOWED_ORIGIN)
    callback(null, true);
  },
  credentials: true,
}));

// ── Body size limits ──────────────────────────────────────────────────────────
// Logo uploads send base64 data URLs (~2.7 MB for a 2 MB image), so the JSON
// limit must be large enough to accommodate them. Public/unauthenticated routes
// receive small payloads, so this is acceptable.
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false, limit: '5mb' }));

// ── Rate limiters ─────────────────────────────────────────────────────────────
const rateLimitHandler = (_req, res) =>
  res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' });

// Global fallback — 6000 req / 15 min per IP
// Raised from 300 to handle shared shop WiFi: 25 customers polling every 3s
// = ~7,500 req / 15 min from one IP. 6,000 covers busy shops comfortably
// while still blocking sustained bot attacks (which easily exceed this).
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 6000,
  standardHeaders: true, legacyHeaders: false,
  handler: rateLimitHandler,
});
app.use(globalLimiter);

// Auth endpoints — 10 attempts / 20 min per IP (supplements the custom login throttle)
const authLimiter = rateLimit({
  windowMs: 20 * 60 * 1000, max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true, legacyHeaders: false,
  handler: rateLimitHandler,
});
app.use('/api/business-login', authLimiter);
app.use('/api/superadmin/login', authLimiter);
app.use('/api/auth/request-pin-reset', authLimiter);
app.use('/api/auth/reset-pin', authLimiter);

// Queue join — 10 joins / 5 min per IP (stops spam queue entries)
// Applied only to POST so that GET ticket-status polls are NOT rate-limited.
const joinLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  handler: rateLimitHandler,
});

// Business registration — 5 submissions / hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 5,
  standardHeaders: true, legacyHeaders: false,
  handler: rateLimitHandler,
});
app.use('/api/register', registerLimiter);

// Admin dashboard — 120 req / min per IP
const adminLimiter = rateLimit({
  windowMs: 60 * 1000, max: 120,
  standardHeaders: true, legacyHeaders: false,
  handler: rateLimitHandler,
});
app.use('/api/admin', adminLimiter);

// Super-admin — 60 req / min per IP
const superadminLimiter = rateLimit({
  windowMs: 60 * 1000, max: 60,
  standardHeaders: true, legacyHeaders: false,
  handler: rateLimitHandler,
});
app.use('/api/superadmin', superadminLimiter);

// SMS webhook — 150 req / min (Twilio can fire fast; allow headroom)
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, max: 150,
  standardHeaders: true, legacyHeaders: false,
  handler: rateLimitHandler,
});
app.use('/api/sms', webhookLimiter);

const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 20 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;

function isValidPin(pin) {
  return /^\d{6}$/.test(String(pin || ''));
}

const SHA256_RE = /^[0-9a-f]{64}$/;
const BCRYPT_ROUNDS = 10;

async function hashPin(pin) {
  return bcrypt.hash(String(pin), BCRYPT_ROUNDS);
}

async function verifyPin(pin, hash) {
  if (!hash) return false;
  if (SHA256_RE.test(hash)) {
    return crypto.createHash('sha256').update(String(pin)).digest('hex') === hash;
  }
  return bcrypt.compare(String(pin), hash);
}

async function pinInUse(pin, excludingShopId = null) {
  const result = excludingShopId
    ? await pool.query('SELECT id, admin_pin_hash FROM shops WHERE id <> $1', [excludingShopId])
    : await pool.query('SELECT id, admin_pin_hash FROM shops');
  const checks = await Promise.all(result.rows.map(s => verifyPin(pin, s.admin_pin_hash)));
  return checks.some(Boolean);
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function getLoginKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded) ? forwarded[0] : (forwarded || req.ip || req.socket.remoteAddress || 'unknown');
  return String(ip).split(',')[0].trim();
}

function checkLoginLimit(req) {
  const key = getLoginKey(req);
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 0, resetAt: now + LOGIN_WINDOW_MS });
    return { allowed: true, key, remaining: LOGIN_MAX_ATTEMPTS };
  }
  if (entry.count >= LOGIN_MAX_ATTEMPTS) {
    return { allowed: false, key, retryAfterMs: entry.resetAt - now, remaining: 0 };
  }
  return { allowed: true, key, remaining: LOGIN_MAX_ATTEMPTS - entry.count };
}

function recordFailedLogin(key) {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

function clearLoginLimit(key) {
  loginAttempts.delete(key);
}

// pinHashInUse removed — replaced by pinInUse(plaintext pin) using bcrypt
async function _deprecated_pinHashInUse(pinHash, excludingShopId = null) {
  const result = excludingShopId
    ? await pool.query('SELECT id FROM shops WHERE admin_pin_hash = $1 AND id <> $2 LIMIT 1', [pinHash, excludingShopId])
    : await pool.query('SELECT id FROM shops WHERE admin_pin_hash = $1 LIMIT 1', [pinHash]);
  return result.rows.length > 0;
}

function stripPinHash(record) {
  if (!record) return record;
  const { admin_pin_hash, ...safeRecord } = record;
  return safeRecord;
}

const isExternalDB = process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes('localhost') &&
  !process.env.DATABASE_URL.includes('127.0.0.1') &&
  !process.env.DATABASE_URL.includes('helium');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
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
        admin_pin_hash TEXT,
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
        admin_pin_hash TEXT,
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
      `ALTER TABLE shops ADD COLUMN IF NOT EXISTS force_closed BOOLEAN NOT NULL DEFAULT false`,
      `ALTER TABLE shops ADD COLUMN IF NOT EXISTS admin_pin_hash TEXT`,
      `ALTER TABLE shops ADD COLUMN IF NOT EXISTS closed_days TEXT NOT NULL DEFAULT ''`,
      `ALTER TABLE shops ADD COLUMN IF NOT EXISTS website TEXT`,
      `ALTER TABLE shops ADD COLUMN IF NOT EXISTS queue_opened_at BIGINT NOT NULL DEFAULT 0`,
    ];
    const ticketMigrations = [
      `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS served_at BIGINT`,
      `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS exited_at BIGINT`,
      `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS reminder_sent_at BIGINT`,
      `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS approaching_sent_at BIGINT`,
      `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS party_size INTEGER NOT NULL DEFAULT 1`,
      `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS additional_info TEXT`,
    ];
    const regMigrations = [
      `ALTER TABLE shop_registrations ADD COLUMN IF NOT EXISTS zip_code TEXT`,
      `ALTER TABLE shop_registrations ADD COLUMN IF NOT EXISTS num_staff INTEGER NOT NULL DEFAULT 1`,
      `ALTER TABLE shop_registrations ADD COLUMN IF NOT EXISTS avg_service_minutes INTEGER NOT NULL DEFAULT 15`,
      `ALTER TABLE shop_registrations ADD COLUMN IF NOT EXISTS message TEXT`,
      `ALTER TABLE shop_registrations ADD COLUMN IF NOT EXISTS admin_note TEXT`,
      `ALTER TABLE shop_registrations ADD COLUMN IF NOT EXISTS reviewed_at BIGINT`,
      `ALTER TABLE shop_registrations ADD COLUMN IF NOT EXISTS allow_remote_join BOOLEAN NOT NULL DEFAULT true`,
      `ALTER TABLE shop_registrations ADD COLUMN IF NOT EXISTS admin_pin_hash TEXT`,
      `ALTER TABLE shop_registrations ADD COLUMN IF NOT EXISTS address TEXT`,
      `ALTER TABLE shop_registrations ADD COLUMN IF NOT EXISTS city TEXT`,
      `ALTER TABLE shop_registrations ADD COLUMN IF NOT EXISTS state TEXT`,
      `ALTER TABLE shop_registrations ADD COLUMN IF NOT EXISTS num_doctors INTEGER`,
      `ALTER TABLE shop_registrations ADD COLUMN IF NOT EXISTS website TEXT`,
    ];
    for (const sql of [...shopMigrations, ...ticketMigrations, ...regMigrations]) {
      await pool.query(sql);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS page_content (
        page_key TEXT PRIMARY KEY,
        content JSONB NOT NULL,
        updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
      )
    `);

    // Seed default content (only inserts if the row doesn't exist yet)
    const defaultAbout = {
      mission_body: "Waiting rooms are outdated. Barbershops, salons, and local businesses lose customers to frustration every day. We built Wavit so you can see your exact wait time right from your phone — no guessing, no crowding the waiting area. Businesses get a smoother flow with fewer no-shows and happier clients.",
      mission_quote: "Eliminate unnecessary waiting — for customers who value their time and businesses who want happier clients.",
      cta_tagline: "Find a shop near you and join their queue in under 30 seconds.",
      features: [
        { title: "See Your Wait Time From Your Phone", desc: "Check your live position and exact wait time right on your phone — updated every few seconds, no app needed." },
        { title: "SMS Notifications", desc: "Get a text when you're almost up. No app download, no account needed — ever." },
        { title: "Live & Shared", desc: "The queue is live for everyone. Real data, real time — powered by a real database." },
        { title: "Smart Auto-Remove", desc: "If you don't respond after being called, we check in by text and auto-remove you to keep things moving." },
      ],
    };
    const defaultHowToUse = {
      customer_steps: [
        { title: "Find Your Shop", desc: "Scan the QR code posted at the shop entrance, or go to the Wavit website and search for the business by name." },
        { title: "Check In to the Queue", desc: "Enter your name and phone number to join the queue. You'll receive a link to your live queue status." },
        { title: "See Your Wait Time From Your Phone", desc: "Your queue page shows your live position and exact estimated wait time — updated every few seconds, right on your phone screen." },
        { title: "Get Texted When It's Your Turn", desc: "When your turn is approaching, Wavit sends you an SMS alert. Reply YES to confirm you're ready, or the system will check in with you automatically." },
      ],
      customer_faqs: [
        { q: "Do I need to download an app?", a: "No. Everything works in your phone's web browser. Just scan the QR code or visit the site." },
        { q: "How do I check my wait time?", a: "After checking in, you'll get a link to your personal queue page. Open it on your phone to see your live wait time updated in real time." },
        { q: "What if I miss my turn?", a: "Wavit will text you when your turn is near. If you don't respond, the system will check in and may remove you from the queue to keep things moving for others." },
        { q: "How do I stop receiving texts?", a: "Reply STOP to any text message from Wavit and you'll be opted out immediately." },
      ],
      business_steps: [
        { title: "Apply to Join Wavit", desc: "Go to the Register page and fill out your business details. Once approved, you'll receive your unique admin link." },
        { title: "Log In With Your PIN", desc: "Use the Login page and enter your 6-digit business PIN to access your admin dashboard. Keep this PIN safe — it's how you manage your queue." },
        { title: "Open Your Queue", desc: "In the admin panel, toggle your queue open. Customers can now check in via your QR code or by searching your business on the site." },
        { title: "Serve Customers", desc: "When you're ready for the next person, tap \"Serve Next\" in your admin panel. Wavit automatically texts the next customer that their turn is coming up." },
      ],
      business_faqs: [
        { q: "How do I log in to my admin panel?", a: "Go to the Login page and enter your 6-digit business PIN. You'll be redirected straight to your dashboard." },
        { q: "What if I forget my PIN?", a: "Contact us at wavitapp@gmail.com and we can reset it for you." },
        { q: "Can I change my settings after setup?", a: "Yes. Inside the admin panel you can update your hours, staff count, service time, PIN, and more at any time." },
        { q: "How do customers get notified?", a: "Wavit sends SMS texts automatically. When you tap \"Serve Next,\" the customer receives a text that their turn is approaching." },
      ],
    };
    const defaultTerms = {
      last_updated: "April 2025",
      sections: [
        { heading: "1. Acceptance of Terms", body: "By accessing or using Wavit (\"the Service,\" \"we,\" \"us\"), you agree to be bound by these Terms of Service. If you do not agree, please do not use Wavit. These terms apply to all visitors, customers, and registered businesses." },
        { heading: "2. Description of Service", body: "Wavit is a digital queue management platform that lets local businesses manage wait lines and allows their customers to join virtual queues and receive status updates via SMS." },
        { heading: "3. SMS Notifications & Consent", body: "By joining a queue, you consent to receive SMS text messages from Wavit regarding your queue position and status at the business you joined. Message frequency varies. Message and data rates may apply.\n\nTo stop receiving messages at any time, reply STOP to any text message from us. After opting out, you will receive one final confirmation message and no further messages will be sent. You may re-opt-in at any time by joining a queue again.\n\nFor help, reply HELP to any message or contact us at wavitapp@gmail.com." },
        { heading: "4. Business Accounts", body: "Businesses that apply to use Wavit must provide accurate information. Wavit reserves the right to approve, reject, or suspend any business account at our sole discretion. Business owners are responsible for keeping their account information current and for all activity on their account." },
        { heading: "5. Acceptable Use", body: "You agree not to misuse the Service — including but not limited to: joining queues with false information, attempting to disrupt or overload the platform, or using the Service for any unlawful purpose." },
        { heading: "6. Limitation of Liability", body: "Wavit is provided \"as is.\" We do not guarantee uninterrupted service, the accuracy of wait times, or that businesses will be available. To the maximum extent permitted by law, Wavit shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service." },
        { heading: "7. Privacy", body: "Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference." },
        { heading: "8. Changes to Terms", body: "We may update these Terms from time to time. Continued use of the Service after changes are posted constitutes acceptance of the revised Terms." },
        { heading: "9. Contact", body: "Questions about these Terms? Email us at wavitapp@gmail.com." },
      ],
    };
    const defaultWebDev = { body: 'Web development content coming soon.' };
    const defaultForClinics = {
      body: "Clinics on Wavit only need your first name to hold your spot in line. No phone number required.\n\nScan the QR code at the front desk to instantly join the queue — no app download needed.\n\nVisit www.wavit.cc or open the Wavit app to see how many people are ahead of you in real time.\n\nWait wherever you like. The queue updates live so you always know your place. There's no need to sit in the waiting room.\n\nFrequently Asked Questions:\n\nDo I need to download an app?\nNo. Everything works in your phone's web browser. The QR code takes you directly to the clinic's queue.\n\nDo I need to give my phone number?\nNo. Clinics on Wavit only collect your first name to hold your spot in line. No phone number required.\n\nHow do I know my place in line?\nAfter joining, check www.wavit.cc or the Wavit app to see live queue lengths for the clinic.\n\nWhat happens when it's my turn?\nThe clinic will call your name. Your spot is automatically removed from the queue when you go in.\n\nCan I leave and come back?\nYes. The queue is live online so you can check your place anytime. Just make sure to be back before your name is called."
    };
    const seeds = [
      ['about', defaultAbout],
      ['how_to_use', defaultHowToUse],
      ['terms', defaultTerms],
      ['web_dev', defaultWebDev],
      ['for_clinics', defaultForClinics],
    ];
    for (const [key, content] of seeds) {
      await pool.query(
        `INSERT INTO page_content (page_key, content, updated_at) VALUES ($1, $2, $3) ON CONFLICT (page_key) DO NOTHING`,
        [key, JSON.stringify(content), Date.now()]
      );
    }

    console.log('Database schema ready');
  } catch (err) {
    console.error('Schema init error:', err.message);
  }
}
await initSchema();

// ── Auto open/close scheduler ─────────────────────────────────────────────────

function toMinutes(timeStr) {
  const [h, m] = (timeStr || '00:00').split(':').map(Number);
  return h * 60 + m;
}

// Get current time in US Central (handles CST/CDT automatically)
function getCentralMinutes() {
  const centralStr = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
  const central = new Date(centralStr);
  return central.getHours() * 60 + central.getMinutes();
}

function getCentralDayOfWeek() {
  const centralStr = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
  return new Date(centralStr).getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
}

function isClosedDay(shop) {
  if (!shop.closed_days) return false;
  const closedList = shop.closed_days.split(',').map(Number).filter(n => !isNaN(n));
  return closedList.includes(getCentralDayOfWeek());
}

async function runSchedule() {
  try {
    const shopsRes = await pool.query('SELECT * FROM shops');
    const nowMs = Date.now();
    const currentMinutes = getCentralMinutes();

    for (const shop of shopsRes.rows) {
      const openMin  = toMinutes(shop.opening_time  || '09:00');
      const closeMin = toMinutes(shop.closing_time  || '17:00');

      const isOpeningWindow = currentMinutes >= openMin && currentMinutes < openMin + 2;
      const isDuringHours   = currentMinutes >= openMin && currentMinutes < closeMin;
      const isPastClose     = currentMinutes >= closeMin;

      // ── Closed day: keep queue closed, no auto-open ───────────────────────
      if (isClosedDay(shop)) {
        if (shop.queue_open) {
          await pool.query('UPDATE shops SET queue_open = false, force_closed = true WHERE id = $1', [shop.id]);
          console.log(`[CT ${currentMinutes}] Closed (day off): ${shop.name}`);
        }
        continue;
      }

      // ── During business hours ──────────────────────────────────────────────
      if (isDuringHours) {
        if (isOpeningWindow && (shop.force_closed || !shop.queue_open)) {
          // At opening time: always open and clear force-close
          await pool.query(
            'UPDATE shops SET queue_open = true, force_closed = false, queue_opened_at = $2 WHERE id = $1',
            [shop.id, Date.now()]
          );
          console.log(`[CT ${currentMinutes}] Auto-opened at opening time: ${shop.name}`);
        } else if (!shop.force_closed && !shop.queue_open) {
          // Mid-day safety net: re-open if somehow closed without force flag
          await pool.query('UPDATE shops SET queue_open = true, queue_opened_at = $2 WHERE id = $1', [shop.id, Date.now()]);
          console.log(`[CT ${currentMinutes}] Auto-opened mid-day: ${shop.name}`);
        }
        continue;
      }

      // ── Past closing time: close after 15 min of no activity ─────────────
      // Uses GREATEST(queue_opened_at, last_join) so manually reopening after
      // hours resets the 15-min window even if no new patients have joined yet.
      if (isPastClose && shop.queue_open) {
        const lastJoinRes = await pool.query(
          'SELECT MAX(joined_at) AS last_join FROM tickets WHERE shop_id = $1',
          [shop.id]
        );
        const lastJoin = lastJoinRes.rows[0]?.last_join ? Number(lastJoinRes.rows[0].last_join) : 0;
        const queueOpenedAt = shop.queue_opened_at ? Number(shop.queue_opened_at) : 0;
        const lastActivity = Math.max(lastJoin, queueOpenedAt);
        const msSinceActivity = lastActivity > 0 ? nowMs - lastActivity : Infinity;
        const minSince = Math.round(msSinceActivity / 60000);

        console.log(`[CT ${currentMinutes}] After-hours check "${shop.name}": lastJoin=${lastJoin ? new Date(lastJoin).toLocaleTimeString('en-US',{timeZone:'America/Chicago'}) : 'never'} queueOpenedAt=${queueOpenedAt ? new Date(queueOpenedAt).toLocaleTimeString('en-US',{timeZone:'America/Chicago'}) : 'never'} → ${minSince}min since last activity`);

        if (msSinceActivity >= 15 * 60 * 1000) {
          await pool.query('UPDATE shops SET queue_open = false WHERE id = $1', [shop.id]);
          console.log(`[CT ${currentMinutes}] Soft-closed (15 min no activity after closing): ${shop.name}`);
        } else {
          console.log(`[CT ${currentMinutes}] Keeping open — only ${minSince}min since last activity: ${shop.name}`);
        }
      }

      // ── Before opening: re-open is blocked until opening time ────────────
      // (force_closed is cleared at opening window above; no action needed here)
    }
  } catch (err) {
    console.error('[schedule] Error:', err.message);
  }
}

// Run immediately then every minute
runSchedule();
setInterval(runSchedule, 60 * 1000);

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

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (raw.trim().startsWith('+')) return `+${digits}`;
  return `+1${digits}`;
}

async function sendSMS(to, body) {
  if (!twilioClient) return;
  const normalized = normalizePhone(to);
  try {
    await twilioClient.messages.create({ from: TWILIO_PHONE, to: normalized, body });
    console.log(`SMS sent to ${normalized}`);
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

  return { ...shop, queue: decryptTickets(ticketRes.rows) };
}

// ── Shared slot-time builder ──────────────────────────────────────────────────
// Returns one sorted slot-time array (ms until each staff member is free).
// Overdue tickets get a minimum of 60 s remaining so they never read as
// instantly free, which was causing "No wait" when all staff were occupied.
function buildSlotTimes(shop, now) {
  const avgMs = shop.avg_service_minutes * 60 * 1000;
  const numStaff = Math.max(1, shop.num_staff || 1);
  const servingNow = (shop.queue || []).filter(t => t.served_at && !t.exited_at);

  // For overdue tickets clamp remaining time to a minimum of 60 s so the slot
  // never appears instantly free just because the average has elapsed.
  const MIN_REMAINING_MS = 60 * 1000;
  const slotTimes = servingNow.map(t => {
    const elapsed = now - Number(t.served_at);
    const remaining = avgMs - elapsed;
    return remaining > 0 ? remaining : MIN_REMAINING_MS;
  });

  // Pad with immediately-available slots for any unstaffed positions
  const freeSlots = Math.max(0, numStaff - servingNow.length);
  for (let i = 0; i < freeSlots; i++) slotTimes.push(0);

  slotTimes.sort((a, b) => a - b);
  return { slotTimes, avgMs, numStaff, servingNow };
}

// ── Per-ticket earliest-barber wait time ─────────────────────────────────────
// Returns the ms until a specific waiting ticket gets served.
function calcPersonalWaitMs(shop, ticketId) {
  const now = Date.now();
  const { slotTimes, avgMs } = buildSlotTimes(shop, now);
  const waitingQueue = (shop.queue || []).filter(t => !t.served_at && !t.exited_at);

  for (let i = 0; i < waitingQueue.length; i++) {
    slotTimes.sort((a, b) => a - b);
    const startTime = slotTimes[0];
    if (waitingQueue[i].id === ticketId) return startTime;
    slotTimes[0] = startTime + avgMs;
  }

  return 0; // Not in the waiting queue (already being served or exited)
}

// ── Earliest-barber-available wait time ───────────────────────────────────────
// Shows what the NEXT person to join would wait.
function calcWaitRange(shop) {
  const now = Date.now();
  const { slotTimes, avgMs, numStaff, servingNow } = buildSlotTimes(shop, now);
  const waitingQueue = (shop.queue || []).filter(t => !t.served_at && !t.exited_at);

  // Any genuinely free staff slot → next joiner goes straight in
  const freeSlots = Math.max(0, numStaff - servingNow.length);
  if (freeSlots > 0) return 'No wait';
  if (servingNow.length === 0) return 'No wait';

  // Schedule every waiting person through the earliest available slot
  for (let i = 0; i < waitingQueue.length; i++) {
    slotTimes.sort((a, b) => a - b);
    slotTimes[0] += avgMs;
  }

  // The hypothetical next joiner takes whichever slot opens first
  slotTimes.sort((a, b) => a - b);
  const waitMs = slotTimes[0];

  if (waitMs <= 0) return 'No wait';

  const waitMin = waitMs / 60000;
  const min = Math.max(1, Math.round(waitMin * 0.8));
  const max = Math.round(Math.max(waitMin * 1.2, waitMin + 1));
  return `${min}–${max} min`;
}

// ── Advance next waiting person into a free slot ──────────────────────────────
async function advanceQueue(shopId) {
  const now = Date.now();
  const shop = await getShopWithQueue(shopId);
  if (!shop) return;
  if (shop.category === 'Clinic') return; // Clinics never auto-advance

  const numStaff = Math.max(1, shop.num_staff || 1);
  const servingNow = (shop.queue || []).filter(t => t.served_at && !t.exited_at);
  const waitingQueue = (shop.queue || []).filter(t => !t.served_at && !t.exited_at);

  const freeSlots = Math.max(0, numStaff - servingNow.length);
  const toAdvance = waitingQueue.slice(0, freeSlots);

  for (const next of toAdvance) {
    await pool.query('UPDATE tickets SET served_at = $1 WHERE id = $2', [now, next.id]);
    await sendSMS(next.phone, `It's your turn at ${shop.name}! Please head to the front now. Reply STOP to opt out.`);
  }

  if (toAdvance.length > 0) {
    await pool.query('UPDATE shops SET current_service_started_at = $1 WHERE id = $2', [now, shopId]);
  }
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
      return stripPinHash({ ...shop, queue: ticketRes.rows, waitRange: calcWaitRange({ ...shop, queue: ticketRes.rows }) });
    }));
    res.json(shops);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/shops/by-slug/:slug — lookup shop by name slug (e.g. wavit.cc/myshop)
app.get('/api/shops/by-slug/:slug', async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase().replace(/[^a-z0-9]/g, '');
    const shopsRes = await pool.query('SELECT * FROM shops');
    const shop = shopsRes.rows.find(s =>
      s.name.toLowerCase().replace(/[^a-z0-9]/g, '') === slug
    );
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    const ticketRes = await pool.query(
      'SELECT * FROM tickets WHERE shop_id = $1 AND exited_at IS NULL ORDER BY joined_at ASC',
      [shop.id]
    );
    const fullShop = { ...shop, queue: ticketRes.rows };
    const isClinic = shop.category === 'Clinic';
    const publicShop = isClinic
      ? { ...fullShop, queue: fullShop.queue.map(t => ({ ...t, name: '', phone: '' })) }
      : fullShop;
    res.json(stripPinHash({ ...publicShop, waitRange: calcWaitRange(fullShop) }));
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
    const isClinic = shop.category === 'Clinic';
    const publicShop = isClinic
      ? { ...shop, queue: shop.queue.map(t => ({ ...t, name: '', phone: '' })) }
      : shop;
    res.json(stripPinHash({ ...publicShop, waitRange: calcWaitRange(shop) }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/tickets — join queue
app.post('/api/tickets', joinLimiter, async (req, res) => {
  const { shopId, name, phone, additionalInfo } = req.body;
  if (!shopId || !name) {
    return res.status(400).json({ error: 'shopId and name are required' });
  }

  try {
    const shop = await getShopWithQueue(shopId);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    if (shop.queue_open === false) return res.status(403).json({ error: 'Queue is currently closed' });

    const isClinic = shop.category === 'Clinic';

    if (!isClinic && !phone) {
      return res.status(400).json({ error: 'shopId, name, and phone are required' });
    }

    // ── Duplicate check — phone numbers are encrypted so we must decrypt and compare ──
    // Skip duplicate check for clinics (no phone collected)
    if (!isClinic && phone) {
      const normalizedPhone = normalizePhone(phone.trim());
      const activeRes = await pool.query(
        'SELECT id, phone FROM tickets WHERE shop_id = $1 AND exited_at IS NULL',
        [shopId]
      );
      const alreadyInQueue = activeRes.rows.some(
        r => decryptField(r.phone) === normalizedPhone
      );
      if (alreadyInQueue) {
        return res.status(409).json({ error: 'This phone number is already in the queue. You can only join once at a time.' });
      }
    }

    const waitRange = calcWaitRange(shop);
    const id = generateId();
    const now = Date.now();
    const sanitizedInfo = additionalInfo ? String(additionalInfo).slice(0, 500) : null;
    const phoneToStore = isClinic ? '' : (phone || '').trim();

    await pool.query(
      'INSERT INTO tickets (id, shop_id, name, phone, joined_at, party_size, additional_info) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, shopId, encryptField(name.trim()), encryptField(phoneToStore), now, 1, sanitizedInfo]
    );

    // Clinics don't auto-serve — everyone waits until front desk sends them to doctor
    const numStaff = Math.max(1, shop.num_staff || 1);
    const servingNow = shop.queue.filter(t => t.served_at && !t.exited_at);
    const servedImmediately = !isClinic && servingNow.length < numStaff;
    if (servedImmediately) {
      await pool.query('UPDATE tickets SET served_at = $1 WHERE id = $2', [now, id]);
      await pool.query('UPDATE shops SET current_service_started_at = $1 WHERE id = $2', [now, shopId]);
    }

    const smsBody = servedImmediately
      ? `Welcome to Wavit! A staff member is ready for you now at ${shop.name}. Head to the front! Track your spot: ${APP_DOWNLOAD_LINK} Reply STOP to opt out.`
      : `Welcome to Wavit! You've joined the queue at ${shop.name}. Estimated wait: ${waitRange}. Track your spot: ${APP_DOWNLOAD_LINK} Reply STOP to opt out.`;
    await sendSMS(phone.trim(), smsBody);

    const ticketRes = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
    res.json(decryptTicket(ticketRes.rows[0]));
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

    const ticket = decryptTicket(ticketRes.rows[0]);
    const activeQueue = shop.queue.filter(t => !t.served_at);
    const position = activeQueue.findIndex(t => t.id === ticketId) + 1;
    const myWaitMs = calcPersonalWaitMs(shop, ticketId);

    res.json({ ticket, position: position || null, myWaitMs, shop: stripPinHash({ ...shop, waitRange: calcWaitRange(shop) }) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/tickets/:shopId/:ticketId — leave queue
// For clinics: hard-deletes the row — patient data is never retained.
app.delete('/api/tickets/:shopId/:ticketId', async (req, res) => {
  try {
    const { shopId, ticketId } = req.params;
    const ticketRes = await pool.query(
      'SELECT t.*, s.category FROM tickets t JOIN shops s ON s.id = t.shop_id WHERE t.id = $1 AND t.shop_id = $2',
      [ticketId, shopId]
    );
    if (ticketRes.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });

    const isClinic = ticketRes.rows[0].category === 'Clinic';
    if (isClinic) {
      await pool.query('DELETE FROM tickets WHERE id = $1', [ticketId]);
    } else {
      await pool.query('UPDATE tickets SET exited_at = $1 WHERE id = $2', [Date.now(), ticketId]);
      await advanceQueue(shopId);
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Admin Routes ─────────────────────────────────────────────────────────────

app.post('/api/business-login', async (req, res) => {
  const limit = checkLoginLimit(req);
  if (!limit.allowed) {
    return res.status(429).json({
      error: 'Too many attempts. Please wait before trying again.',
      retryAfterSeconds: Math.ceil(limit.retryAfterMs / 1000),
    });
  }

  try {
    const { pin } = req.body;
    if (!isValidPin(pin)) {
      recordFailedLogin(limit.key);
      return res.status(400).json({ error: 'Enter a valid 6-digit PIN.' });
    }

    const allShops = await pool.query('SELECT id, name, admin_secret, admin_pin_hash FROM shops');

    // Verify PIN against every shop in parallel (handles both SHA-256 legacy and bcrypt)
    const matchResults = await Promise.all(
      allShops.rows.map(async s => (await verifyPin(pin, s.admin_pin_hash)) ? s : null)
    );
    const matches = matchResults.filter(Boolean);

    if (matches.length === 0) {
      recordFailedLogin(limit.key);
      return res.status(401).json({ error: 'Invalid PIN.' });
    }
    if (matches.length > 1) {
      recordFailedLogin(limit.key);
      return res.status(409).json({ error: 'This PIN matches more than one business. Please contact support to reset it.' });
    }

    clearLoginLimit(limit.key);
    const shop = matches[0];

    // Lazy upgrade: if stored hash is still SHA-256, silently re-hash with bcrypt
    if (SHA256_RE.test(shop.admin_pin_hash)) {
      const newHash = await hashPin(pin);
      await pool.query('UPDATE shops SET admin_pin_hash = $1 WHERE id = $2', [newHash, shop.id]);
    }

    const token = createAdminSession(shop.id);
    // SameSite=none + Secure required for cross-origin Capacitor WebView requests.
    // In HTTP dev environments SameSite=lax is used as a fallback.
    const isSecure = process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true';
    res.cookie('admin_token', token, {
      httpOnly: true,
      sameSite: isSecure ? 'none' : 'lax',
      secure: isSecure,
      maxAge: ADMIN_SESSION_TTL,
      path: '/',
    });
    // Also return token in JSON body — used by Capacitor WebView as X-Admin-Token header
    // since Android WebView frequently blocks cross-origin cookies.
    res.json({ success: true, shopId: shop.id, shopName: shop.name, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/superadmin/login — issue superadmin session cookie
app.post('/api/superadmin/login', (req, res) => {
  const { pin } = req.body;
  const SA_SECRET = process.env.SUPERADMIN_SECRET;
  if (!SA_SECRET) return res.status(503).json({ error: 'SUPERADMIN_SECRET not configured' });
  if (!pin || pin.trim() !== SA_SECRET.trim()) return res.status(403).json({ error: 'Incorrect PIN' });
  const token = createSuperadminSession();
  const isSecureSA = process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true';
  res.cookie('superadmin_token', token, {
    httpOnly: true,
    sameSite: isSecureSA ? 'none' : 'lax',
    secure: isSecureSA,
    maxAge: SUPERADMIN_SESSION_TTL,
    path: '/',
  });
  // Also return token in JSON body — used by Capacitor WebView as X-Superadmin-Token header
  res.json({ success: true, token });
});

// POST /api/admin/logout — clear admin session cookie
app.post('/api/admin/logout', (req, res) => {
  const cookies = parseCookies(req);
  const token = cookies['admin_token'];
  if (token) adminSessions.delete(token);
  res.clearCookie('admin_token', { path: '/' });
  res.json({ success: true });
});

// POST /api/superadmin/logout — clear superadmin session cookie
app.post('/api/superadmin/logout', (req, res) => {
  const cookies = parseCookies(req);
  const token = cookies['superadmin_token'];
  if (token) superadminSessions.delete(token);
  res.clearCookie('superadmin_token', { path: '/' });
  res.json({ success: true });
});

// POST /api/auth/request-pin-reset — send a reset link to the shop's registered email
app.post('/api/auth/request-pin-reset', async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Email is required' });
  if (!resend) return res.status(503).json({ error: 'Email service not configured' });

  try {
    const normalised = email.trim().toLowerCase();
    // Find shop by email or analytics_email (case-insensitive)
    const result = await pool.query(
      `SELECT id, name, email, analytics_email FROM shops
       WHERE LOWER(COALESCE(email,'')) = $1 OR LOWER(COALESCE(analytics_email,'')) = $1
       LIMIT 1`,
      [normalised]
    );

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({ success: true });
    }

    const shop = result.rows[0];
    const to = shop.email || shop.analytics_email;

    // Generate a secure token (expires in 30 min)
    const token = crypto.randomBytes(32).toString('hex');
    pinResetTokens.set(token, { shopId: shop.id, expiresAt: Date.now() + PIN_RESET_TTL });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${baseUrl}/reset-pin?token=${token}`;

    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `Reset your Wavit PIN — ${shop.name}`,
      html: buildPinResetEmailHtml(shop.name, resetUrl),
    });

    res.json({ success: true });
  } catch (err) {
    console.error('PIN reset request error:', err);
    res.status(500).json({ error: 'Failed to send reset email' });
  }
});

// POST /api/auth/reset-pin — validate token and set a new PIN
app.post('/api/auth/reset-pin', async (req, res) => {
  const { token, pin } = req.body;
  if (!token || typeof token !== 'string') return res.status(400).json({ error: 'Token is required' });
  if (!pin || !/^\d{6}$/.test(pin)) return res.status(400).json({ error: 'PIN must be exactly 6 digits' });

  const entry = pinResetTokens.get(token);
  if (!entry) return res.status(400).json({ error: 'Reset link is invalid or has already been used' });
  if (entry.expiresAt < Date.now()) {
    pinResetTokens.delete(token);
    return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
  }

  try {
    const shopRes = await pool.query('SELECT id FROM shops WHERE id = $1', [entry.shopId]);
    if (shopRes.rows.length === 0) {
      pinResetTokens.delete(token);
      return res.status(404).json({ error: 'Shop not found' });
    }

    const newHash = await hashPin(pin);
    await pool.query('UPDATE shops SET admin_pin_hash = $1 WHERE id = $2', [newHash, entry.shopId]);
    pinResetTokens.delete(token);

    res.json({ success: true });
  } catch (err) {
    console.error('PIN reset error:', err);
    res.status(500).json({ error: 'Failed to reset PIN' });
  }
});

function buildPinResetEmailHtml(shopName, resetUrl) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:'Helvetica Neue',Arial,sans-serif;background:#f8f7ff;margin:0;padding:0;color:#111}
  .wrap{max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb}
  .header{background:linear-gradient(135deg,#1a0845,#1d3a8a);padding:28px 32px 22px;text-align:center}
  .logo{font-size:36px;font-weight:900;color:#60a5fa;letter-spacing:-1px}
  .body{padding:32px}
  h2{font-size:18px;font-weight:800;margin:0 0 10px;color:#111}
  p{font-size:14px;line-height:1.7;color:#4b5563;margin:0 0 16px}
  .btn{display:inline-block;background:#2563eb;color:#fff;font-weight:800;font-size:14px;padding:14px 32px;border-radius:10px;text-decoration:none;margin:8px 0}
  .note{font-size:12px;color:#9ca3af;line-height:1.6}
  .footer{padding:16px 32px;border-top:1px solid #f3f4f6;font-size:11px;color:#9ca3af;text-align:center}
</style></head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo">wavit</div>
  </div>
  <div class="body">
    <h2>Reset your Wavit PIN</h2>
    <p>We received a request to reset the admin PIN for <strong>${escHtml(shopName)}</strong>. Click the button below to choose a new 6-digit PIN.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${resetUrl}" class="btn">Reset My PIN</a>
    </div>
    <p class="note">This link expires in <strong>30 minutes</strong>. If you didn't request a PIN reset, you can safely ignore this email — your PIN has not been changed.</p>
  </div>
  <div class="footer">Wavit · Waive the Wait</div>
</div>
</body></html>`;
}

// GET /api/admin/:shopId — live queue for shop owner
app.get('/api/admin/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    if (!checkAdminSession(req, res, shopId)) return;
    const shopRes = await pool.query('SELECT * FROM shops WHERE id = $1', [shopId]);
    if (shopRes.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });
    const shop = shopRes.rows[0];

    const ticketRes = await pool.query(
      'SELECT * FROM tickets WHERE shop_id = $1 ORDER BY joined_at ASC',
      [shopId]
    );

    const allTickets = decryptTickets(ticketRes.rows);
    const active = allTickets.filter(t => !t.exited_at);
    const recent = allTickets.filter(t => t.exited_at).slice(-20);

    // Today's served stats for clinic dashboard
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayServed = allTickets.filter(t => t.served_at && Number(t.served_at) >= todayStart.getTime());
    const avgWaitTodayMs = todayServed.length > 0
      ? todayServed.reduce((s, t) => s + (Number(t.served_at) - Number(t.joined_at)), 0) / todayServed.length
      : 0;

    res.json({
      shop: stripPinHash({ ...shop, waitRange: calcWaitRange({ ...shop, queue: active }) }),
      queue: active,
      recentlyServed: recent,
      servedTodayCount: todayServed.length,
      avgWaitTodayMin: Math.round(avgWaitTodayMs / 60000),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/:shopId/serve/:ticketId — mark as done/completed
// For clinics: marks served_at + exited_at (timing kept for analytics; PII cleared at midnight)
app.post('/api/admin/:shopId/serve/:ticketId', async (req, res) => {
  try {
    const { shopId, ticketId } = req.params;
    if (!checkAdminSession(req, res, shopId)) return;
    const shopRes = await pool.query('SELECT * FROM shops WHERE id = $1', [shopId]);
    if (shopRes.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });

    const isClinic = shopRes.rows[0].category === 'Clinic';
    if (isClinic) {
      await pool.query(
        'UPDATE tickets SET served_at = $1, exited_at = $1 WHERE id = $2 AND shop_id = $3',
        [Date.now(), ticketId, shopId]
      );
    } else {
      await pool.query(
        'UPDATE tickets SET exited_at = $1, served_at = COALESCE(served_at, $1) WHERE id = $2 AND shop_id = $3',
        [Date.now(), ticketId, shopId]
      );
      await advanceQueue(shopId);
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/:shopId/add-patient — front desk adds patient to clinic queue
app.post('/api/admin/:shopId/add-patient', async (req, res) => {
  try {
    const { shopId } = req.params;
    if (!checkAdminSession(req, res, shopId)) return;
    const { name, additionalInfo } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const shop = await getShopWithQueue(shopId);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    const id = generateId();
    const now = Date.now();
    const sanitizedInfo = additionalInfo ? String(additionalInfo).slice(0, 500) : null;
    await pool.query(
      'INSERT INTO tickets (id, shop_id, name, phone, joined_at, party_size, additional_info) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, shopId, encryptField(name.trim()), encryptField(''), now, 1, sanitizedInfo]
    );

    const ticketRes = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
    res.json(decryptTicket(ticketRes.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/:shopId/tickets/:ticketId — remove from queue
// For clinics: hard-deletes the row so no patient trace remains in DB.
app.delete('/api/admin/:shopId/tickets/:ticketId', async (req, res) => {
  try {
    const { shopId, ticketId } = req.params;
    if (!checkAdminSession(req, res, shopId)) return;
    const shopRes = await pool.query('SELECT * FROM shops WHERE id = $1', [shopId]);
    if (shopRes.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });

    const isClinic = shopRes.rows[0].category === 'Clinic';
    if (isClinic) {
      await pool.query('DELETE FROM tickets WHERE id = $1 AND shop_id = $2', [ticketId, shopId]);
    } else {
      await pool.query('UPDATE tickets SET exited_at = $1 WHERE id = $2 AND shop_id = $3', [Date.now(), ticketId, shopId]);
      await advanceQueue(shopId);
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/:shopId/settings — update shop settings
app.patch('/api/admin/:shopId/settings', async (req, res) => {
  try {
    const { shopId } = req.params;
    if (!checkAdminSession(req, res, shopId)) return;
    const shopRes = await pool.query('SELECT * FROM shops WHERE id = $1', [shopId]);
    if (shopRes.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });

    const { numStaff, avgServiceMinutes, queueOpen, openingTime, closingTime, allowRemoteJoin, adminPin, closedDays,
            name, zipCode, address, phone, website, email } = req.body;
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
      const open = !!queueOpen;
      updates.push(`queue_open = $${idx++}`);
      values.push(open);
      // Closing via admin = force close; opening via admin = clear force close
      updates.push(`force_closed = $${idx++}`);
      values.push(!open);
      // Stamp when queue was opened so scheduler 15-min window resets correctly
      if (open) {
        updates.push(`queue_opened_at = $${idx++}`);
        values.push(Date.now());
      }
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
    if (closedDays !== undefined) {
      const sanitized = Array.isArray(closedDays)
        ? closedDays.filter(d => Number.isInteger(d) && d >= 0 && d <= 6).join(',')
        : '';
      updates.push(`closed_days = $${idx++}`);
      values.push(sanitized);
    }
    if (adminPin !== undefined) {
      if (!isValidPin(adminPin)) return res.status(400).json({ error: 'Admin PIN must be exactly 6 digits.' });
      if (await pinInUse(adminPin, shopId)) return res.status(409).json({ error: 'That PIN is already used by another business. Choose a different 6-digit PIN.' });
      const nextPinHash = await hashPin(adminPin);
      updates.push(`admin_pin_hash = $${idx++}`);
      values.push(nextPinHash);
    }
    if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(String(name).trim().slice(0, 100)); }
    if (zipCode !== undefined) { updates.push(`zip_code = $${idx++}`); values.push(String(zipCode).trim().slice(0, 10)); }
    if (address !== undefined) { updates.push(`address = $${idx++}`); values.push(String(address).trim().slice(0, 200)); }
    if (phone !== undefined) { updates.push(`phone = $${idx++}`); values.push(String(phone).trim().slice(0, 30)); }
    if (website !== undefined) { updates.push(`website = $${idx++}`); values.push(String(website).trim().slice(0, 200)); }
    if (email !== undefined) { updates.push(`email = $${idx++}`); values.push(String(email).trim().slice(0, 200)); }

    if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    values.push(shopId);
    await pool.query(`UPDATE shops SET ${updates.join(', ')} WHERE id = $${idx}`, values);

    // If staff count increased or queue was opened, fill any newly available slots immediately
    if (numStaff !== undefined || (queueOpen !== undefined && !!queueOpen)) {
      await advanceQueue(shopId);
    }

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
    // Fetch candidates and match by decrypting — phone is encrypted at rest so we can't query directly
    const ticketRes = await pool.query(
      `SELECT t.*, s.name as shop_name FROM tickets t
       JOIN shops s ON t.shop_id = s.id
       WHERE t.exited_at IS NULL AND t.reminder_sent_at IS NOT NULL
       ORDER BY t.joined_at DESC`
    );

    const matched = ticketRes.rows.find(r => decryptField(r.phone) === from);

    if (!matched) {
      return res.send('<Response></Response>');
    }

    const ticket = matched;

    if (body === 'YES' || body === 'Y') {
      // Customer confirms they are done — remove them and advance the queue
      await pool.query('UPDATE tickets SET exited_at = $1 WHERE id = $2', [Date.now(), ticket.id]);
      await sendSMS(from, `Thanks for visiting ${ticket.shop_name}! We hope to see you again. Reply STOP to opt out.`);
      await advanceQueue(ticket.shop_id);
    } else if (body === 'NO' || body === 'N' || body === 'EXIT' || body === 'STOP') {
      await pool.query('UPDATE tickets SET exited_at = $1 WHERE id = $2', [Date.now(), ticket.id]);
      await sendSMS(from, `You've been removed from the queue at ${ticket.shop_name}. Thanks for visiting — come back soon!`);
      await advanceQueue(ticket.shop_id);
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
  const total = tickets.reduce((s, t) => s + (t.party_size || 1), 0);
  const servedTickets = tickets.filter(t => t.served_at);
  const served = servedTickets.reduce((s, t) => s + (t.party_size || 1), 0);
  const leftBeforeServed = tickets.filter(t => t.exited_at && !t.served_at).reduce((s, t) => s + (t.party_size || 1), 0);
  const noShowRate = total > 0 ? Math.round((leftBeforeServed / total) * 100) : 0;
  const avgWaitMs = servedTickets.length > 0
    ? servedTickets.reduce((sum, t) => sum + (Number(t.served_at) - Number(t.joined_at)), 0) / servedTickets.length
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
      ${competitors.count} other ${escHtml(competitors.category)} shop${competitors.count > 1 ? 's' : ''} in ZIP ${escHtml(String(competitors.zipCode))} — last ${days} days
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
      ? `<p style="background:#fef2f2;border-radius:8px;padding:12px;color:#991b1b;font-size:13px;margin-top:12px;">⚠️ Your no-show rate is above the local average. Nearby ${escHtml(competitors.category)}s are retaining more customers — consider adjusting your queue size or sending earlier reminders.</p>`
      : noShowRate < competitors.avgNoShowRate
        ? `<p style="background:#f0fdf4;border-radius:8px;padding:12px;color:#166534;font-size:13px;margin-top:12px;">✅ Your no-show rate is better than nearby competitors. Keep it up — your customers are more engaged than the local average.</p>`
        : ''
    }
    ${total > competitors.avgTotal
      ? `<p style="background:#f0fdf4;border-radius:8px;padding:12px;color:#166534;font-size:13px;margin-top:8px;">✅ You're attracting more customers than the average ${escHtml(competitors.category)} in your area. Strong local demand.</p>`
      : total < competitors.avgTotal
        ? `<p style="background:#fffbeb;border-radius:8px;padding:12px;color:#92400e;font-size:13px;margin-top:8px;">💡 Nearby ${escHtml(competitors.category)}s are seeing more joins on average. Consider visibility improvements — QR code placement, social media, or local promotions.</p>`
        : ''
    }
  </div>` : (shop.zip_code ? `
  <div style="margin-top:28px;padding-top:24px;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:13px;">No other ${escHtml(shop.category)} shops found in ZIP ${escHtml(shop.zip_code)} on Wavit yet — you're the first!</p>
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
  <h2 style="color:#111827;margin:0 0 4px 0;font-size:20px;">${escHtml(shop.name)}</h2>
  <p style="color:#6b7280;font-size:13px;margin:0 0 20px 0;">
    Last ${days} days · ${escHtml(shop.category)}${shop.zip_code ? ` · ZIP ${escHtml(shop.zip_code)}` : ''}
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

// GET /api/admin/:shopId/analytics
app.get('/api/admin/:shopId/analytics', async (req, res) => {
  try {
    const { shopId } = req.params;
    if (!checkAdminSession(req, res, shopId)) return;
    const shopRes = await pool.query('SELECT * FROM shops WHERE id = $1', [shopId]);
    if (shopRes.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });
    const allTime = req.query.allTime === 'true';
    const days = allTime ? 3650 : 14;
    const analytics = await computeAnalytics(shopId, days);
    const competitors = await computeCompetitorAnalytics(shopRes.rows[0], 14);

    // Peak hour computation (all time)
    const allTicketsRes = await pool.query(
      'SELECT joined_at, party_size FROM tickets WHERE shop_id = $1 AND joined_at IS NOT NULL',
      [shopId]
    );
    const hourCounts = {};
    for (const t of allTicketsRes.rows) {
      const hour = new Date(Number(t.joined_at)).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + (t.party_size || 1);
    }
    const peakEntries = Object.entries(hourCounts).sort((a, b) => Number(b[1]) - Number(a[1]));
    const peakHour = peakEntries.length > 0 ? Number(peakEntries[0][0]) : null;

    // Avg patients per day (all time)
    const allTimeRes = await pool.query(
      'SELECT joined_at FROM tickets WHERE shop_id = $1 AND joined_at IS NOT NULL ORDER BY joined_at ASC',
      [shopId]
    );
    let avgPerDay = null;
    if (allTimeRes.rows.length > 0) {
      const firstDay = new Date(Number(allTimeRes.rows[0].joined_at)); firstDay.setHours(0,0,0,0);
      const today = new Date(); today.setHours(0,0,0,0);
      const daysDiff = Math.max(1, Math.round((today.getTime() - firstDay.getTime()) / 86400000) + 1);
      avgPerDay = Math.round(allTimeRes.rows.length / daysDiff);
    }

    res.json({ ...analytics, competitors, peakHour, avgPerDay });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/:shopId/analytics/toggle
app.post('/api/admin/:shopId/analytics/toggle', async (req, res) => {
  try {
    const { shopId } = req.params;
    if (!checkAdminSession(req, res, shopId)) return;
    const { enabled, email } = req.body;
    const shopRes = await pool.query('SELECT * FROM shops WHERE id = $1', [shopId]);
    if (shopRes.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });
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

// POST /api/admin/:shopId/analytics/send — send report now
app.post('/api/admin/:shopId/analytics/send', async (req, res) => {
  try {
    const { shopId } = req.params;
    if (!checkAdminSession(req, res, shopId)) return;
    const shopRes = await pool.query('SELECT * FROM shops WHERE id = $1', [shopId]);
    if (shopRes.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });
    const shop = shopRes.rows[0];
    const toEmail = shop.analytics_email || shop.email;
    if (!toEmail) return res.status(400).json({ error: 'No email address set' });
    if (!resend) return res.status(503).json({ error: 'Email not configured (RESEND_API_KEY missing)' });
    const analytics = await computeAnalytics(shopId, 14);
    const competitors = await computeCompetitorAnalytics(shop, 14);
    await resend.emails.send({
      from: EMAIL_FROM,
      to: toEmail,
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
      'SELECT * FROM shops WHERE analytics_enabled = TRUE AND (analytics_email IS NOT NULL OR email IS NOT NULL)'
    );
    for (const shop of shopsRes.rows) {
      const toEmail = shop.analytics_email || shop.email;
      if (!toEmail) continue;
      const lastSent = Number(shop.last_analytics_sent) || 0;
      if (now - lastSent >= fourteenDays) {
        const analytics = await computeAnalytics(shop.id, 14);
        const competitors = await computeCompetitorAnalytics(shop, 14);
        await resend.emails.send({
          from: EMAIL_FROM,
          to: toEmail,
          subject: `Wavit Analytics — ${shop.name}`,
          html: buildAnalyticsEmail(shop, analytics, competitors),
        });
        await pool.query('UPDATE shops SET last_analytics_sent = $1 WHERE id = $2', [now, shop.id]);
        console.log(`Analytics email sent to ${toEmail} for ${shop.name}`);
      }
    }
  } catch (err) {
    console.error('Analytics scheduler error:', err.message);
  }
}

setInterval(analyticsScheduler, 60 * 60 * 1000); // check every hour

// 15-day ticket cleanup — runs hourly, deletes tickets older than 15 days
async function pruneOldTickets() {
  try {
    const cutoff = Date.now() - 15 * 24 * 60 * 60 * 1000;
    const result = await pool.query('DELETE FROM tickets WHERE joined_at < $1', [cutoff]);
    if (result.rowCount > 0) console.log(`[cleanup] Pruned ${result.rowCount} tickets older than 15 days`);
  } catch (err) {
    console.error('[cleanup] Error pruning old tickets:', err.message);
  }
}
pruneOldTickets();
setInterval(pruneOldTickets, 60 * 60 * 1000);

// ── Midnight queue clear ────────────────────────────────────────────────────
let lastMidnightClearDate = null;
async function midnightClear() {
  try {
    const centralStr = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
    const central = new Date(centralStr);
    const dateStr = central.toDateString();
    if (central.getHours() === 0 && central.getMinutes() <= 2 && lastMidnightClearDate !== dateStr) {
      lastMidnightClearDate = dateStr;
      const result = await pool.query(
        'UPDATE tickets SET exited_at = $1 WHERE exited_at IS NULL',
        [Date.now()]
      );
      console.log(`[midnight] Cleared ${result.rowCount} active tickets from all queues`);
    }
  } catch (err) {
    console.error('[midnight] Error clearing tickets:', err.message);
  }
}
setInterval(midnightClear, 60 * 1000);

// ── Queue Tick ────────────────────────────────────────────────────────────────

async function tick() {
  const now = Date.now();

  try {
    const shopsRes = await pool.query('SELECT * FROM shops');

    for (const shop of shopsRes.rows) {
      if (shop.category === 'Clinic') continue; // Clinics: no auto-advance, no auto-remove

      const avgMs = shop.avg_service_minutes * 60 * 1000;
      const numStaff = Math.max(1, shop.num_staff || 1);

      // Get active tickets (not exited)
      const ticketRes = await pool.query(
        'SELECT * FROM tickets WHERE shop_id = $1 AND exited_at IS NULL ORDER BY joined_at ASC',
        [shop.id]
      );
      const queue = decryptTickets(ticketRes.rows);
      const waitingQueue = queue.filter(t => !t.served_at);
      const servingNow = queue.filter(t => t.served_at);

      // Fill any free staff slots from the waiting queue
      const freeSlots = Math.max(0, numStaff - servingNow.length);
      const toStart = waitingQueue.slice(0, freeSlots);
      for (const next of toStart) {
        await pool.query('UPDATE tickets SET served_at = $1 WHERE id = $2', [now, next.id]);
        await sendSMS(next.phone, `It's your turn at ${shop.name}! Please head to the front now. Reply STOP to opt out.`);
      }
      if (toStart.length > 0) {
        await pool.query('UPDATE shops SET current_service_started_at = $1 WHERE id = $2', [now, shop.id]);
      }

      // Per-ticket overdue handling — 1 person = 1 slot, no party size
      for (const serving of servingNow) {
        const elapsed = now - Number(serving.served_at);

        // At 33% over avg service time → auto-remove (checked first to avoid double SMS)
        if (elapsed >= avgMs * 1.33) {
          await pool.query('UPDATE tickets SET exited_at = $1 WHERE id = $2', [now, serving.id]);
          await sendSMS(
            serving.phone,
            `You've been automatically removed from the queue at ${shop.name}. Thanks for your visit!`
          );
          await advanceQueue(shop.id);
          continue;
        }

        // At 25% over avg service time → send "are you done?" SMS once
        if (elapsed >= avgMs * 1.25 && !serving.reminder_sent_at) {
          await pool.query('UPDATE tickets SET reminder_sent_at = $1 WHERE id = $2', [now, serving.id]);
          await sendSMS(
            serving.phone,
            `Hi ${serving.name}, your service time at ${shop.name} is up. Are you all done? Reply YES if finished. Reply STOP to opt out.`
          );
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
    const { businessName, ownerName, email, phone, category, zipCode, numStaff, avgServiceMinutes, message, allowRemoteJoin, adminPin, address, city, state, numDoctors, website } = req.body;
    if (!businessName || !ownerName || !email || !phone || !category) {
      return res.status(400).json({ error: 'businessName, ownerName, email, phone, and category are required' });
    }
    if (!isValidPin(adminPin)) {
      return res.status(400).json({ error: 'Please choose a 6-digit admin PIN.' });
    }
    if (await pinInUse(adminPin)) {
      return res.status(409).json({ error: 'That PIN is already in use by another business. Please choose a different 6-digit PIN.' });
    }
    const pinHash = await hashPin(adminPin);
    const id = generateId();
    const isClinic = category.trim() === 'Clinic';
    const staffCount = isClinic ? (parseInt(numDoctors, 10) || 1) : (parseInt(numStaff, 10) || 1);
    await pool.query(
      `INSERT INTO shop_registrations
        (id, business_name, owner_name, email, phone, category, zip_code, num_staff, avg_service_minutes, message, status, submitted_at, allow_remote_join, admin_pin_hash, address, city, state, num_doctors, website)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending',$11,$12,$13,$14,$15,$16,$17,$18)`,
      [id, businessName.trim(), ownerName.trim(), email.trim(), phone.trim(), category.trim(),
       zipCode?.trim() || null, staffCount, parseInt(avgServiceMinutes, 10) || 15,
       message?.trim() || null, Date.now(), isClinic ? false : (allowRemoteJoin !== false), pinHash,
       address?.trim() || null, city?.trim() || null, state?.trim() || null, parseInt(numDoctors, 10) || null,
       website?.trim() || null]
    );
    // Send registration confirmation email
    if (resend && email) {
      const confirmHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:'Helvetica Neue',Arial,sans-serif;background:#f8f7ff;margin:0;padding:0}
  .wrap{max-width:540px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb}
  .header{background:linear-gradient(135deg,#1a0845,#1d3a8a);padding:28px 32px;text-align:center}
  .logo{font-size:36px;font-weight:900;color:#60a5fa;letter-spacing:-1px}
  .body{padding:32px}
  h2{font-size:18px;font-weight:800;margin:0 0 10px;color:#111}
  p{font-size:14px;line-height:1.7;color:#4b5563;margin:0 0 14px}
  .box{background:#f0f4ff;border-left:3px solid #3b82f6;border-radius:8px;padding:14px 16px;margin-bottom:16px;font-size:13px;color:#374151}
  .footer{padding:16px 32px;border-top:1px solid #f3f4f6;font-size:11px;color:#9ca3af;text-align:center}
</style></head>
<body>
<div class="wrap">
  <div class="header"><div class="logo">wavit</div></div>
  <div class="body">
    <h2>We received your application, ${ownerName.trim()}!</h2>
    <p>Thanks for applying to bring <strong>${businessName.trim()}</strong> onto Wavit. We review every application manually and will be in touch within <strong>1–2 business days</strong>.</p>
    <div class="box">
      <strong>What happens next:</strong><br/>
      Our team will review your details. If approved, you'll receive a welcome email with setup instructions so you can start managing your queue right away.
    </div>
    <p style="font-size:13px;color:#6b7280">Questions? Just reply to this email.</p>
  </div>
  <div class="footer">Wavit · Waive the Wait</div>
</div></body></html>`;
      resend.emails.send({
        from: EMAIL_FROM,
        to: email.trim(),
        subject: `We got your Wavit application — ${businessName.trim()}`,
        html: confirmHtml,
      }).catch(err => console.error('Registration confirm email failed:', err.message));
    }

    res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Super Admin ───────────────────────────────────────────────────────────────

// GET /api/superadmin/registrations
app.get('/api/superadmin/registrations', async (req, res) => {
  if (!checkSuperAdminSession(req, res)) return;
  try {
    const result = await pool.query(
      'SELECT * FROM shop_registrations ORDER BY submitted_at DESC'
    );
    res.json(result.rows.map(stripPinHash));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/superadmin/registrations/:id/approve
app.post('/api/superadmin/registrations/:id/approve', async (req, res) => {
  if (!checkSuperAdminSession(req, res)) return;
  try {
    const regRes = await pool.query('SELECT * FROM shop_registrations WHERE id = $1', [req.params.id]);
    if (regRes.rows.length === 0) return res.status(404).json({ error: 'Registration not found' });
    const reg = regRes.rows[0];
    if (reg.status !== 'pending') return res.status(400).json({ error: 'Registration is not pending' });

    const shopId = generateId();
    const adminSecret = generateId() + generateId();
    // PIN uniqueness is enforced at registration-submit time (plaintext available there).
    // We can't reverse the stored bcrypt hash here, so we trust the submission-time check.

    const shopAddress = [reg.address, reg.city, reg.state ? `${reg.state} ${reg.zip_code || ''}`.trim() : reg.zip_code]
      .filter(Boolean).join(', ') || null;
    await pool.query(
      `INSERT INTO shops (id, name, email, phone, category, zip_code, avg_service_minutes, num_staff, admin_secret, allow_remote_join, admin_pin_hash, address, website)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [shopId, reg.business_name, reg.email || null, reg.phone, reg.category, reg.zip_code,
       reg.avg_service_minutes, reg.num_staff, adminSecret, reg.allow_remote_join !== false, reg.admin_pin_hash, shopAddress, reg.website || null]
    );

    await pool.query(
      'UPDATE shop_registrations SET status=$1, reviewed_at=$2 WHERE id=$3',
      ['approved', Date.now(), reg.id]
    );

    // Auto-send tutorial email to the new shop owner
    const newShop = { id: shopId, name: reg.business_name, email: reg.email, analytics_email: null, admin_secret: adminSecret };
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    sendTutorialEmail(newShop, baseUrl).catch(err => console.error('Auto tutorial email failed:', err.message));

    res.json({ success: true, shopId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/superadmin/registrations/:id/reject
app.post('/api/superadmin/registrations/:id/reject', async (req, res) => {
  if (!checkSuperAdminSession(req, res)) return;
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

// GET /api/superadmin/shops — list all approved shops
app.get('/api/superadmin/shops', async (req, res) => {
  if (!checkSuperAdminSession(req, res)) return;
  try {
    const result = await pool.query('SELECT * FROM shops ORDER BY name ASC');
    res.json(result.rows.map(stripPinHash));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/superadmin/shops/:shopId — update shop settings
app.patch('/api/superadmin/shops/:shopId', async (req, res) => {
  if (!checkSuperAdminSession(req, res)) return;
  try {
    const { shopId } = req.params;
    const shopRes = await pool.query('SELECT id FROM shops WHERE id = $1', [shopId]);
    if (shopRes.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });

    const { name, email, category, numStaff, avgServiceMinutes, queueOpen, allowRemoteJoin, openingTime, closingTime, adminPin } = req.body;
    const updates = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name.trim()); }
    if (email !== undefined) { updates.push(`email = $${idx++}`); values.push(email.trim() || null); }
    if (category !== undefined) { updates.push(`category = $${idx++}`); values.push(category.trim()); }
    if (numStaff !== undefined) { updates.push(`num_staff = $${idx++}`); values.push(Math.max(1, Math.min(20, parseInt(numStaff, 10) || 1))); }
    if (avgServiceMinutes !== undefined) { updates.push(`avg_service_minutes = $${idx++}`); values.push(Math.max(1, Math.min(120, parseInt(avgServiceMinutes, 10) || 15))); }
    if (queueOpen !== undefined) {
      const open = !!queueOpen;
      updates.push(`queue_open = $${idx++}`);
      values.push(open);
      updates.push(`force_closed = $${idx++}`);
      values.push(!open);
      if (open) {
        updates.push(`queue_opened_at = $${idx++}`);
        values.push(Date.now());
      }
    }
    if (allowRemoteJoin !== undefined) { updates.push(`allow_remote_join = $${idx++}`); values.push(!!allowRemoteJoin); }
    if (openingTime !== undefined) { updates.push(`opening_time = $${idx++}`); values.push(openingTime); }
    if (closingTime !== undefined) { updates.push(`closing_time = $${idx++}`); values.push(closingTime); }
    if (adminPin !== undefined) {
      if (!isValidPin(adminPin)) return res.status(400).json({ error: 'Admin PIN must be exactly 6 digits.' });
      if (await pinInUse(adminPin, shopId)) return res.status(409).json({ error: 'That PIN is already used by another business. Choose a different 6-digit PIN.' });
      const nextPinHash = await hashPin(adminPin);
      updates.push(`admin_pin_hash = $${idx++}`);
      values.push(nextPinHash);
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

// PATCH /api/superadmin/shops/:shopId/analytics — toggle biweekly email reports
app.patch('/api/superadmin/shops/:shopId/analytics', async (req, res) => {
  if (!checkSuperAdminSession(req, res)) return;
  try {
    const { shopId } = req.params;
    const shopRes = await pool.query('SELECT * FROM shops WHERE id = $1', [shopId]);
    if (shopRes.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });
    const shop = shopRes.rows[0];
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') return res.status(400).json({ error: 'enabled must be boolean' });

    const toEmail = shop.analytics_email || shop.email;
    if (enabled && resend && toEmail) {
      // Send immediately on enable and mark sent now so the 2-week cycle starts from today
      const now = Date.now();
      try {
        const analytics = await computeAnalytics(shopId, 14);
        const competitors = await computeCompetitorAnalytics(shop, 14);
        await resend.emails.send({
          from: EMAIL_FROM,
          to: toEmail,
          subject: `Wavit Analytics — ${shop.name}`,
          html: buildAnalyticsEmail(shop, analytics, competitors),
        });
        await pool.query(
          'UPDATE shops SET analytics_enabled = true, last_analytics_sent = $1 WHERE id = $2',
          [now, shopId]
        );
        console.log(`Analytics enabled + immediate email sent to ${shop.analytics_email} for ${shop.name}`);
        return res.json({ success: true, emailSent: true });
      } catch (emailErr) {
        console.error('Failed to send immediate analytics email:', emailErr.message);
        // Still enable analytics even if the email fails
        await pool.query('UPDATE shops SET analytics_enabled = true WHERE id = $1', [shopId]);
        return res.json({ success: true, emailSent: false, emailError: emailErr.message });
      }
    }

    await pool.query('UPDATE shops SET analytics_enabled = $1 WHERE id = $2', [enabled, shopId]);
    res.json({ success: true, emailSent: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/superadmin/shops/:shopId — permanently delete shop and its tickets
app.delete('/api/superadmin/shops/:shopId', async (req, res) => {
  if (!checkSuperAdminSession(req, res)) return;
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

// ── Email helpers ─────────────────────────────────────────────────────────────

function buildTutorialEmailHtml(shop, baseUrl) {
  const loginUrl = `${baseUrl}/login`;
  const joinUrl  = `${baseUrl}/join/${shop.id}`;
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:'Helvetica Neue',Arial,sans-serif;background:#f8f7ff;margin:0;padding:0;color:#111}
  .wrap{max-width:580px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb}
  .header{background:linear-gradient(135deg,#1a0845,#1d3a8a);padding:32px 32px 24px;text-align:center}
  .logo{font-size:40px;font-weight:900;color:#60a5fa;letter-spacing:-1px}
  .tagline{color:#a5b4fc;font-size:13px;margin-top:6px}
  .body{padding:32px}
  h2{font-size:20px;font-weight:800;margin:0 0 8px;color:#111}
  p{font-size:14px;line-height:1.7;color:#4b5563;margin:0 0 16px}
  .step{background:#f0f4ff;border-left:3px solid #3b82f6;border-radius:8px;padding:14px 16px;margin-bottom:12px}
  .step-num{font-size:11px;font-weight:800;color:#3b82f6;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
  .step-title{font-size:14px;font-weight:700;color:#1e3a8a;margin-bottom:4px}
  .step-body{font-size:13px;color:#4b5563;line-height:1.6;margin:0}
  .btn{display:inline-block;background:#2563eb;color:#fff;font-weight:800;font-size:14px;padding:14px 28px;border-radius:10px;text-decoration:none;margin:8px 4px}
  .link-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px 16px;font-family:monospace;font-size:12px;color:#374151;word-break:break-all;margin-bottom:16px}
  .footer{padding:20px 32px;border-top:1px solid #f3f4f6;font-size:11px;color:#9ca3af;text-align:center}
</style></head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo">wavit</div>
    <div class="tagline">Waive the Wait — Your Queue Management Platform</div>
  </div>
  <div class="body">
    <h2>Welcome to Wavit, ${escHtml(shop.name)}! 👋</h2>
    <p>Your queue is live. Here's everything you need to know to get started in under 5 minutes.</p>

    <div class="step">
      <div class="step-num">Step 1</div>
      <div class="step-title">Access your Admin Dashboard</div>
      <p class="step-body">Log in using the 6-digit PIN you chose when you registered. Your dashboard is your command centre.</p>
    </div>
    <div style="text-align:center;margin-bottom:24px">
      <a href="${loginUrl}" class="btn">Log In to Your Dashboard</a>
    </div>

    <div class="step">
      <div class="step-num">Step 2</div>
      <div class="step-title">Let customers join your queue</div>
      <p class="step-body">Share your QR code (shown in the admin dashboard) at your door or counter. Customers scan it, enter their name and phone number, and they're in. You can also share this direct link:</p>
    </div>
    <div class="link-box">${joinUrl}</div>

    <div class="step">
      <div class="step-num">Step 3</div>
      <div class="step-title">Serve customers from the dashboard</div>
      <p class="step-body">When you're ready for the next customer, hit <strong>Serve</strong> next to their name. They'll get an SMS alert automatically (if Twilio is configured). Use <strong>Remove</strong> to skip a no-show.</p>
    </div>

    <div class="step">
      <div class="step-num">Step 4</div>
      <div class="step-title">Open and close your queue</div>
      <p class="step-body">Use the <strong>Open / Close Queue</strong> toggle in your dashboard to stop accepting new customers at the end of the day. Existing customers in line are unaffected.</p>
    </div>

    <div class="step">
      <div class="step-num">Bonus</div>
      <div class="step-title">Enable weekly analytics emails</div>
      <p class="step-body">From your admin dashboard, scroll to Analytics and toggle it on. You'll get a weekly report with wait times, no-show rates, and how you compare to nearby shops.</p>
    </div>

    <p style="margin-top:24px;font-size:13px;color:#6b7280">Questions? Just reply to this email. We're here to help.</p>
  </div>
  <div class="footer">Wavit · Waive the Wait · <a href="${baseUrl}" style="color:#6b7280">${baseUrl}</a></div>
</div>
</body></html>`;
}

async function sendTutorialEmail(shop, baseUrl) {
  if (!resend) return;
  const to = shop.email || shop.analytics_email;
  if (!to) return;
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Welcome to Wavit — How to use your queue dashboard`,
    html: buildTutorialEmailHtml(shop, baseUrl),
  });
  console.log(`Tutorial email sent to ${to} for shop ${shop.name}`);
}

// POST /api/superadmin/shops/:shopId/send-tutorial — email onboarding guide
app.post('/api/superadmin/shops/:shopId/send-tutorial', async (req, res) => {
  if (!checkSuperAdminSession(req, res)) return;
  if (!resend) return res.status(503).json({ error: 'Email not configured (RESEND_API_KEY missing)' });
  try {
    const { shopId } = req.params;
    const shopRes = await pool.query('SELECT * FROM shops WHERE id = $1', [shopId]);
    if (shopRes.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });
    const shop = shopRes.rows[0];
    const to = shop.email || shop.analytics_email;
    if (!to) return res.status(400).json({ error: 'No email address on file for this shop' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    await sendTutorialEmail(shop, baseUrl);
    res.json({ success: true, sentTo: to });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/superadmin/history — tickets from last 7 days grouped by shop+day
app.get('/api/superadmin/history', async (req, res) => {
  if (!checkSuperAdminSession(req, res)) return;
  try {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const result = await pool.query(
      `SELECT t.id, t.name, t.phone, t.joined_at, t.exited_at, t.served_at, t.party_size,
              s.id AS shop_id, s.name AS shop_name, s.category AS shop_category
       FROM tickets t JOIN shops s ON t.shop_id = s.id
       WHERE t.joined_at >= $1
       ORDER BY t.joined_at DESC`,
      [cutoff]
    );
    res.json(decryptTickets(result.rows));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/:shopId/logo — upload shop logo (base64 data URL)
app.patch('/api/admin/:shopId/logo', async (req, res) => {
  try {
    const { shopId } = req.params;
    if (!checkAdminSession(req, res, shopId)) return;
    const shopRes = await pool.query('SELECT * FROM shops WHERE id = $1', [shopId]);
    if (shopRes.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });
    const { logoUrl } = req.body;
    await pool.query('UPDATE shops SET logo_url = $1 WHERE id = $2', [logoUrl || null, shopId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Version ───────────────────────────────────────────────────────────────────

app.get('/api/version', (req, res) => {
  res.json({
    app: 'Wavit',
    version: '1.0.0',
    node: process.version,
    env: process.env.NODE_ENV || 'development',
    uptime_seconds: Math.floor(process.uptime()),
  });
});

// ── Page Content (public read) ────────────────────────────────────────────────

app.get('/api/content/:page', async (req, res) => {
  const validPages = ['about', 'how_to_use', 'terms', 'privacy', 'home', 'web_dev', 'for_clinics'];
  if (!validPages.includes(req.params.page)) return res.status(404).json({ error: 'Unknown page' });
  try {
    const result = await pool.query('SELECT content FROM page_content WHERE page_key = $1', [req.params.page]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Content not found' });
    res.json(result.rows[0].content);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/superadmin/content/:page — superadmin only
app.put('/api/superadmin/content/:page', async (req, res) => {
  if (!checkSuperAdminSession(req, res)) return;
  const validPages = ['about', 'how_to_use', 'terms', 'privacy', 'home', 'web_dev', 'for_clinics'];
  if (!validPages.includes(req.params.page)) return res.status(404).json({ error: 'Unknown page' });
  try {
    const content = req.body;
    if (!content || typeof content !== 'object') return res.status(400).json({ error: 'Invalid content' });
    await pool.query(
      `INSERT INTO page_content (page_key, content, updated_at) VALUES ($1, $2, $3)
       ON CONFLICT (page_key) DO UPDATE SET content = $2, updated_at = $3`,
      [req.params.page, JSON.stringify(content), Date.now()]
    );
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
