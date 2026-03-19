// server/server.mjs — Main entry point for Warcher backend
//
// Loads .env.local manually — no dotenv dep needed (Node 22 built-ins only)
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { state, startSweepCycle, loadPersistedState, setBroadcast, setAlertHandler } from './sweep.mjs';
import { getSweepCount } from './delta.mjs';
import { startTelegramBot } from './bots/telegram.mjs';
import { sendDiscordAlert } from './bots/discord.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __rootDir = path.resolve(__dirname, '..');

// ── Load .env.local ───────────────────────────────────────────────────────────
try {
  const envContent = readFileSync(path.join(__rootDir, '.env.local'), 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key && !(key in process.env)) process.env[key] = val;
  }
  console.log('[Config] Loaded .env.local');
} catch {
  console.log('[Config] No .env.local found, using process.env as-is');
}

const PORT = parseInt(process.env.PORT || '3117', 10);
const app = express();

// ── CORS: allow the Vite dev server ──────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json());

// ── SSE client registry ───────────────────────────────────────────────────────
const sseClients = new Set();

function broadcast(payload) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try { client.write(data); } catch { sseClients.delete(client); }
  }
}
setBroadcast(broadcast);

// ── Alert handler (bots) ──────────────────────────────────────────────────────
setAlertHandler(async (delta) => {
  await sendDiscordAlert(delta).catch(err => console.warn('[Discord]', err.message));
});

// ── Routes ────────────────────────────────────────────────────────────────────

// SSE endpoint
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'init', data: state })}\n\n`);

  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch { clearInterval(heartbeat); }
  }, 25000);

  sseClients.add(res);
  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// Full data snapshot
app.get('/api/data', (_req, res) => res.json(state));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    sweepCount: getSweepCount(),
    lastSweep: state.lastSweep,
    articleCount: state.articles.length,
    sseClients: sseClients.size,
    sourceStatus: state.sourceStatus,
    uptime: Math.floor(process.uptime()),
  });
});

// Telegram webhook placeholder
app.post('/telegram', (_req, res) => res.sendStatus(200));

// ── Serve built frontend in production ────────────────────────────────────────
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
  await loadPersistedState();

  app.listen(PORT, () => {
    console.log(`\n🛰  WARCHER backend on http://localhost:${PORT}`);
    console.log(`   /api/health  /api/data  /events\n`);
  });

  startSweepCycle();
  startTelegramBot().catch(err => console.warn('[Telegram]', err.message));
}

start().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
