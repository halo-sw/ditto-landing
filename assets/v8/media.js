/* Ditto! v8 · media.js — 페이지의 모든 플래터에서 음악 · 영상 위젯을 누르면 재생한다 (앱 규칙 MusicPlayback)
 *   음악: 작은 칸(가로나 세로 200px 미만)이거나 YouTube 주소가 없으면 미리듣기(audio, 30초) — CD가 돌고 진행 막대가 찬다.
 *         큰 칸이고 YouTube 주소가 있으면 칸 안에서 YouTube.
 *   영상: 칸 안에서 YouTube. 칸이 너무 작으면(가로 150px 미만) 화면 가운데 창으로 연다.
 *   편집 중인 플래터에서도 탭 = 선택 + 재생. 끌어서 옮긴 손짓(6px 넘게 움직였거나 0.3초 넘게 누름)은 재생하지 않는다.
 *   DittoPlatter.create 를 감싸 루트마다 위젯 데이터를 기억한다 (platter.js 바로 뒤에 불러야 한다).
 */
(function () {
  'use strict';
  var DP = window.DittoPlatter; if (!DP) return;
  var DATA = new WeakMap();
  var orig = DP.create;
  DP.create = function (root, opts) {
    var inst = orig.apply(this, arguments), map = {};
    ((opts && opts.widgets) || []).forEach(function (w) { map[w.id] = w; });
    DATA.set(root, map); watch(root);
    return inst;
  };

  var audio = null, playing = null, frames = [];
  function widgetOf(item) {
    var root = item.parentNode, map = root && DATA.get(root);
    return map ? map[item.getAttribute('data-id')] : null;
  }
  function isBig(box) { var r = box.getBoundingClientRect(); return Math.min(r.width, r.height) >= 200; }

  /* 음악 CD 가운데에 ▶ / ❚❚ 표시를 단다 — 위젯이 다시 그려져도 붙도록 루트를 지켜본다 */
  function decorate(root) {
    var map = DATA.get(root); if (!map) return;
    [].forEach.call(root.querySelectorAll('.dpl-item'), function (item) {
      var w = map[item.getAttribute('data-id')]; if (!w) return;
      if (w.kind === 'music' && (w.data && (w.data.audio || w.data.ytId))) {
        item.classList.add('x-med');
        var cd = item.querySelector('.dw-cd');
        if (cd && !cd.querySelector('.x-pp')) { var i = document.createElement('i'); i.className = 'x-pp'; i.setAttribute('aria-hidden', 'true'); cd.appendChild(i); }
        if (playing && playing.item === item) item.classList.add('x-on');
      } else if (w.kind === 'video' && w.data && w.data.ytId) item.classList.add('x-med');
    });
  }
  function watch(root) {
    if (root.__xMed) return; root.__xMed = 1;
    decorate(root);
    if ('MutationObserver' in window) new MutationObserver(function () {
      decorate(root);
      if (playing && !document.documentElement.contains(playing.item)) stop();
      frames = frames.filter(function (f) { return document.documentElement.contains(f); });
    }).observe(root, { childList: true, subtree: true });
  }

  function stop() {
    if (audio) { audio.pause(); }
    if (playing) { playing.item.classList.remove('x-on'); var bar = playing.item.querySelector('.dw-mu-track i, .dw-mu-bar i'); if (bar) bar.style.width = ''; }
    playing = null;
  }
  function closeFrames() { frames.forEach(function (f) { if (f.parentNode) f.parentNode.removeChild(f); }); frames = []; }

  function playAudio(item, src) {
    if (playing && playing.item === item) { if (audio.paused) { audio.play().catch(function () {}); item.classList.add('x-on'); } else { audio.pause(); item.classList.remove('x-on'); } return; }
    stop(); closeFrames();
    if (!audio) {
      audio = new Audio(); audio.preload = 'none';
      audio.addEventListener('timeupdate', function () {
        if (!playing) return; var bar = playing.item.querySelector('.dw-mu-track i, .dw-mu-bar i');
        if (bar && audio.duration) bar.style.width = (audio.currentTime / audio.duration * 100).toFixed(1) + '%';
      });
      audio.addEventListener('ended', stop);
      audio.addEventListener('error', function () { if (playing) { var w = widgetOf(playing.item); var it = playing.item; stop(); if (w && w.data.ytId) inline(it, w.data.ytId, w.data.title); } });
    }
    audio.src = src; playing = { item: item }; item.classList.add('x-on');
    var p = audio.play(); if (p && p.catch) p.catch(function () { stop(); });
  }

  function ytSrc(id) { return 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?playsinline=1&autoplay=1&rel=0&modestbranding=1'; }
  function frameEl(id, title) {
    var f = document.createElement('iframe');
    f.src = ytSrc(id); f.title = title || 'YouTube'; f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true;
    return f;
  }
  /* 칸 안에서 재생 — 닫기(×)를 누르면 위젯으로 돌아간다 */
  function inline(item, id, title) {
    stop(); closeFrames();
    var box = item.querySelector('.dw'); if (!box) return;
    if (box.getBoundingClientRect().width < 150) { modal(id, title); return; }
    var wrap = document.createElement('div'); wrap.className = 'x-yt';
    var x = document.createElement('button'); x.type = 'button'; x.className = 'x-yt-x'; x.setAttribute('aria-label', '영상 닫기'); x.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    wrap.appendChild(frameEl(id, title)); wrap.appendChild(x); box.appendChild(wrap); frames.push(wrap);
  }
  var dlg = null;
  function modal(id, title) {
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.className = 'x-ytd'; dlg.setAttribute('aria-label', '영상');
      dlg.innerHTML = '<div class="x-ytd-in"></div><button type="button" class="x-ytd-x" aria-label="닫기"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>';
      document.body.appendChild(dlg);
      dlg.querySelector('.x-ytd-x').addEventListener('click', function () { dlg.close(); });
      dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
      dlg.addEventListener('close', function () { dlg.querySelector('.x-ytd-in').textContent = ''; });
    }
    dlg.querySelector('.x-ytd-in').replaceChildren(frameEl(id, title));
    if (dlg.showModal) dlg.showModal(); else window.open('https://www.youtube.com/watch?v=' + id, '_blank', 'noopener');
  }

  /* 손짓 구분: 누른 자리 · 시간을 기억했다가 click 때 비교한다 */
  var down = null;
  document.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY, t: Date.now() }; }, true);
  document.addEventListener('click', function (e) {
    var t = e.target;
    var cx = t.closest && t.closest('.x-yt-x');
    if (cx) { e.preventDefault(); e.stopPropagation(); var w = cx.parentNode; if (w.parentNode) w.parentNode.removeChild(w); frames = frames.filter(function (f) { return f !== w; }); return; }
    var item = t.closest && t.closest('.dpl-item.x-med'); if (!item) return;
    if (t.closest('.dpl-del, .dpl-handle, a[href]')) return;
    if (down && (Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) > 6 || Date.now() - down.t > 300)) return;
    var roll = item.closest('.x-roll-i'); if (roll && roll.dataset.p && roll.dataset.p !== 'c') return;   // 첫 화면 옆 플래터는 먼저 가운데로 온다
    var w = widgetOf(item); if (!w || !w.data) return;
    e.preventDefault();
    var d = w.data, box = item.querySelector('.dw');
    if (w.kind === 'music') {
      if (d.ytId && (!d.audio || (box && isBig(box)))) inline(item, d.ytId, d.title);
      else if (d.audio) playAudio(item, d.audio);
    } else if (w.kind === 'video') inline(item, d.ytId, d.title);
  }, true);

  /* 화면을 벗어나면 미리듣기를 멈춘다 */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (!en.isIntersecting && playing && playing.item === en.target) stop(); }); });
    var lastObs = null;
    setInterval(function () { if (playing && playing.item !== lastObs) { if (lastObs) io.unobserve(lastObs); lastObs = playing.item; io.observe(lastObs); } }, 500);
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden && audio) audio.pause(); });
  window.DittoMedia = { stop: function () { stop(); closeFrames(); } };
})();
