/* One authoritative LAUNCHER snapshot for both the hero phone and server page. */
(() => {
  const $ = id => document.getElementById(id);
  const state = {last: null};
  function setText(id, value) { const el = $(id); if (el) el.textContent = value; }
  function setBadge(text, kind) {
    const el = $('serverStatusBadge');
    if (el) { el.textContent = text; el.dataset.state = kind; }
    const hero = $('heroServerStatus');
    if (hero) {
      const dot = hero.querySelector('.stat-dot');
      hero.textContent = '';
      if (dot) hero.appendChild(dot);
      hero.appendChild(document.createTextNode(` ${text}`));
      hero.dataset.state = kind;
    }
  }
  function showSnapshot(data) {
    // Never turn a missing or invalid value into a fabricated zero.
    const players = Number(data?.players);
    const max = Number(data?.maxPlayers);
    if (!Number.isInteger(players) || players < 0 || !Number.isInteger(max) || max <= 0) throw Error('Số người chơi LAUNCHER không hợp lệ');
    const label = `${players}/${max}`;
    setText('heroPlayerCount', label);
    const number = $('heroPlayerCount');
    if (number) number.dataset.digits = String(label.length);
    setText('serverPlayers', `${label} người chơi`);
    const ring = $('heroStatusRing');
    if (ring) {
      ring.setAttribute('aria-label', `${players} trên ${max} người chơi`);
      ring.style.setProperty('--online-ratio', `${Math.min(100, players / max * 100)}%`);
    }
    setText('heroDataLabel', data.stale ? 'LAUNCHER · DỮ LIỆU GẦN NHẤT' : 'LAUNCHER · DỮ LIỆU TRỰC TIẾP');
    setText('heroLatencyLabel', `${players} người chơi đang trực tuyến`);
    setBadge(data.stale ? 'Dữ liệu gần nhất' : 'Đang hoạt động', data.stale ? 'stale' : 'online');
    setText('serverName', 'Mochi Town');
    setText('serverEndpoint', 'Launcher Mochi Town');
    setText('connectCommand', 'Mochi Town Launcher');
    const copy = $('copyConnectBtn');
    if (copy && copy.tagName === 'A') copy.href = 'https://drive.google.com/drive/folders/1q2hqxUWkqKIhRG2t7c8ezfaXRcDXzpuM?usp=sharing';
    const updated = $('serverUpdated');
    if (updated && data.updatedAt) updated.textContent = new Date(data.updatedAt).toLocaleString('vi-VN');
    state.last = data;
  }
  function showUnavailable() {
    // If previously loaded, keep last known snapshot
    if (state.last) return showSnapshot({...state.last, stale: true});
    setText('heroPlayerCount', 'Coming Soon');
    setText('serverPlayers', 'Coming Soon');
    setText('heroDataLabel', 'LAUNCHER · COMING SOON');
    setText('heroLatencyLabel', 'Đang phát triển');
    setBadge('Coming Soon', 'soon');
  }
  async function refresh() {
    try {
      const response = await fetch('/api/LAUNCHER/server', {cache:'no-store'});
      if (!response.ok) throw Error(`LAUNCHER HTTP ${response.status}`);
      showSnapshot(await response.json());
    } catch (error) {
      console.warn('[Mochi Launcher]', error.message);
      showUnavailable();
    }
  }
  const start = () => {
    if (!$('heroPlayerCount') && !$('serverPlayers')) return;
    for (const id of ['serverCode', 'serverUpdated']) {
      const el = $(id);
      if (el) el.closest('.server-info-grid > div')?.remove();
    }
    refresh();
    setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', () => {if (!document.hidden) refresh();});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
