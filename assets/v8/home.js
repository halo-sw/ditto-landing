/* ditto.place v8 — 홈 장면 (2026-11-12)
   1) 처음 화면의 실제 플래터   2) 3줄 격자 ↔ 플래터 · 직접 옮기고 크기 바꾸기   3) 위젯 14종 진열
   4) 디토가 이어지는 길 (태율 → 봄 → 누리)   5) 글자로 그린 주파수   6) 카메라 → 초대장 사진
   위젯과 격자 규칙은 platter-render.js · platter-grid.js · platter.js (앱 규격 그대로)가 맡는다. */
(function () {
  'use strict';
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var P = window.DITTO_PLATTERS || {}, DW = window.DittoWidgets, DP = window.DittoPlatter, G = window.DittoGrid;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return [].slice.call((el || document).querySelectorAll(s)); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var sm = function (a, b, x) { x = clamp((x - a) / (b - a)); return x * x * (3 - 2 * x); };
  var EASE = 'cubic-bezier(.22,1,.36,1)';
  function seen(el, fn, th) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { fn(); return; }
    new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { o.disconnect(); fn(); } }, { threshold: th == null ? 0.25 : th }).observe(el);
  }
  function visible(el, fn) {            // 화면에 있을 때만 도는 반복 그리기용
    if (!('IntersectionObserver' in window)) { fn(true); return; }
    new IntersectionObserver(function (es) { fn(es[0].isIntersecting); }, { threshold: 0.02 }).observe(el);
  }
  var av = function (h) { return P[h].avatar; };
  var MARK = ['M176.502 20.1889C176.502 20.1889 151.492 0.354846 97.6641 0C94.3642 19.1617 88.339 51.3127 81.3034 89.5053C79.088 54.665 59.1585 48.6326 48.2761 50.8924C21.3295 56.5046 -9.02822 106.398 2.52162 142.172C14.1642 178.236 66.5 169.869 87.9867 165.452C87.9497 165.34 87.9219 165.228 87.8848 165.125C87.4862 128.819 92.0468 78.7012 124.629 47.6988C139.08 33.9532 161.782 21.2254 176.511 20.1982L176.502 20.1889ZM67.0839 146.169C62.5604 151.146 52.4473 144.413 43.4095 132.572C24.8334 108.209 25.7047 80.905 39.1641 80.7369C46.45 80.6435 53.6153 86.1997 61.2256 109.106C65.7121 122.618 69.7906 143.181 67.0747 146.169H67.0839Z',
    'M153.996 156.046C151.332 158.734 147.415 158.93 145.465 153.751C144.379 150.849 141.687 144.093 134.633 134.976C130.845 130.077 123.716 122.659 119.186 114.046C114.332 104.817 113.375 99.5919 114.146 91.7629C115.158 81.6385 125.257 69.1251 139.33 69.993C164.012 71.514 162.165 103.922 162.165 103.922C162.165 103.922 176.803 73.0536 200.279 83.1595C213.209 88.7303 215.892 105.275 212.875 114.046C206.953 131.253 185 138.009 176.608 142.068C163.965 148.171 160.494 149.496 153.987 156.046H153.996Z'];

  /* ── 두께가 있는 디토 마크: 뒤에서 앞으로 겹겹이 그려 옆면을 만들고, 앞면에는 빛이 지나간다. th = y축으로 돈 각도 ── */
  var MP = window.Path2D ? MARK.map(function (d) { return new Path2D(d); }) : [], MCLIP = null;
  function markPath() { if (!MCLIP && MP.length) { MCLIP = new Path2D(); MP.forEach(function (pp) { MCLIP.addPath(pp); }); MCLIP.arc(141.594, 187.204, 16.75, 0, 6.2832); } return MCLIP; }
  function mark3d(ctx, cx, cy, w, h, th, alpha, glow) {
    if (!MP.length) return;
    markPath();
    var cs = Math.cos(th), sn = Math.sin(th), DEP = 30, N = 22, k;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(w / 214, h / 204); ctx.globalAlpha = alpha;
    for (k = 0; k < N; k++) {                       // 옆면: 뒤쪽은 어둡게, 앞으로 올수록 밝게
      var t = k / (N - 1);
      ctx.save(); ctx.translate((t - 0.5) * DEP * sn, 0); ctx.scale(cs, 1); ctx.translate(-107, -102);
      if (k === 0 && glow) { ctx.shadowColor = 'rgba(190,110,255,.75)'; ctx.shadowBlur = glow; }
      ctx.fillStyle = 'rgb(' + Math.round(84 + 46 * t) + ',' + Math.round(30 + 24 * t) + ',' + Math.round(150 + 60 * t) + ')';
      ctx.fill(MCLIP); ctx.restore();
    }
    ctx.translate(0.5 * DEP * sn, 0); ctx.scale(cs, 1); ctx.translate(-107, -102);       // 앞면
    var g = ctx.createLinearGradient(0, 30, 214, 190); g.addColorStop(0, '#AA4AF4'); g.addColorStop(0.5, '#C77BFF'); g.addColorStop(1, '#FA97E2');
    ctx.fillStyle = g; ctx.fill(MCLIP); ctx.clip(MCLIP);
    var hx = 107 - sn * 190, hl = ctx.createLinearGradient(hx - 70, 0, hx + 70, 60);       // 지나가는 빛
    hl.addColorStop(0, 'rgba(255,255,255,0)'); hl.addColorStop(0.5, 'rgba(255,255,255,.34)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl; ctx.fillRect(-20, -20, 254, 244);
    var top = ctx.createLinearGradient(0, 0, 0, 204); top.addColorStop(0, 'rgba(255,255,255,.22)'); top.addColorStop(0.45, 'rgba(255,255,255,0)'); top.addColorStop(1, 'rgba(60,10,110,.18)');
    ctx.fillStyle = top; ctx.fillRect(-20, -20, 254, 244);
    ctx.restore();
  }

  /* ── 하단 카드: 도는 입체 마크 ── */
  function getMark() {
    var cv = $('#fxGetMark'); if (!cv || !cv.getContext || !MP.length) return;
    var ctx = cv.getContext('2d'), raf = 0, live = false, t0 = performance.now(), mxn = 0, card = cv.closest('.get-b');
    function paint(now) {
      var D = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
      if (cv.width !== Math.round(w * D) || cv.height !== Math.round(h * D)) { cv.width = Math.round(w * D); cv.height = Math.round(h * D); }
      ctx.setTransform(D, 0, 0, D, 0, 0); ctx.clearRect(0, 0, w, h);
      var t = (now - t0) / 1000, s = Math.min(w / 1.42, h / 1.3), th = RM ? -0.42 : 0.85 * Math.sin(t * 0.7) + mxn * 0.6;
      mark3d(ctx, w / 2, h / 2 + (RM ? 0 : Math.sin(t * 1.1) * s * 0.018), s * 214 / 204, s, th, 1, 34 * D);
    }
    function loop(now) { raf = 0; if (!live) return; paint(now); raf = requestAnimationFrame(loop); }
    visible(cv, function (v) { live = v && !RM; if (live && !raf) raf = requestAnimationFrame(loop); });
    if (card) {
      card.addEventListener('pointermove', function (e) { var r = card.getBoundingClientRect(); mxn = (e.clientX - r.left) / r.width - 0.5; });
      card.addEventListener('pointerleave', function () { mxn = 0; });
    }
    addEventListener('resize', function () { paint(performance.now()); });
    paint(performance.now());
  }

  /* ── 등장 ── */
  function reveal() {
    var els = $$('.h8-rv');
    if (RM || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('on'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
    }, { threshold: 0.04, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ── ① 처음: 봄의 플래터 ── */
  function hero() {
    var P = window.DittoIntroPlatters;
    var root = $('#h8HeroPl'); if (!root || !DP || !P.jiuallday) return;
    DP.create(root, { widgets: clone(P.jiuallday.widgets), editable: false, removable: false });
    $$('.dpl-card', root).forEach(function (el, i) { el.style.setProperty('--i', i); });
    requestAnimationFrame(function () { requestAnimationFrame(function () { var hv = root.closest('.h8-hero-v'); if (hv) hv.classList.add('on'); }); });    [['#fxTrioL', 'soramaybe'], ['#fxTrioR', 'haeunzip']].forEach(function (x) {       // 양옆의 흐릿한 친구 플래터
      var el = $(x[0]); if (el && P[x[1]]) DP.create(el, { widgets: clone(P[x[1]].widgets), editable: false, removable: false });
    });
  }

  /* ── ① 처음: 친구들의 실제 위젯과 사진이 옆으로 흐르는 띠 ── */
  function strip() {
    var root = $('#fxStrip'); if (!root || !DW) return;
    var OK = { image: 1, music: 1, status: 1, text: 1, video: 1, guestbook: 1 }, cap = { image: 9, music: 2, status: 2, text: 2, video: 2, guestbook: 1 }, got = {}, pick = [];
    var hs = Object.keys(P);
    for (var round = 0; round < 4 && pick.length < 16; round++) hs.forEach(function (h) {
      if (pick.length >= 16) return;
      var w = P[h].widgets.filter(function (x) { return OK[x.kind] && x.w <= 6 && x.h <= 6 && !x._s && (got[x.kind] || 0) < cap[x.kind] && (x.kind !== 'image' || (x.data && x.data.img)); })[0];
      if (w) { w._s = 1; got[w.kind] = (got[w.kind] || 0) + 1; pick.push(w); }
    });
    if (pick.length < 5) return;
    var track = document.createElement('div'); track.className = 'fx-strip-t';
    function card(w, i, ghost) {
      var el = document.createElement('div'), d = document.createElement('div'), pw = w.w * 45.75 - 8, ph = w.h * 45.75 - 8;
      el.className = 'fx-sc'; el.style.setProperty('--w', pw.toFixed(2)); el.style.setProperty('--h', ph.toFixed(2)); el.style.setProperty('--i', i); d.className = 'dpl';
      var wd = { id: 'st-' + (ghost ? 'b' : 'a') + i, kind: w.kind, x: 0, y: 0, w: w.w, h: w.h, data: clone(w.data), ditto: !!w.ditto }, box = DW.box(wd);
      d.appendChild(box); centre(box, wd, pw / 2, ph / 2); el.appendChild(d); return el;
    }
    pick.forEach(function (w, i) { track.appendChild(card(w, i, false)); });
    if (!RM) pick.forEach(function (w, i) { track.appendChild(card(w, i, true)); });
    track.style.setProperty('--t', (pick.length * 6.5) + 's');
    root.appendChild(track);
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('on'); }); });
  }

  /* ── ③-1 플래터: 프로필 격자(같은 크기 사진만) → 플래터. 진행도 q(0→1)로 한 장면을 그린다 ── */
  function lab() {
    var st = $('#h8Stage'), root = $('#h8LabPl'), feed = $('#h8Feed'); if (!st || !root || !feed || !DP || !P.bomcut) return;
    var scr = st.closest('.h8-scr'), pin = $('.fx-plpin');
    var W0 = clone(P.bomcut.widgets), PRE = 'bom-';
    var inst = DP.create(root, { widgets: clone(W0), editable: false, removable: false, minRows: 16 });
    var PHOTO = ['friends','meme','practice','post','video','song'], VIEWS = { practice: '1.2만', video: '8,431', pocket: '2,907' };
    var tiles = PHOTO.map(function (k, index) {
      var w = W0.filter(function (x) { return x.id === PRE + k; })[0], el = document.createElement('i');
      el.className = 'h8-ft'; el.style.backgroundImage = 'url("' + window.DittoScenes.grid[index] + '")'; if (VIEWS[k]) el.dataset.v = VIEWS[k]; feed.appendChild(el);
      return { id: w.id, kind: w.kind, el: el };
    });
    var ghosts = []; for (var gi = 0; gi < 12; gi++) { var ge = document.createElement('i'); ge.className = 'h8-fg'; feed.appendChild(ge); ghosts.push(ge); }
    var others = W0.filter(function (w) { return PHOTO.indexOf(w.id.replace(PRE, '')) < 0; }).map(function (w) { return w.id; });
    var item = function (id) { return root.querySelector('.dpl-item[data-id="' + id + '"]'); };
    function cell(i) { var Wd = st.clientWidth, g = 2, c = (Wd - 2 * g) / 3; return { left: (i % 3) * (c + g), top: Math.floor(i / 3) * (c + g), width: c, height: c, r: 0 }; }
    function plat(t) {
      var r = inst.rectOf(t.id), b = st.getBoundingClientRect(), l = inst.layout().filter(function (x) { return x.id === t.id; })[0];
      return { left: r.left - b.left, top: r.top - b.top, width: r.width, height: r.height, r: G.radius(t.kind, l.w, l.h) * b.width / 358 };
    }
    function put(el, r) { el.style.left = r.left + 'px'; el.style.top = r.top + 'px'; el.style.width = r.width + 'px'; el.style.height = r.height + 'px'; el.style.borderRadius = (r.r || 0) + 'px'; }
    function mix(a, b, k) { return { left: a.left + (b.left - a.left) * k, top: a.top + (b.top - a.top) * k, width: a.width + (b.width - a.width) * k, height: a.height + (b.height - a.height) * k, r: (b.r || 0) * k }; }
    function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
    var q = -1, done = false, li = 0, tw = 0;
    function btns() { chips.forEach(function (b) { b.disabled = !done; }); if (done) auto(); }
    function setQ(v, force) {
      v = clamp(v); if (v === q && !force) return; q = v;
      if (scr) scr.style.setProperty('--q', v.toFixed(3));
      st.classList.toggle('feed', v <= 0);
      if (v >= 1) {
        if (!done) {
          done = true; feed.hidden = true;
          tiles.forEach(function (t) { var e = item(t.id); if (e) e.style.opacity = ''; });
          others.forEach(function (id) { var e = item(id); if (e) e.style.opacity = ''; });
          inst.setEditable(true); btns(); coach();
        }
        return;
      }
      if (done) {
        done = false;
        if (cur !== 'bomcut' || swT) {
          clearTimeout(swT); swT = 0; cur = 'bomcut';
          labelBoard(cur); renderBoard(cur, false);
          if (scr) scr.classList.remove('sw');
        }
        inst.select(null); inst.setEditable(false); feed.hidden = false; btns();
      }
      var sw = clamp((v - 0.9) / 0.1);                 // 끝에서 사진 조각이 실제 위젯으로 바뀐다
      tiles.forEach(function (t, i) {
        put(t.el, mix(cell(i), plat(t), ease(clamp((v - i * 0.04) / 0.7)))); t.el.style.opacity = 1 - sw;
        var e = item(t.id); if (e) e.style.opacity = sw;
      });
      ghosts.forEach(function (g, i) { put(g, cell(i + 6)); });
      others.forEach(function (id, i) { var e = item(id); if (e) e.style.opacity = clamp((v - 0.5 - i * 0.03) / 0.3); });
    }
    /* 다 바뀐 뒤에는 다른 친구들의 플래터로 넘겨 볼 수 있다 */
    var chips = $$('#h8Who button'), hb = scr ? $('.h8-top .h8-hb', scr) : null, cur = 'bomcut', swT = 0, autoT = 0, seenNow = false, userSet = false;
    function labelBoard(h) {
      var openPlatter = $('#castOpenPlatter');
      if (openPlatter) { openPlatter.href = '/demo/' + h + '/'; openPlatter.textContent = P[h].name + '의 플래터 열기 ↗'; }
      chips.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.h === h); });
    }
    function renderBoard(h, editable) {
        var pr = P[h], hs = pr.handleStyle || {};
        inst.select(null); inst.destroy();
        inst = DP.create(root, { widgets: clone(pr.widgets), editable: editable, removable: false, minRows: 16 });
        if (hb) { hb.style.setProperty('--hb-a', hs.top || '#EEAFC7'); hb.style.setProperty('--hb-b', hs.bottom || '#E37CA2'); $('img', hb).src = av(h); $('b', hb).textContent = pr.name; $('span', hb).textContent = '@' + pr.handle; }
    }
    function swap(h, user) {
      if (user) { userSet = true; clearInterval(autoT); autoT = 0; }
      if (!done || h === cur || !P[h]) return; cur = h;
      labelBoard(h);
      renderBoard(h, true);
    }
    function auto() {
      clearInterval(autoT); autoT = 0; return;            /* 2026-11-21: 저절로 넘어가면 '걸려 있는 그림'처럼 보여서 끔 — 직접 만지도록 안내한다 */
      autoT = setInterval(function () { var i = 0; chips.forEach(function (b, k) { if (b.dataset.h === cur) i = k; }); swap(chips[(i + 1) % chips.length].dataset.h, false); }, 3800);
    }
    /* 편집 안내 — 바뀐 뒤 한 번, 손가락이 위젯 하나를 꾹 눌러 옮기고 모서리를 끌어 키운다. 그 뒤 토스트가 '직접 해 보기'를 권한다 */
    var co = null, coDone = false, coRun = 0;
    function coachEl() {
      if (co) return co; var host = scr ? $('.h8-scr-in', scr) : st.parentNode;
      co = document.createElement('div'); co.className = 'x-coach';
      co.innerHTML = '<span class="x-coach-hand" aria-hidden="true"><svg viewBox="0 0 40 48"><path d="M14 4.5c0-2 1.6-3.5 3.5-3.5S21 2.5 21 4.5V20l1.2-.2V15c0-1.9 1.5-3.4 3.4-3.4s3.4 1.5 3.4 3.4v5.4l1-.1v-2.7c0-1.8 1.5-3.3 3.3-3.3s3.3 1.5 3.3 3.3V31c0 8.6-6.9 15.5-15.5 15.5h-1.7c-4.6 0-8.8-2.4-11.2-6.3L2.6 30.6c-1-1.6-.5-3.7 1.1-4.7 1.5-.9 3.5-.6 4.6.8l5.7 6.4z" fill="#fff" stroke="#16131c" stroke-width="2" stroke-linejoin="round"/></svg></span>' +
        '<div class="x-coach-t" role="status"><b>직접 편집해 보세요!</b><span>꾹 눌러 옮기고, 모서리를 끌어 크기를 바꿔요.<br>음악과 영상은 누르면 재생돼요.</span><div><button type="button" class="x-coach-go">해 볼게요</button><button type="button" class="x-coach-re">다시 보기</button></div></div>';
      host.appendChild(co);
      $('.x-coach-go', co).addEventListener('click', function () { hideCoach(); });
      $('.x-coach-re', co).addEventListener('click', function () { renderBoard(cur, true); setTimeout(demo, 250); });
      return co;
    }
    function hideCoach() { if (co) co.classList.add('gone'); coDone = true; }
    function handAt(x, y, press) { var h = $('.x-coach-hand', co); h.style.transform = 'translate(' + x + 'px,' + y + 'px)' + (press ? ' scale(.88)' : ''); }
    function demo() {
      if (!done || RM) return; coachEl(); co.classList.remove('gone'); co.classList.add('on', 'x-run');
      var run = ++coRun, host = co.parentNode.getBoundingClientRect(), L = inst.layout().slice().sort(function (a, b) { return a.w * a.h - b.w * b.h; });
      var it = L.filter(function (x) { return x.w <= 3 && x.h <= 3 && x.y > 0; })[0] || L[0]; if (!it) return;
      var rect = function () { var r = inst.rectOf(it.id); host = co.parentNode.getBoundingClientRect(); return { x: r.left - host.left, y: r.top - host.top, w: r.width, h: r.height }; };
      var a = rect(), C = (G && G.COLS) || 8, toX = it.x, toY = it.y;
      [[it.x - it.w, it.y], [it.x, it.y + it.h], [it.x + it.w, it.y], [it.x, it.y - it.h], [0, it.y], [it.x - 2, it.y + 2]].some(function (c) {       // 놓을 수 있는 이웃 자리를 앱 규칙(G.preview)으로 고른다
        if (c[0] < 0 || c[1] < 0 || c[0] + it.w > C) return false;
        var r = G.preview(L, it.id, { x: c[0], y: c[1], w: it.w, h: it.h }, { origin: { x: it.x, y: it.y }, maxRows: 48 });
        if (r.valid) { toX = c[0]; toY = c[1]; } return r.valid;
      });
      co.classList.add('hand'); handAt(a.x + a.w / 2, a.y + a.h / 2, false);
      setTimeout(function () {
        if (run !== coRun) return; handAt(a.x + a.w / 2, a.y + a.h / 2, true);
        inst.select(it.id);
        var dx = (toX - it.x) * a.w / it.w, dy = (toY - it.y) * a.h / it.h, hand = $('.x-coach-hand', co);
        hand.style.transition = 'transform 1s cubic-bezier(.45,0,.55,1) .18s';
        handAt(a.x + a.w / 2 + dx, a.y + a.h / 2 + dy, true);
        inst.simulateDrag(it.id, toX, toY, { duration: 1000 }).then(function (moved) {
          if (run !== coRun) return; hand.style.transition = 'transform .35s ease, opacity .3s';
          setTimeout(function () {
            if (run !== coRun) return;
            var nl = inst.layout().filter(function (x) { return x.id === it.id; })[0]; if (!nl) return;
            var b = rect(); handAt(b.x + b.w - 8, b.y + b.h - 8, false); inst.select(it.id);
            var nw = Math.min(C - nl.x, nl.w + 1), nh = nl.h + 1, cw = b.w / nl.w, ch = b.h / nl.h;
            setTimeout(function () {
              if (run !== coRun) return; handAt(b.x + b.w - 8, b.y + b.h - 8, true);
              hand.style.transition = 'transform .8s cubic-bezier(.45,0,.55,1)'; handAt(b.x + b.w - 8 + (nw - nl.w) * cw, b.y + b.h - 8 + (nh - nl.h) * ch, true);
              inst.simulateResize(it.id, nw, nh, { duration: 800 }).then(function () { if (run !== coRun) return; setTimeout(function () { hand.style.transition = ''; co.classList.remove('hand', 'x-run'); inst.select(null); }, 300); });
            }, 450);
          }, 450);
        });
      }, 700);
    }
    function coach() { if (coDone || RM) { if (!coDone && RM) { coachEl(); co.classList.add('on'); } return; } setTimeout(demo, 500); }
    st.addEventListener('pointerdown', function (e) { if (co && co.classList.contains('x-run')) { coRun++; co.classList.remove('hand', 'x-run'); } if (co && co.classList.contains('on') && !e.target.closest('.x-coach')) setTimeout(hideCoach, 1200); }, true);
    chips.forEach(function (b) { b.addEventListener('click', function () { swap(b.dataset.h, true); }); });
    st.addEventListener('pointerdown', function () { userSet = true; clearInterval(autoT); autoT = 0; });       // 직접 만지기 시작하면 자동 넘김을 멈춘다
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { seenNow = es[0].isIntersecting; auto(); }, { threshold: 0.4 }).observe(st);
    var wide = window.matchMedia ? matchMedia('(min-width: 1100px)') : { matches: false };
    function fromScroll() {              // 넓은 화면: 구간이 고정된 동안 스크롤이 곧 진행도
      if (!pin || !wide.matches) return false;
      var r = pin.getBoundingClientRect(), span = r.height - window.innerHeight; if (span < 60) return false;
      setQ((clamp(-r.top / span) - 0.06) / 0.62); return true;
    }
    function tween(to, ms) {
      cancelAnimationFrame(tw); var from = Math.max(0, q), t0 = performance.now();
      (function step(now) { var k = clamp((now - t0) / ms); setQ(from + (to - from) * k); if (k < 1) tw = requestAnimationFrame(step); })(t0);
    }
    btns();
    if (RM) { setQ(1); return; }
    setQ(0, true);
    var rz = 0; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (!fromScroll()) setQ(q, true); }, 120); });
    addEventListener('scroll', fromScroll, { passive: true });
    if (!fromScroll()) seen(st, function () { if (!fromScroll()) setTimeout(function () { tween(1, 1700); }, 800); }, 0.35);
  }

  /* ── ③-1 위젯 진열: 14종 · 누르면 다음 크기 ── */
  function cq(px) { return (px / 358 * 100).toFixed(3) + 'cqw'; }
  function centre(box, s, cx, cy) {
    var w = s.w * 45.75 - 8, h = s.h * 45.75 - 8;
    box.style.left = cq(cx - w / 2); box.style.top = cq(cy - h / 2); box.style.width = cq(w); box.style.height = cq(h);
  }
  function shelf() {
    var ul = $('#h8Shelf'); if (!ul || !DW || !DW.catalog) return;
    var cards = [];
    DW.catalog.forEach(function (c) {
      var sizes = c.sizes.filter(function (s) { return s.w <= 6 && s.h <= 4; });
      var k = 0; sizes.forEach(function (s, i) { if (s.w === c.defaultSize.w && s.h === c.defaultSize.h) k = i; });
      var li = document.createElement('li'), b = document.createElement('button'); b.type = 'button'; b.className = 'h8-wc';
      b.innerHTML = '<div class="h8-wc-st"><div class="dpl"></div></div><div class="h8-wc-t"><b></b><span></span><i></i></div>';
      var rootEl = $('.dpl', b), tx = $('.h8-wc-t', b), meta = $('i', tx), wd = { id: 'shelf-' + c.kind, kind: c.kind, x: 0, y: 0, w: sizes[k].w, h: sizes[k].h, data: clone(c.sample || {}), ditto: !!c.dittoable };
      var box = DW.box(wd); rootEl.appendChild(box);
      $('b', tx).textContent = c.name; if (c.dittoable) { var u = document.createElement('u'); u.textContent = '디토 가능'; $('b', tx).appendChild(u); }
      $('span', tx).textContent = c.desc;
      function show() {
        var s = sizes[k]; wd.w = s.w; wd.h = s.h;
        DW.applyBox(box, wd); DW.update(box.firstElementChild, wd); centre(box, s, 179, 179);
        meta.textContent = s.w + '×' + s.h + ' · 크기 ' + c.sizes.length + '가지';
        b.setAttribute('aria-label', c.name + ' 위젯, 지금 ' + s.w + '×' + s.h + '. 누르면 다음 크기로 바뀌어요.');
      }
      function next() { k = (k + 1) % sizes.length; show(); }
      b.addEventListener('click', next); show();
      li.appendChild(b); ul.appendChild(li); cards.push(next);
    });
    if (!RM) seen(ul, function () { [0, 2, 5].forEach(function (i, n) { if (cards[i]) { setTimeout(cards[i], 900 + n * 420); setTimeout(cards[i], 2300 + n * 420); } }); }, 0.3);
  }

  /* ── 아날로그 카드: 방명록은 실제 위젯 세 장 · 캠코더는 앱의 VHS 캠 색감 그대로 ── */
  function guestbook() {
    var root = $('#fxGb'); if (!root || !DW) return;
    ['bomcut', 'rollbytae'].concat(Object.keys(P)).filter(function (h, i, a) { return a.indexOf(h) === i; })
      .map(function (h) { return P[h] && P[h].widgets.filter(function (w) { return w.kind === 'guestbook'; })[0]; })
      .filter(Boolean).slice(0, 3).forEach(function (src, i) {
        var note = document.createElement('div'), d = document.createElement('div'); note.className = 'fx-gb-n'; note.style.setProperty('--k', i); d.className = 'dpl'; note.appendChild(d); root.appendChild(note);
        var wd = { id: 'an-gb-' + i, kind: 'guestbook', x: 0, y: 0, w: 4, h: 3, data: clone(src.data) }, box = DW.box(wd);
        d.appendChild(box); centre(box, wd, 179, 87.5);
      });
  }
  function camcorder() {
    var cv = $('#fxCamc'); if (!cv || !cv.getContext || !P.rollbytae) return;
    var im = new Image();
    im.onload = function () {
      var W = cv.width, H = cv.height, ctx = cv.getContext('2d', { willReadFrequently: true }), k = Math.max(W / im.width, H / im.height), sw = W / k, sh = H / k;
      ctx.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, 0, 0, W, H);
      loadLut('cam-corder', function () { try { ctx.putImageData(grade(ctx.getImageData(0, 0, W, H), lookOf(CAMS[4])), 0, 0); } catch (e) { /* 그대로 둔다 */ } });
    };
    im.src = window.DittoScenes.camcorder.img;
  }

  /* ── 점 매트릭스 파형 (앱 DotMatrixWave: 17열 × 9행, 봉우리 2·1·3·1·2) ── */
  function dotWave(cv, color, signal) {
    var ctx = cv.getContext('2d'), HH = [-1, -1, 0, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 0, -1, -1], rows = 9, cen = 4, t0 = performance.now(), on = false, tm = 0;
    function paint() {
      var w = cv.clientWidth, h = cv.clientHeight; if (!w) return;
      var D = Math.min(window.devicePixelRatio || 1, 2);
      if (cv.width !== Math.round(w * D)) { cv.width = Math.round(w * D); cv.height = Math.round(h * D); }
      ctx.setTransform(D, 0, 0, D, 0, 0); ctx.clearRect(0, 0, w, h);
      var t = RM ? 0 : (performance.now() - t0) / 1000, cg = w / HH.length, rg = h / rows, maxR = Math.min(cg, rg) * 0.42;
      for (var c = 0; c < HH.length; c++) {
        var hh = HH[c] < 0 ? -1 : HH[c] * (signal + (1 - signal) * 0.5 * (0.5 + 0.5 * Math.sin(t * 1.5 - c * 0.55)));
        for (var r = 0; r < rows; r++) {
          var rad = maxR * (0.34 + 0.66 * (1 - Math.abs(r - cen) / cen)), lv = hh < 0 ? 0 : Math.max(0, Math.min(1, hh - Math.abs(r - cen) + 1));
          ctx.globalAlpha = lv > 0.02 ? 0.35 + 0.65 * lv : 1; ctx.fillStyle = lv > 0.02 ? color : 'rgba(0,0,0,.09)';
          ctx.beginPath(); ctx.arc(cg * (c + 0.5), rg * (r + 0.5), rad, 0, 6.2832); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
    visible(cv, function (v) { on = v; clearInterval(tm); if (v) { paint(); if (!RM) tm = setInterval(paint, 83); } });
    return paint;
  }

  /* ── ③-2 디토: 사진 한 장이 사람에서 사람으로 건너간다 (태율 → 봄 → 누리, 그리고 그 너머).
     사본마다 출처(@rollbytae)가 남는다. 누리는 봄의 그룹 채팅에 올라온 원본 카드에서 디토한다 (가져온 사본은 다시 디토할 수 없다 — 앱 규칙) ── */
  function ditto() {
    var root = $('#h8Dt'), sA = $('#h8RlA'), sB = $('#h8RlB'), sC = $('#h8RlC'); if (!root || !sA || !sB || !sC || !DW || !P.rollbytae) return;
    var src = P.rollbytae.widgets.filter(function (w) { return w.id === 'taeyul-friends'; })[0]; if (!src) return;
    var ring = $('#h8Hold'), card = $('#h8DtCard'), T = [], gen = 0, busy = false, PW = 3 * 45.75 - 8, PH = 4 * 45.75 - 8;
    if (card) card.style.backgroundImage = 'url("' + src.data.img + '")';
    function put(slot, k) {              // 실제 이미지 위젯을 그 자리에 그린다. k > 0 이면 출처가 붙은 사본
      var d = $('.dpl', slot); d.innerHTML = '';
      var wd = { id: 'rl-' + k, kind: src.kind, x: 0, y: 0, w: 3, h: 4, data: clone(src.data), ditto: !k };
      if (k) wd.source = { name: '태율', handle: 'rollbytae', avatar: av('rollbytae') };
      var box = DW.box(wd); d.appendChild(box); centre(box, wd, PW / 2, PH / 2);
      slot.classList.toggle('has', true);
    }
    function clear(slot) { $('.dpl', slot).innerHTML = ''; slot.classList.remove('has'); }
    function set(n) { root.dataset.s = n; }
    function reset() { gen++; T.forEach(clearTimeout); T = []; busy = false; ring.style.setProperty('--p', 0); $$('.h8-ghost').forEach(function (g) { g.remove(); }); clear(sB); clear(sC); set(0); }
    function press() {              // 고리가 차오르는 짧은 '꾹'
      if (RM) return Promise.resolve();
      return new Promise(function (res) {
        var t0 = performance.now(), g0 = gen;
        (function step(now) { if (g0 !== gen) return; var k = clamp((now - t0) / 760); ring.style.setProperty('--p', k); if (k < 1) requestAnimationFrame(step); else { ring.style.setProperty('--p', 0); res(); } })(t0);
      });
    }
    function fly(fromEl, slot, k) {
      if (RM || !document.body.animate) { put(slot, k); return Promise.resolve(); }
      var from = fromEl.getBoundingClientRect(), to = $('.dpl', slot).parentNode.getBoundingClientRect(), g = document.createElement('div');
      g.className = 'h8-ghost'; g.style.backgroundImage = 'url("' + src.data.img + '")'; g.style.borderRadius = Math.round(to.width * 0.12) + 'px'; document.body.appendChild(g);
      var midX = (from.left + to.left) / 2, lift = Math.min(90, Math.abs(to.left - from.left) * 0.22 + 30);
      return g.animate([
        { transform: 'translate(' + from.left + 'px,' + from.top + 'px) rotate(0deg)', width: from.width + 'px', height: from.height + 'px' },
        { transform: 'translate(' + midX + 'px,' + (Math.min(from.top, to.top) - lift) + 'px) rotate(-7deg)', width: (from.width + to.width) / 2 + 'px', height: (from.height + to.height) / 2 + 'px', offset: 0.5 },
        { transform: 'translate(' + to.left + 'px,' + to.top + 'px) rotate(0deg)', width: to.width + 'px', height: to.height + 'px' }], { duration: 1050, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'forwards' }).finished.then(function () {
        put(slot, k);
        g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' }).finished.then(function () { g.remove(); });
      });
    }
    function run() {
      if (busy) return; busy = true; var g0 = gen, ok = function () { return g0 === gen; };
      if (RM) { put(sB, 1); put(sC, 2); set(4); return; }
      press().then(function () { if (ok()) { set(1); return fly($('.dpl', sA).parentNode, sB, 1); } })          // ① 태율 → 봄
        .then(function () { if (ok()) return wait(1000); })
        .then(function () { if (!ok()) return; set(2); return wait(1300); })                                    // ② 봄의 그룹 채팅에 원본 카드가 올라온다
        .then(function () { if (ok()) { set(3); return fly(card, sC, 2); } })                                   // ③ 카드 → 누리
        .then(function () { if (ok()) return wait(900); })
        .then(function () { if (ok()) set(4); });                                                               // ④ 누리와 태율 사이에 주파수, 그 너머로 이어진다
    }
    function play() { reset(); if (RM) { run(); return; } T.push(setTimeout(run, 1100)); }
    put(sA, 0);
    /* 카드 세 장을 꿰는 실: 바탕은 점선, 디토가 건너간 구간은 보라 → 분홍으로 채워진다. 끝에는 누리 → 소라로 돌아오는 주파수 곡선 */
    var NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'), more = $('.h8-rl-more', root), fq = $('#h8DtFq'), vias = $$('.h8-rl-via', root);
    svg.setAttribute('class', 'h8-rl-th'); svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = '<defs><linearGradient id="h8RlG" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="0"><stop offset="0" stop-color="#AA4AF4"/><stop offset="1" stop-color="#FA97E2"/></linearGradient></defs>'
      + '<path class="b"/><path class="b"/><path class="b"/><path class="f"/><path class="a a1" pathLength="1"/><path class="a a2" pathLength="1"/><path class="a a3" pathLength="1"/>';
    root.insertBefore(svg, root.firstChild);
    var pb = $$('.b', svg), pa = $$('.a', svg), pf = $('.f', svg), grad = $('linearGradient', svg);
    var SEG = [], ARC = null, phase = 0, wraf = 0, wlive = false, wt = 0;
    function bez(c, t) {              // 3차 곡선 위의 점과 수직 방향
      var u = 1 - t, x = u * u * u * c[0] + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t * t * t * c[6], y = u * u * u * c[1] + 3 * u * u * t * c[3] + 3 * u * t * t * c[5] + t * t * t * c[7];
      var dx = 3 * u * u * (c[2] - c[0]) + 6 * u * t * (c[4] - c[2]) + 3 * t * t * (c[6] - c[4]), dy = 3 * u * u * (c[3] - c[1]) + 6 * u * t * (c[5] - c[3]) + 3 * t * t * (c[7] - c[5]), l = Math.sqrt(dx * dx + dy * dy) || 1;
      return [x, y, -dy / l, dx / l];
    }
    function plain(c) { return 'M' + c[0].toFixed(1) + ' ' + c[1].toFixed(1) + 'C' + c[2].toFixed(1) + ' ' + c[3].toFixed(1) + ',' + c[4].toFixed(1) + ' ' + c[5].toFixed(1) + ',' + c[6].toFixed(1) + ' ' + c[7].toFixed(1); }
    function wavy(c, len, amp, ph) {  // 곡선을 따라 흐르는 파동 (양 끝은 잦아든다)
      var N = Math.max(24, Math.round(len / 7)), wn = len / 44, d = '';
      for (var i = 0; i <= N; i++) { var t = i / N, b = bez(c, t), off = amp * Math.sin(t * Math.PI) * Math.sin(t * wn * 6.2832 - ph); d += (i ? 'L' : 'M') + (b[0] + b[2] * off).toFixed(1) + ' ' + (b[1] + b[3] * off).toFixed(1); }
      return d;
    }
    function waves() {
      var st = +root.dataset.s || 0;
      SEG.forEach(function (g, i) { pa[i].setAttribute('d', wavy(g.c, g.len, 5.5, phase)); });
      if (ARC) pf.setAttribute('d', st >= 4 ? wavy(ARC.c, ARC.len, 4, -phase * 0.8) : plain(ARC.c));
    }
    function wloop(now) { wraf = 0; if (!wlive) return; wraf = requestAnimationFrame(wloop); var dt = Math.min(0.1, (now - wt) / 1000 || 0); wt = now; if (+root.dataset.s > 0) { phase += dt * 5.2; waves(); } }
    function thread() {
      var R = root.getBoundingClientRect(); if (!R.width) return;
      svg.setAttribute('viewBox', '0 0 ' + R.width.toFixed(1) + ' ' + R.height.toFixed(1));
      var c = function (el) { var r = el.getBoundingClientRect(); return { x: r.left - R.left + r.width / 2, y: r.top - R.top + r.height / 2, w: r.width, h: r.height }; };
      var A = c(sA), B = c(sB), C = c(sC), M = c(more), vert = Math.abs(B.y - A.y) > Math.abs(B.x - A.x);
      var seg = function (p, q, k) {
        if (vert) { var dy = (q.y - p.y) / 2; return [p.x, p.y, p.x + k, p.y + dy, q.x - k, q.y - dy, q.x, q.y]; }
        var dx = (q.x - p.x) / 2; return [p.x, p.y, p.x + dx, p.y - k, q.x - dx, q.y + k, q.x, q.y];
      };
      var k = vert ? 26 : Math.min(70, A.h * 0.28);
      SEG = [seg(A, B, k), seg(B, C, -k), seg(C, M, vert ? 0 : k * 0.6)].map(function (cc, i) { pb[i].setAttribute('d', plain(cc)); return { c: cc, len: pb[i].getTotalLength ? pb[i].getTotalLength() : 200 }; });
      if (vert) { grad.setAttribute('x1', 0); grad.setAttribute('y1', A.y); grad.setAttribute('x2', 0); grad.setAttribute('y2', M.y); }
      else { grad.setAttribute('x1', A.x); grad.setAttribute('y1', 0); grad.setAttribute('x2', M.x); grad.setAttribute('y2', 0); }
      root.classList.toggle('vert', vert);
      vias.forEach(function (v, i) {              // 구슬(말)은 실의 한가운데에
        if (vert) { v.style.removeProperty('--x'); v.style.removeProperty('--y'); return; }
        var b = bez(SEG[i].c, 0.5); v.style.setProperty('--x', b[0].toFixed(1) + 'px'); v.style.setProperty('--y', b[1].toFixed(1) + 'px');
      });
      if (vert) { ARC = null; pf.setAttribute('d', ''); if (fq) { fq.style.removeProperty('--x'); fq.style.removeProperty('--y'); } waves(); return; }
      var y0 = Math.max(A.y + A.h / 2, B.y + B.h / 2, C.y + C.h / 2), dip = Math.min(96, A.h * 0.36), ya = A.y + A.h / 2 - 8, yc = C.y + C.h / 2 - 8;      // 누리 → 태율: 카드 아래로 돌아오는 곡선
      ARC = { c: [C.x, yc, C.x, y0 + dip * 1.3, A.x, y0 + dip * 1.3, A.x, ya], len: Math.abs(C.x - A.x) * 1.25 };
      if (fq) { fq.style.setProperty('--x', ((A.x + C.x) / 2).toFixed(1) + 'px'); fq.style.setProperty('--y', (y0 + dip * 0.98).toFixed(1) + 'px'); }
      waves();
    }
    if (!RM && 'IntersectionObserver' in window) new IntersectionObserver(function (es) { wlive = es[0].isIntersecting; if (wlive && !wraf) { wt = performance.now(); wraf = requestAnimationFrame(wloop); } }, { threshold: 0.05 }).observe(root);
    var trz = 0; addEventListener('resize', function () { clearTimeout(trz); trz = setTimeout(thread, 120); });
    thread(); setTimeout(thread, 600); if (document.fonts && document.fonts.ready) document.fonts.ready.then(thread);
    ring.addEventListener('click', function () { if (busy) { reset(); } run(); });
    $('#h8DtReplay').addEventListener('click', play);
    reset();
    if (RM) { run(); return; }
    seen(root, play, 0.4);
  }

  /* ── ② 문제: 수없이 많지만 하나같이 먼 점들 ── */
  function why() {
    var cv = $('#h8WhyC'); if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d'), tm = 0, tick = 0;
    function h2(a, b) { var x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); }
    function paint() {
      var w = cv.clientWidth, h = cv.clientHeight, D = Math.min(window.devicePixelRatio || 1, 2), cw = w < 700 ? 13 : 17, ch = w < 700 ? 19 : 25;
      if (cv.width !== Math.round(w * D) || cv.height !== Math.round(h * D)) { cv.width = Math.round(w * D); cv.height = Math.round(h * D); }
      ctx.setTransform(D, 0, 0, D, 0, 0); ctx.clearRect(0, 0, w, h);
      ctx.font = '500 ' + (w < 700 ? 11 : 13) + 'px "Pretendard Variable",Pretendard,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
      for (var r = 0, R = Math.ceil(h / ch); r < R; r++) for (var c = 0, C = Math.ceil(w / cw); c < C; c++) {
        var v = h2(c, r);
        if (v < 0.09) { ctx.globalAlpha = 0.1 + 0.2 * h2(c + tick * 0.37, r + 7); ctx.fillText('o', c * cw + cw / 2, r * ch + ch / 2); }
        else if (v < 0.5) { ctx.globalAlpha = 0.07; ctx.fillText('·', c * cw + cw / 2, r * ch + ch / 2); }
      }
      ctx.globalAlpha = 1;
    }
    visible(cv, function (v) { clearInterval(tm); if (v) { paint(); if (!RM) tm = setInterval(function () { tick++; paint(); }, 700); } });
    addEventListener('resize', paint);
  }

  /* ── ③-3 주파수: 점으로 된 두 물결이 가까워지고, 하나가 되어 디토 마크로 모인다 ──
     전부 같은 점이다. 마크는 점마다 앞뒤 깊이를 가져서 y축으로 돌 때 입체로 보인다. */
  function freq() {
    var wrap = $('#h8-freq'), box = $('#h8Fq'), cv = $('#h8FqC'); if (!wrap || !box || !cv || !cv.getContext) return;
    var ctx = cv.getContext('2d'), W = 0, H = 0, D = 1, PT = [], rows = 1, MK = { cx: 0, cy: 0, w: 1, h: 1 }, small = false;
    var p = RM ? 1 : 0, ps = p, live = false, raf = 0, tPrev = 0, tt = 0, flow = 0, mx = -999, my = -999, stage = -1, dayNow = -1;
    var STC = [[142, 145, 158], [43, 196, 168], [90, 91, 242], [170, 74, 244]], rgb = STC[0].slice();
    var NAME = ['잔잔', '선명', '곧 열림', '열림'], SAY = ['잔잔하게 이어지는 중', '선명하게 이어지는 중', '곧 친구 신청이 열려요', '친구 신청이 열렸어요'];
    var dayEl = $('#h8FqDay'), nameEl = $('#h8FqName'), sayEl = $('#h8FqSay'), endEl = $('#h8FqEnd'), logs = $$('#h8FqLog li'), btns = $$('#h8FqSt button'), caps = $$('#h8FqCap p'), PU = [];
    var one = $('#xFqOne'), oneN = $('#xFqN'), oneS = $('#xFqS'), oc = one && $('canvas', one), octx = oc && oc.getContext('2d');
    var spin = 0, spinV = 0, formed = false, SPK = [], RING = [], boomT = -1e9, beat = 0;
    var GR = []; for (var gi = 0; gi < 12; gi++) { var gt = gi / 11; GR.push('rgb(' + Math.round(170 + 80 * gt) + ',' + Math.round(74 + 77 * gt) + ',' + Math.round(244 - 18 * gt) + ')'); }   // #AA4AF4 → #FA97E2
    function rn(a, b) { var x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); }
    function build() {
      var r = box.getBoundingClientRect(); W = r.width; H = r.height; D = Math.min(window.devicePixelRatio || 1, r.width < 700 ? 1.5 : 2); small = W < 700;
      cv.width = Math.round(W * D); cv.height = Math.round(H * D);
      var mh = H * (small ? 0.27 : 0.4), mw = mh * 214 / 204; if (mw > W * 0.78) { mw = W * 0.78; mh = mw * 204 / 214; }
      MK = { cx: W * 0.5, cy: H * (small ? 0.36 : 0.38), w: mw, h: mh };
      PT = [];
      if (markPath()) {                       /* 마크 안을 벌집 간격으로 채우는 점 */
        var Q = 240, Qh = Math.round(Q * 204 / 214), m = document.createElement('canvas'); m.width = Q; m.height = Qh;
        var mc = m.getContext('2d'); mc.scale(Q / 214, Qh / 204); mc.fill(MCLIP);
        var id = mc.getImageData(0, 0, Q, Qh).data, st = (small ? 5.4 : 7.2) * Q / mw, row = 0;
        for (var y = st / 2; y < Qh - 1; y += st * 0.866, row++) for (var x = row % 2 ? st : st / 2; x < Q - 1; x += st) {
          if (id[(Math.round(y) * Q + Math.round(x)) * 4 + 3] > 127) PT.push({ lx: x / Q - 0.5, ly: y / Qh - 0.5 });
        }
      }
      PT.sort(function (a, b) { return a.lx - b.lx; });            /* 왼쪽 점은 마크의 왼쪽으로 — 모일 때 서로 엇갈리지 않는다 */
      var half = Math.ceil(PT.length / 2), cols = Math.max(24, Math.round(W / (small ? 6.5 : 8))); rows = Math.max(2, Math.ceil(half / cols));
      var used = Math.max(1, Math.ceil(half / rows)), extra = [];
      PT.forEach(function (o, i) {
        var k = i >> 1;
        o.wv = i & 1; o.u = (Math.floor(k / rows) + 0.5) / used; o.row = rows > 1 ? (k % rows) / (rows - 1) - 0.5 : 0;
        o.lz = 0.5; o.ly2 = 0; o.dl = rn(i, 3) * 0.34; o.sw = rn(i, 2) - 0.5; o.ex = 0;
        /* 뒤쪽 두 겹: 물결일 때는 보이지 않다가, 모일 때 앞 점을 따라 나타난다 */
        extra.push({ lx: o.lx, ly: o.ly, wv: o.wv, u: o.u, row: o.row, lz: -0.5, dl: o.dl, sw: o.sw, ex: 2 });
        if (i % 2) extra.push({ lx: o.lx, ly: o.ly, wv: o.wv, u: o.u, row: o.row, lz: 0, dl: o.dl, sw: o.sw, ex: 1 });
      });
      PT = extra.concat(PT); PT.sort(function (a, b) { return a.lz - b.lz; });       /* 뒤 → 가운데 → 앞 순서로 그린다 */
      if (!live) paint(performance.now());
    }
    function setStage(s) {
      stage = s; box.style.setProperty('--fq-c', STC[s].join(' '));
      nameEl.textContent = NAME[s]; sayEl.textContent = SAY[s];
      btns.forEach(function (b, i) { b.setAttribute('aria-pressed', i === s); });
      caps.forEach(function (c, i) { c.classList.toggle('on', i === s); });
      if (one) { one.dataset.s = s; oneN.textContent = NAME[s]; oneS.textContent = SAY[s]; }
    }
    /* 버튼 속 작은 주파수: 단계가 오를수록 물결이 커지고, 색은 지금 단계의 색 */
    function pill(col) {
      if (!octx) return; var w = 68, h = 36, sig = 0.22 + 0.78 * clamp(ps / 0.76);
      octx.setTransform(2, 0, 0, 2, 0, 0); octx.clearRect(0, 0, w, h);
      for (var c = 0; c < 15; c++) {
        var lv = 0.35 + (0.5 + 0.5 * Math.sin(tt * 2.6 - c * 0.62)) * sig * 2.9;
        for (var r = 0; r < 7; r++) { var ds = Math.abs(r - 3), on = ds <= lv; octx.globalAlpha = on ? 1 - ds * 0.17 : 0.16; octx.fillStyle = on ? col : '#8E919E'; octx.beginPath(); octx.arc(3.4 + c * 4.37, 4.2 + r * 4.6, on ? 1.55 : 1.05, 0, 6.2832); octx.fill(); }
      }
      octx.globalAlpha = 1;
    }
    /* 터짐: 고리 여러 겹 + 사방으로 튀는 점 + 빠른 회전 */
    function boom(x, y, k) {
      if (RM) return; var now = performance.now(); boomT = now;
      for (var q = 0; q < 3; q++) { PU.push({ x: x, y: y, t: now + q * 130, k: k * (1.5 - q * 0.3), v: 760 - q * 90 }); RING.push({ x: x, y: y, t: now + q * 130, k: k }); }
      while (PU.length > 9) PU.shift();
      var n = Math.round((small ? 70 : 150) * k);
      for (var i = 0; i < n; i++) { var a = rn(i, now % 97) * 6.2832, v = (220 + rn(i, 7) * 820) * (0.7 + 0.3 * k); SPK.push({ x: x + Math.cos(a) * MK.w * 0.2, y: y + Math.sin(a) * MK.h * 0.2, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, t: now, l: 620 + rn(i, 11) * 900, r: 1.4 + rn(i, 5) * 3.2, c: GR[Math.round(rn(i, 9) * 11)] }); }
      if (SPK.length > 520) SPK.splice(0, SPK.length - 520);
      spinV = 15 * k; box.classList.remove('boom'); void box.offsetWidth; box.classList.add('boom');
    }
    function paint(now) {
      var dt = Math.min(0.1, (now - tPrev) / 1000 || 0); tPrev = now; if (!RM) tt += dt;
      ps += (p - ps) * (RM ? 1 : 0.16);
      var s = ps < 0.25 ? 0 : ps < 0.5 ? 1 : ps < 0.74 ? 2 : 3; if (s !== stage) setStage(s);
      for (var c3 = 0; c3 < 3; c3++) rgb[c3] += (STC[s][c3] - rgb[c3]) * (RM ? 1 : 0.14);
      var sync = sm(0, 0.74, ps), m = sm(0.75, 0.9, ps); flow += dt * 0.012 * (1 - m);
      var nowF = m > 0.965; if (nowF && !formed) { boom(MK.cx, MK.cy, 1); beat = now; } if (m < 0.6) formed = false; else if (nowF) formed = true;
      if (formed && now - beat > 1900) { beat = now; PU.push({ x: MK.cx, y: MK.cy, t: now, k: 0.55, v: 520 }); RING.push({ x: MK.cx, y: MK.cy, t: now, k: 0.45 }); }      /* 맺힌 뒤에는 심장처럼 고리가 이어진다 */
      spinV += ((formed ? 1.7 : 0) - spinV) * Math.min(1, dt * 1.5); if (m > 0.5) spin += spinV * dt; else spin = 0.5 * Math.sin(tt * 1.2);
      var R = Math.round(rgb[0]), Gc = Math.round(rgb[1]), B = Math.round(rgb[2]);
      ctx.setTransform(D, 0, 0, D, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H);
      /* 뒤에서 번지는 빛: 가까워질수록 밝아지고, 마크가 맺히면 그 뒤로 모인다 */
      var gx = W / 2 + (MK.cx - W / 2) * m, gr = Math.max(W, H) * (0.3 + 0.1 * sync), g = ctx.createRadialGradient(gx, MK.cy, 0, gx, MK.cy, gr);
      g.addColorStop(0, 'rgba(' + R + ',' + Gc + ',' + B + ',' + (0.07 + 0.1 * sync + 0.07 * m).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + R + ',' + Gc + ',' + B + ',0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      var cA = 'rgb(' + R + ',' + Gc + ',' + B + ')', cB = 'rgb(' + Math.round(R * 0.72 + 22 * 0.28) + ',' + Math.round(Gc * 0.72 + 18 * 0.28) + ',' + Math.round(B * 0.72 + 27 * 0.28) + ')';
      var mid = MK.cy, gap = H * 0.17 * (1 - sync), amp = H * (0.03 + 0.065 * sync) * (small ? 0.62 : 1);
      var kA = 6.2832 / (W * (small ? 0.82 : 0.42)), kB = kA * (1 + 0.9 * (1 - sync)), off = (1 - sync) * (2.1 + 0.9 * Math.sin(tt * 0.23)), ph = tt * 1.15, jit = (1 - sync) * H * 0.022;
      var band = rows * (small ? 5 : 6.4) * (1 - 0.35 * sync), base = (small ? 1.2 : 1.55) * (0.8 + 0.4 * sync), aW = 0.42 + 0.58 * sync;
      var th = RM ? -0.42 : spin + (mx > -900 && !formed ? (mx / W - 0.5) * 0.4 : 0), cs = Math.cos(th), sn = Math.sin(th);
      var bAge = (now - boomT) / 1000, shk = bAge < 0.32 ? (1 - bAge / 0.32) * 7 : 0; if (shk) ctx.translate(Math.sin(now * 0.09) * shk, Math.cos(now * 0.11) * shk);
      for (var pi = PU.length - 1; pi >= 0; pi--) if (now - PU[pi].t > 1900) PU.splice(pi, 1);                 /* 누른 자리에서 퍼지는 파동 */
      var bob = RM ? 0 : Math.sin(tt * 1.1) * MK.h * 0.012, dep = MK.w * 0.13, rl = small ? 1.5 : 2.05;
      for (var i = 0, n = PT.length; i < n; i++) {
        var o = PT[i], u = o.u + (o.wv ? flow : -flow); u -= Math.floor(u);
        var x = u * W, y = o.wv
          ? mid + gap + amp * Math.sin(kB * x - ph - off) + jit * Math.sin(x * 0.021 - tt * 1.6) * Math.sin(x * 0.0069 + tt * 0.6)
          : mid - gap + amp * Math.sin(kA * x - ph) + jit * Math.sin(x * 0.027 + tt * 1.9) * Math.sin(x * 0.005 - tt * 0.8);
        if (mx > -900) y += (my - y) * Math.exp(-Math.pow((x - mx) / 110, 2)) * 0.26;
        y += o.row * band;
        var r = base, a = o.ex ? 0 : aW * (1 - Math.abs(o.row) * 1.1), col = o.wv ? cB : cA;
        if (m > 0) {
          var k = clamp(m * 1.4 - o.dl); k = k * k * (3 - 2 * k);
          if (k > 0) {
            var X = o.lx * MK.w, Z = o.lz * dep, xr = X * cs + Z * sn, zr = Z * cs - X * sn, pp = 1 / (1 - zr / (MK.w * 1.7));
            x += (MK.cx + xr * pp - x) * k; y += (MK.cy + bob + o.ly * MK.h * pp - y) * k + Math.sin(k * 3.1416) * o.sw * H * 0.1;
            var dk = clamp(0.5 + zr / dep); r += (rl * pp * (0.72 + 0.28 * dk) - r) * k; a += ((0.18 + 0.78 * dk * dk) - a) * k;
            if (k > 0.5) col = GR[Math.max(0, Math.min(11, Math.round((o.lx + 0.5 + o.ly * 0.35) * 11)))];
          }
        }
        for (var pj = 0; pj < PU.length; pj++) {              // 파동의 고리가 지나가는 점은 바깥으로 밀리며 커지고 밝아진다
          var pu = PU[pj], age = (now - pu.t) / 1000; if (age < 0) continue; var ddx = x - pu.x, ddy = y - pu.y, dd = Math.sqrt(ddx * ddx + ddy * ddy) || 1, pk = pu.k || 1;
          var wv = Math.exp(-Math.pow((dd - age * (pu.v || 560)) / 66, 2)) * (1 - age / 1.9) * pk;
          if (wv > 0.01) { x += ddx / dd * wv * 38; y += ddy / dd * wv * 38; r += wv * 1.7; if (!o.ex) a = Math.min(1, a + wv * 0.5); }
        }
        if (a < 0.012) continue;
        ctx.fillStyle = col;
        if (!o.ex) { ctx.globalAlpha = a * 0.09; ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, 6.2832); ctx.fill(); }     // 번짐
        ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();                  // 점
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      for (var ri = RING.length - 1; ri >= 0; ri--) {            /* 눈에 보이는 고리 */
        var rg = RING[ri], ra = (now - rg.t) / 1000; if (ra < 0) continue; if (ra > 1.5) { RING.splice(ri, 1); continue; }
        ctx.globalAlpha = (1 - ra / 1.5) * 0.5 * rg.k; ctx.lineWidth = 2 + 9 * (1 - ra / 1.5) * rg.k; ctx.strokeStyle = GR[Math.min(11, Math.round(ra * 9))]; ctx.beginPath(); ctx.arc(rg.x, rg.y, 30 + ra * 640, 0, 6.2832); ctx.stroke();
      }
      for (var si = SPK.length - 1; si >= 0; si--) {            /* 튀어 나가는 점 */
        var sp = SPK[si], sa = (now - sp.t) / sp.l; if (sa >= 1) { SPK.splice(si, 1); continue; }
        var st = sa * sp.l / 1000, dr = 1 - Math.exp(-st * 2.6); ctx.globalAlpha = (1 - sa) * 0.9; ctx.fillStyle = sp.c; ctx.beginPath(); ctx.arc(sp.x + sp.vx * dr / 2.6, sp.y + sp.vy * dr / 2.6 + 160 * st * st, sp.r * (1 - sa * 0.5), 0, 6.2832); ctx.fill();
      }
      if (bAge < 0.5) { ctx.globalAlpha = (1 - bAge / 0.5) * 0.5; var fg = ctx.createRadialGradient(MK.cx, MK.cy, 0, MK.cx, MK.cy, MK.w * 1.5); fg.addColorStop(0, '#fff'); fg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = fg; ctx.fillRect(0, 0, W, H); }
      ctx.globalAlpha = 1; pill(cA);
      var dn = 1 + Math.round(clamp(ps / 0.88) * 20); if (dn !== dayNow) { dayNow = dn; dayEl.textContent = dn + '일째'; }
      var last = -1; logs.forEach(function (li, i) { var on = ps >= +li.dataset.at; li.classList.toggle('on', on); if (on) last = i; });
      logs.forEach(function (li, i) { li.classList.toggle('old', i < last - 1); });
      endEl.classList.toggle('on', ps > 0.9);
    }
    function loop(now) { raf = 0; if (!live) return; raf = requestAnimationFrame(loop); if (small && (loop.skip = !loop.skip)) return; paint(now); }            // 휴대폰에서는 한 프레임 걸러 그린다
    function onScroll() { var r = wrap.getBoundingClientRect(), span = r.height - innerHeight; p = RM ? 1 : span > 0 ? clamp(-r.top / span) : 1; }
    btns.forEach(function (b, i) { b.addEventListener('click', function () {
      var r = wrap.getBoundingClientRect(), span = r.height - innerHeight; if (span <= 0) return;
      scrollTo({ top: r.top + scrollY + span * [0.04, 0.4, 0.7, 0.99][i], behavior: RM ? 'auto' : 'smooth' });
    }); });
    if (one) one.addEventListener('click', function () {            /* 누르면 다음 단계로 (마지막에서는 처음으로) */
      var r = wrap.getBoundingClientRect(), span = r.height - innerHeight; if (span <= 0) return; var nx = stage >= 3 ? 0 : stage + 1;
      scrollTo({ top: r.top + scrollY + span * [0.02, 0.36, 0.62, 0.97][nx], behavior: RM ? 'auto' : 'smooth' });
    });
    box.addEventListener('pointermove', function (e) { var r = box.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    box.addEventListener('pointerleave', function () { mx = my = -999; });
    box.addEventListener('pointerdown', function (e) { if (RM || (e.target.closest && e.target.closest('button'))) return; var r = box.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top; if (formed) { boom(px, py, 0.6); return; } PU.push({ x: px, y: py, t: performance.now() }); if (PU.length > 9) PU.shift(); });
    var rz = 0; addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { build(); onScroll(); }, 120); });
    build(); onScroll(); ps = p; paint(performance.now());
    visible(box, function (v) { live = v && !RM; if (live && !raf) { tPrev = performance.now(); raf = requestAnimationFrame(loop); } });
  }

  /* ── ⑦ 카메라: 앱 색감 다섯 → 찍기 → 초대장에 넣기 ──
     값은 앱 camera-looks 프로필(노출 · 온기 · 틴트 · 대비 · 채도 · 암부 색 · 입자 · 주변 감광 · VHS 번짐)을 그대로 옮겼다. 사진은 이 브라우저 안에서만 다룬다. */
  var NC = { ev: 0, warm: 0, tint: 0, con: 1, sat: 1, lift: 0, sh: [0, 0, 0] };
  /* 색은 앱의 33³ 색감 표(camlook-{id}.lut)를 그림 한 장(1089 × 33)으로 옮긴 것을 그대로 읽는다. 입자 · 주변 감광 값도 앱 camera-looks.json 그대로 */
  /* 앱 카메라 출시 10종(Model/CameraLineup.swift) + 필름 14종(Model/Films.swift) — LUT는 앱 CameraLooks/*.lut를 33×33×33 PNG로 옮긴 것 */
  var FILMS = { c07: ['Cloud', 25], c03: ['Milk Tea', 40], c01: ['Butter', 50], c02: ['Peach', 64], c13: ['Petal', 80], c04: ['Sunny', 100], c05: ['Mint', 125], c06: ['Ocean', 200], c09: ['Cine', 500], c14: ['Mist', 640], c08: ['Matte', 800], c10: ['Night Walk', 1600], c12: ['Mono', 3200], c11: ['Neon', 6400] };
  var CAMS = [
    { id: 'pocket-ccd', name: '포켓 CCD', type: 'CCD 디카', own: 1, grain: 0.35, fall: 0.09, slots: ['c07', 'c01', 'c02', 'c08', 'c10'] },
    { id: 'peek', name: '피크', type: '즉석 카메라', own: 1, film: 1, grain: 0.4, fall: 0.05, slots: ['c13', 'c01', 'c02', 'c05', 'c12'] },
    { id: 'toss-27', name: '토스 27', type: '일회용 필름 카메라', own: 1, film: 1, grain: 0.95, fall: 0.035, slots: ['c04', 'c01', 'c06', 'c02', 'c12'] },
    { id: 'aa-grip', name: 'AA 그립', type: '건전지 디카', grain: 0.3, fall: 0.04, slots: ['c01', 'c04', 'c08', 'c09', 'c10'] },
    { id: 'cam-corder', name: '캠코더', type: 'DV 캠코더', own: 1, grain: 0, fall: 0, slots: ['c09', 'c05', 'c07', 'c08', 'c11'] },
    { id: 'slider', name: '슬라이더', type: '슬라이드 커버 디카', grain: 0.3, fall: 0.04, slots: ['c03', 'c07', 'c08', 'c14', 'c04'] },
    { id: 'manual-76', name: '수동 76', type: '수동 필름 카메라', film: 1, grain: 0.85, fall: 0.03, slots: ['c01', 'c04', 'c12', 'c09', 'c02'] },
    { id: 'iphone-7', name: '7', type: '2016 스마트폰', own: 1, grain: 0, fall: 0, slots: ['c07', 'c09', 'c08', 'c13', 'c06'] },
    { id: 'daily-slim', name: '데일리 슬림', type: '슬림 디카', grain: 0.3, fall: 0.04, slots: ['c08', 'c01', 'c07', 'c04', 'c12'] },
    { id: 'card-slim', name: '카드 슬림', type: '카드 두께 디카', grain: 0.3, fall: 0.04, slots: ['c14', 'c01', 'c06', 'c03', 'c10'] }];
  var LUTS = {};
  CAMS.forEach(function (C) { C.th = '/assets/v8/cam10/cam-' + C.id + '.webp'; C.pick = C.own ? null : C.slots[0]; });
  function lutOf(C) { return C.pick || C.id; }
  function loadLut(key, cb) {
    var e = LUTS[key]; if (e && e.data) { if (cb) cb(); return; } if (e) { if (cb) e.cbs.push(cb); return; }
    e = LUTS[key] = { data: null, cbs: cb ? [cb] : [] };
    var im = new Image(); im.onload = function () { var c = document.createElement('canvas'); c.width = 1089; c.height = 33; var x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0); e.data = x.getImageData(0, 0, 1089, 33).data; e.cbs.forEach(function (f) { f(); }); e.cbs = []; }; im.src = '/assets/v8/cam10/lut-' + key + '.png';
  }
  function lookOf(C) { var e = LUTS[lutOf(C)]; return { c: NC, grain: C.grain, fall: C.fall, _lut: e && e.data }; }
  function lut3(T, a, b, c, d, e, f, g, h, tr, tg, tb) {            // 여덟 꼭짓점 사이를 고르게 섞는다
    var x00 = T[a] + (T[b] - T[a]) * tr, x10 = T[c] + (T[d] - T[c]) * tr, x01 = T[e] + (T[f] - T[e]) * tr, x11 = T[g] + (T[h] - T[g]) * tr, y0 = x00 + (x10 - x00) * tg, y1 = x01 + (x11 - x01) * tg;
    return (y0 + (y1 - y0) * tb) / 255;
  }
  function grade(im, L) {
    var d = im.data, w = im.width, h = im.height, c = L.c, ev = Math.pow(2, c.ev), wr = ev * (1 + c.warm * 0.16) * (1 + c.tint * 0.05), wg = ev * (1 - c.tint * 0.1), wb = ev * (1 - c.warm * 0.16) * (1 + c.tint * 0.05);
    var con = c.con, sat = c.sat, lift = c.lift, sh = c.sh, gr = (L.grain || 0) * 0.09, fall = (L.fall || 0) * 3.6, cx = w / 2, cy = h / 2, inv = 1 / (cx * cx + cy * cy), seed = (Math.random() * 2147483647) | 0, pa = c.palette, tn = c.tone, T = L._lut;
    for (var y = 0, i = 0; y < h; y++) for (var x = 0; x < w; x++, i += 4) {
      var r, g, b, l;
      if (T) {
        var fr = d[i] * 0.12549019, fg = d[i + 1] * 0.12549019, fb = d[i + 2] * 0.12549019, r0 = fr | 0, g0 = fg | 0, b0 = fb | 0, r1 = r0 < 32 ? r0 + 1 : 32, g1 = g0 < 32 ? g0 + 1 : 32, b1 = b0 < 32 ? b0 + 1 : 32;
        var A0 = (g0 * 1089 + b0 * 33 + r0) << 2, A1 = (g0 * 1089 + b0 * 33 + r1) << 2, B0 = (g1 * 1089 + b0 * 33 + r0) << 2, B1 = (g1 * 1089 + b0 * 33 + r1) << 2, C0 = (g0 * 1089 + b1 * 33 + r0) << 2, C1 = (g0 * 1089 + b1 * 33 + r1) << 2, D0 = (g1 * 1089 + b1 * 33 + r0) << 2, D1 = (g1 * 1089 + b1 * 33 + r1) << 2;
        var tr = fr - r0, tg = fg - g0, tb = fb - b0;
        r = lut3(T, A0, A1, B0, B1, C0, C1, D0, D1, tr, tg, tb); g = lut3(T, A0 + 1, A1 + 1, B0 + 1, B1 + 1, C0 + 1, C1 + 1, D0 + 1, D1 + 1, tr, tg, tb); b = lut3(T, A0 + 2, A1 + 2, B0 + 2, B1 + 2, C0 + 2, C1 + 2, D0 + 2, D1 + 2, tr, tg, tb);
      } else {
        r = (d[i] / 255 * wr - 0.5) * con + 0.5; g = (d[i + 1] / 255 * wg - 0.5) * con + 0.5; b = (d[i + 2] / 255 * wb - 0.5) * con + 0.5;
        l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (c.mono) {
          if (pa) { var q = l < 0 ? 0 : l > 1 ? 1 : l; r = pa[0][0] + (pa[1][0] - pa[0][0]) * q; g = pa[0][1] + (pa[1][1] - pa[0][1]) * q; b = pa[0][2] + (pa[1][2] - pa[0][2]) * q; }
          else { r = l * tn[0]; g = l * tn[1]; b = l * tn[2]; }
        } else { r = l + (r - l) * sat; g = l + (g - l) * sat; b = l + (b - l) * sat; }
        var sd = 1 - l; if (sd > 0) { sd = sd * sd * 0.22; r += sh[0] * sd; g += sh[1] * sd; b += sh[2] * sd; }
        r = r * (1 - lift) + lift; g = g * (1 - lift) + lift; b = b * (1 - lift) + lift;
      }
      if (fall) { var dx = x - cx, dy = y - cy, v = 1 - fall * (dx * dx + dy * dy) * inv; r *= v; g *= v; b *= v; }
      if (gr) { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; var n = ((seed >>> 8) / 16777216 - 0.5) * gr; r += n; g += n; b += n; }
      d[i] = r * 255; d[i + 1] = g * 255; d[i + 2] = b * 255;
    }
    if (L.chroma) {            /* VHS: 빨강과 파랑이 양옆으로 어긋나고, 가는 주사선과 아래쪽 트래킹 띠가 남는다 */
      var o = Math.max(1, Math.round(L.chroma * w / 360)), row = new Uint8ClampedArray(w * 4), band = Math.round(h * 0.9), bh = Math.max(2, Math.round(h * 0.012));
      for (var yy = 0; yy < h; yy++) {
        var of = yy * w * 4; row.set(d.subarray(of, of + w * 4));
        var sl = yy % 3 === 0 ? 0.93 : 1, tr = yy >= band && yy < band + bh;
        for (var xx = 0; xx < w; xx++) {
          var xr = xx - o < 0 ? 0 : xx - o, xb = xx + o >= w ? w - 1 : xx + o, k = of + xx * 4;
          d[k] = row[xr * 4] * sl; d[k + 1] = row[xx * 4 + 1] * sl; d[k + 2] = row[xb * 4 + 2] * sl;
          if (tr) { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; var nn = (seed >>> 24); d[k] = d[k] * 0.6 + nn * 0.4; d[k + 1] = d[k + 1] * 0.6 + nn * 0.4; d[k + 2] = d[k + 2] * 0.6 + nn * 0.4; }
        }
      }
    }
    return im;
  }
  function cam() {
    var box = $('#h8Cam'); if (!box) return;
    var view = $('.h8-cam-v', box), v = $('video', box), cv = $('#h8CamC'), ctx = cv.getContext('2d', { willReadFrequently: true });
    var msg = $('#h8CamMsg'), btnRe = $('#h8CamRe'), btnUse = $('#h8CamUse'), hudA = $('#h8CamHudA'), hudB = $('#h8CamHudB'), strip = $('#h8Looks');
    var pill = $('#c10Film'), pillT = $('#c10FilmT'), pillI = $('img', pill), tray = $('#c10Tray'), off = $('#c10Off');
    var cur = CAMS[2], stream = null, raf = 0, last = 0, raw = null, shot = null, demo = null, front = true, PW = 480, PH = 360, SW = 960, SH = 720;   // 11-21 가로(4:3) — 컴퓨터로 단체 사진을 찍는다
    /* 카메라 줄 — 앱 ChatCamera의 이름 붙은 칸 띠 */
    CAMS.forEach(function (C) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', C === cur); b.dataset.id = C.id;
      b.innerHTML = '<span><img src="' + C.th + '" alt="" width="64" height="64" loading="lazy" decoding="async"></span><b></b>'; $('b', b).textContent = C.name; b.setAttribute('aria-label', C.name + ' · ' + C.type);
      b.addEventListener('click', function () { choose(C); });
      strip.appendChild(b);
    });
    function choose(C) {
      cur = C; $$('button', strip).forEach(function (x) { x.setAttribute('aria-checked', x.dataset.id === C.id); });
      var me = $('[data-id="' + C.id + '"]', strip); if (me && strip.scrollWidth > strip.clientWidth) strip.scrollTo({ left: me.offsetLeft - (strip.clientWidth - me.offsetWidth) / 2, behavior: RM ? 'auto' : 'smooth' });
      if (off) off.src = C.th;
      openTray(false); pillSet(); hud(); loadLut(lutOf(C), redraw); redraw();
    }
    /* 필름 알약 — 필름 카메라(토스 27 · 수동 76 · 피크)만 눌러서 갈아 끼운다. 나머지는 이름만 */
    function pillSet() {
      var f = cur.pick && FILMS[cur.pick];
      pillT.textContent = cur.name + (f ? ' · ' + f[0] + ' ' + f[1] : '');
      if (f) { pillI.src = '/assets/v8/cam10/can-' + cur.pick + '.webp'; pillI.hidden = false; } else pillI.hidden = true;
      pill.disabled = !cur.film; pill.classList.toggle('on', !!cur.film);
      if (cur.film) buildTray();
    }
    function buildTray() {
      tray.textContent = '';
      var list = (cur.own ? [null] : []).concat(cur.slots);
      list.forEach(function (id) {
        var b = document.createElement('button'), f = id && FILMS[id]; b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', cur.pick === id);
        b.innerHTML = id ? '<img src="/assets/v8/cam10/can-' + id + '.webp" alt="" width="40" height="68" loading="lazy"><b></b><i></i>' : '<span class="c10-own"><img src="' + cur.th + '" alt="" width="40" height="40"></span><b>본래 색</b><i>' + cur.name + '</i>';
        if (f) { $('b', b).textContent = f[0]; $('i', b).textContent = f[1]; }
        b.addEventListener('click', function () { cur.pick = id; pillSet(); loadLut(lutOf(cur), redraw); openTray(false); redraw(); });
        tray.appendChild(b);
      });
    }
    function openTray(on) { tray.classList.toggle('on', on); pill.setAttribute('aria-expanded', on); view.classList.toggle('tray', on); }
    pill.addEventListener('click', function () { if (cur.film) openTray(!tray.classList.contains('on')); });
    function hud() { hudA.textContent = cur.name; hudB.textContent = cur.type; }
    function cover(src, sw, sh, dst, dw, dh, mirror) {
      var k = Math.max(dw / sw, dh / sh), w = dw / k, h = dh / k, c = dst.getContext('2d');
      c.save(); if (mirror) { c.translate(dw, 0); c.scale(-1, 1); } c.drawImage(src, (sw - w) / 2, (sh - h) / 2, w, h, 0, 0, dw, dh); c.restore();
    }
    function redraw() { if (stream) return; if (raw) develop(); else if (demo) paintDemo(); }
    /* 카메라를 켜기 전에도 색이 보이게 — 견본 사진에 고른 카메라 · 필름 색을 입혀 둔다 */
    function paintDemo() {
      if (cv.width !== PW) { cv.width = PW; cv.height = PH; }
      ctx.drawImage(demo, 0, 0); ctx.putImageData(grade(ctx.getImageData(0, 0, PW, PH), lookOf(cur)), 0, 0);
    }
    function frame(now) {
      raf = 0; if (!stream) return; raf = requestAnimationFrame(frame);
      if (now - last < 50 || v.readyState < 2) return; last = now;
      if (cv.width !== PW) { cv.width = PW; cv.height = PH; }
      cover(v, v.videoWidth, v.videoHeight, cv, PW, PH, true);   // 늘 좌우반전(거울처럼)
      ctx.putImageData(grade(ctx.getImageData(0, 0, PW, PH), lookOf(cur)), 0, 0);
    }
    function stopCam() { if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; } if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    function start() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { msg.textContent = '이 브라우저에서는 카메라를 켤 수 없어요. 사진 없이도 초대장을 뽑을 수 있어요.'; return; }
      msg.textContent = '카메라를 켜는 중이에요.'; stopCam();
      navigator.mediaDevices.getUserMedia({ video: { facingMode: front ? 'user' : 'environment', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false }).then(function (s) {
        stream = s; v.srcObject = s; raw = shot = null; view.classList.remove('shot', 'demo'); view.classList.add('live'); hud(); btnRe.hidden = btnUse.hidden = true;
        msg.textContent = '아래 줄에서 카메라를 고르고 셔터를 눌러요.';
        var pl = v.play(); if (pl && pl.catch) pl.catch(function () {});
        raf = requestAnimationFrame(frame);
      }).catch(function () { msg.textContent = '카메라를 켤 수 없어요. 브라우저 주소창에서 카메라 권한을 허용해 주세요.'; });
    }
    function develop() {
      if (!raw) return;
      shot = document.createElement('canvas'); shot.width = SW; shot.height = SH;
      var sc = shot.getContext('2d'); sc.drawImage(raw, 0, 0);
      sc.putImageData(grade(sc.getImageData(0, 0, SW, SH), lookOf(cur)), 0, 0);
      cv.width = SW; cv.height = SH; ctx.drawImage(shot, 0, 0);
      if (window.__dittoInvitePhoto) use(true);
    }
    function took(src, sw, sh, mirror) {
      raw = document.createElement('canvas'); raw.width = SW; raw.height = SH; cover(src, sw, sh, raw, SW, SH, mirror);
      stopCam(); view.classList.remove('live', 'demo'); view.classList.add('shot', 'flash'); setTimeout(function () { view.classList.remove('flash'); }, 500);
      hud(); develop(); btnRe.hidden = btnUse.hidden = false; msg.textContent = '찍은 뒤에도 카메라와 필름을 바꿔 볼 수 있어요.';
    }
    function use(quiet) {
      if (!shot) return;
      window.__dittoInvitePhoto = shot;
      var im = $('#tkPh'); if (im) { im.src = shot.toDataURL('image/jpeg', 0.9); im.hidden = false; }
      if (quiet) return;
      msg.textContent = '사진이 초대장에 들어갔어요. 이름과 아이디를 적고 초대장을 뽑아 보세요.';
      var form = $('#tmForm'), name = $('#tmDisp');
      if (form) form.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
      if (name) setTimeout(function () { try { name.focus({ preventScroll: true }); } catch (e) { /* 포커스 실패는 넘어간다 */ } }, 600);
    }
    $('#h8CamOn').addEventListener('click', start);
    $('#h8CamShot').addEventListener('click', function () { if (stream && v.readyState >= 2) took(v, v.videoWidth, v.videoHeight, true); else if (!stream) start(); });
    $('#c10Flip').addEventListener('click', function () { front = !front; if (stream) start(); else msg.textContent = front ? '앞 카메라로 찍어요.' : '뒤 카메라로 찍어요.'; });
    var fl = $('#c10Fl'), flN = 0; fl.addEventListener('click', function () { flN = (flN + 1) % 3; $('b', fl).textContent = ['A', '', ''][flN]; fl.classList.toggle('off', flN === 2); fl.setAttribute('aria-label', ['플래시 자동', '플래시 켬', '플래시 끔'][flN]); fl.setAttribute('aria-pressed', flN === 1); });
    seen(box, function () {
      CAMS.forEach(function (C) { loadLut(lutOf(C)); });
      Object.keys(FILMS).forEach(function (k) { loadLut(k); });
      var im = new Image(); im.onload = function () { demo = document.createElement('canvas'); demo.width = PW; demo.height = PH; cover(im, im.naturalWidth, im.naturalHeight, demo, PW, PH, false); if (!stream && !raw) { view.classList.add('demo'); loadLut(lutOf(cur), redraw); } }; im.src = '/assets/cast/scenes/webcam-group.webp';
    }, 0.01);
    btnRe.addEventListener('click', function () { window.__dittoInvitePhoto = null; var im = $('#tkPh'); if (im) { im.hidden = true; im.removeAttribute('src'); } start(); });
    btnUse.addEventListener('click', function () { use(false); });
    visible(box, function (on) { if (!on && stream) { stopCam(); view.classList.remove('live'); if (demo) { view.classList.add('demo'); paintDemo(); } msg.textContent = '화면을 벗어나 카메라를 껐어요. 셔터를 누르면 다시 켜져요.'; } });
    addEventListener('pagehide', stopCam);
    pillSet(); hud();
  }

  [reveal, hero, strip, lab, shelf, guestbook, camcorder, ditto, why, freq, cam, getMark].forEach(function (fn) {
    try { fn(); } catch (e) { if (window.console) console.error('[v8 home]', fn.name, e); }
  });
})();
