/**
 * assets/team.js — Mochi Town Team & Support Crew Layout
 * Hiển thị đội ngũ theo chuẩn giao diện Gummy / Mochi Town:
 * Hàng trên: Leaders (Developer & Gamemaster/Owner)
 * Hàng dưới: Support Crew (Hỗ trợ trực chiến 24/7 với hiệu ứng spotlight)
 */

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('main-team-grid');
  const supportMount = document.getElementById('support-list');
  const statusEl = document.getElementById('team-status');
  if (!grid || !supportMount) return;

  let retryTimer = null;

  const setStatus = (message, kind = 'info') => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.dataset.state = kind;
    statusEl.hidden = !message;
  };

  const getDefaultAvatar = (id) => {
    try {
      const idx = Number((BigInt(id || '0') >> 22n) % 6n);
      return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
    } catch (_) {
      return 'https://cdn.discordapp.com/embed/avatars/0.png';
    }
  };

  const addText = (parent, tag, cls, value) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    el.textContent = value;
    parent.appendChild(el);
    return el;
  };

  const makeCard = (person, role) => {
    const isSupportCrew = role === 'SUPPORT' || role === 'ADMIN';
    const card = document.createElement('article');
    card.className = isSupportCrew
      ? 'support-card glass-card reveal will-reveal'
      : 'feature-card glass-card holo-card';

    // Avatar container
    const imageWrap = document.createElement('div');
    imageWrap.className = isSupportCrew ? 'support-avatar' : 'feature-icon';

    const image = document.createElement('img');
    image.src = person.avatar || getDefaultAvatar(person.id);
    image.alt = `Ảnh đại diện ${person.name}`;
    image.loading = 'lazy';
    image.referrerPolicy = 'no-referrer';
    image.onerror = () => {
      image.onerror = null;
      image.src = getDefaultAvatar(person.id);
    };
    image.width = isSupportCrew ? 82 : 84;
    image.height = isSupportCrew ? 82 : 84;

    imageWrap.appendChild(image);
    card.appendChild(imageWrap);

    // Tên thành viên
    addText(card, 'h3', '', person.name);

    // Role Label
    addText(card, isSupportCrew ? 'span' : 'p', isSupportCrew ? 'support-role' : '', person.role || role);

    // Divider cho Support Card
    if (isSupportCrew) addText(card, 'div', 'support-divider', '');

    // Button liên kết Discord
    const link = addText(card, 'a', isSupportCrew ? 'support-chat' : 'feature-btn', isSupportCrew ? '↗' : (person.role === 'DEV' ? 'DEVELOPER' : (person.role || role)));
    link.href = person.profileUrl || `https://discord.com/users/${person.id}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `Xem Discord của ${person.name}`);

    return card;
  };

  const buildSupportWall = (people) => {
    supportMount.replaceChildren();
    supportMount.className = 'support-showcase';
    if (!people.length) return;

    const intro = document.createElement('div');
    intro.className = 'support-heading';
    intro.innerHTML = `
      <p class="section-eyebrow support-eyebrow">Support Crew</p>
      <h3 class="support-title">Hỗ trợ trực chiến 24/7</h3>
      <p class="support-copy">Đội ngũ hỗ trợ Mochi Town — mỗi thành viên chỉ xuất hiện một lần.</p>
    `;

    const gallery = document.createElement('div');
    gallery.className = 'support-gallery';

    const unique = [...new Map(people.map(person => [person.id, person])).values()];
    unique.forEach((person, index) => {
      const card = makeCard(person, person.role || 'SUPPORT');
      card.style.setProperty('--support-delay', `${index * 0.08}s`);
      gallery.appendChild(card);
    });

    supportMount.append(intro, gallery);

    // Hiệu ứng Spotlight luân phiên xoay vòng giữa các thẻ Support
    let active = -1;
    const cycle = () => {
      const cards = gallery.querySelectorAll('.support-card');
      if (!cards.length) return;
      if (active >= 0 && cards[active]) {
        cards[active].classList.remove('is-spotlight');
      }
      active = (active + 1) % cards.length;
      if (cards[active]) {
        cards[active].classList.add('is-spotlight');
      }
    };

    cycle();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const interval = setInterval(() => {
        if (!document.hidden && gallery.isConnected) cycle();
        if (!gallery.isConnected) clearInterval(interval);
      }, 1800);
    }
  };

  async function loadTeam() {
    try {
      const response = await fetch('/api/team', { cache: 'no-store' });
      let data = null;
      try {
        data = await response.json();
      } catch (_) {}

      if (!response.ok || !data || data.status === 'not_configured') {
        setStatus('Đội ngũ Ban Quản Trị đang được cập nhật. Hãy tham gia Discord để kết nối cùng BQT!', 'info');
        return;
      }

      if (data.status === 'connecting') {
        setStatus('Đang kết nối bot Discord…', 'loading');
        clearTimeout(retryTimer);
        retryTimer = setTimeout(loadTeam, 2500);
        return;
      }

      grid.replaceChildren();

      // 1. Thêm Developer
      if (data.dev) {
        grid.appendChild(makeCard(data.dev, 'DEV'));
      }

      // 2. Thêm Owner / Gamemaster
      for (const owner of data.owner || []) {
        grid.appendChild(makeCard(owner, 'OWNER'));
      }

      // 3. Gom danh sách Support & Admin cho Showcase bên dưới
      const supports = data.allSupport || [...(data.admin || []), ...(data.support || [])];
      buildSupportWall(supports);

      const leadersCount = Number(Boolean(data.dev)) + (data.owner || []).length;
      const totalCount = leadersCount + supports.length;

      grid.classList.toggle('team-only', leadersCount <= 1);
      grid.classList.toggle('team-lineup', leadersCount > 1);

      if (totalCount === 0) {
        setStatus('Đội ngũ Ban Quản Trị đang được cập nhật. Hãy tham gia Discord để kết nối cùng BQT!', 'info');
      } else {
        setStatus('');
      }
    } catch (error) {
      console.warn('[Mochi team]', error);
      setStatus('Đội ngũ Ban Quản Trị đang được cập nhật. Hãy tham gia Discord để kết nối cùng BQT!', 'info');
    }
  }

  setStatus('Đang tải đội ngũ từ Discord…', 'loading');
  loadTeam();
});
