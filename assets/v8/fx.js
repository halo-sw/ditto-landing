/* ditto.place v8.2 — 움직임 (2026-11-13)
   home.js 가 그린 장면 위에 얹는다. 글과 서버 호출은 건드리지 않는다.
   1) 제목 줄 등장   2) 스크롤을 따라 밝아지는 글   3) 큰 목차와 커서 미리보기   4) 처음 화면의 모이는 위젯 · 기울기
   5) 흐르는 위젯 띠   6) 펼쳐지는 앱 화면   7) 쌓이는 아날로그 카드
   모션 줄이기 설정에서는 전부 완성된 정지 상태로 둔다. */
(function () {
  'use strict';
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return [].slice.call((el || document).querySelectorAll(s)); };
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var rnd = function (a, b) { var x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

  /* 스크롤 · 크기 변화는 한 번에 모아 처리한다 */
  var onScroll = [], tick = false;
  function run() { tick = false; var vh = window.innerHeight; onScroll.forEach(function (fn) { fn(vh); }); }
  function req() { if (!tick) { tick = true; requestAnimationFrame(run); } }
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);

  /* 글자를 낱말 단위로 감싼다 (띄어쓰기는 그대로) */
  function words(el) {
    var out = [];
    (function walk(n) {
      [].slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 1) { walk(c); return; }
        if (c.nodeType !== 3 || !c.textContent.trim()) return;
        var f = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(function (t) {
          if (!t) return;
          if (/^\s+$/.test(t)) { f.appendChild(document.createTextNode(t)); return; }
          var s = document.createElement('span'); s.className = 'fx-w'; s.textContent = t; f.appendChild(s); out.push(s);
        });
        n.replaceChild(f, c);
      });
    })(el);
    return out;
  }
  function fill(ws, p) { var k = Math.round(p * ws.length); ws.forEach(function (w, i) { w.classList.toggle('on', i < k); }); }

  /* ── 1) 제목: 줄 단위로 올라온다 ── */
  function lines() {
    var hs = $$('.fx-mf h2, .h8-head h2, .h8-head h3, #ro-h');   // 처음 화면 제목은 HTML 에 이미 나뉘어 있다
    if (RM || !('IntersectionObserver' in window)) return;
    hs.forEach(function (h) {
      h.innerHTML = h.innerHTML.split(/<br\s*\/?>/i).map(function (p, i) { return '<span class="fx-ln" style="--l:' + i + '"><span>' + p + '</span></span>'; }).join('');
      h.classList.remove('h8-rv'); h.classList.add('fx-h');
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
    }, { threshold: 0.35 });
    hs.forEach(function (h) { io.observe(h); });
  }

  /* ── 4) 처음 화면 ── */
  function hero() {
    var sec = $('#top'), view = $('.h8-hero-v', sec), text = $('.h8-hero-t', sec); if (!sec || !view) return;
    if (RM) return;
    var cards = $$('.dpl-card', view), n = Math.max(1, cards.length - 1);
    cards.forEach(function (c, i) {
      var t = i / n, side = i % 2 ? 1 : -1;
      c.style.setProperty('--dx', Math.round(side * (26 + rnd(i, 1) * 70)) + 'px');
      c.style.setProperty('--dy', Math.round(70 + rnd(i, 2) * 150) + 'px');
      c.style.setProperty('--dr', ((rnd(i, 3) - 0.5) * 16).toFixed(1) + 'deg');
      c.style.setProperty('--d', Math.round(140 + 560 * (1 - (1 - t) * (1 - t))) + 'ms');   // 뒤로 갈수록 간격이 좁아진다
    });
    var scr = $('.h8-scr', view);
    if (FINE && scr) {
      sec.addEventListener('pointermove', function (e) {
        var r = sec.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        scr.style.setProperty('--ry', (x * 7).toFixed(2) + 'deg'); scr.style.setProperty('--rx', (-y * 5).toFixed(2) + 'deg');
      });
      sec.addEventListener('pointerleave', function () { scr.style.setProperty('--ry', '0deg'); scr.style.setProperty('--rx', '0deg'); });
    }
    onScroll.push(function (vh) {
      var y = window.scrollY; if (y > vh * 1.2) return;
      if (scr) scr.style.setProperty('--py', (-y * 0.07).toFixed(1) + 'px');
      if (text) { text.style.transform = 'translateY(' + (y * 0.14).toFixed(1) + 'px)'; text.style.opacity = (1 - clamp(y / (vh * 0.75))).toFixed(3); }
    });
  }

  /* ── 2) 문제: 고정 화면에서 낱말이 차례로 밝아진다 ── */
  function why() {
    var sec = $('#h8-why'), p = $('p', sec); if (!sec || !p) return;
    p.classList.remove('h8-rv');
    if (RM) return;
    var ws = words(p);
    onScroll.push(function (vh) {
      var r = sec.getBoundingClientRect(), span = r.height - vh; if (r.bottom < 0 || r.top > vh) return;
      var pr = clamp(-r.top / Math.max(1, span)); sec.style.setProperty('--p', pr.toFixed(3));
      fill(ws, clamp((pr - 0.06) / 0.78));
    });
  }

  /* ── 3) 세 개념: 낱말이 짙어지고, 목차 위로 미리보기가 따라온다 ── */
  function three() {
    var sec = $('#h8-three'), h = $('h2', sec); if (!sec || !h) return;
    if (!RM) {
      var ws = words(h);
      onScroll.push(function (vh) { var r = h.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return; fill(ws, clamp((vh * 0.86 - r.top) / (vh * 0.42))); });
    }
    var pv = $('.fx-pv'), rows = $$('.fx-idx a[data-pv]', sec); if (!pv || !rows.length || !FINE || RM) return;
    var imgs = rows.map(function (a) { var im = new Image(); im.alt = ''; im.decoding = 'async'; im.src = a.dataset.pv; pv.appendChild(im); return im; });
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, lastX = 0, rot = 0;
    function loop() {
      cx += (tx - cx) * 0.16; cy += (ty - cy) * 0.16; rot += ((tx - lastX) * 0.5 - rot) * 0.12; lastX = tx;
      pv.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px) rotate(' + Math.max(-9, Math.min(9, rot)).toFixed(2) + 'deg)';
      raf = pv.classList.contains('on') || Math.abs(tx - cx) > 0.5 ? requestAnimationFrame(loop) : 0;
    }
    rows.forEach(function (a, i) {
      a.addEventListener('pointerenter', function (e) {
        imgs.forEach(function (im, k) { im.classList.toggle('on', k === i); });
        tx = e.clientX + 28; ty = e.clientY - pv.offsetHeight * 0.62;
        if (!pv.classList.contains('on')) { cx = tx; cy = ty; lastX = tx; }
        pv.classList.add('on'); if (!raf) raf = requestAnimationFrame(loop);
      });
      a.addEventListener('pointermove', function (e) { tx = e.clientX + 28; ty = e.clientY - pv.offsetHeight * 0.62; });
      a.addEventListener('pointerleave', function () { pv.classList.remove('on'); });
    });
    addEventListener('scroll', function () { pv.classList.remove('on'); }, { passive: true });
  }

  /* ── 5) 위젯 진열 → 두 줄로 흐르는 띠 ── */
  function shelf() {
    var ul = $('#h8Shelf'); if (!ul) return;
    var lis = [].slice.call(ul.children); if (lis.length < 4) return;
    var box = document.createElement('div'); box.className = 'fx-mq'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', '위젯 모음');
    var half = Math.ceil(lis.length / 2);
    [lis.slice(0, half), lis.slice(half)].forEach(function (set) {
      var row = document.createElement('ul'); row.className = 'fx-mq-row'; row.style.setProperty('--t', (set.length * 8) + 's');
      set.forEach(function (li) { row.appendChild(li); });
      if (!RM) set.forEach(function (li) {            // 끊김 없이 돌도록 한 벌 더 (보조 기기에는 숨김)
        var c = li.cloneNode(true), cb = $('button', c), ob = $('button', li); c.setAttribute('aria-hidden', 'true');
        if (cb && ob) { cb.tabIndex = -1; cb.addEventListener('click', function () { ob.click(); setTimeout(function () { var a = $('.h8-wc-st', c), b = $('.h8-wc-st', li); if (a && b) a.innerHTML = b.innerHTML; }, 620); }); }
        row.appendChild(c);
      });
      box.appendChild(row);
    });
    ul.parentNode.replaceChild(box, ul);
    var ht = 0;
    box.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') return; box.classList.add('hold'); clearTimeout(ht); ht = setTimeout(function () { box.classList.remove('hold'); }, 2600); });
    if (RM || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (es, o) {           // 처음 보일 때 두 장만 크기를 한 번 바꿔 보여 준다
      if (!es[0].isIntersecting) return; o.disconnect();
      [lis[1], lis[half + 2]].forEach(function (li, k) { var b = li && $('button', li); if (b) setTimeout(function () { b.click(); }, 1100 + k * 700); });
    }, { threshold: 0.4 }).observe(box);
  }

  /* ── 6) 앱 화면 세 장: 탭을 누르면 가운데 폰이 바뀐다 (양옆에 이전 · 다음 화면이 흐릿하게) ── */
  function shots() {
    var tabs = $$('#fxTabs [role="tab"]'), ims = $$('#fxTabV img'); if (tabs.length < 3 || ims.length !== tabs.length) return;
    var n = tabs.length, cur = 0, tm = 0;
    function show(k, user) {
      cur = k;
      tabs.forEach(function (t, i) { t.setAttribute('aria-selected', i === k); });
      ims.forEach(function (im, i) { var d = (i - k + n) % n; im.className = d === 0 ? 'c' : d === 1 ? 'r' : 'l'; });
      if (user) { clearInterval(tm); tm = 0; }
    }
    tabs.forEach(function (t, i) { t.addEventListener('click', function () { show(i, true); }); });
    ims.forEach(function (im, i) { im.addEventListener('click', function () { if (i !== cur) show(i, true); }); });
    show(0);
    if (RM || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (es) {            // 보이는 동안만 천천히 넘어간다. 한 번 누르면 멈춘다
      if (es[0].isIntersecting) { if (!tm) tm = setInterval(function () { show((cur + 1) % n); }, 3600); } else { clearInterval(tm); tm = 0; }
    }, { threshold: 0.4 }).observe($('#fxTabV'));
  }

  /* 선언문: 화면 가운데에 가장 가까운 문장만 또렷하게. 강조된 낱말에 올리거나 누르면 그 말에 얽힌 물건이 양옆에 튀어나온다 */
  function manifesto() {
    var ps = $$('.fx-mf-p'), hls = $$('.fx-hl'), eggs = $$('.fx-egg'), pinned = '';
    function show(key) {
      eggs.forEach(function (e) { e.classList.toggle('on', !!key && e.dataset.egg === key); });
      hls.forEach(function (h) { var on = !!key && h.dataset.egg === key; h.classList.toggle('on', on); h.setAttribute('aria-pressed', on); });
      ps.forEach(function (p) { var mine = !!key && !!p.querySelector('.fx-egg.on'); p.classList.toggle('egg', mine); if (mine) ps.forEach(function (q) { q.classList.toggle('cur', q === p); }); });   // 누른 문장이 읽는 문장이 된다
    }
    var auto = '', hover = '';
    function paint() { show(pinned || hover || auto); }
    hls.forEach(function (h) {
      h.insertAdjacentHTML('beforeend', '<svg class="fx-ring" viewBox="0 0 120 50" preserveAspectRatio="none" aria-hidden="true"><path d="M9 27C10 13 34 5 63 5c29 0 50 8 49 21-1 13-25 20-54 20C30 46 8 40 9 27Z" pathLength="1"/></svg>');
      h.addEventListener('click', function () { var k = h.dataset.egg; pinned = pinned === k ? '' : k; paint(); });
      if (FINE) {
        h.addEventListener('pointerenter', function () { hover = h.dataset.egg; paint(); });
        h.addEventListener('pointerleave', function () { hover = ''; paint(); });
      }
    });
    if (ps.length < 2 || RM) return;
    /* 스크롤에 맞춰 낱말이 차례로 켜진다: 첫 낱말은 화면 70% 높이에서, 마지막 낱말은 30% 높이에서 켜지도록 기준선이 미끄러진다
       (낱말들이 64px 간격으로 붙어 있어도 한 낱말마다 150px쯤 머문다). 그림을 누르거나 올려 둔 낱말이 있으면 그쪽이 먼저다 */
    var n = hls.length;
    onScroll.push(function (vh) {
      var box = ps[0].parentNode.getBoundingClientRect();
      if (box.bottom < -200 || box.top > vh + 200) { if (pinned || auto) { pinned = ''; auto = ''; paint(); } return; }
      var best = -1, bd = 1e9;
      hls.forEach(function (h, k) { var r = h.getBoundingClientRect(), y = r.top + r.height / 2, line = vh * (0.7 - 0.4 * (n > 1 ? k / (n - 1) : 0)), d = Math.abs(y - line); if (d < bd) { bd = d; best = k; } });
      var f = hls[0].getBoundingClientRect(), l = hls[n - 1].getBoundingClientRect();
      if (f.top > vh * 0.86 || l.bottom < vh * 0.14) best = -1;            // 아직 안 왔거나 이미 지나갔다
      var key = best < 0 ? '' : hls[best].dataset.egg;
      if (key !== auto) { auto = key; pinned = ''; paint(); }
      var eg = eggs.filter(function (e) { return e.classList.contains('on'); })[0];
      if (eg) {
        var pr = eg.parentNode.getBoundingClientRect(), pc = pr.top + pr.height / 2, hh = 0;
        [].forEach.call(eg.children, function (c) { hh = Math.max(hh, c.offsetHeight); });
        var lo = Math.max(88 + hh / 2, vh * 0.36), hi = Math.min(vh - 24 - hh / 2, vh * 0.6); if (hi < lo) lo = hi = vh / 2 + 32;            // 그림은 화면 가운데 띠 안에 머문다
        eg.style.setProperty('--ey', (Math.max(lo, Math.min(hi, pc)) - pc).toFixed(1) + 'px');
      }
      if (!key) {            // 켜진 낱말이 없을 때는 가운데에 가장 가까운 문장이 읽는 문장
        var bp = 0, pd = 1e9; ps.forEach(function (q, i) { var r = q.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - vh * 0.5); if (d < pd) { pd = d; bp = i; } });
        ps.forEach(function (q, i) { q.classList.toggle('cur', i === bp); });
      }
    });
  }

  /* 아날로그: 옆으로 넘기는 캐로셀의 화살표 */
  function rail() {
    var ul = $('.fx-an .h8-an'); if (!ul) return;
    var box = document.createElement('div'); box.className = 'fx-rail-a';
    ['prev', 'next'].forEach(function (k, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'fx-cv-a'; b.setAttribute('aria-label', i ? '다음' : '이전');
      b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (i ? 'M9 5l7 7-7 7' : 'M15 5l-7 7 7 7') + '"/></svg>';
      b.addEventListener('click', function () { var li = ul.children[0], st = li ? li.getBoundingClientRect().width + 16 : 320; ul.scrollBy({ left: (i ? 1 : -1) * st, behavior: RM ? 'auto' : 'smooth' }); });
      box.appendChild(b);
    });
    ul.parentNode.insertBefore(box, ul.nextSibling);
  }

  /* 위젯 모음: 부채꼴 캐로셀 — 가운데가 크고 양옆은 작아지며 아래로 휜다.
     천천히 한 칸씩 넘어가고, 가운데에 온 위젯은 크기가 한 번 바뀐다. 끌기 · 옆 위젯 누르기 · 화살표로 넘긴다 */
  function belt() {
    var ul = $('#h8Shelf'); if (!ul) return;
    var lis = [].slice.call(ul.children), n = lis.length; if (n < 5) return;
    ul.classList.add('fx-cv'); ul.setAttribute('role', 'group'); ul.setAttribute('aria-roledescription', '캐로셀'); ul.setAttribute('aria-label', '위젯 모음');
    var pos = Math.floor(n / 2), tm = 0, rt = 0, live = false, hold = false, drag = null, moved = false, cap = $('#fxCvCap');
    function sp() { return Math.max(118, Math.min(230, ul.clientWidth * 0.155)); }
    function wrap(d) { return ((d + n / 2) % n + n) % n - n / 2; }
    function render(anim) {
      var s = sp(); if (ul.scrollLeft) ul.scrollLeft = 0;
      lis.forEach(function (li, i) {
        var d = wrap(i - pos), ad = Math.abs(d), jump = li._d != null && Math.abs(d - li._d) > n / 2;
        li.style.transition = !anim || jump ? 'none' : '';
        li._d = d;
        li.style.transform = 'translate3d(' + (d * s * (1 - Math.min(ad, 5) * 0.04)).toFixed(1) + 'px,' + (ad * ad * 11).toFixed(1) + 'px,0) rotate(' + (d * 5.5).toFixed(2) + 'deg) scale(' + Math.max(0.58, 1.3 - ad * 0.24).toFixed(3) + ')';
        li.style.opacity = ad > 3.7 ? 0 : ad > 2.7 ? (3.7 - ad).toFixed(2) : 1;
        li.style.zIndex = 100 - Math.round(ad * 10);
        li.classList.toggle('mid', ad < 0.5);
        if (ad < 0.5 && cap && cap._k !== i) { cap._k = i; var nb = $('.h8-wc-t b', li), ns = $('.h8-wc-t span', li); $('b', cap).textContent = nb ? nb.firstChild.textContent : ''; $('span', cap).textContent = ns ? ns.textContent : ''; }
        var bt = $('button', li); if (bt) bt.tabIndex = ad < 0.5 ? 0 : -1;
      });
    }
    function pulse() {            // 가운데에 온 위젯은 다음 크기로 한 번 바뀐다
      clearTimeout(rt); if (RM) return;
      rt = setTimeout(function () { var li = lis[((Math.round(pos) % n) + n) % n], bt = li && $('button', li); if (bt && !drag) { li._auto = true; bt.click(); li._auto = false; } }, 820);
    }
    function go(to) { pos = Math.round(to); render(true); pulse(); }
    function auto() { clearInterval(tm); tm = 0; if (RM || !live || hold) return; tm = setInterval(function () { go(pos + 1); }, 2800); }
    lis.forEach(function (li, i) {
      li.addEventListener('click', function (e) {            // 옆에 있는 위젯을 누르면 가운데로 온다 (크기 바꾸기는 가운데 위젯만)
        if (moved) { e.stopPropagation(); e.preventDefault(); return; }
        var d = wrap(i - pos); if (Math.abs(d) < 0.5) return;
        e.stopPropagation(); e.preventDefault(); go(pos + Math.round(d)); auto();
      }, true);
    });
    var abox = document.createElement('div'); abox.className = 'fx-rail-a'; ul.parentNode.insertBefore(abox, (cap || ul).nextSibling);
    ['prev', 'next'].forEach(function (k, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'fx-cv-a ' + k; b.setAttribute('aria-label', i ? '다음 위젯' : '이전 위젯');
      b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (i ? 'M9 5l7 7-7 7' : 'M15 5l-7 7 7 7') + '"/></svg>';
      b.addEventListener('click', function () { go(pos + (i ? 1 : -1)); auto(); });
      abox.appendChild(b);
    });
    ul.addEventListener('pointerdown', function (e) { if (e.button) return; drag = { x: e.clientX, p: pos }; moved = false; });
    addEventListener('pointermove', function (e) {
      if (!drag) return; var dx = e.clientX - drag.x; if (!moved && Math.abs(dx) < 7) return;
      moved = true; hold = true; clearInterval(tm); tm = 0; pos = drag.p - dx / sp(); render(false);
    });
    ['pointerup', 'pointercancel'].forEach(function (nm) { addEventListener(nm, function () {
      if (!drag) return; drag = null; if (moved) { go(pos); setTimeout(function () { moved = false; }, 60); } hold = false; auto();
    }); });
    ul.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); go(pos + (e.key === 'ArrowRight' ? 1 : -1)); auto(); } });
    if (FINE) { ul.addEventListener('pointerenter', function () { hold = true; auto(); }); ul.addEventListener('pointerleave', function () { if (!drag) { hold = false; auto(); } }); }
    addEventListener('resize', function () { render(false); });
    render(false);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { live = es[0].isIntersecting; auto(); }, { threshold: 0.35 }).observe(ul);
  }

  /* ── 7) 아날로그: 뒤에 깔리는 카드는 조금 작아진다 ── */
  function analog() {
    var cards = $$('.fx-an .h8-an > li'); if (!cards.length) return;
    cards.forEach(function (c, i) { c.style.setProperty('--n', i); });
    if (RM) return;
    var wide = window.matchMedia('(min-width: 1100px)');
    onScroll.push(function (vh) {
      if (!wide.matches) { cards.forEach(function (c) { c.style.removeProperty('--sc'); }); return; }
      var box = cards[0].parentNode.getBoundingClientRect(); if (box.bottom < 0 || box.top > vh) return;
      var rs = cards.map(function (c) { return c.getBoundingClientRect(); });
      cards.forEach(function (c, i) {
        var cover = 0;
        for (var k = i + 1; k < cards.length; k++) cover += clamp(1 - (rs[k].top - rs[i].top - 16 * (k - i)) / rs[i].height);
        c.style.setProperty('--sc', (1 - Math.min(cover, 4) * 0.03).toFixed(4));
      });
    });
  }

  /* v8.5: 처음 화면 기울기 · 글자 밝아짐 · 흐르는 위젯 띠 · 쌓이는 카드는 쓰지 않는다 (함수는 남겨 둠) */
  [lines, shots, belt, manifesto, rail].forEach(function (fn) {
    try { fn(); } catch (e) { if (window.console) console.error('[v8 fx]', fn.name, e); }
  });
  req();
})();
