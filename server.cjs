require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { Client, GatewayIntentBits } = require('discord.js');

const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Dynamic Open Graph handler: ensures Discord gets absolute URL for banner and site
app.get(['/', '/index.html'], (req, res) => {
  const host = req.get('x-forwarded-host') || req.get('host');
  const protocol = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
  const baseUrl = `${protocol}://${host}`;
  const indexPath = path.join(__dirname, 'index.html');
  fs.readFile(indexPath, 'utf8', (err, html) => {
    if (err) return res.sendFile(indexPath);
    const updatedHtml = html
      .replace(/content="https:\/\/mochitown\.loca\.lt\/assets\/banner\.jpg"/g, `content="${baseUrl}/assets/banner.png"`)
      .replace(/content="https:\/\/mochitown\.loca\.lt"/g, `content="${baseUrl}"`);
    res.send(updatedHtml);
  });
});

// Serve static website
app.use(express.static(__dirname));

// Discord Bot Setup — SERVER MEMBERS INTENT + đọc tin channel
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let botReady = false;
let cachedTeam = null;
let lastFetchTime = 0;
const CACHE_TTL = 30 * 1000; // Cache 30 seconds

// Helper: parse comma-separated or single IDs
function parseRoleIds(...envVars) {
  const ids = [];
  for (const val of envVars) {
    if (!val) continue;
    val.split(',').forEach(id => {
      const trimmed = id.trim();
      if (trimmed) ids.push(trimmed);
    });
  }
  return ids;
}

async function fetchTeamFromDiscord() {
  const guildId = process.env.DISCORD_GUILD_ID;
  const devRoleIds = parseRoleIds(process.env.ROLE_ID_DEV);
  const ownerRoleIds = parseRoleIds(process.env.ROLE_ID_OWNER, process.env.ROLE_ID_GAMEMASTER);
  // Support Crew gộp cả ROLE_ID_SUPPORT và ROLE_ID_ADMIN
  const supportRoleIds = parseRoleIds(process.env.ROLE_ID_SUPPORT, process.env.ROLE_ID_ADMIN);

  if (!guildId) {
    throw new Error('Chưa cấu hình DISCORD_GUILD_ID trong file .env');
  }

  const guild = await client.guilds.fetch(guildId);
  if (!guild) {
    throw new Error(`Không tìm thấy Guild ID: ${guildId}`);
  }

  // Fetch all members from Discord server via SERVER MEMBERS INTENT
  const members = await guild.members.fetch();

  const mapMember = (member, roleName) => ({
    id: member.user.id,
    name: member.displayName || member.user.username,
    avatar: member.user.displayAvatarURL({ extension: 'png', size: 128 }),
    role: roleName,
    profileUrl: `https://discord.com/users/${member.user.id}`
  });

  let devMember = null;
  const ownersMap = new Map();
  const supportsMap = new Map();

  for (const [id, member] of members) {
    if (member.user.bot) continue;

    const hasAnyRole = (roleIds) => roleIds.some(rId => member.roles.cache.has(rId));

    // 1. Developer
    if (!devMember && hasAnyRole(devRoleIds)) {
      devMember = mapMember(member, 'DEV');
    }

    // 2. GAMEMASTER MOCHI (Owner / Founder)
    if (hasAnyRole(ownerRoleIds)) {
      ownersMap.set(member.user.id, mapMember(member, 'OWNER'));
    }

    // 3. Support Crew: gộp chung cả Support lẫn Admin
    if (hasAnyRole(supportRoleIds)) {
      const adminRoleIds = parseRoleIds(process.env.ROLE_ID_ADMIN);
      const roleLabel = hasAnyRole(adminRoleIds) ? 'ADMIN' : 'SUPPORT';
      supportsMap.set(member.user.id, mapMember(member, roleLabel));
    }
  }

  const owners = Array.from(ownersMap.values());
  const allSupports = Array.from(supportsMap.values());

  return {
    status: 'ok',
    dev: devMember,
    owner: owners,
    admin: allSupports.filter(m => m.role === 'ADMIN'),
    support: allSupports.filter(m => m.role === 'SUPPORT'),
    allSupport: allSupports,
    totalCount: (devMember ? 1 : 0) + owners.length + allSupports.length
  };
}

// API endpoint that frontend team.js calls
app.get('/api/team', async (req, res) => {
  if (!process.env.DISCORD_BOT_TOKEN) {
    return res.json({
      status: 'not_configured',
      message: 'Chưa cấu hình DISCORD_BOT_TOKEN trong .env. Hãy điền Token bot Discord để tự động lấy thành viên.',
      dev: null,
      owner: [],
      support: []
    });
  }

  if (!botReady) {
    return res.json({
      status: 'connecting',
      message: 'Bot Discord đang kết nối tới server để tải danh sách thành viên...',
      dev: null,
      owner: [],
      support: []
    });
  }

  try {
    const now = Date.now();
    if (cachedTeam && (now - lastFetchTime < CACHE_TTL)) {
      return res.json(cachedTeam);
    }

    const data = await fetchTeamFromDiscord();
    cachedTeam = data;
    lastFetchTime = now;
    return res.json(data);
  } catch (err) {
    console.error('[API Team Error]:', err.message);
    return res.json({
      status: 'error',
      message: err.message,
      dev: null,
      owner: [],
      support: []
    });
  }
});

// ─── API: Bảng Tin từ Discord Channel ──────────────────────────────────────
let cachedNews = null;
let lastNewsFetch = 0;
const NEWS_CACHE_TTL = 60 * 1000; // 60 seconds

app.get('/api/news', async (req, res) => {
  const channelId = process.env.CHANNEL_ID_NEWS;

  if (!process.env.DISCORD_BOT_TOKEN || !channelId) {
    return res.json({
      status: 'not_configured',
      messages: [],
      message: 'Chưa cấu hình DISCORD_BOT_TOKEN hoặc CHANNEL_ID_NEWS trong .env'
    });
  }

  if (!botReady) {
    return res.json({
      status: 'connecting',
      messages: [],
      message: 'Bot đang kết nối...'
    });
  }

  try {
    const now = Date.now();
    if (cachedNews && (now - lastNewsFetch < NEWS_CACHE_TTL)) {
      return res.json(cachedNews);
    }

    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      throw new Error(`Channel ${channelId} không tìm thấy hoặc không phải text channel`);
    }

    // Lấy 6 tin nhắn mới nhất (hỗ trợ cả tin nhắn văn bản lẫn embed/webhook)
    const fetched = await channel.messages.fetch({ limit: 50 });
    const messages = fetched
      .filter(m => m.author.id !== client.user.id && ((m.content && m.content.trim().length > 0) || (m.embeds && m.embeds.length > 0)))
      .sort((a, b) => b.createdTimestamp - a.createdTimestamp)
      .first(6)
      .map(m => {
        let text = m.content ? m.content.trim() : '';
        if (!text && m.embeds && m.embeds.length > 0) {
          const emb = m.embeds[0];
          text = [emb.title, emb.description].filter(Boolean).join('\n');
        }
        return {
          id: m.id,
          content: text,
          timestamp: m.createdAt.toISOString(),
          author: m.author.displayName || m.author.username,
          jumpUrl: m.url
        };
      })
      .filter(m => m.content && m.content.length > 0);

    const result = { status: 'ok', messages };
    cachedNews = result;
    lastNewsFetch = now;
    return res.json(result);
  } catch (err) {
    console.error('[API News Error]:', err.message);
    return res.json({
      status: 'error',
      messages: [],
      message: err.message
    });
  }
});

// Start Discord Bot
if (process.env.DISCORD_BOT_TOKEN) {
  client.once('clientReady', () => {
    botReady = true;
    console.log(`[Discord Bot] Đã đăng nhập với tư cách: ${client.user.tag}`);
    console.log(`[Discord Bot] Sẵn sàng quét Members & đọc Channel tin tức!`);
  });

  client.login(process.env.DISCORD_BOT_TOKEN).catch(err => {
    console.error('[Discord Bot Login Error]:', err.message);
  });
} else {
  console.log('[Notice] Chưa có DISCORD_BOT_TOKEN trong .env. Hãy điền Token để bot hoạt động.');
}

// Start Server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🍡 MOCHI TOWN SERVER ĐANG CHẠY TẠI: http://localhost:${PORT}`);
  console.log(`API Team: http://localhost:${PORT}/api/team`);
  console.log(`API News: http://localhost:${PORT}/api/news`);
  console.log(`======================================================\n`);
});