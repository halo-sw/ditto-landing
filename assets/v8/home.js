/* ditto.place v8 — 홈 장면 (2026-11-12)
   1) 처음 화면의 실제 플래터   2) 3줄 격자 ↔ 플래터 · 직접 옮기고 크기 바꾸기   3) 위젯 14종 진열
   4) 디토가 이어지는 길 (소라 → 지우 → 하은)   5) 글자로 그린 주파수   6) 카메라 → 초대장 사진
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
  var AV = { jiuallday: 'jiu', soramaybe: 'sora', haeunzip: 'haeun', nariday: 'nari' };
  var av = function (h) { return '/assets/rooms/rav-' + AV[h] + '.webp'; };
  var MARK = ['M176.502 20.1889C176.502 20.1889 151.492 0.354846 97.6641 0C94.3642 19.1617 88.339 51.3127 81.3034 89.5053C79.088 54.665 59.1585 48.6326 48.2761 50.8924C21.3295 56.5046 -9.02822 106.398 2.52162 142.172C14.1642 178.236 66.5 169.869 87.9867 165.452C87.9497 165.34 87.9219 165.228 87.8848 165.125C87.4862 128.819 92.0468 78.7012 124.629 47.6988C139.08 33.9532 161.782 21.2254 176.511 20.1982L176.502 20.1889ZM67.0839 146.169C62.5604 151.146 52.4473 144.413 43.4095 132.572C24.8334 108.209 25.7047 80.905 39.1641 80.7369C46.45 80.6435 53.6153 86.1997 61.2256 109.106C65.7121 122.618 69.7906 143.181 67.0747 146.169H67.0839Z',
    'M153.996 156.046C151.332 158.734 147.415 158.93 145.465 153.751C144.379 150.849 141.687 144.093 134.633 134.976C130.845 130.077 123.716 122.659 119.186 114.046C114.332 104.817 113.375 99.5919 114.146 91.7629C115.158 81.6385 125.257 69.1251 139.33 69.993C164.012 71.514 162.165 103.922 162.165 103.922C162.165 103.922 176.803 73.0536 200.279 83.1595C213.209 88.7303 215.892 105.275 212.875 114.046C206.953 131.253 185 138.009 176.608 142.068C163.965 148.171 160.494 149.496 153.987 156.046H153.996Z'];

  /* ── 등장 ── */
  function reveal() {
    var els = $$('.h8-rv');
    if (RM || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('on'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ── ① 처음: 지우의 플래터 ── */
  function hero() {
    var root = $('#h8HeroPl'); if (!root || !DP || !P.jiuallday) return;
    window.__v9Hero = DP.create(root, { widgets: clone(P.jiuallday.widgets), editable: false, removable: false });
    $$('.dpl-card', root).forEach(function (el, i) { el.style.setProperty('--i', i); });
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.closest('.h8-hero-v').classList.add('on'); }); });
  }

  /* ── ③-1 플래터: 3줄 격자 ↔ 플래터 ── */
  function lab() {
    var st = $('#h8Stage'), root = $('#h8LabPl'), feed = $('#h8Feed'); if (!st || !root || !DP || !P.jiuallday) return;
    var W0 = clone(window.__v11LabWidgets || P.jiuallday.widgets), PRE = 'fs-07-jiu-';
    var LAY = [null,
      { birthday: [4, 0, 4, 3], song: [0, 0, 4, 3], day: [0, 3, 2, 2], status: [2, 3, 2, 2], 'from-sora': [4, 3, 4, 2], dance: [0, 5, 4, 4], flash: [4, 5, 4, 3], flowers: [4, 8, 4, 3], video: [0, 11, 4, 3], stickers: [4, 11, 4, 3] },
      { flowers: [0, 0, 3, 4], dance: [3, 0, 3, 4], day: [6, 0, 2, 2], status: [6, 2, 2, 2], stickers: [0, 4, 4, 3], song: [4, 4, 4, 3], birthday: [0, 7, 6, 4], 'from-sora': [6, 7, 2, 4], video: [0, 11, 4, 3], flash: [4, 11, 4, 4] }];
    var NOTE = ['지우가 꾸민 그대로예요.', '같은 위젯을 가지런히 놓았어요.', '사진 한 장을 크게 두었어요.'];
    var inst = DP.create(root, { widgets: clone(W0), editable: false, removable: false, minRows: 16 });
    window.__v9Lab = inst;
    var seg = $$('#h8Seg button'), hint = $('#h8Hint'), mode = 'feed', li = 0, busy = false;
    var PHOTO = ['birthday', 'dance', 'flash', 'flowers', 'video', 'song'];
    var tiles = PHOTO.map(function (k) {
      var w = W0.filter(function (x) { return x.id === PRE + k; })[0], el = document.createElement('i');
      el.className = 'h8-ft'; el.dataset.field = w.kind === 'music' ? '음악' : w.kind === 'video' ? '영상' : '사진'; feed.appendChild(el);
      return { id: w.id, kind: w.kind, el: el };
    });
    var ghosts = []; for (var gi = 0; gi < 12; gi++) { var ge = document.createElement('i'); ge.className = 'h8-fg'; feed.appendChild(ge); ghosts.push(ge); }
    var others = W0.filter(function (w) { return PHOTO.indexOf(w.id.replace(PRE, '')) < 0; }).map(function (w) { return w.id; });
    var item = function (id) { return root.querySelector('.dpl-item[data-id="' + id + '"]'); };
    function cell(i) { var Wd = st.clientWidth, g = 3, c = (Wd - 2 * g) / 3; return { left: (i % 3) * (c + g), top: Math.floor(i / 3) * (c + g), width: c, height: c, r: 0 }; }
    function plat(t) {
      var r = inst.rectOf(t.id), b = st.getBoundingClientRect(), l = inst.layout().filter(function (x) { return x.id === t.id; })[0];
      return { left: r.left - b.left, top: r.top - b.top, width: r.width, height: r.height, r: G.radius(t.kind, l.w, l.h) * b.width / 358 };
    }
    function put(el, r) { el.style.left = r.left + 'px'; el.style.top = r.top + 'px'; el.style.width = r.width + 'px'; el.style.height = r.height + 'px'; el.style.borderRadius = (r.r || 0) + 'px'; }
    function travel(el, from, to, delay, duration) {
      put(el,to);el.style.transformOrigin='0 0';
      return el.animate([{transform:'translate('+(from.left-to.left)+'px,'+(from.top-to.top)+'px) scale('+(from.width/to.width)+','+(from.height/to.height)+')',borderRadius:(from.r||0)+'px'},{transform:'none',borderRadius:(to.r||0)+'px'}],{duration:duration,delay:delay,easing:EASE,fill:'both'});
    }
    function layFeed() { tiles.forEach(function (t, i) { put(t.el, cell(i)); t.el.style.opacity = 1; }); ghosts.forEach(function (g, i) { put(g, cell(i + 6)); }); }
    function label() {
      seg.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.m === mode); });
      hint.textContent = mode === 'feed' ? '피드에는 사진만, 같은 크기로만 올라가요.' : '위젯을 끌어 옮기거나, 누른 뒤 모서리를 당겨 크기를 바꿔 보세요.';
      $('#h8Shuffle').disabled = $('#h8Reset').disabled = mode === 'feed';
    }
    function toPlatter(anim) {
      if (busy || mode === 'platter') return; mode = 'platter'; label();
      if (!anim || RM || !tiles[0].el.animate) { st.classList.remove('feed'); feed.hidden = true; inst.setEditable(true); return; }
      busy = true;
      tiles.forEach(function (t) { var e = item(t.id); if (e) e.style.opacity = 0; });
      others.forEach(function (id) { var e = item(id); if (e) e.style.opacity = 0; });
      st.classList.remove('feed');
      var jobs = tiles.map(function (t, i) {
        var a = travel(t.el, cell(i), plat(t), i * 36, 640);
        return a.finished.then(function () {
          var e = item(t.id); if (e) e.style.opacity = '';
          put(t.el, plat(t)); a.cancel();
          return t.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' }).finished;
        });
      });
      others.forEach(function (id, i) {
        var e = item(id); if (!e) return;
        e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 520, delay: 520 + i * 90, easing: 'ease-out', fill: 'backwards' });
        setTimeout(function () { e.style.opacity = ''; }, 520 + i * 90);
      });
      Promise.all(jobs).then(function () { feed.hidden = true; tiles.forEach(function (t) { t.el.getAnimations().forEach(function (a) { a.cancel(); }); }); inst.setEditable(true); busy = false; });
    }
    function toFeed() {
      if (busy || mode === 'feed') return; mode = 'feed'; label();
      inst.select(null); inst.setEditable(false);
      feed.hidden = false; ghosts.forEach(function (g, i) { put(g, cell(i + 6)); });
      if (RM || !tiles[0].el.animate) { layFeed(); st.classList.add('feed'); return; }
      busy = true;
      var from = tiles.map(plat);
      tiles.forEach(function (t, i) { put(t.el, from[i]); t.el.style.opacity = 1; });
      st.classList.add('feed');
      Promise.all(tiles.map(function (t, i) {
        var a = travel(t.el, from[i], cell(i), i * 30, 580);
        return a.finished.then(function () { put(t.el, cell(i)); a.cancel(); });
      })).then(function () { busy = false; });
    }
    function setLayout(k) {
      if (busy || mode !== 'platter') return;
      li = k; window.dispatchEvent(new CustomEvent('v9:layout',{detail:k})); var pr = LAY[k];
      var lay = W0.map(function (w) { var r = pr ? pr[w.id.replace(PRE, '')] : [w.x, w.y, w.w, w.h]; return { id: w.id, kind: w.kind, x: r[0], y: r[1], w: r[2], h: r[3] }; });
      inst.select(null); inst.setGridVisible(true);
      Promise.resolve(inst.setLayout(lay, { animate: !RM, stagger: 26 })).then(function () { setTimeout(function () { inst.setGridVisible(false); }, 500); });
      hint.textContent = NOTE[k] + ' 직접 옮기거나 크기를 바꿔도 돼요.'; var ln = $('#v9LayoutName'); if (ln) ln.textContent = ['자유롭게 놓기','가지런히 놓기','사진을 크게 놓기'][k];
    }
    window.__v9Layouts=LAY;window.__v9SetLayout=function(k){if(mode==='feed')toPlatter(false);setLayout(k);};
    seg.forEach(function (b) { b.addEventListener('click', function () { if (b.dataset.m === 'feed') toFeed(); else toPlatter(true); }); });
    $('#h8Shuffle').addEventListener('click', function () { setLayout((li + 1) % LAY.length); });
    $('#h8Reset').addEventListener('click', function () { setLayout(0); });
    var rz = 0; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (mode === 'feed' && !busy) layFeed(); }, 120); });
    toPlatter(false); layFeed(); label();
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
    var soon = document.createElement('li'); soon.innerHTML = '<div class="h8-wc soon">위젯은 더 추가될 예정이에요!</div>'; ul.appendChild(soon);
    if (!RM) seen(ul, function () { [0, 2, 5].forEach(function (i, n) { if (cards[i]) { setTimeout(cards[i], 900 + n * 420); setTimeout(cards[i], 2300 + n * 420); } }); }, 0.3);
  }

  /* ── 아날로그 카드의 방명록: 실제 위젯 ── */
  function guestbook() {
    var root = $('#h8AnGb'); if (!root || !DW || !P.jiuallday) return;
    var src = P.jiuallday.widgets.filter(function (w) { return w.kind === 'guestbook'; })[0]; if (!src) return;
    var wd = { id: 'an-gb', kind: 'guestbook', x: 0, y: 0, w: 4, h: 3, data: clone(src.data) }, box = DW.box(wd);
    root.appendChild(box); centre(box, wd, 179, 87.5);
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

  /* ── ③-2 디토: 소라 → 지우 → 하은 ── */
  function ditto() {
    var root = $('#h8Dt'), rA = $('#h8DtSora'), rB = $('#h8DtJiu'); if (!root || !rA || !rB || !DP || !P.soramaybe || !P.jiuallday) return;
    var TARGET = 'fs-03-sora-picnic', OPEN = P.soramaybe.widgets.filter(function (w) { return w.ditto; }).map(function (w) { return w.id; });
    var src = P.soramaybe.widgets.filter(function (w) { return w.id === TARGET; })[0];
    var sora = DP.create(rA, { widgets: clone(P.soramaybe.widgets), editable: false, removable: false });
    var jiu = null, copied = false, S = -1, T = [], manual = false;
    var cols = $('#h8DtCols'), colEls = $$('.h8-dt-col', root), stA = $('#h8DtStA'), hold = $('#h8Hold'), holdN = $('span', hold), cap = $('#h8DtCap');
    var toast = $('#h8ToastA'), slots = $$('#h8Slots i'), slotN = $('#h8SlotN'), steps = $$('.h8-dt-steps button', root);
    var CAP = [
      '소라가 디토할 수 있게 열어 둔 위젯에는 디토 표시가 붙어요. 한 사람이 열어 둘 수 있는 위젯은 3개까지예요.',
      '지우가 소라의 플래터에서 마음에 든 사진을 3초 동안 꾹 눌러요. 표시된 사진을 직접 눌러 보세요.',
      '내용과 출처가 담긴 사본이 지우의 플래터 맨 앞에 놓였어요. 소라에게는 알림이 가요. 디토는 3개까지 둘 수 있어요.',
      '지우가 만든 그룹 채팅에 소라가 같은 사진을 카드로 올렸어요. 지우의 친구 하은도 그 카드를 디토했어요. 하은과 소라는 아직 모르는 사이예요.',
      '디토를 가져왔다고 바로 친구가 되지는 않아요. 대신 둘 사이에 주파수가 생기고, 소라의 디토 탭에는 내 위젯이 어디까지 닿았는지가 그려져요.'];
    $$('.h8-hc-th', root).forEach(function (e) { e.style.backgroundImage = 'url("' + src.data.img + '")'; });
    var wave = $('#h8Wave'); if (wave) dotWave(wave, '#8E919E', 0.3);
    function mkJiu() { if (jiu) jiu.destroy(); jiu = DP.create(rB, { widgets: clone(P.jiuallday.widgets), editable: false, removable: false }); copied = false; setSlots(0); }
    function setSlots(n) { slots.forEach(function (e, i) { e.classList.toggle('on', i < n); }); slotN.textContent = '디토 ' + n + '/3'; }
    function later(fn, ms) { T.push(setTimeout(fn, ms)); }
    function stop() { T.forEach(clearTimeout); T = []; holdCancel(true); }
    function focusCol(i) {
      if (cols.scrollWidth <= cols.clientWidth + 4) return;
      var c = colEls[i]; cols.scrollTo({ left: c.offsetLeft - (cols.clientWidth - c.clientWidth) / 2, behavior: RM ? 'auto' : 'smooth' });
    }
    function placeHold() {
      var r = sora.rectOf(TARGET), b = stA.getBoundingClientRect();
      hold.style.left = (r.left - b.left) + 'px'; hold.style.top = (r.top - b.top) + 'px'; hold.style.width = r.width + 'px'; hold.style.height = r.height + 'px';
      hold.style.borderRadius = (G.radius('image', 3, 4) * b.width / 358) + 'px';
    }
    function copyWidget() { return { id: 'dt-copy', kind: 'image', w: 3, h: 4, data: clone(src.data), source: { name: '소라', handle: 'soramaybe', avatar: av('soramaybe') } }; }
    function ensureCopy(anim) {
      if (copied) return Promise.resolve();
      copied = true;
      if (!anim || RM || !document.body.animate) return Promise.resolve(jiu.add(copyWidget(), { front: true, animate: false })).then(function () { setSlots(1); });
      var from = sora.rectOf(TARGET), g = document.createElement('div');
      g.className = 'h8-ghost'; g.style.backgroundImage = 'url("' + src.data.img + '")';
      g.style.width = from.width + 'px'; g.style.height = from.height + 'px'; g.style.borderRadius = hold.style.borderRadius;
      g.style.transform = 'translate(' + from.left + 'px,' + from.top + 'px)'; document.body.appendChild(g);
      var lift = g.animate([{ transform: 'translate(' + from.left + 'px,' + from.top + 'px) scale(1)' }, { transform: 'translate(' + from.left + 'px,' + (from.top - 10) + 'px) scale(1.06)' }], { duration: 260, easing: 'ease-out', fill: 'forwards' });
      var scrolls = cols.scrollWidth > cols.clientWidth + 4;
      if (scrolls) focusCol(1);
      return lift.finished.then(function () { return wait(scrolls ? 420 : 60); }).then(function () {
        var to = jiu.cellRect(0, 0, 3, 4);
        return g.animate([{ transform: 'translate(' + from.left + 'px,' + (from.top - 10) + 'px) scale(1.06)', width: from.width + 'px', height: from.height + 'px' },
          { transform: 'translate(' + to.left + 'px,' + to.top + 'px) scale(1)', width: to.width + 'px', height: to.height + 'px' }], { duration: 720, easing: EASE, fill: 'forwards' }).finished;
      }).then(function () {
        var p = jiu.add(copyWidget(), { front: true, animate: true });
        g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, delay: 120, fill: 'forwards' }).finished.then(function () { g.remove(); });
        setSlots(1);
        return p;
      });
    }
    function apply(n, anim) {
      root.dataset.s = n; S = n; cap.textContent = CAP[n];
      steps.forEach(function (b, i) { if (i === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
      sora.clearMarks(); hold.hidden = n !== 1; toast.classList.remove('on');
      if (n < 2 && copied) mkJiu();
      if (n === 0) { sora.highlight(OPEN, { dimOthers: true }); focusCol(0); return Promise.resolve(); }
      if (n === 1) { sora.highlight([TARGET], { dimOthers: true }); placeHold(); focusCol(0); return Promise.resolve(); }
      sora.highlight([TARGET]);
      return ensureCopy(anim && n === 2).then(function () {
        if (S !== n) return;
        if (n === 2) { if (!anim) focusCol(1); toast.classList.add('on'); later(function () { toast.classList.remove('on'); }, 3200); }
        else focusCol(2);
      });
    }
    /* 3초 꾹 */
    var hRaf = 0, hT0 = 0;
    function holdTick(now) {
      var p = Math.min(1, (now - hT0) / 3000); hold.style.setProperty('--p', p);
      if (p < 1) { holdN.textContent = Math.ceil((1 - p) * 3); hRaf = requestAnimationFrame(holdTick); return; }
      hRaf = 0; holdN.textContent = '디토'; holdDone();
    }
    function holdStart() { if (hRaf || S !== 1) return; hT0 = performance.now(); hRaf = requestAnimationFrame(holdTick); }
    function holdCancel(quiet) { if (!hRaf) return; cancelAnimationFrame(hRaf); hRaf = 0; hold.style.setProperty('--p', 0); holdN.textContent = '꾹'; if (!quiet) cap.textContent = '중간에 떼면 취소돼요. 3초 동안 꾹 눌러 보세요.'; }
    function holdDone() {
      apply(2, true).then(function () { hold.style.setProperty('--p', 0); holdN.textContent = '꾹'; if (manual) return; later(function () { apply(3, true); later(function () { apply(4, true); }, 4200); }, 3600); });
    }
    hold.addEventListener('pointerdown', function (e) { stop(); manual = false; if (hold.setPointerCapture) hold.setPointerCapture(e.pointerId); holdStart(); });
    ['pointerup', 'pointercancel'].forEach(function (nm) { hold.addEventListener(nm, function () { holdCancel(false); }); });
    hold.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    hold.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); stop(); manual = false; holdStart(); } });
    hold.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') holdCancel(false); });
    steps.forEach(function (b, i) { b.addEventListener('click', function () { stop(); manual = true; apply(i, i === 2); }); });
    function play() {
      stop(); manual = false; mkJiu(); apply(0, false);
      later(function () { apply(1, true); later(function () { if (S === 1 && !hRaf) holdStart(); }, 1400); }, 3200);
    }
    $('#h8DtReplay').addEventListener('click', play);
    var rz = 0; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (S === 1) placeHold(); }, 120); });
    mkJiu();
    if (RM) { apply(4, false); return; }
    apply(0, false);
    seen(root, play, 0.3);
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

  /* ── ③-3 주파수: 글자 격자 위의 두 신호 → 디토 마크 ── */
  function freq() {
    var wrap = $('#h8-freq'), box = $('#h8Fq'), cv = $('#h8FqC'); if (!wrap || !box || !cv || !cv.getContext) return;
    var ctx = cv.getContext('2d'), W = 0, H = 0, D = 1, cw = 12, ch = 19, fs = 13, cols = 0, rows = 0, bg = null, mask = null, mW = 0, mH = 0, mX = 0, mY = 0;
    var p = RM ? 1 : 0, ps = p, live = false, raf = 0, tPrev = 0, tt = 0, fr = 0, mx = -999, my = -999, stage = -1, dayNow = -1, YA = [], YB = [];
    var MID = 0.46, STC = [[142, 145, 158], [43, 196, 168], [90, 91, 242], [170, 74, 244]], PINK = [250, 151, 226], rgb = STC[0].slice(), LET = 'ditto!';
    var NAME = ['잔잔', '선명', '곧 열림', '열림'], SAY = ['잔잔하게 이어지는 중', '선명하게 이어지는 중', '곧 친구 신청이 열려요', '친구 신청이 열렸어요'];
    var dayEl = $('#h8FqDay'), nameEl = $('#h8FqName'), sayEl = $('#h8FqSay'), endEl = $('#h8FqEnd'), logs = $$('#h8FqLog li'), btns = $$('#h8FqSt button');
    function size() {
      var r = box.getBoundingClientRect(); W = r.width; H = r.height; D = Math.min(window.devicePixelRatio || 1, 2);
      if (W < 700) { cw = 9; ch = 15; fs = 11; } else { cw = 12; ch = 19; fs = 14; }
      cols = Math.ceil(W / cw) + 1; rows = Math.ceil(H / ch) + 1;
      cv.width = Math.round(W * D); cv.height = Math.round(H * D);
      bg = document.createElement('canvas'); bg.width = cv.width; bg.height = cv.height;
      var b = bg.getContext('2d'); b.setTransform(D, 0, 0, D, 0, 0); b.fillStyle = 'rgba(255,255,255,.09)';
      for (var y = 0; y < rows; y++) for (var x = y % 2; x < cols; x += 2) b.fillRect(x * cw + cw / 2 - 0.6, y * ch + ch / 2 - 0.6, 1.2, 1.2);
      /* 상징: 디토 마크를 글자 칸으로 */
      mH = Math.round(rows * (W < 700 ? 0.3 : 0.5)); mW = Math.round(mH * (214 / 204) * (ch / cw));
      if (mW > cols * 0.82) { mW = Math.floor(cols * 0.82); mH = Math.round(mW * (204 / 214) * (cw / ch)); }
      mX = Math.round((cols - mW) / 2); mY = Math.round(rows * (W < 700 ? 0.45 : MID) - mH / 2);
      var Q = 4, m = document.createElement('canvas'); m.width = mW * Q; m.height = mH * Q; var mc = m.getContext('2d');
      mc.scale(mW * Q / 214, mH * Q / 204); mc.fillStyle = '#000';
      if (window.Path2D) MARK.forEach(function (d) { mc.fill(new Path2D(d)); });
      mc.beginPath(); mc.arc(141.594, 187.204, 16.75, 0, 6.2832); mc.fill();
      var id = mc.getImageData(0, 0, mW * Q, mH * Q).data; mask = new Uint8Array(mW * mH);
      for (var yy = 0; yy < mH; yy++) for (var xx = 0; xx < mW; xx++) {      /* 칸마다 덮인 넓이가 45%를 넘으면 켠다 */
        var sum = 0; for (var qy = 0; qy < Q; qy++) for (var qx = 0; qx < Q; qx++) sum += id[((yy * Q + qy) * mW * Q + xx * Q + qx) * 4 + 3];
        mask[yy * mW + xx] = sum / (Q * Q * 255) > 0.45 ? 1 : 0;
      }
      if (!live) paint(performance.now());
    }
    function inMask(c, r) { c -= mX; r -= mY; return c >= 0 && r >= 0 && c < mW && r < mH && mask[r * mW + c] > 0; }
    function setStage(s) {
      stage = s; box.style.setProperty('--fq-c', STC[s].join(' '));
      nameEl.textContent = NAME[s]; sayEl.textContent = SAY[s];
      btns.forEach(function (b, i) { b.setAttribute('aria-pressed', i === s); });
    }
    function grad(a, b, mixW) {
      var g = ctx.createLinearGradient(0, 0, W, 0), f = function (c, w) { return 'rgb(' + Math.round(c[0] + (255 - c[0]) * w) + ',' + Math.round(c[1] + (255 - c[1]) * w) + ',' + Math.round(c[2] + (255 - c[2]) * w) + ')'; };
      g.addColorStop(0, f(a, mixW)); g.addColorStop(1, f(b, mixW)); return g;
    }
    function band(c, y, al, wide, hide) {
      var r0 = Math.round(y), x = c * cw + cw / 2;
      for (var dr = -wide; dr <= wide; dr++) {
        var rr = r0 + dr; if (rr < 0 || rr >= rows) continue; if (hide && inMask(c, rr)) continue;
        var d = Math.abs(rr - y), chh, a;
        if (d < 0.5) { chh = LET.charAt(c % 6); a = 1; } else if (d < 1.5) { chh = '+'; a = 0.64; } else if (d < 2.5) { chh = ':'; a = 0.38; } else { chh = '·'; a = 0.22; }
        ctx.globalAlpha = a * al; ctx.fillText(chh, x, rr * ch + ch / 2);
      }
    }
    function paint(now) {
      var dt = Math.min(0.1, (now - tPrev) / 1000 || 0); tPrev = now; if (!RM) tt += dt;
      ps += (p - ps) * (RM ? 1 : 0.16);
      var s = ps < 0.28 ? 0 : ps < 0.56 ? 1 : ps < 0.84 ? 2 : 3; if (s !== stage) setStage(s);
      for (var j = 0; j < 3; j++) rgb[j] += (STC[s][j] - rgb[j]) * (RM ? 1 : 0.14);
      var sync = sm(0, 0.84, ps), m = sm(0.86, 0.985, ps), end = s === 3 ? sm(0.84, 0.9, ps) : 0;
      var tip = [rgb[0] + (PINK[0] - rgb[0]) * end, rgb[1] + (PINK[1] - rgb[1]) * end, rgb[2] + (PINK[2] - rgb[2]) * end];
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); if (bg) ctx.drawImage(bg, 0, 0);
      ctx.setTransform(D, 0, 0, D, 0, 0);
      ctx.font = '700 ' + fs + 'px "Pretendard Variable",Pretendard,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var mid = rows * (W < 700 ? 0.45 : MID), gap = rows * 0.17 * (1 - sync), amp = rows * (0.045 + 0.08 * sync) * (1 - m * 0.78);
      var kA = 6.2832 / (cols * 0.4), kB = kA * (1 + 0.9 * (1 - sync)), off = (1 - sync) * (2.1 + 0.9 * Math.sin(tt * 0.23)), ph = tt * 1.15, jit = (1 - sync) * rows * 0.024;
      var mcx = mx / cw, mcy = my / ch, c;
      for (c = 0; c < cols; c++) {
        var ya = mid - gap + amp * Math.sin(kA * c - ph) + jit * Math.sin(c * 1.7 + tt * 1.9) * Math.sin(c * 0.31 - tt * 0.8);
        var yb = mid + gap + amp * Math.sin(kB * c - ph - off) + jit * Math.sin(c * 1.3 - tt * 1.6) * Math.sin(c * 0.43 + tt * 0.6);
        if (mx > -900) { var near = Math.exp(-Math.pow((c - mcx) / 7, 2)) * 0.32; ya += (mcy - ya) * near; yb += (mcy - yb) * near; }
        YA[c] = ya; YB[c] = yb;
      }
      var al = (0.66 + 0.34 * sync) * (1 - m * 0.72), wide = sync > 0.35 ? 3 : 2, hide = m > 0.25;
      /* 신호 뒤로 번지는 빛: 칸 단위의 옅은 띠 */
      ctx.fillStyle = grad(rgb, tip, 0.1); ctx.globalAlpha = (0.018 + 0.03 * sync) * (1 - m * 0.6);
      for (c = 0; c < cols; c++) { ctx.fillRect(c * cw, (Math.round(YA[c]) - wide - 1) * ch, cw, (wide * 2 + 3) * ch); ctx.fillRect(c * cw, (Math.round(YB[c]) - wide - 1) * ch, cw, (wide * 2 + 3) * ch); }
      ctx.fillStyle = grad(rgb, tip, 0.14); for (c = 0; c < cols; c++) band(c, YA[c], al, wide, hide);
      ctx.fillStyle = grad(rgb, tip, 0.58); for (c = 0; c < cols; c++) band(c, YB[c], al * 0.94, wide, hide);
      /* 맞닿는 자리 */
      ctx.fillStyle = '#fff';
      for (c = 0; c < cols; c++) {
        var d = Math.abs(YA[c] - YB[c]); if (d > 1.5) continue;
        var rr = Math.round((YA[c] + YB[c]) / 2); if (hide && inMask(c, rr)) continue;
        ctx.globalAlpha = (1 - d / 1.5) * (0.55 + 0.4 * Math.sin(tt * 3 + c * 0.7)) * (1 - m * 0.6); ctx.fillText(c % 3 ? '*' : '!', c * cw + cw / 2, rr * ch + ch / 2);
      }
      /* 상징 */
      if (m > 0.002 && mask) {
        var g = ctx.createLinearGradient(mX * cw, 0, (mX + mW) * cw, 0); g.addColorStop(0, '#B463F7'); g.addColorStop(0.55, '#C77BFF'); g.addColorStop(1, '#FA97E2'); ctx.fillStyle = g;
        var half = mH / 2;
        var r, a2;      /* 글자 타일: 색 칸 위에 어두운 글자. 가운데 줄에서 위아래로 번지며 켜진다 */
        for (r = 0; r < mH; r++) for (c = 0; c < mW; c++) {
          if (!mask[r * mW + c]) continue;
          var rev = m * 1.3 - Math.abs(r - half) / half; if (rev <= 0) continue;
          ctx.globalAlpha = Math.min(1, rev * 4) * (0.86 + 0.14 * Math.sin(tt * 2.2 + c * 0.35 + r * 0.27));
          ctx.fillRect((mX + c) * cw + 0.75, (mY + r) * ch + 0.75, cw - 1.5, ch - 1.5);
        }
        ctx.fillStyle = '#16081F';
        for (r = 0; r < mH; r++) for (c = 0; c < mW; c++) {
          if (!mask[r * mW + c]) continue;
          a2 = m * 1.3 - Math.abs(r - half) / half; if (a2 <= 0) continue;
          ctx.globalAlpha = Math.min(1, a2 * 4) * 0.82; ctx.fillText(LET.charAt((c + r) % 6), (mX + c) * cw + cw / 2, (mY + r) * ch + ch / 2 + 0.5);
        }
      }
      ctx.globalAlpha = 1;
      var dn = 1 + Math.round(ps * 20); if (dn !== dayNow) { dayNow = dn; dayEl.textContent = dn + '일째'; }
      var last = -1; logs.forEach(function (li, i) { var on = ps >= +li.dataset.at; li.classList.toggle('on', on); if (on) last = i; });
      logs.forEach(function (li, i) { li.classList.toggle('old', i < last - 1); });
      endEl.classList.toggle('on', ps > 0.94);
    }
    function loop(now) { raf = 0; if (!live) return; raf = requestAnimationFrame(loop); if (++fr % 2) return; paint(now); }
    function onScroll() { var r = wrap.getBoundingClientRect(), span = r.height - innerHeight; p = RM ? 1 : span > 0 ? clamp(-r.top / span) : 1; }
    btns.forEach(function (b, i) { b.addEventListener('click', function () {
      var r = wrap.getBoundingClientRect(), span = r.height - innerHeight; if (span <= 0) return;
      scrollTo({ top: r.top + scrollY + span * [0.04, 0.4, 0.7, 0.99][i], behavior: RM ? 'auto' : 'smooth' });
    }); });
    box.addEventListener('pointermove', function (e) { var r = box.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    box.addEventListener('pointerleave', function () { mx = my = -999; });
    addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', function () { size(); onScroll(); });
    size(); onScroll(); ps = p; paint(performance.now());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!live) paint(performance.now()); });
    visible(box, function (v) { live = v && !RM; if (live && !raf) { tPrev = performance.now(); raf = requestAnimationFrame(loop); } });
  }

  /* ── ⑦ 카메라: 앱 색감 다섯 → 찍기 → 초대장에 넣기 ──
     값은 앱 camera-looks 프로필(노출 · 온기 · 틴트 · 대비 · 채도 · 암부 색 · 입자 · 주변 감광 · VHS 번짐)을 그대로 옮겼다. 사진은 이 브라우저 안에서만 다룬다. */
  var LOOKS = [
    { id: 'toss-27', name: '토스 27', look: '끝나지 않은 소풍', type: '일회용 필름 카메라', pal: ['#F5E2AF', '#D7BA53', '#71965E'], c: { ev: 0.04, warm: 0.62, tint: -0.08, con: 1.1, sat: 1.12, lift: 0.025, sh: [0.1, 0.08, -0.1] }, grain: 0.95, fall: 0.035 },
    { id: 'vhs-cam', name: 'VHS 캠', look: '거실 테이프 1987', type: '어깨형 VHS 캠코더', pal: ['#E6D9BB', '#C58B75', '#7F7188'], c: { ev: 0.01, warm: 0.42, tint: 0.15, con: 0.98, sat: 0.86, lift: 0.035, sh: [0.18, -0.1, 0.28] }, grain: 0.2, fall: 0, chroma: 2.2 },
    { id: 'pixel-pal', name: '픽셀 팔', look: '초록빛 비밀기지', type: '휴대용 게임 카메라', pal: ['#E7E7B2', '#A0B76D', '#244829'], c: { ev: 0, warm: 0, tint: 0, con: 1.03, sat: 1, lift: 0.018, sh: [0, 0, 0], mono: 1, palette: [[0.14, 0.28, 0.16], [0.9, 0.91, 0.7]] }, grain: 0.2, fall: 0 },
    { id: 'analog-booth', name: '아날로그 포토부스', look: '커튼 뒤 네 번의 플래시', type: '은염 인화 포토부스', pal: ['#F2E8D5', '#B5A58F', '#302D29'], c: { ev: 0.01, warm: 0.2, tint: 0, con: 1.08, sat: 0, lift: 0.018, sh: [0.1, 0.05, -0.06], mono: 1, tone: [1.025, 1, 0.95] }, grain: 1.3, fall: 0.07 },
    { id: 'clamshell-05', name: '클램셸 05', look: '방과 후 첫 문자', type: '폴더폰', pal: ['#F6E5E5', '#DAB9C7', '#A3A7C5'], c: { ev: 0.06, warm: 0.12, tint: 0.22, con: 0.96, sat: 0.9, lift: 0.026, sh: [0.15, -0.12, 0.25] }, grain: 0.25, fall: 0 }];
  function grade(im, L) {
    var d = im.data, w = im.width, h = im.height, c = L.c, ev = Math.pow(2, c.ev), wr = ev * (1 + c.warm * 0.16) * (1 + c.tint * 0.05), wg = ev * (1 - c.tint * 0.1), wb = ev * (1 - c.warm * 0.16) * (1 + c.tint * 0.05);
    var con = c.con, sat = c.sat, lift = c.lift, sh = c.sh, gr = (L.grain || 0) * 0.09, fall = (L.fall || 0) * 3.6, cx = w / 2, cy = h / 2, inv = 1 / (cx * cx + cy * cy), seed = (Math.random() * 2147483647) | 0, pa = c.palette, tn = c.tone;
    for (var y = 0, i = 0; y < h; y++) for (var x = 0; x < w; x++, i += 4) {
      var r = (d[i] / 255 * wr - 0.5) * con + 0.5, g = (d[i + 1] / 255 * wg - 0.5) * con + 0.5, b = (d[i + 2] / 255 * wb - 0.5) * con + 0.5;
      var l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (c.mono) {
        if (pa) { var q = l < 0 ? 0 : l > 1 ? 1 : l; r = pa[0][0] + (pa[1][0] - pa[0][0]) * q; g = pa[0][1] + (pa[1][1] - pa[0][1]) * q; b = pa[0][2] + (pa[1][2] - pa[0][2]) * q; }
        else { r = l * tn[0]; g = l * tn[1]; b = l * tn[2]; }
      } else { r = l + (r - l) * sat; g = l + (g - l) * sat; b = l + (b - l) * sat; }
      var sd = 1 - l; if (sd > 0) { sd = sd * sd * 0.22; r += sh[0] * sd; g += sh[1] * sd; b += sh[2] * sd; }
      r = r * (1 - lift) + lift; g = g * (1 - lift) + lift; b = b * (1 - lift) + lift;
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
    var msg = $('#h8CamMsg'), btnRe = $('#h8CamRe'), btnUse = $('#h8CamUse'), hudA = $('#h8CamHudA'), hudB = $('#h8CamHudB'), list = $('#h8Looks');
    var cur = LOOKS[0], stream = null, raf = 0, last = 0, raw = null, shot = null, PW = 360, PH = 480, SW = 720, SH = 960;
    LOOKS.forEach(function (L, i) {
      var li = document.createElement('li'), b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-pressed', i === 0);
      b.innerHTML = '<u style="--a:' + L.pal[0] + ';--b:' + L.pal[1] + ';--c:' + L.pal[2] + '"></u><div><b></b><span></span></div><i></i>';
      $('b', b).textContent = L.name; $('span', b).textContent = L.look; $('i', b).textContent = L.type;
      b.addEventListener('click', function () { cur = L; $$('button', list).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); hud(); if (raw) { develop(); if (window.__dittoInvitePhoto) use(true); } });
      li.appendChild(b); list.appendChild(li);
    });
    function hud() { hudA.textContent = cur.name; hudB.textContent = cur.type; }
    function cover(src, sw, sh, dst, dw, dh, mirror) {
      var k = Math.max(dw / sw, dh / sh), w = dw / k, h = dh / k, c = dst.getContext('2d');
      c.save(); if (mirror) { c.translate(dw, 0); c.scale(-1, 1); } c.drawImage(src, (sw - w) / 2, (sh - h) / 2, w, h, 0, 0, dw, dh); c.restore();
    }
    function frame(now) {
      raf = 0; if (!stream) return; raf = requestAnimationFrame(frame);
      if (now - last < 50 || v.readyState < 2) return; last = now;
      if (cv.width !== PW) { cv.width = PW; cv.height = PH; }
      cover(v, v.videoWidth, v.videoHeight, cv, PW, PH, true);
      ctx.putImageData(grade(ctx.getImageData(0, 0, PW, PH), cur), 0, 0);
    }
    function stopCam() { if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; } if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    function start() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { msg.textContent = '이 브라우저에서는 카메라를 켤 수 없어요. 사진을 골라 주세요.'; return; }
      msg.textContent = '카메라를 켜는 중이에요.';
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 1280 } }, audio: false }).then(function (s) {
        stream = s; v.srcObject = s; raw = shot = null; view.classList.remove('shot'); view.classList.add('live'); hud(); btnRe.hidden = btnUse.hidden = true;
        msg.textContent = '색감을 고르고 가운데 버튼으로 찍어요.';
        var pl = v.play(); if (pl && pl.catch) pl.catch(function () {});
        raf = requestAnimationFrame(frame);
      }).catch(function () { msg.textContent = '카메라를 켤 수 없어요. 권한을 확인하거나 사진을 골라 주세요.'; });
    }
    function develop() {
      if (!raw) return;
      shot = document.createElement('canvas'); shot.width = SW; shot.height = SH;
      var sc = shot.getContext('2d'); sc.drawImage(raw, 0, 0);
      sc.putImageData(grade(sc.getImageData(0, 0, SW, SH), cur), 0, 0);
      cv.width = SW; cv.height = SH; ctx.drawImage(shot, 0, 0);
      if (window.__dittoInvitePhoto) use(true);
    }
    function took(src, sw, sh, mirror) {
      raw = document.createElement('canvas'); raw.width = SW; raw.height = SH; cover(src, sw, sh, raw, SW, SH, mirror);
      stopCam(); view.classList.remove('live'); view.classList.add('shot', 'flash'); setTimeout(function () { view.classList.remove('flash'); }, 500);
      hud(); develop(); btnRe.hidden = btnUse.hidden = false; msg.textContent = '색감은 찍은 뒤에도 바꿀 수 있어요.';
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
    $('#h8CamShot').addEventListener('click', function () { if (stream && v.readyState >= 2) took(v, v.videoWidth, v.videoHeight, true); });
    btnRe.addEventListener('click', function () { window.__dittoInvitePhoto = null; var im = $('#tkPh'); if (im) { im.hidden = true; im.removeAttribute('src'); } start(); });
    btnUse.addEventListener('click', function () { use(false); });
    $('#h8CamFile').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0]; if (!f) return;
      var im = new Image(), url = URL.createObjectURL(f);
      im.onload = function () { took(im, im.naturalWidth, im.naturalHeight, false); URL.revokeObjectURL(url); };
      im.onerror = function () { msg.textContent = '이 사진은 열 수 없어요. 다른 사진을 골라 주세요.'; URL.revokeObjectURL(url); };
      im.src = url; e.target.value = '';
    });
    visible(box, function (on) { if (!on && stream) { stopCam(); view.classList.remove('live'); msg.textContent = '화면을 벗어나 카메라를 껐어요. 다시 켜려면 버튼을 눌러 주세요.'; } });
    addEventListener('pagehide', stopCam);
    hud();
  }

  [reveal, hero, lab, guestbook, why, cam].forEach(function (fn) {
    try { fn(); } catch (e) { if (window.console) console.error('[v8 home]', fn.name, e); }
  });
})();
