// server/bots/discord.mjs
// Discord webhook — posts FLASH alerts, no bot token needed
// Requires: DISCORD_WEBHOOK_URL in .env.local

import fetch from 'node-fetch';

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const TIER_COLORS = { FLASH: 0xef4444, PRIORITY: 0xf59e0b, ROUTINE: 0x6b7280 };

export async function sendDiscordAlert(delta) {
  if (!WEBHOOK_URL) return;
  if (delta.flash.length === 0 && delta.priority.length === 0) return;

  const embeds = [];

  if (delta.flash.length > 0) {
    embeds.push({
      title: `⚡ FLASH — ${delta.flash.length} new high-priority alerts`,
      color: TIER_COLORS.FLASH,
      description: delta.flash.slice(0, 3)
        .map(a => `**${a.title}**\n*${a.source}*`).join('\n\n'),
      footer: { text: `WARCHER Sweep #${delta.sweepNumber}` },
      timestamp: new Date().toISOString(),
    });
  }

  if (delta.priority.length > 0) {
    embeds.push({
      title: `🟡 PRIORITY — ${delta.priority.length} new`,
      color: TIER_COLORS.PRIORITY,
      description: delta.priority.slice(0, 3)
        .map(a => `**${a.title}**\n*${a.source}*`).join('\n\n'),
      footer: { text: `WARCHER Sweep #${delta.sweepNumber}` },
      timestamp: new Date().toISOString(),
    });
  }

  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'WARCHER',
        avatar_url: 'https://www.warcher.io/icon.png',
        embeds: embeds.slice(0, 10), // Discord limit
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    console.warn('[Discord] Webhook failed:', err.message);
  }
}
