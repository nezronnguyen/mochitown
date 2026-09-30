/* =========================================================
   MOCHI MUSIC PLAYER — Logic JS
   File: assets/music-player.js
   Tính năng: lưu trạng thái qua sessionStorage để nhạc tiếp
   tục khi chuyển trang (không bị reset lại từ đầu).
   ========================================================= */
(function () {
  'use strict';

  const SEL = id => document.getElementById(id);
  const STORE_KEY = 'mmp_state';

  const player = SEL('mochiMusicPlayer');
  const audio = SEL('mochiAudio');
  const collapsed = SEL('mmpCollapsed');
  const expanded = SEL('mmpExpanded');
  const playBtn = SEL('mmpPlayBtn');
  const iconPlay = SEL('mmpIconPlay');
  const iconPause = SEL('mmpIconPause');
  const expandBtn = SEL('mmpExpandBtn');
  const playBtnBig = SEL('mmpPlayBtnBig');
  const iconPlayBig = SEL('mmpIconPlayBig');
  const iconPauseBig = SEL('mmpIconPauseBig');
  const collapseBtn = SEL('mmpCollapseBtn');
  const volBtn = SEL('mmpVolBtn');
  const volSlider = SEL('mmpVolSlider');
  const progressBar = SEL('mmpProgressBar');
  const progressFill = SEL('mmpProgressFill');
  const progressThumb = SEL('mmpProgressThumb');
  const curTime = SEL('mmpCurrent');
  const durTime = SEL('mmpDuration');
  const titleEl = SEL('mmpTitle');
  const marqueeEl = SEL('mmpMarquee');

  // Thoát nhẹ nếu player chưa được thêm vào trang này
  if (!player || !audio) return;

  let isExpanded = false;

  // ── Format time mm:ss ────────────────────────────────────
  function fmt(s) {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ':' + String(sec).padStart(2, '0');
  }

  // ── Đồng bộ icon play/pause ───────────────────────────────
  function setPlayIcons(playing) {
    iconPlay.style.display = playing ? 'none' : '';
    iconPause.style.display = playing ? '' : 'none';
    iconPlayBig.style.display = playing ? 'none' : '';
    iconPauseBig.style.display = playing ? '' : 'none';
    player.classList.toggle('mmp-playing', playing);
  }

  // ── Cập nhật thanh tiến trình ─────────────────────────────
  function updateProgress() {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = pct + '%';
    progressThumb.style.left = pct + '%';
    curTime.textContent = fmt(audio.currentTime);
  }

  function updateDuration() {
    durTime.textContent = fmt(audio.duration);
  }

  // ── Tên bài từ tên file ───────────────────────────────────
  function setSongTitle(src) {
    try {
      const name = src.split('/').pop().replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      const pretty = name.charAt(0).toUpperCase() + name.slice(1);
      if (titleEl) titleEl.textContent = '♪ ' + pretty;
      if (marqueeEl) marqueeEl.textContent = '♪ ' + pretty;
    } catch (_) { }
  }
  setSongTitle('./assets/Mochi Town.mp3');

  // ─────────────────────────────────────────────────────────
  // sessionStorage: lưu & khôi phục trạng thái qua trang
  // ─────────────────────────────────────────────────────────
  function saveState() {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify({
        playing: !audio.paused,
        time: audio.currentTime,
        volume: audio.volume,
        muted: audio.muted
      }));
    } catch (_) { }
  }

  function loadState() {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  // Lưu trước khi thoát/chuyển trang
  window.addEventListener('pagehide', saveState);
  window.addEventListener('beforeunload', saveState);
  // Lưu định kỳ 2s phòng crash/close đột ngột
  setInterval(saveState, 2000);

  // ── Volume ────────────────────────────────────────────────
  volSlider.addEventListener('input', () => {
    audio.volume = volSlider.value / 100;
    audio.muted = false;
    const volX = SEL('mmpVolX');
    if (volX) volX.style.display = '';
  });

  volBtn.addEventListener('click', () => {
    audio.muted = !audio.muted;
    const volX = SEL('mmpVolX');
    if (volX) volX.style.display = audio.muted ? 'none' : '';
  });

  // ── Play / Pause ──────────────────────────────────────────
  function togglePlay() {
    audio.paused ? audio.play().catch(() => { }) : audio.pause();
  }

  playBtn.addEventListener('click', togglePlay);
  playBtnBig.addEventListener('click', togglePlay);

  audio.addEventListener('play', () => setPlayIcons(true));
  audio.addEventListener('pause', () => setPlayIcons(false));
  audio.addEventListener('ended', () => setPlayIcons(false));

  // ── Progress ──────────────────────────────────────────────
  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('loadedmetadata', updateDuration);
  audio.addEventListener('durationchange', updateDuration);

  // Seek (kéo thanh tiến trình)
  let dragging = false;
  function seekTo(e) {
    const rect = progressBar.getBoundingClientRect();
    const clientX = e.clientX != null ? e.clientX
      : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    if (audio.duration) audio.currentTime = pct * audio.duration;
  }

  progressBar.addEventListener('mousedown', e => { dragging = true; seekTo(e); });
  progressBar.addEventListener('touchstart', e => { dragging = true; seekTo(e); }, { passive: true });
  document.addEventListener('mousemove', e => { if (dragging) seekTo(e); });
  document.addEventListener('touchmove', e => { if (dragging) seekTo(e); }, { passive: true });
  document.addEventListener('mouseup', () => { dragging = false; });
  document.addEventListener('touchend', () => { dragging = false; });

  // ── Expand / Collapse ─────────────────────────────────────
  function showExpanded() {
    isExpanded = true;
    collapsed.style.display = 'none';
    expanded.classList.add('visible');
  }

  function showCollapsed() {
    isExpanded = false;
    expanded.classList.remove('visible');
    setTimeout(() => { if (!isExpanded) collapsed.style.display = ''; }, 200);
  }

  expandBtn.addEventListener('click', showExpanded);
  collapseBtn.addEventListener('click', showCollapsed);

  // Phím Space = play/pause
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
      togglePlay();
    }
  });

  // ─────────────────────────────────────────────────────────
  // Khôi phục trạng thái khi trang load
  // ─────────────────────────────────────────────────────────
  let autoPlayed = false;

  function startPlay() {
    if (autoPlayed) return;
    autoPlayed = true;
    audio.volume = typeof audio.volume === 'number' && audio.volume > 0 ? audio.volume : 0.7;
    audio.play().catch(() => { });
    // Dọn event listeners
    document.removeEventListener('click', startPlay);
    document.removeEventListener('keydown', startPlay);
    document.removeEventListener('touchstart', startPlay);
  }

  function registerFirstPlay() {
    // Hook vào Enter overlay (nếu có) để nhạc bật ngay khi user nhấn Enter
    const enterOverlay = document.getElementById('enterOverlay');
    if (enterOverlay) {
      enterOverlay.addEventListener('click', startPlay, { once: true });
    }
    // Fallback: bất kỳ tương tác nào cũng bật nhạc
    document.addEventListener('click', startPlay);
    document.addEventListener('keydown', startPlay);
    document.addEventListener('touchstart', startPlay, { passive: true });
  }

  function restoreState() {
    const state = loadState();

    if (!state) {
      // Lần đầu vào site — thử autoplay ngay, nếu bị chặn thì chờ interaction đầu tiên
      audio.volume = 0.7;
      audio.play().catch(() => {
        // Browser chặn autoplay → chờ user click Enter overlay hoặc bất kỳ tương tác nào
        registerFirstPlay();
      });
      return;
    }

    // Áp dụng volume & mute đã lưu
    audio.volume = typeof state.volume === 'number' ? state.volume : 0.7;
    audio.muted = !!state.muted;
    volSlider.value = Math.round(audio.volume * 100);

    // Khôi phục vị trí
    if (state.time && isFinite(state.time)) {
      audio.currentTime = state.time;
    }

    // Nếu trước đó đang phát → tiếp tục phát, nếu không → cũng tự phát luôn
    audio.play().catch(() => {
      // Browser chặn → chờ interaction
      registerFirstPlay();
    });
  }

  // Đợi metadata load xong mới seek được
  if (audio.readyState >= 1) {
    restoreState();
  } else {
    audio.addEventListener('loadedmetadata', restoreState, { once: true });
  }

})();
