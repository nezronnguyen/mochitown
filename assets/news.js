/* Mochi Town — Tự động tải bài tin từ Discord channel qua /api/news */
(() => {
  const ARROW_SVG = `<span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3"/></svg></span>`;

  // Detect emoji tag in first line → dùng làm category badge
  const CATEGORY_MAP = {
    '🎉': 'Sự kiện', '🎊': 'Sự kiện', '🥳': 'Sự kiện',
    '📢': 'Thông báo', '📣': 'Thông báo', '🔔': 'Thông báo',
    '🛠': 'Cập nhật', '🔧': 'Cập nhật', '⚙️': 'Cập nhật', '✅': 'Cập nhật',
    '🚨': 'Khẩn cấp', '⚠️': 'Khẩn cấp',
    '🎮': 'Gameplay', '🗺': 'Gameplay',
    '💰': 'Kinh tế', '💵': 'Kinh tế',
    '🏠': 'Nhà đất', '🏡': 'Nhà đất',
  };

  function detectCategory(text) {
    for (const [emoji, label] of Object.entries(CATEGORY_MAP)) {
      if (text.startsWith(emoji)) return label;
    }
    return 'Cập nhật';
  }

  function formatViDate(isoDate) {
    const d = new Date(isoDate);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return `${day} Tháng ${month}, ${year}`;
  }

  function isoDate(isoString) {
    return isoString.slice(0, 10);
  }

  // Tách dòng đầu làm tiêu đề, các dòng còn lại làm nội dung
  function parseMessage(content) {
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    const title = lines[0] || 'Thông báo mới';
    const body = lines.slice(1).join(' ').slice(0, 160);
    return { title, body };
  }

  function buildCard(item, index) {
    const { title, body } = parseMessage(item.content);
    const category = detectCategory(item.content);
    const dateLabel = formatViDate(item.timestamp);
    const iso = isoDate(item.timestamp);
    const delay = index * 65;
    const link = item.jumpUrl || item.discordUrl || 'https://discord.gg/krftt8bA7m';

    return `<article class="news-card glass-card holo-card reveal" style="--reveal-delay:${delay}ms;">
      <div class="news-meta">
        <time datetime="${iso}">${dateLabel}</time>
        <span class="category">${category}</span>
      </div>
      <h3>${title}</h3>
      ${body ? `<p>${body}${body.length >= 160 ? '…' : ''}</p>` : ''}
      <a href="${link}" class="news-btn" target="_blank" rel="noopener">
        Xem thêm ${ARROW_SVG}
      </a>
    </article>`;
  }

  function showError(grid) {
    grid.innerHTML = `<p style="text-align:center;color:var(--colour-text-muted,#aaa);grid-column:1/-1;padding:2rem 0;">
      Chưa Có Cập Nhật Mới — Hãy đăng tin trong kênh Discord thông báo!
    </p>`;
  }

  async function loadNews() {
    const grid = document.getElementById('news-grid');
    if (!grid) return;

    try {
      const res = await fetch('/api/news', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (!Array.isArray(data.messages) || data.messages.length === 0) {
        grid.innerHTML = `<p style="text-align:center;color:var(--colour-text-muted,#aaa);grid-column:1/-1;padding:2rem 0;">
          Chưa có bài tin nào. Hãy đăng tin trong kênh Discord thông báo!
        </p>`;
        return;
      }

      grid.innerHTML = data.messages.map((item, i) => buildCard(item, i)).join('');

      // Trigger reveal animation if effects-2026.js is present
      if (typeof IntersectionObserver !== 'undefined') {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(e => {
            if (e.isIntersecting) {
              e.target.classList.add('is-visible');
              observer.unobserve(e.target);
            }
          });
        }, { threshold: 0.1 });
        grid.querySelectorAll('.reveal').forEach(el => observer.observe(el));
      }
    } catch (err) {
      console.warn('[Mochi News]', err.message);
      showError(grid);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNews, { once: true });
  } else {
    loadNews();
  }
})();
