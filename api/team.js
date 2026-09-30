// api/team.js — Vercel Serverless Function
// Dùng Discord REST API (không cần bot gateway/WebSocket)
// Bật Privileged Intents > Server Members Intent trong Discord Developer Portal

const DISCORD_API = 'https://discord.com/api/v10';

function parseIds(val) {
  if (!val) return [];
  return val.split(',').map(s => s.trim()).filter(Boolean);
}

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

async function getAllMembers(guildId, token) {
  let members = [];
  let after = '0';
  while (true) {
    const batch = await discordFetch(
      `/guilds/${guildId}/members?limit=1000&after=${after}`,
      token
    );
    if (!batch.length) break;
    members = members.concat(batch);
    after = batch[batch.length - 1].user.id;
    if (batch.length < 1000) break;
  }
  return members;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!token || !guildId) {
    return res.json({ status: 'not_configured', dev: null, owner: [], support: [], missing: 0 });
  }

  try {
    const devRoleIds    = parseIds(process.env.ROLE_ID_DEV);
    const ownerRoleIds  = parseIds(process.env.ROLE_ID_OWNER + ',' + (process.env.ROLE_ID_GAMEMASTER || ''));
    const adminRoleIds  = parseIds(process.env.ROLE_ID_ADMIN);
    const supportRoleIds = parseIds(process.env.ROLE_ID_SUPPORT);

    const members = await getAllMembers(guildId, token);

    const hasRole = (member, ids) => ids.some(id => (member.roles || []).includes(id));

    let devMember = null;
    const ownersMap  = new Map();
    const supportsMap = new Map();

    for (const member of members) {
      if (!member.user || member.user.bot) continue;

      // Build avatar URL correctly:
      // 1) Guild-specific avatar (member.avatar)
      // 2) User's global avatar (member.user.avatar)
      // 3) Default Discord avatar (based on user ID)
      let avatarUrl;
      if (member.avatar) {
        avatarUrl = `https://cdn.discordapp.com/guilds/${guildId}/users/${member.user.id}/avatars/${member.avatar}.png?size=128`;
      } else if (member.user.avatar) {
        avatarUrl = `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png?size=128`;
      } else {
        avatarUrl = `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(member.user.id) >> 22n) % 6n)}.png`;
      }

      const mapped = {
        id: member.user.id,
        name: member.nick || member.user.global_name || member.user.username,
        avatar: avatarUrl
      };

      if (!devMember && hasRole(member, devRoleIds)) {
        devMember = { ...mapped, role: 'DEV' };
      }
      if (hasRole(member, ownerRoleIds)) {
        ownersMap.set(member.user.id, { ...mapped, role: 'OWNER' });
      }
      if (hasRole(member, adminRoleIds)) {
        supportsMap.set(member.user.id, { ...mapped, role: 'ADMIN' });
      } else if (hasRole(member, supportRoleIds)) {
        supportsMap.set(member.user.id, { ...mapped, role: 'SUPPORT' });
      }
    }

    const allSupports = Array.from(supportsMap.values());
    return res.json({
      status: 'ok',
      dev: devMember,
      owner: Array.from(ownersMap.values()),
      admin: allSupports.filter(m => m.role === 'ADMIN'),
      support: allSupports.filter(m => m.role === 'SUPPORT'),
      allSupport: allSupports,
      missing: 0
    });
  } catch (err) {
    console.error('[api/team]', err.message);
    return res.status(500).json({ status: 'error', message: err.message, dev: null, owner: [], support: [] });
  }
}
