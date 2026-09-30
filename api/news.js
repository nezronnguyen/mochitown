// api/news.js — Vercel Serverless Function
// Dùng Discord REST API để lấy tin từ channel

const DISCORD_API = 'https://discord.com/api/v10';

async function discordFetch(path, token) {
  const res = await fetch(`${DISCORD_API}${path}`, {
    headers: { Authorization: `Bot ${token}` }
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Discord API ${path} → ${res.status}: ${err}`);
  }
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  const token     = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.CHANNEL_ID_NEWS;

  if (!token || !channelId) {
    return res.json({ status: 'not_configured', messages: [] });
  }

  try {
    const rawMessages = await discordFetch(`/channels/${channelId}/messages?limit=50`, token);

    const messages = rawMessages
      .filter(m => {
        const hasText = m.content && m.content.trim().length > 0;
        const hasEmbed = m.embeds && m.embeds.length > 0;
        return hasText || hasEmbed;
      })
      .slice(0, 6)
      .map(m => {
        let text = m.content ? m.content.trim() : '';
        if (!text && m.embeds && m.embeds.length > 0) {
          const emb = m.embeds[0];
          text = [emb.title, emb.description].filter(Boolean).join('\n');
        }
        return {
          id: m.id,
          content: text,
          timestamp: m.timestamp,
          author: m.author?.global_name || m.author?.username || 'Unknown',
          jumpUrl: `https://discord.com/channels/${process.env.DISCORD_GUILD_ID || '@me'}/${channelId}/${m.id}`
        };
      })
      .filter(m => m.content && m.content.length > 0);

    return res.json({ status: 'ok', messages });
  } catch (err) {
    console.error('[api/news]', err.message);
    return res.status(500).json({ status: 'error', messages: [], message: err.message });
  }
}
