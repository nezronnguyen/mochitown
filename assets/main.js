// BUGFIX (structural): every feature below now runs inside its own isolated
// try/catch via runSafely(). Previously, if any single block threw a
// synchronous error, every feature registered AFTER it in this file would
// silently never run at all — which is exactly what produced symptoms like
// the countdown staying frozen at "00:00:00:00" (its code never executed).
// Wrapping each feature keeps all logic, variable names, IDs and classes
// 100% identical; it only prevents one failure from cascading into others.
function runSafely(fn, label) {
  try {
    fn();
  } catch (err) {
    console.error(`[mochitown] "${label}" failed to initialize:`, err);
  }
}

// ⚠️ Đã được thay thế bởi assets/music-player.js — xem #mochiMusicPlayer trong index.html
function playBackgroundMusic() {
  // disabled — new player handles this
}

/* ============================================================
   ENTER OVERLAY — fits tightly on mobile, no scroll needed
   ============================================================ */
function showEnterOverlay() {
  if (document.getElementById('enterOverlay')) return;

  if (typeof playBackgroundMusic === 'function') {
    playBackgroundMusic();
  }

  // Lock body scroll so the overlay never feels "long"
  const scrollY = window.scrollY || 0;
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';
  document.body.dataset.enterScrollY = String(scrollY);

  const overlay = document.createElement('div');
  overlay.id = 'enterOverlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'Chào mừng đến Mochi Town');
  overlay.innerHTML = `
    <div class="enter-bg" aria-hidden="true">
      <span class="enter-orb o1"></span>
      <span class="enter-orb o2"></span>
      <span class="enter-orb o3"></span>
    </div>
    <div class="enter-inner">
      <div class="enter-title">Mochi Town</div>
      <div class="enter-sub">Thành phố Bánh Ngọt · LAUNCHER Roleplay</div>
      <div class="enter-cta">
        <span class="enter-cta-dot"></span>
        Nhấn để khám phá
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.id = 'enterOverlayStyles';
  style.textContent = `
    #enterOverlay {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      height: 100dvh;
      max-height: 100dvh;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(ellipse at 50% 40%, rgba(40, 12, 28, 0.94) 0%, rgba(8, 4, 10, 0.97) 70%);
      backdrop-filter: blur(20px) saturate(140%);
      -webkit-backdrop-filter: blur(20px) saturate(140%);
      cursor: pointer;
      overflow: hidden;
      overscroll-behavior: none;
      touch-action: none;
      animation: enterFadeIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
      box-sizing: border-box;
      padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
    }
    #enterOverlay .enter-bg {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }
    #enterOverlay .enter-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(50px);
      opacity: 0.4;
    }
    #enterOverlay .enter-orb.o1 {
      width: min(280px, 55vw); height: min(280px, 55vw);
      top: 8%; left: 10%;
      background: #ff6ec7;
      animation: enterOrb 8s ease-in-out infinite;
    }
    #enterOverlay .enter-orb.o2 {
      width: min(220px, 45vw); height: min(220px, 45vw);
      bottom: 12%; right: 8%;
      background: #c6a3ff;
      animation: enterOrb 10s ease-in-out infinite reverse;
    }
    #enterOverlay .enter-orb.o3 {
      width: min(140px, 30vw); height: min(140px, 30vw);
      top: 45%; left: 55%;
      background: #ffc94d;
      opacity: 0.28;
      animation: enterOrb 7s ease-in-out infinite 1s;
    }
    #enterOverlay .enter-inner {
      position: relative;
      text-align: center;
      color: #fff;
      padding: 1rem 1.25rem;
      max-width: 92vw;
      animation: enterRise 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    #enterOverlay .enter-title {
      font-family: 'Oswald', system-ui, sans-serif;
      font-size: clamp(1.85rem, 8vw, 2.8rem);
      font-weight: 800;
      letter-spacing: 0.06em;
      line-height: 1.15;
      margin: 0 0 0.4rem;
      text-transform: uppercase;
      background: linear-gradient(120deg, #fff2f8 0%, #ff9ec8 35%, #ffc94d 55%, #ff9ec8 75%, #fff2f8 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      animation: heroGradient 6s ease-in-out infinite;
    }
    #enterOverlay .enter-sub {
      font-family: 'Oswald', system-ui, sans-serif;
      font-size: clamp(0.65rem, 2.8vw, 0.78rem);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.55);
      margin-bottom: 1.25rem;
    }
    #enterOverlay .enter-cta {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-family: 'Oswald', system-ui, sans-serif;
      font-size: clamp(0.7rem, 3vw, 0.8rem);
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.9);
      padding: 0.55rem 1.2rem;
      border-radius: 999px;
      border: 1px solid rgba(255, 158, 210, 0.4);
      background: rgba(255, 110, 199, 0.15);
      backdrop-filter: blur(8px);
      animation: enterPulse 2.2s ease-in-out infinite;
      transition: background 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
    }
    #enterOverlay:active .enter-cta,
    #enterOverlay:hover .enter-cta {
      background: rgba(255, 110, 199, 0.28);
      border-color: rgba(255, 158, 210, 0.6);
      transform: scale(1.03);
    }
    #enterOverlay .enter-cta-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #ff9ec8;
      box-shadow: 0 0 10px #ff6ec7;
      flex-shrink: 0;
      animation: enterDot 1.4s ease-in-out infinite;
    }

    /* Mobile: everything fits one screen — no scroll */
    @media (max-width: 600px) {
      #enterOverlay {
        padding: max(12px, env(safe-area-inset-top)) 16px max(12px, env(safe-area-inset-bottom));
      }
      #enterOverlay .enter-inner { padding: 0.75rem 0.5rem; }
      #enterOverlay .enter-title {
        font-size: clamp(1.7rem, 9vw, 2.3rem);
        margin-bottom: 0.35rem;
      }
      #enterOverlay .enter-sub {
        margin-bottom: 1rem;
        letter-spacing: 0.1em;
      }
      #enterOverlay .enter-cta { padding: 0.5rem 1.1rem; }
      #enterOverlay .enter-orb.o1 { width: 180px; height: 180px; top: 5%; left: 5%; }
      #enterOverlay .enter-orb.o2 { width: 140px; height: 140px; bottom: 8%; right: 5%; }
      #enterOverlay .enter-orb.o3 { width: 90px; height: 90px; }
    }
    @media (max-height: 560px) {
      #enterOverlay .enter-title { font-size: 1.6rem; }
      #enterOverlay .enter-sub { margin-bottom: 0.75rem; font-size: 0.62rem; }
      #enterOverlay .enter-cta { padding: 0.45rem 1rem; font-size: 0.68rem; }
      #enterOverlay .enter-orb { opacity: 0.25; }
    }

    #enterOverlay.is-out {
      pointer-events: none;
      opacity: 0;
      backdrop-filter: blur(0) saturate(100%);
      -webkit-backdrop-filter: blur(0) saturate(100%);
      transition: opacity .5s ease, backdrop-filter .5s ease;
    }
    #enterOverlay.is-out .enter-inner {
      opacity: 0;
      transform: scale(1.04) translateY(-8px);
      transition: opacity .4s ease-out, transform .5s cubic-bezier(0.65, 0, 0.35, 1);
    }

    @keyframes enterFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes enterRise {
      from { opacity: 0; transform: translateY(14px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes enterPulse {
      0%, 100% { opacity: 0.78; }
      50%      { opacity: 1; }
    }
    @keyframes enterDot {
      0%, 100% { transform: scale(1); opacity: 1; }
      50%      { transform: scale(1.3); opacity: 0.7; }
    }
    @keyframes enterOrb {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50%      { transform: translate(14px, -12px) scale(1.06); }
    }
    @keyframes heroGradient {
      0%   { background-position: 0% center; }
      50%  { background-position: 100% center; }
      100% { background-position: 0% center; }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(overlay);

  function unlockScroll() {
    const y = parseInt(document.body.dataset.enterScrollY || '0', 10);
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    delete document.body.dataset.enterScrollY;
    window.scrollTo(0, y);
  }

  function dismiss() {
    try { sessionStorage.setItem('gummy-entered', '1'); } catch (error) { }
    const audio = window.__gummyAudio;
    if (audio) {
      audio.muted = false;
      if (audio.paused) audio.play().catch(() => { });
    }
    overlay.style.animation = 'none';
    const inner = overlay.querySelector('.enter-inner');
    if (inner) inner.style.animation = 'none';
    requestAnimationFrame(() => overlay.classList.add('is-out'));
    setTimeout(() => {
      overlay.remove();
      style.remove();
      unlockScroll();
    }, 560);
  }

  overlay.addEventListener('click', dismiss, { once: true });
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      dismiss();
    }
  });
}

/* ============================================================
   MAIN DOMContentLoaded
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Welcome screen only on the first page in a tab. Music is still available everywhere. ---------- */
  runSafely(() => {
    playBackgroundMusic();
    let entered = false;
    try { entered = sessionStorage.getItem('gummy-entered') === '1'; } catch (error) { }
    if (!entered) setTimeout(showEnterOverlay, 200);
  }, 'enter overlay');

  /* ---------- Mobile nav ---------- */
  runSafely(() => {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    const navOverlay = document.getElementById('navOverlay');

    if (menuBtn && navLinks) {
      const closeMenu = () => {
        navLinks.classList.remove('active');
        navOverlay && navOverlay.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
        document.body.style.overflow = '';
      };
      const openMenu = () => {
        navLinks.classList.add('active');
        navOverlay && navOverlay.classList.add('active');
        menuBtn.setAttribute('aria-expanded', 'true');
        document.body.classList.add('menu-open');
        document.body.style.overflow = 'hidden';
      };
      menuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        navLinks.classList.contains('active') ? closeMenu() : openMenu();
      });
      navOverlay && navOverlay.addEventListener('click', closeMenu);
      navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeMenu();
      });
    }
  }, 'mobile nav');

  /* ---------- Gentle, one-time scroll reveal (no scroll-linked blur) ---------- */
  runSafely(() => {
    const elements = document.querySelectorAll('.reveal');
    if (!elements.length || !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -30px 0px', threshold: 0.02 });
    document.body.classList.add('motion-ready');
    elements.forEach((element) => { element.classList.add('will-reveal'); observer.observe(element); });
  }, 'scroll reveal');

  /* ---------- Back to top ---------- */
  runSafely(() => {
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
      window.addEventListener('scroll', () => {
        backToTop.classList.toggle('show', window.scrollY > 500);
      });
      backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
  }, 'back to top');

  /* ---------- Copy connect command ---------- */
  runSafely(() => {
    document.querySelectorAll('.copy-ip').forEach(btn => {
      if (btn.tagName === 'A' || btn.getAttribute('href')) return;
      btn.addEventListener('click', async () => {
        const value = btn.dataset.ip;
        const label = btn.querySelector('span');
        const originalText = label ? label.textContent : '';
        try {
          await navigator.clipboard.writeText(value);
        } catch (err) {
          /* clipboard unavailable */
        }
        btn.classList.add('copied');
        if (label) label.textContent = 'Đã sao chép!';
        setTimeout(() => {
          btn.classList.remove('copied');
          if (label) label.textContent = originalText;
        }, 1800);
      });
    });
  }, 'copy connect command');

  /* ---------- Event countdown ---------- */
  runSafely(() => {
    const countdown = document.getElementById('countdown');
    if (countdown) {
      const target = new Date();
      target.setDate(target.getDate() + 7);
      target.setHours(20, 0, 0, 0);

      const daysEl = document.getElementById('days');
      const hoursEl = document.getElementById('hours');
      const minsEl = document.getElementById('mins');
      const secsEl = document.getElementById('secs');

      const pad = n => String(n).padStart(2, '0');

      const tick = () => {
        const diff = Math.max(0, target - new Date());
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        if (daysEl) { daysEl.textContent = pad(d); daysEl.setAttribute('value', d); }
        if (hoursEl) { hoursEl.textContent = pad(h); hoursEl.setAttribute('value', h); }
        if (minsEl) { minsEl.textContent = pad(m); minsEl.setAttribute('value', m); }
        if (secsEl) { secsEl.textContent = pad(s); secsEl.setAttribute('value', s); }
      };
      tick();
      setInterval(tick, 1000);
    }
  }, 'event countdown');

  /* ---------- Wiki: search + active category sync ---------- */
  runSafely(() => {
    const wikiSearch = document.getElementById('wikiSearch');
    const wikiArticles = document.querySelectorAll('.wiki-article');
    if (wikiSearch && wikiArticles.length) {
      const runSearch = () => {
        const term = wikiSearch.value.trim().toLowerCase();
        wikiArticles.forEach(article => {
          const items = article.querySelectorAll('li');
          let anyVisible = false;
          items.forEach(li => {
            const match = !term || li.textContent.toLowerCase().includes(term);
            li.style.display = match ? '' : 'none';
            if (match) anyVisible = true;
          });
          article.hidden = term.length > 0 && !anyVisible;
        });
      };
      wikiSearch.addEventListener('input', runSearch);
      document.querySelectorAll('.wiki-search button').forEach(btn => btn.addEventListener('click', runSearch));
    }

    const wikiNavLinks = document.querySelectorAll('.wiki-nav a, .category-card');
    const wikiSections = document.querySelectorAll('.wiki-article[id]');
    if (wikiNavLinks.length && wikiSections.length && 'IntersectionObserver' in window) {
      const setActive = (id) => {
        wikiNavLinks.forEach(link => {
          const match = link.getAttribute('href') === `#${id}`;
          link.toggleAttribute('aria-current', match);
          if (match) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      };
      const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      }, { rootMargin: '-40% 0px -50% 0px' });
      wikiSections.forEach(sec => sectionObserver.observe(sec));
    }
  }, 'wiki search/nav');

  /* ---------- FAQ accordion ----------
     Moved to a small inline <script> at the bottom of index.html so the
     FAQ works standalone without depending on this file loading/running
     correctly. (Keeping it here too would double-bind the click handler
     and make every click cancel itself out.) */

  /* ---------- Community events: search + filter + modal ---------- */
  runSafely(() => {
    const eventSearch = document.getElementById('eventSearch');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const eventCards = document.querySelectorAll('.event-card');
    const modal = document.getElementById('eventDetailsModal');

    if (eventCards.length) {
      const eventDetails = {
        tournament: {
          title: 'Grand Battle Tournament',
          rules: [
            'Must be a member of a clan to participate',
            'Each clan can enter with maximum 10 players',
            'PvP rules apply',
            'No hacks or exploits allowed',
            'Tournament duration: 2 hours'
          ],
          prizes: [
            '1st Clan: $50,000 + Exclusive Clan Tag',
            '2nd Clan: $25,000 + Special Armor Set',
            '3rd Clan: $10,000 + Unique Weapon Skin'
          ]
        },
        community: {
          title: 'Master Builder Challenge',
          rules: [
            'Builds must be completely original',
            'Maximum build area: 100x100 blocks',
            'Creative mode allowed',
            'No WorldEdit usage',
            'Time limit: 3 hours'
          ],
          prizes: [
            '1st Place: $30,000 + Master Builder Badge',
            '2nd Place: $15,000 + Special Block Set',
            '3rd Place: $7,500 + Unique Hat'
          ]
        },
        ingame: {
          title: 'Epic Treasure Hunt',
          rules: [
            'Solo participation only',
            'No team formation allowed',
            'PvP disabled',
            'No flying or teleporting',
            'Time limit: 1 hour'
          ],
          prizes: [
            '1st Place: $15,000 + Legendary Chest',
            '2nd Place: $7,500 + Rare Chest',
            '3rd Place: $3,750 + Common Chest'
          ]
        }
      };

      const openModal = (eventType) => {
        const details = eventDetails[eventType];
        if (!details || !modal) return;
        modal.querySelector('.modal-header h2').textContent = details.title;

        const rulesList = modal.querySelector('.rules-list');
        rulesList.innerHTML = details.rules.map(rule => `<li>${rule}</li>`).join('');

        const prizesList = modal.querySelector('.prizes-list');
        prizesList.innerHTML = details.prizes.map(prize => `<li>${prize}</li>`).join('');

        const card = document.querySelector(`[data-event-type="${eventType}"]`);
        if (card) {
          modal.querySelector('.event-date-info').textContent =
            `${card.querySelector('.event-date .day').textContent} ${card.querySelector('.event-date .month').textContent}`;
          modal.querySelector('.event-time-info').textContent = card.querySelector('.meta-item:first-child span').textContent;
          modal.querySelector('.event-participants-info').textContent = card.querySelector('.participant-count').textContent.trim();
          modal.querySelector('.event-prize-info').textContent = card.querySelector('.meta-item:last-child span').textContent;
        }

        modal.hidden = false;
        requestAnimationFrame(() => modal.classList.add('show'));
        document.body.style.overflow = 'hidden';
        modal.querySelector('.modal-close').focus();
      };

      const closeModal = () => {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        setTimeout(() => { modal.hidden = true; }, 300);
      };

      document.querySelectorAll('.details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const card = e.target.closest('.event-card');
          if (card) openModal(card.dataset.eventType);
        });
      });

      if (modal) {
        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
        });
      }

      const filterEvents = () => {
        const term = eventSearch ? eventSearch.value.toLowerCase() : '';
        const activeBtn = document.querySelector('.filter-btn[aria-pressed="true"]');
        const activeFilter = activeBtn ? activeBtn.dataset.filter : 'all';

        let visibleCount = 0;
        eventCards.forEach(card => {
          const title = card.querySelector('h2').textContent.toLowerCase();
          const description = card.querySelector('p').textContent.toLowerCase();
          const type = card.dataset.eventType;
          const matchesSearch = title.includes(term) || description.includes(term);
          const matchesFilter = activeFilter === 'all' || type === activeFilter;
          const visible = matchesSearch && matchesFilter;
          card.style.display = visible ? 'flex' : 'none';
          if (visible) visibleCount++;
        });

        let noResults = document.querySelector('.no-results');
        if (visibleCount === 0) {
          if (!noResults) {
            noResults = document.createElement('p');
            noResults.className = 'no-results';
            noResults.innerHTML = 'Không tìm thấy sự kiện phù hợp. Hãy thử từ khoá khác.';
            const grid = document.querySelector('.events-grid');
            if (grid) grid.appendChild(noResults);
          }
        } else if (noResults) {
          noResults.remove();
        }
      };

      eventSearch && eventSearch.addEventListener('input', filterEvents);
      filterButtons.forEach(button => {
        button.addEventListener('click', () => {
          filterButtons.forEach(btn => btn.setAttribute('aria-pressed', 'false'));
          button.setAttribute('aria-pressed', 'true');
          filterEvents();
        });
      });
    }
  }, 'community events');

  /* ---------- Hero side-dot nav: sync active dot with scroll position ---------- */
  runSafely(() => {
    const heroDots = document.querySelectorAll('.hero-dot');
    if (!heroDots.length || !('IntersectionObserver' in window)) return;

    const targets = Array.from(heroDots)
      .map(dot => document.querySelector(dot.getAttribute('href')))
      .filter(Boolean);
    if (!targets.length) return;

    const setActiveDot = (id) => {
      heroDots.forEach(dot =>
        dot.classList.toggle('active', dot.getAttribute('href') === `#${id}`)
      );
    };

    const dotObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setActiveDot(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

    targets.forEach(target => dotObserver.observe(target));
  }, 'hero dot nav sync');
});

/* ============================================================
   UI ENHANCEMENT ONLY — additive visual behaviour
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header glass-on-scroll */
  runSafely(() => {
    const uiHeader = document.querySelector('.main-header');
    if (uiHeader) {
      const toggleHeaderScroll = () =>
        uiHeader.classList.toggle('is-scrolled', window.scrollY > 24);
      toggleHeaderScroll();
      window.addEventListener('scroll', toggleHeaderScroll, { passive: true });
    }
  }, 'header glass-on-scroll');

  /* Button ripple */
  runSafely(() => {
    if (!prefersReducedMotion) {
      const uiRippleSelector =
        '.primary-btn, .secondary-btn, .feature-btn, .discord-pill, .join-btn, ' +
        '.details-btn, .filter-btn, .news-btn, .copy-ip, .modal-close, .back-to-top, .support-chat, .footer-social a';
      document.addEventListener(
        'click',
        (e) => {
          const el = e.target.closest(uiRippleSelector);
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const ripple = document.createElement('span');
          ripple.className = 'ui-ripple';
          const size = Math.max(rect.width, rect.height);
          ripple.style.width = ripple.style.height = `${size}px`;
          ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
          ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
          el.appendChild(ripple);
          ripple.addEventListener('animationend', () => ripple.remove());
        },
        { passive: true }
      );
    }
  }, 'button ripple');

  /* Card cursor spotlight + holo tracking */
  runSafely(() => {
    if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches) {
      document.querySelectorAll('.glass-card').forEach((card) => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const px = e.clientX - rect.left;
          const py = e.clientY - rect.top;
          card.style.setProperty('--spot-x', `${px}px`);
          card.style.setProperty('--spot-y', `${py}px`);
          if (card.classList.contains('holo-card')) {
            card.style.setProperty('--holo-x', `${(px / rect.width) * 100}%`);
            card.style.setProperty('--holo-y', `${(py / rect.height) * 100}%`);
          }
        });
      });

      const glow = document.createElement('div');
      glow.className = 'cursor-glow';
      glow.setAttribute('aria-hidden', 'true');
      document.body.appendChild(glow);
      let glowActive = false;
      window.addEventListener(
        'mousemove',
        (e) => {
          glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
          if (!glowActive) {
            glow.classList.add('active');
            glowActive = true;
          }
        },
        { passive: true }
      );
      window.addEventListener('mouseleave', () => glow.classList.remove('active'));
    }
  }, 'card cursor spotlight + holo tracking');

  /* Smooth same-site page transitions */
  runSafely(() => {
    if (prefersReducedMotion) return;
    const internalLinkSelector = 'a[href$=".html"]:not([target="_blank"])';
    document.querySelectorAll(internalLinkSelector).forEach((link) => {
      link.addEventListener('click', (e) => {
        if (
          e.defaultPrevented ||
          e.button !== 0 ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey
        )
          return;
        const url = link.getAttribute('href');
        if (!url || link.hasAttribute('download')) return;
        e.preventDefault();
        document.documentElement.classList.add('page-exit');
        window.setTimeout(() => {
          window.location.href = url;
        }, 220);
      });
    });
  }, 'page transition');
});
