// server/bots/telegram.mjs
// Telegram bot — polling mode + commands + FLASH alert push
// Requires: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env.local

import fetch from 'node-fetch';
import { state } from '../sweep.mjs';
import { getSweepCount } from '../delta.mjs';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const BASE = TOKEN ? `https://api.telegram.org/bot${TOKEN}` : null;

let lastOffset = 0;
let muted = false;

async function sendMessage(chatId, text, parseMode = 'Markdown') {
  if (!BASE) return;
  try {
    await fetch(`${BASE}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    console.warn('[Telegram] sendMessage failed:', err.message);
  }
}

function formatBrief(articles, limit = 5) {
  const top = articles.filter(a => a.priority === 'HIGH').slice(0, limit);
  if (top.length === 0) return '_No high-priority signals in current feed._';
  return top.map((a, i) => `*${i + 1}.* ${a.title}\n_${a.source}_`).join('\n\n');
}

async function handleCommand(msg) {
  const chat = msg.chat?.id;
  const text = (msg.text || '').trim().toLowerCase();
  if (!chat) return;

  if (text === '/start' || text === '/help') {
    await sendMessage(chat,
      `🛰 *WARCHER BOT*\n\nCommands:\n` +
      `/status — system health\n` +
      `/brief — top 5 HIGH priority articles\n` +
      `/alerts — latest delta (new since last sweep)\n` +
      `/sweep — trigger manual sweep (delayed)\n` +
      `/mute — silence auto-alerts\n` +
      `/unmute — resume auto-alerts`
    );
  } else if (text === '/status') {
    const s = state;
    await sendMessage(chat,
      `📡 *WARCHER STATUS*\n` +
      `Sweep #${getSweepCount()} | Articles: ${s.articles.length}\n` +
      `Last sweep: ${s.lastSweep ? new Date(s.lastSweep).toUTCString() : 'N/A'}\n` +
      `BTC: $${s.prices.btc?.price?.toLocaleString() || '—'} (${s.prices.btc?.change24h?.toFixed(2) || '—'}%)\n` +
      `Oil: $${s.prices.oil?.price?.toFixed(2) || '—'} | Gold: $${s.prices.gold?.price?.toFixed(0) || '—'}`
    );
  } else if (text === '/brief') {
    const brief = formatBrief(state.articles);
    await sendMessage(chat, `🔴 *FLASH BRIEF — WARCHER*\n\n${brief}`);
  } else if (text === '/alerts') {
    const d = state.delta;
    const flashList = d.flash.slice(0, 3).map(a => `⚡ ${a.title}`).join('\n') || '_None_';
    const priList = d.priority.slice(0, 3).map(a => `🟡 ${a.title}`).join('\n') || '_None_';
    await sendMessage(chat,
      `🔔 *SWEEP #${d.sweepNumber} DELTA* — ${d.totalNew} new\n\n*FLASH:*\n${flashList}\n\n*PRIORITY:*\n${priList}`
    );
  } else if (text === '/mute') {
    muted = true;
    await sendMessage(chat, '🔇 Auto-alerts muted. Use /unmute to resume.');
  } else if (text === '/unmute') {
    muted = false;
    await sendMessage(chat, '🔔 Auto-alerts resumed.');
  } else if (text === '/sweep') {
    await sendMessage(chat, '⏳ Manual sweep queued — results in ~30 seconds.');
    // Import runSweep lazily to avoid circular dep
    const { runSweep } = await import('../sweep.mjs');
    setTimeout(() => runSweep().catch(console.error), 2000);
  }
}

async function poll() {
  if (!BASE) return;
  try {
    const res = await fetch(`${BASE}/getUpdates?offset=${lastOffset + 1}&timeout=20`, {
      signal: AbortSignal.timeout(30000),
    });
    const json = await res.json();
    const updates = json?.result || [];
    for (const update of updates) {
      lastOffset = update.update_id;
      if (update.message) await handleCommand(update.message);
    }
  } catch {
    // Network error — silently retry
  }
  setTimeout(poll, 1000);
}

export async function sendFlashAlert(delta) {
  if (!BASE || !CHAT_ID || muted || delta.flash.length === 0) return;
  const list = delta.flash.slice(0, 3).map(a => `⚡ *${a.title}*\n_${a.source}_`).join('\n\n');
  await sendMessage(CHAT_ID,
    `🚨 *WARCHER FLASH ALERT — ${delta.flash.length} new*\n\n${list}`
  );
}

export async function startTelegramBot() {
  if (!TOKEN) {
    console.log('[Telegram] No TELEGRAM_BOT_TOKEN set — bot disabled');
    return;
  }
  console.log('[Telegram] Bot starting (polling mode)...');
  poll();
}
