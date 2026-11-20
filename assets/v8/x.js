/* ditto.place v8.10 — 홈 장면 덧붙임 (2026-11-14)
   위젯 타일과 상세 · 디토 다섯 명 확산 · 섬 메뉴 · 글자가 뜻대로 움직이는 선언문 · 스티커 띠 · 디자인 시스템 · 프로필 월 · 초대장 장치
   새 클래스는 전부 x- 로 시작한다 (옛 스타일의 짧은 이름과 겹치지 않게). */
(function () {
  'use strict';
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var P = window.DITTO_PLATTERS || {}, DW = window.DittoWidgets;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return [].slice.call((el || document).querySelectorAll(s)); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  function ga(name, params) { try { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); } catch (e) {} }   // Google 애널리틱스 이벤트 (개인정보는 보내지 않는다)
  /* 서버(Supabase) 함수 부르기 — 공개(publishable) 키. 함수가 아직 없으면(운영 미적용) 거절되고, 화면은 예전 방식으로 남는다 */
  var SB = 'https://lisqekczixwzshmpewzq.supabase.co', SBKEY = 'sb_publishable_wZhXPAWXra62J60VkWJlhQ_2OPv-Zpf';
  function rpc(fn, body) {
    return fetch(SB + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: SBKEY, Authorization: 'Bearer ' + SBKEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) })
      .then(function (r) { return r.json().catch(function () { return null; }).then(function (d) { if (!r.ok) { var er = new Error((d && d.message) || String(r.status)); er.code = d && d.code; er.status = r.status; throw er; } return d; }); });
  }
  function seen(el, fn, th) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { fn(); return; }
    new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { o.disconnect(); fn(); } }, { threshold: th == null ? 0.25 : th }).observe(el);
  }
  function visible(el, fn) {
    if (!('IntersectionObserver' in window)) { fn(true); return; }
    new IntersectionObserver(function (es) { fn(es[0].isIntersecting); }, { threshold: 0.02 }).observe(el);
  }
  function cq(px) { return (px / 358 * 100).toFixed(3) + 'cqw'; }
  function centre(box, s, cx, cy) {
    var w = s.w * 45.75 - 8, h = s.h * 45.75 - 8;
    box.style.left = cq(cx - w / 2); box.style.top = cq(cy - h / 2); box.style.width = cq(w); box.style.height = cq(h);
  }
  function chars(el, text, cls) {            // 글자 하나씩 감싼다 (빈칸은 그대로)
    var out = [];
    Array.from(text).forEach(function (ch) {
      if (ch === ' ' || ch === ' ') { el.appendChild(document.createTextNode(ch)); return; }
      var c = document.createElement('span'); c.className = cls; c.textContent = ch; c.style.setProperty('--i', out.length); el.appendChild(c); out.push(c);
    });
    return out;
  }

  /* ── 위젯 모음: 같은 규격의 타일 → 누르면 자세히. 그 뒤에 곧 나올 위젯은 흐릿한 타일로 ──
     상세의 움직임: 누른 타일에서 위젯이 날아와 커지고(열기) · 크기를 고르면 앞 모양이 다음 모양으로 녹아들고(비율) · 이전/다음은 옆으로 밀려 바뀐다 */
  function widgets() {
    var ul = $('#xWg'), dlg = $('#xWd'); if (!ul || !dlg || !DW || !DW.catalog) return;
    var stage = $('#xWdSt'), card = $('.x-wd-in', dlg), text = $('.x-wd-t', dlg), nameEl = $('#xWdN'), descEl = $('#xWdD'), cntEl = $('#xWdC'), szEl = $('#xWdSz');
    var cur = 0, k = 0, wrap = null, busy = false, EASE = 'cubic-bezier(.32,.72,0,1)', can = !RM && !!document.body.animate;
    var captureRoot = '/assets/cast/widgets/build65/';
    var nativeWidgets = [
      {kind:'ask', name:'Ask', desc:'친구에게 질문을 받아요', defaultSize:{w:3,h:4}},
      {kind:'collection', name:'취향 콜렉션', desc:'앨범·영화·책 내 Top 10을 꽂아 둬요', defaultSize:{w:4,h:4}},
      {kind:'qna', name:'연말 문답', desc:'D-50부터 하루 한 문답으로 올해의 나를 모아요', defaultSize:{w:4,h:4}}
    ];
    // Build 65 uses the same twelve service sizes as the image widget.
    var serviceSizes = DW.catalog.find(function (item) { return item.kind === 'image'; }).sizes;
    nativeWidgets.forEach(function (item) { item.sizes = serviceSizes; item.nativePreview = true; });
    function capture(item, size, extent) {
      var img = document.createElement('img');
      img.src = captureRoot + item.kind + '-' + size.w + 'x' + size.h + '.webp?v=examples2';
      // Reserve the native tile's ratio before the image decodes, including during the opening animation.
      img.width = Math.round((size.w * 45.75 - 8) * 4);
      img.height = Math.round((size.h * 45.75 - 8) * 4);
      var longest = Math.max(img.width, img.height);
      img.style.setProperty('--tile-width', extent * img.width / longest + '%');
      img.style.setProperty('--tile-height', extent * img.height / longest + '%');
      img.alt = item.name + ' ' + size.w + '×' + size.h;
      return img;
    }
    var items = DW.catalog.concat(nativeWidgets).map(function (c, idx) {
      var sizes = c.sizes;
      var base = c.defaultSize;
      var li = document.createElement('li'), b = document.createElement('button'); b.type = 'button'; b.className = 'x-wg-t';
      b.innerHTML = '<span class="x-wg-st"><span class="dpl"></span></span><b></b>';
      $('b', b).textContent = c.name; b.setAttribute('aria-label', c.name + ' 위젯 자세히 보기');
      var box;
      if (c.nativePreview) {
        box = capture(c, base, 82); box.loading = 'lazy';
        box.className = 'x-native-preview';
        $('.dpl', b).replaceWith(box);
      } else {
        var wd = { id: 'xw-' + c.kind, kind: c.kind, x: 0, y: 0, w: base.w, h: base.h, data: clone(c.sample || {}) };
        box = DW.box(wd);
        $('.dpl', b).appendChild(box); DW.applyBox(box, wd); DW.update(box.firstElementChild, wd); centre(box, base, 179, 179);
      }
      b.addEventListener('click', function () { if (li.classList.contains('mid') || !ul.classList.contains('x-fan')) open(idx, box); });
      li.dataset.n = c.name; li.dataset.d = c.desc; li.appendChild(b); ul.appendChild(li);
      return { c: c, sizes: sizes, base: base };
    });
    var upcoming = [
      ['diary', '한줄일기'], ['bucket', '버킷리스트'],
      ['secret', '비밀게시글'], ['paparazzi', '파파라치']
    ];
    upcoming.forEach(function (entry) {
      var li = document.createElement('li'); li.className = 'soon';
      li.dataset.n = entry[1]; li.dataset.d = '곧 오픈 예정';
      li.innerHTML = '<div class="x-wg-t"><span class="x-wg-st"><em>곧 오픈 예정</em></span><b></b></div>';
      $('b', li).textContent = entry[1];
      var art = document.createElement('img');
      art.alt = '';
      art.loading = 'lazy';
      art.src = '/assets/cast/widgets/soon/' + entry[0] + '.webp?v=native7';
      $('.x-wg-st', li).prepend(art);
      ul.appendChild(li);
    });
    var n = items.length;
    function make(it, s) {            // 그 크기의 위젯 한 장 (어떤 크기든 무대를 비슷하게 채운다)
      var w = document.createElement('span'); w.className = 'x-wd-w';
      if (it.c.nativePreview) {
        var art = capture(it.c, s, 76);
        art.className = 'x-native-detail'; art.loading = 'eager';
        w.appendChild(art); w._box = art;
        return w;
      }
      var d = document.createElement('span'); d.className = 'dpl'; d.style.width = (358 / Math.max(s.w * 45.75 - 8, s.h * 45.75 - 8) * 76).toFixed(1) + '%'; w.appendChild(d);
      var wd = { id: 'xwd-' + it.c.kind + s.w + s.h, kind: it.c.kind, x: 0, y: 0, w: s.w, h: s.h, data: clone(it.c.sample || {}) }, box = DW.box(wd);
      d.appendChild(box); DW.applyBox(box, wd); DW.update(box.firstElementChild, wd); centre(box, s, 179, 179); w._box = box;
      return w;
    }
    function chips() { $$('button', szEl).forEach(function (b, i) { b.setAttribute('aria-pressed', i === k); }); }
    function swap(nw, how, dir) {            // how: 'morph' 비율이 바뀜 · 'slide' 다른 위젯 · 'none'
      var old = wrap; wrap = nw; stage.appendChild(nw);
      if (!old) return; if (!can || how === 'none') { old.remove(); return; }
      var a = old._box.getBoundingClientRect(), b = nw._box.getBoundingClientRect();
      if (how === 'morph') {
        old.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(' + (b.width / a.width).toFixed(3) + ',' + (b.height / a.height).toFixed(3) + ')' }], { duration: 300, easing: EASE, fill: 'forwards' }).finished.then(function () { old.remove(); });
        nw.animate([{ opacity: 0, transform: 'scale(' + (a.width / b.width).toFixed(3) + ',' + (a.height / b.height).toFixed(3) + ')' }, { opacity: 1, transform: 'none', offset: 0.7 }, { opacity: 1, transform: 'none' }], { duration: 460, easing: EASE });
      } else {
        old.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(' + (-dir * 46) + 'px) scale(.94)' }], { duration: 220, easing: 'ease-in', fill: 'forwards' }).finished.then(function () { old.remove(); });
        nw.animate([{ opacity: 0, transform: 'translateX(' + (dir * 56) + 'px) scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: EASE, delay: 90, fill: 'backwards' });
        text.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: EASE, delay: 80, fill: 'backwards' });
      }
    }
    function fill(i) {
      cur = (i % n + n) % n; var it = items[cur];
      var sample = it.c.sample || {}, link = $('#xWdLink');
      nameEl.textContent = it.c.name;
      descEl.textContent = it.c.desc;
      var youtubeMusic = it.c.kind === 'music' && /^https:\/\/music\.youtube\.com\//.test(sample.url || '');
      var target = youtubeMusic ? sample.url : sample.ytId ? 'https://www.youtube.com/watch?v=' + sample.ytId : sample.sourceURL || (it.c.kind === 'social' ? sample.url : '');
      link.hidden = !target;
      if (target) {
        link.href = target; link.target = '_blank'; link.rel = 'noopener noreferrer';
        link.textContent = youtubeMusic ? 'YouTube Music에서 듣기' : sample.ytId ? 'YouTube에서 보기' : sample.sourceURL ? (sample.creator ? sample.creator + ' · ' : '') + '짤 원본 보기' : sample.label + ' 인스타그램 보기';
      } else link.removeAttribute('href');
      cntEl.textContent = it.sizes.length + '가지';
      k = 0; it.sizes.forEach(function (s, q) { if (s.w === it.base.w && s.h === it.base.h) k = q; });
      szEl.innerHTML = '';
      it.sizes.forEach(function (s, q) {
        var b = document.createElement('button'); b.type = 'button'; b.innerHTML = '<i style="aspect-ratio:' + s.w + '/' + s.h + ';' + (s.w >= s.h ? 'width:22px' : 'height:22px') + '"></i>' + s.w + '×' + s.h;
        b.setAttribute('aria-label', '가로 ' + s.w + '칸, 세로 ' + s.h + '칸');
        b.addEventListener('click', function () { if (q === k) return; k = q; chips(); swap(make(items[cur], items[cur].sizes[k]), 'morph'); });
        szEl.appendChild(b);
      });
      chips(); return it;
    }
    function open(i, from) {            // 누른 타일의 위젯이 그대로 날아와 커진다
      if (busy) return; var it = fill(i); if (wrap) { wrap.remove(); wrap = null; }
      dlg.classList.remove('closing'); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      swap(make(it, it.sizes[k]), 'none');
      if (!can || !from) return;
      var a = from.getBoundingClientRect(), b = wrap._box.getBoundingClientRect();
      stage.classList.add('fly');
      card.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: EASE });
      wrap.animate([{ transform: 'translate(' + (a.left + a.width / 2 - b.left - b.width / 2).toFixed(1) + 'px,' + (a.top + a.height / 2 - b.top - b.height / 2).toFixed(1) + 'px) scale(' + (a.width / b.width).toFixed(3) + ')' }, { transform: 'none' }], { duration: 480, easing: EASE }).finished.then(function () { stage.classList.remove('fly'); });
      text.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: EASE, delay: 120, fill: 'backwards' });
    }
    function go(d) { var it = fill(cur + d); swap(make(it, it.sizes[k]), 'slide', d); }
    function close() {
      if (!dlg.open || busy) return; if (!can) { dlg.close(); return; }
      busy = true; dlg.classList.add('closing');
      card.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.97) translateY(8px)' }], { duration: 200, easing: 'ease-in', fill: 'forwards' }).finished.then(function (an) { dlg.close(); an.cancel(); dlg.classList.remove('closing'); busy = false; });
    }
    stage.addEventListener('click', function () { var ss = items[cur].sizes; k = (k + 1) % ss.length; chips(); swap(make(items[cur], ss[k]), 'morph'); });
    $('#xWdX').addEventListener('click', close);
    $('#xWdP').addEventListener('click', function () { go(-1); });
    $('#xWdQ').addEventListener('click', function () { go(1); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    dlg.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1); });
    fan(ul);
  }
  /* 위젯 진열 (wabi식): 가운데가 크고 양옆은 작아지며 아래로 휜다. 천천히 한 칸씩 넘어가고, 끌기 · 옆 위젯 누르기 · 화살표로 넘긴다.
     타일은 모두 같은 규격이라 깨지지 않는다. 가운데 위젯을 누르면 상세가 열린다 */
  function fan(ul) {
    var lis = [].slice.call(ul.children), n = lis.length; if (n < 5) return;
    ul.classList.add('x-fan'); ul.setAttribute('role', 'group'); ul.setAttribute('aria-roledescription', '캐로셀'); ul.setAttribute('aria-label', '위젯 모음');
    var cap = $('#xFanCap'), pos = Math.min(11, n - 1), tm = 0, live = false, hold = false, drag = null, moved = false;            // 이미지 위젯에서 시작
    function sp() { return Math.max(112, Math.min(220, ul.clientWidth * 0.15)); }
    function wrap(d) { return ((d + n / 2) % n + n) % n - n / 2; }
    function render(anim) {
      var s = sp();
      lis.forEach(function (li, i) {
        var d = wrap(i - pos), ad = Math.abs(d), jump = li._d != null && Math.abs(d - li._d) > n / 2;
        li.style.transition = !anim || jump ? 'none' : ''; li._d = d;
        li.style.transform = 'translate(-50%,-50%) translate3d(' + (d * s * (1 - Math.min(ad, 5) * 0.035)).toFixed(1) + 'px,' + (ad * ad * 10).toFixed(1) + 'px,0) rotate(' + (d * 5).toFixed(2) + 'deg) scale(' + (1.22 * Math.max(0.88, 1 - ad * 0.04)).toFixed(3) + ')';
        li.style.opacity = ad > 3.8 ? 0 : ad > 2.8 ? (3.8 - ad).toFixed(2) : 1; li.style.zIndex = 100 - Math.round(ad * 10);
        var mid = ad < 0.5; li.classList.toggle('mid', mid);
        if (mid && cap && cap._k !== i) { cap._k = i; $('b', cap).textContent = li.dataset.n || ''; $('span', cap).textContent = li.dataset.d || ''; }
        var bt = $('button', li); if (bt) bt.tabIndex = mid ? 0 : -1;
      });
    }
    function go(to) { pos = Math.round(to); render(true); }
    function auto() { clearInterval(tm); tm = 0; if (RM || !live || hold) return; tm = setInterval(function () { if (!$('#xWd').open) go(pos + 1); }, 2800); }
    lis.forEach(function (li, i) { li.addEventListener('click', function (e) {
      if (moved) { e.stopPropagation(); e.preventDefault(); return; }
      var d = wrap(i - pos); if (Math.abs(d) < 0.5) return; e.stopPropagation(); e.preventDefault(); go(pos + Math.round(d)); auto();
    }, true); });
    var box = document.createElement('div'); box.className = 'x-fan-a'; (cap || ul).parentNode.insertBefore(box, (cap || ul).nextSibling);
    ['이전 위젯', '다음 위젯'].forEach(function (lb, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'fx-cv-a'; b.setAttribute('aria-label', lb);
      b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (i ? 'M9 5l7 7-7 7' : 'M15 5l-7 7 7 7') + '"/></svg>';
      b.addEventListener('click', function () { go(pos + (i ? 1 : -1)); auto(); }); box.appendChild(b);
    });
    ul.addEventListener('pointerdown', function (e) { if (e.button) return; drag = { x: e.clientX, p: pos }; moved = false; });
    addEventListener('pointermove', function (e) { if (!drag) return; var dx = e.clientX - drag.x; if (!moved && Math.abs(dx) < 7) return; moved = true; hold = true; clearInterval(tm); tm = 0; pos = drag.p - dx / sp(); render(false); });
    ['pointerup', 'pointercancel'].forEach(function (nm) { addEventListener(nm, function () { if (!drag) return; drag = null; if (moved) { go(pos); setTimeout(function () { moved = false; }, 60); } hold = false; auto(); }); });
    ul.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); go(pos + (e.key === 'ArrowRight' ? 1 : -1)); auto(); } });
    if (FINE) { ul.addEventListener('pointerenter', function () { hold = true; auto(); }); ul.addEventListener('pointerleave', function () { if (!drag) { hold = false; auto(); } }); }
    addEventListener('resize', function () { render(false); });
    render(false);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { live = es[0].isIntersecting; auto(); }, { threshold: 0.35 }).observe(ul);
  }

  /* ── 디토 지도 v2 (11-21): 태율이 올린 단체 사진 한 장. 같이 찍힌 친구들이 하나씩 디토해 간다.
     친구(봄 · 서리)는 태율의 플래터에서, 친구의 친구(누리 · 결 · 이안)는 그룹 채팅에 올라온 카드에서 디토한다.
     디토할 때마다 태율에게 알림이 가고, 처음 보는 사람이면 둘 사이에 새 선이 생긴다 (디토로 새로 이어진 사이) ── */
  function ditto() {
    var root = $('#xDm'), st = $('#xDmSt'), svg = $('#xDmLn'); if (!root || !st || !svg) return;
    var src = $('.x-dm-src', st), ph = $('.x-dm-ph', src), ps = $$('.x-dm-ps > li', st), go = $('#xDmGo'), sayEl = $('#xDmSay'), cnt = $('#xDmCnt'), whoEl = $('#xDmWho');
    var NS = 'http://www.w3.org/2000/svg', SAY0 = sayEl.innerHTML, gen = 0, step = 0, timer = 0, onScreen = false, busy = false;
    var from = ps.map(function (li) { return li.dataset.from === 'src' ? -1 : +li.dataset.from; });
    /* 선: 친구 선(실선) · 친구의 친구 선(점선) · 새로 이어진 선(보라 점선, 처음엔 숨김) */
    var base = ps.map(function (li, i) { var p = document.createElementNS(NS, 'path'); p.setAttribute('class', from[i] < 0 ? 'f' : 'g'); svg.appendChild(p); return p; });
    var lit = ps.map(function () { var p = document.createElementNS(NS, 'path'); p.setAttribute('class', 'a'); p.setAttribute('pathLength', '1'); svg.appendChild(p); return p; });
    var nw = ps.map(function (li) { if (li.dataset.fof !== '1') return null; var p = document.createElementNS(NS, 'path'); p.setAttribute('class', 'n'); p.setAttribute('pathLength', '1'); svg.appendChild(p); return p; });
    var curves = [];
    function at(el) { var R = st.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - R.left + r.width / 2, y: r.top - R.top + r.height / 2, r: r }; }
    function d(a, b, bend) {
      var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y, k = bend || 0;
      var cx = mx - dy * k, cy = my + dx * k;
      return { s: 'M' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1), a: a, b: b, c: { x: cx, y: cy } };
    }
    function layout() {
      var R = st.getBoundingClientRect(); if (!R.width) return;
      svg.setAttribute('viewBox', '0 0 ' + R.width.toFixed(0) + ' ' + R.height.toFixed(0));
      var S = at(ph); S.y = S.r.bottom - R.top - 6;
      var A = ps.map(function (li) { return at($('.x-dm-av', li)); });
      curves = ps.map(function (li, i) {
        var a = from[i] < 0 ? S : A[from[i]], b = A[i], c = d(a, b, from[i] < 0 ? (b.x < a.x ? -0.12 : 0.12) : 0);
        base[i].setAttribute('d', c.s); lit[i].setAttribute('d', c.s);
        if (nw[i]) { var top = at(src); top = { x: S.x + (A[i].x < S.x ? -40 : 40), y: S.r.top - R.top + S.r.height * 0.5 }; var n = d(A[i], top, A[i].x < S.x ? 0.22 : -0.22); nw[i].setAttribute('d', n.s); }
        return c;
      });
    }
    function q(c, t) { var u = 1 - t; return { x: u * u * c.a.x + 2 * u * t * c.c.x + t * t * c.b.x, y: u * u * c.a.y + 2 * u * t * c.c.y + t * t * c.b.y }; }
    /* 사진 사본이 선을 따라 날아간다 (친구의 친구는 친구를 거쳐서) */
    function fly(i) {
      var chain = from[i] < 0 ? [i] : [from[i], i], g0 = gen;
      if (RM) return Promise.resolve();
      var dot = document.createElement('span'); dot.className = 'x-dm-fly'; dot.style.backgroundImage = 'url("/assets/cast/scenes/rooftop-group.webp")'; st.appendChild(dot);
      return new Promise(function (res) {
        var t0 = performance.now(), D = 700;
        (function f(now) {
          if (g0 !== gen) { dot.remove(); return res(); }
          var all = (now - t0) / D, k = Math.min(chain.length - 1, Math.floor(all)), t = clamp(all - k), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, p = q(curves[chain[k]], e);
          dot.style.transform = 'translate(' + (p.x - 18).toFixed(1) + 'px,' + (p.y - 14).toFixed(1) + 'px)';
          if (all < chain.length) requestAnimationFrame(f); else { dot.remove(); res(); }
        })(t0);
      });
    }
    function say(a, b) { sayEl.innerHTML = a + '<span></span>'; $('span', sayEl).textContent = b; sayEl.classList.remove('sw'); void sayEl.offsetWidth; sayEl.classList.add('sw'); }
    function next() {
      if (busy || step >= ps.length) return; busy = true;
      var i = step, li = ps[i], g0 = gen; step++;
      src.classList.add('ping'); setTimeout(function () { src.classList.remove('ping'); }, 500);
      if (from[i] >= 0) lit[from[i]].classList.add('on');
      lit[i].classList.add('run');
      fly(i).then(function () {
        if (g0 !== gen) return;
        lit[i].classList.add('on'); li.classList.add('has');
        var im = document.createElement('img'); im.src = $('.x-dm-av img', li).getAttribute('src'); im.alt = ''; whoEl.insertBefore(im, whoEl.firstChild);
        cnt.textContent = '디토 ' + (i + 1); root.dataset.n = i + 1;
        if (li.dataset.fof === '1') {
          say('<b>' + li.dataset.n + '</b>' + (/[가-힣]/.test(li.dataset.n.slice(-1)) && (li.dataset.n.slice(-1).charCodeAt(0) - 44032) % 28 ? '이 ' : '가 ') + li.dataset.via + ' 디토했어요.', '태율과는 처음이지만, 이제 서로를 알아요.');
          setTimeout(function () { if (g0 === gen && nw[i]) { nw[i].classList.add('on'); li.classList.add('new'); } }, RM ? 0 : 380);
        } else say('<b>' + li.dataset.n + '</b>' + ((li.dataset.n.slice(-1).charCodeAt(0) - 44032) % 28 ? '이 ' : '가 ') + li.dataset.via + ' 디토했어요.', '출처는 태율로 남고, 태율은 누가 가져갔는지 알아요.');
        busy = false;
        if (step >= ps.length) { setTimeout(function () { if (g0 === gen) { say('사진 한 장으로 <b>다섯 명</b>이 같은 순간을 간직해요.', '태율은 친구 둘, 그리고 새로운 사람 셋과 이어졌어요.'); root.classList.add('done'); } }, RM ? 0 : 1600); }
        else schedule(RM ? 1800 : 1500);
      });
    }
    function schedule(ms) { clearTimeout(timer); if (onScreen && !document.hidden && step < ps.length) timer = setTimeout(next, ms); }
    function reset() {
      gen++; clearTimeout(timer); busy = false; step = 0; root.dataset.n = 0; root.classList.remove('done');
      ps.forEach(function (li) { li.classList.remove('has', 'new'); });
      lit.concat(nw).forEach(function (p) { if (p) p.classList.remove('on', 'run'); });
      $$('.x-dm-fly', st).forEach(function (x) { x.remove(); }); whoEl.textContent = ''; cnt.textContent = '디토 0'; sayEl.innerHTML = SAY0;
    }
    go.addEventListener('click', function () { if (step >= ps.length) { reset(); schedule(400); return; } clearTimeout(timer); next(); });
    $('#xDmRe').addEventListener('click', function () { reset(); schedule(500); });
    addEventListener('resize', layout); layout();
    var im0 = $('img', ph); if (im0 && !im0.complete) im0.addEventListener('load', layout);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; if (onScreen) { layout(); schedule(step ? 900 : 1200); } else clearTimeout(timer); }, { threshold: 0.4 }).observe(st);
    else { onScreen = true; schedule(1200); }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) schedule(900); });
  }

  /* ── 섬 메뉴: 알약이 아래로 길어지고, 넓어지고, 그다음 메뉴가 들어온다. 닫을 때는 거꾸로 ── */
  function island() {
    var box = $('#xIsl'), btn = $('#xIslT'), label = $('#xIslL'), panel = $('#xIslP'); if (!box || !btn || !panel) return;
    var links = $$('a', panel), pic = $('.x-isl-pic', panel), glyph = $('path', btn), open = false, tm = 0, gh = 0, gw = 0, graf = 0;
    function gpath(hp, wp) {            // 버튼 속 그림은 상자의 모양을 그대로 따라 한다
      var w = 16 + 4 * wp, h = 10 + 10 * hp, x = (22 - w) / 2, y = (22 - h) / 2, t = (hp + wp) / 2, r = Math.min(w, h) / 2 - t * 2.4, c = r * (0.55 + 0.3 * t);
      return 'M' + (x + r) + ' ' + y + 'H' + (x + w - r) + 'C' + (x + w - r + c) + ' ' + y + ' ' + (x + w) + ' ' + (y + r - c) + ' ' + (x + w) + ' ' + (y + r) + 'V' + (y + h - r)
        + 'C' + (x + w) + ' ' + (y + h - r + c) + ' ' + (x + w - r + c) + ' ' + (y + h) + ' ' + (x + w - r) + ' ' + (y + h) + 'H' + (x + r) + 'C' + (x + r - c) + ' ' + (y + h) + ' ' + x + ' ' + (y + h - r + c) + ' ' + x + ' ' + (y + h - r)
        + 'V' + (y + r) + 'C' + x + ' ' + (y + r - c) + ' ' + (x + r - c) + ' ' + y + ' ' + (x + r) + ' ' + y + 'Z';
    }
    function tween() {
      cancelAnimationFrame(graf); var t0 = performance.now(), h0 = gh, w0 = gw, to = open ? 1 : 0, dh = RM ? 0 : open ? 0 : 450, dw = RM ? 0 : open ? 250 : 200, D = RM ? 1 : 360;
      var ez = function (x) { x = clamp(x); return x * x * (3 - 2 * x); };
      (function f(now) { var e = now - t0; gh = h0 + (to - h0) * ez((e - dh) / D); gw = w0 + (to - w0) * ez((e - dw) / D); glyph.setAttribute('d', gpath(gh, gw)); if (e < Math.max(dh, dw) + D) graf = requestAnimationFrame(f); })(t0);
    }
    function name() { var a = links.filter(function (l) { return l.getAttribute('aria-current') === 'true'; })[0]; return a ? a.firstChild.textContent : '메뉴'; }
    function preview(a) {
      if (!a || !pic) return;
      links.forEach(function (link) { link.classList.toggle('hot', link === a); });
      var im = $('img', pic);
      if (!im || im.getAttribute('src') === a.dataset.img) return;
      $('source', pic).srcset = a.dataset.img.replace('.webp', '-narrow.webp');
      im.src = a.dataset.img;
      if (!RM && im.animate) im.animate([{opacity:0.55},{opacity:1}], {duration:150});
    }
    function set(v) {
      if (open === v) return;
      if (v) preview(links.find(function (a) { return a.getAttribute('aria-current') === 'true'; }) || links[0]);
      open = v; box.classList.toggle('open', v); btn.setAttribute('aria-expanded', v); panel.inert = !v;
      clearTimeout(tm); tm = setTimeout(function () { label.textContent = open ? '닫기' : name(); }, RM ? 0 : open ? 250 : 620); tween();
    }
    links.forEach(function (a, i) {
      a.style.setProperty('--i', i);
      a.insertAdjacentHTML('beforeend', '<i lang="en">' + (a.dataset.e || '') + '</i>');
      a.addEventListener('pointerenter', function () { if (open) preview(a); });
      a.addEventListener('focus', function () { if (open) preview(a); });
      a.addEventListener('click', function () { set(false); });
    });
    btn.addEventListener('click', function () { set(!open); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) { set(false); btn.focus(); } });
    document.addEventListener('pointerdown', function (e) { if (open && !box.contains(e.target)) set(false); });
    var tick = false; addEventListener('scroll', function () { if (tick) return; tick = true; requestAnimationFrame(function () { tick = false; if (!open) { var n = name(); if (label.textContent !== n) label.textContent = n; } }); }, { passive: true });
    panel.inert = true; glyph.setAttribute('d', gpath(0, 0));
  }

  /* ── 선언문 끝: "만들고, 담고, 연결되고, 대화해 봐요." 낱말이 제 뜻대로 움직인다 (올리거나 누르면 그 낱말이 다시 움직인다) ── */
  function warp() {
    var h = $('#h8-three h2'); if (!h) return;
    var W = [['만들고,', 'build'], ['담고,', 'hold'], null, ['연결되고,', 'link'], ['대화해 봐요.', 'talk']];
    h.setAttribute('aria-label', '만들고, 담고, 연결되고, 대화해 봐요.'); h.innerHTML = ''; h.classList.add('x-wp');
    var ws = [], all = [];
    W.forEach(function (w, i) {
      if (!w) { h.appendChild(document.createElement('br')); return; }
      var b = document.createElement('button'); b.type = 'button'; b.className = 'x-wp-w'; b.dataset.v = w[1]; b.setAttribute('aria-hidden', 'true'); b.tabIndex = -1;
      var cs = chars(b, w[0], 'x-wp-c'), mid = (cs.length - 1) / 2; cs.forEach(function (c, j) { c.style.setProperty('--d', (j - mid).toFixed(2)); all.push(c); });
      h.appendChild(b); if (i !== 1 && i !== 4) h.appendChild(document.createTextNode(' ')); ws.push(b);
    });
    if (RM) { $$('#xFour > li').forEach(function (c) { c.classList.add('on'); }); return; }
    var at = -1, tm = 0, live = false, held = 0;
    var cards = [], KEYS = ['build', 'hold', 'link', 'talk'], orb = $('#xOrb');
    function act(i) { at = i; ws.forEach(function (w, j) { w.classList.remove('go'); if (j === i) { void w.offsetWidth; w.classList.add('go'); } }); if (orb) orb.dataset.v = KEYS[i]; }
    var led = !!$('#xCov');
    window.__dittoWord = function (v) { var i = KEYS.indexOf(v); if (i >= 0 && i !== at && live && Date.now() >= held) act(i); };
    function loop() { clearInterval(tm); tm = 0; if (!live || led) return; tm = setInterval(function () { if (Date.now() < held) return; act((at + 1) % ws.length); }, 1700); }
    ws.forEach(function (w, i) {
      var fire = function () { held = Date.now() + 2600; act(i); };
      w.addEventListener('click', fire); if (FINE) w.addEventListener('pointerenter', fire);
    });
    cards.forEach(function (c, i) { var fire = function () { held = Date.now() + 2600; if (at !== i) act(i); }; c.addEventListener('pointerenter', fire); c.addEventListener('focusin', fire); });
    wind(h, all);
    visible(h, function (v) { live = v; if (v && at < 0 && !led) setTimeout(function () { act(0); }, 300); loop(); });
  }
  /* 손가락·커서가 지나는 자리의 글자가 살짝 떠오른다 */
  function wind(host, cs) {
    if (RM || !FINE) return;
    var pos = null, raf = 0;
    function draw() { raf = 0; cs.forEach(function (c) { var r = c.getBoundingClientRect(), d = pos ? Math.hypot(pos.x - (r.left + r.width / 2), pos.y - (r.top + r.height / 2)) : 1e9, f = Math.exp(-Math.pow(d / (r.height * 0.9), 2)); c.style.setProperty('--w', f.toFixed(3)); }); }
    host.addEventListener('pointermove', function (e) { pos = { x: e.clientX, y: e.clientY }; if (!raf) raf = requestAnimationFrame(draw); });
    host.addEventListener('pointerleave', function () { pos = null; if (!raf) raf = requestAnimationFrame(draw); });
  }
  function heroType() {
    var sp = $('#hx-h .fx-ln > span') || $('#hx-h'); if (!sp || RM) return;
    var t = sp.textContent; sp.textContent = ''; sp.setAttribute('aria-label', t); sp.classList.add('x-wp');
    var cs = chars(sp, t, 'x-wp-c'); cs.forEach(function (c) { c.setAttribute('aria-hidden', 'true'); }); wind(sp.parentNode, cs);
    setTimeout(function () { sp.classList.add('x-swell'); }, 1500);            // 처음 한 번, 물결이 글자를 훑고 지나간다
  }

  /* ── 스티커 띠: 앱의 스티커를 한 줄로. 누르면 통 튄다 ── */
  function stickers() {
    var el = $('#xStk'); if (!el) return;
    var packs = window.DITTO_STICKER_PACKS;
    if (!packs || !packs.length) return;
    var run = document.createElement('div'), set = document.createElement('div');
    run.className = 'x-stk-run'; set.className = 'x-stk-set';
    var classic = window.DITTO_PLATTER_STICKERS || [];
    var count = 0;
    function appendSticker(item, folder, theme) {
      var im = document.createElement('img');
      im.src = folder + item[0] + '.webp';
      im.alt = theme + ' · ' + item[1];
      im.loading = 'lazy'; im.width = im.height = 120; im.draggable = false;
      im.style.setProperty('--r', (count * 37 % 23 - 11) + 'deg');
      im.style.setProperty('--y', (count * 53 % 21 - 10) + 'px');
      set.appendChild(im); count++;
    }
    // 같은 테마가 연속해서 보이지 않도록 각 팩에서 한 장씩 섞는다.
    var oldIndex = 0;
    var rows = Math.max.apply(null, packs.map(function (pack) { return pack.items.length; }));
    for (var row = 0; row < rows; row++) {
      packs.forEach(function (pack, col) {
        if (col % 2 === 0 && oldIndex < classic.length)
          appendSticker(classic[oldIndex++], '/assets/cast/found/', '플래터');
        if (pack.items[row])
          appendSticker(pack.items[row], '/assets/cast/pack-stickers/' + pack.id + '/', pack.title);
      });
    }
    while (oldIndex < classic.length) appendSticker(classic[oldIndex++], '/assets/cast/found/', '플래터');
    var repeat = set.cloneNode(true);
    repeat.setAttribute('aria-hidden', 'true');
    run.appendChild(set); run.appendChild(repeat); el.appendChild(run);
    el.classList.add('in');
    var frame = 0, last = 0, fraction = 0, held = null, drag = null, touching = false, resumeAt = 0;
    function coolDown() { resumeAt = performance.now() + 650; }
    function tick(now) {
      if (last && held === null && !touching && now >= resumeAt && !document.hidden) {
        fraction += Math.min(now - last, 64) * .038;
        var step = Math.floor(fraction);
        var width = set.getBoundingClientRect().width;
        if (step && width) {
          el.scrollLeft = (el.scrollLeft + step) % width;
          fraction -= step;
        }
      }
      last = now;
      frame = requestAnimationFrame(tick);
    }
    el.addEventListener('pointerdown', function (ev) {
      if (!ev.isPrimary || ev.button !== 0) return;
      held = ev.pointerId;
      if (ev.pointerType === 'mouse') {
        drag = {origin: ev.clientX, left: el.scrollLeft};
        el.classList.add('is-dragging');
        el.setPointerCapture(ev.pointerId);
      }
    });
    el.addEventListener('pointermove', function (ev) {
      if (drag && held === ev.pointerId) el.scrollLeft = drag.left + drag.origin - ev.clientX;
    });
    function release(ev) {
      if (ev.pointerId !== held) return;
      held = null; drag = null;
      el.classList.remove('is-dragging');
      coolDown();
    }
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    el.addEventListener('lostpointercapture', release);
    // On touch screens the browser takes over the pan and cancels the pointer
    // before the finger lifts. Wait for the actual touch and momentum to end.
    el.addEventListener('touchstart', function () { touching = true; }, {passive:true});
    function touchEnd(ev) {
      touching = ev.touches.length > 0;
      if (!touching) coolDown();
    }
    el.addEventListener('touchend', touchEnd, {passive:true});
    el.addEventListener('touchcancel', touchEnd, {passive:true});
    el.addEventListener('scroll', function () {
      if (performance.now() < resumeAt) coolDown();
    }, {passive:true});
    el.addEventListener('wheel', coolDown, {passive:true});
    el.addEventListener('keydown', coolDown);
    var motion = window.matchMedia('(prefers-reduced-motion: reduce)'), inView = false;
    function update() {
      if (inView && !motion.matches && !document.hidden) {
        if (!frame) { last = 0; frame = requestAnimationFrame(tick); }
      } else { cancelAnimationFrame(frame); frame = 0; }
    }
    visible(el, function (on) { inView = on; update(); });
    motion.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
  }

  /* ── 프로필 월: 끝없는 판 위에 프로필 사진이 스티커처럼 붙는다. 끌어서 둘러보고 버튼으로 확대 · 축소 ──
     실제 연결 전에는 예시 사진을 쓴다. 서버가 준비되면 window.DITTO_WALL = ['사진 주소', …] 로 넘기면 된다 (아이디 · 이름은 받지도 그리지도 않는다) */
  function wall() {
    var box = $('#xWall'), cv = $('#xWallCv'), inner = $('#xWallIn'); if (!box || !cv || !inner) return;
    /* 실제 프로필 사진(window.DITTO_WALL — 공개에 동의한 사람의 사진 주소만)과 예시 그림을 섞는다.
       실제 2 : 예시 1 비율로 번갈아 놓고, 실제가 적으면 예시로 52칸까지 채운다. 실제가 없으면 전부 예시 */
    var given = Array.isArray(window.DITTO_WALL) && window.DITTO_WALL.length ? window.DITTO_WALL : null;
    var real = (given || []).slice(0, 400), dummy = [], list = [];
    var palette = ['purple-pink','cyan-blue','peach-yellow','mint-lime','coral-red','deep-purple','lime-green','gold-yellow','pink-coral','neutral-gray'];
    var gradients = 0;
    for (var friend = 1; friend <= 16; friend++) {
      dummy.push('/assets/cast/wall/friend-' + String(friend).padStart(2,'0') + '.webp');
      if (friend % 3 !== 2 && gradients < palette.length) dummy.push('/assets/cast/wall/gradient-' + palette[gradients++] + '.webp');
    }
    if (real.length) {
      var need = Math.max(52, Math.ceil(real.length * 1.5)), ri = 0, di = 0;
      for (var q = 0; q < need; q++) { if (ri < real.length && (q % 3 !== 2 || di >= dummy.length)) list.push(real[ri++]); else list.push(dummy[di++ % dummy.length]); }
      var nt = $('#xWallNote'); if (nt) nt.textContent = '실제 프로필과 예시 사진이 함께 보여요.';
    } else list = dummy;
    real = real.length ? real : null;
    var hash = function (i, s) { var x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
    list.forEach(function (src, i) {
      var im = document.createElement('img'), rr = 66 * Math.sqrt(i + 0.55), a = i * 2.39996, s = 58 + Math.round(hash(i, 1) * 34);
      im.src = src; im.alt = ''; im.loading = 'lazy'; im.draggable = false; im.decoding = 'async'; im.width = im.height = s;
      im.style.setProperty('--px', (Math.cos(a) * rr * 1.42).toFixed(1) + 'px'); im.style.setProperty('--py', (Math.sin(a) * rr * 0.96).toFixed(1) + 'px');
      im.style.setProperty('--r', ((hash(i, 2) - 0.5) * 18).toFixed(1) + 'deg'); im.style.setProperty('--s', s + 'px'); im.style.setProperty('--d', Math.min(i * 22, 1400) + 'ms');
      inner.appendChild(im);
    });
    if (given) $('#xWallN').textContent = real.length; else $('#xWallN').parentNode.textContent = '예시';            // 실제 가입자 수는 동의 받은 목록이 연결된 뒤에만 센다            // 예시 사진일 때는 사람 수를 세지 않는다
    var Z0 = cv.clientWidth < 520 ? 0.62 : 1, x = 0, y = 0, z = Z0, vx = 0, vy = 0, drag = null, raf = 0, zEl = $('#xWallZ');
    function apply() { inner.style.setProperty('--x', x.toFixed(1) + 'px'); inner.style.setProperty('--y', y.toFixed(1) + 'px'); inner.style.setProperty('--z', z.toFixed(3)); cv.style.setProperty('--gs', (28 * z).toFixed(1) + 'px'); cv.style.setProperty('--gx', (x + cv.clientWidth / 2).toFixed(1) + 'px'); cv.style.setProperty('--gy', (y + cv.clientHeight / 2).toFixed(1) + 'px'); zEl.textContent = Math.round(z * 100) + '%'; }
    function glide() { raf = 0; if (drag) return; vx *= 0.93; vy *= 0.93; if (Math.abs(vx) + Math.abs(vy) < 0.15) return; x += vx; y += vy; apply(); raf = requestAnimationFrame(glide); }
    cv.addEventListener('pointerdown', function (e) { if (e.button) return; drag = { x: e.clientX, y: e.clientY, t: performance.now() }; vx = vy = 0; cv.classList.add('drag'); try { cv.setPointerCapture(e.pointerId); } catch (er) { /* 잡지 못해도 끌기는 된다 */ } });
    cv.addEventListener('pointermove', function (e) { if (!drag) return; var dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; x += dx; y += dy; vx = dx; vy = dy; apply(); });
    ['pointerup', 'pointercancel'].forEach(function (n) { cv.addEventListener(n, function () { if (!drag) return; drag = null; cv.classList.remove('drag'); if (!RM && !raf) raf = requestAnimationFrame(glide); }); });
    function zoom(to) { var nz = Math.max(0.5, Math.min(2, to)), k = nz / z; x *= k; y *= k; z = nz; inner.style.transition = RM ? 'none' : 'transform .35s cubic-bezier(.2,1,.3,1)'; apply(); setTimeout(function () { inner.style.transition = ''; }, 380); }
    $('#xWallOut').addEventListener('click', function () { zoom(z - 0.25); });
    $('#xWallIn2').addEventListener('click', function () { zoom(z + 0.25); });
    $('#xWallHome').addEventListener('click', function () { x = y = 0; zoom(Z0); });
    cv.addEventListener('wheel', function (e) { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); zoom(z - e.deltaY * 0.004); }, { passive: false });
    addEventListener('resize', apply); apply();
    seen(box, function () { box.classList.add('in'); }, 0.25);
  }

  /* ── 지금 디토에 있는 친구들 v2 (11-21): 1,000칸 잔디판. 한 칸 = 한 사람, 들어온 순서대로 채워진다 (서버 landing_members).
     사진이 없는 사람은 프로필 팔레트 사각 아바타(10색). 옆 · 위 칸과 같은 색이 붙지 않게 고른다. 글자는 쓰지 않는다.
     칸을 누르거나 올리면 그 사람의 카드. 사진 · 이름은 웹 프로필 공개를 켠 사람만 (서버가 거른다). 서버 함수가 없으면 예시 판 그대로 ── */
  function members() {
    var sec = $('#x-wall'), wallBox = $('#xWall'); if (!sec || !wallBox) return;
    var CAP = 1000, pad = function (n) { return String(n).padStart(4, '0'); };
    var PAL = ['purple-pink', 'cyan-blue', 'peach-yellow', 'mint-lime', 'coral-red', 'deep-purple', 'lime-green', 'gold-yellow', 'pink-coral', 'neutral-gray'];
    function ago(t) {
      var m = Math.max(0, (Date.now() - new Date(t).getTime()) / 60000);
      if (m < 1) return '방금'; if (m < 60) return Math.floor(m) + '분 전'; if (m < 1440) return Math.floor(m / 60) + '시간 전';
      var d = new Date(t); return (d.getMonth() + 1) + '월 ' + d.getDate() + '일';
    }
    function photo(r) { return r.avatar ? (/^https?:\/\//.test(r.avatar) ? r.avatar : SB + '/storage/v1/object/public/avatars/' + String(r.avatar).replace(/^\/+/, '')) : null; }
    /* 사진 없는 사람의 색: 바로 앞 칸, 그리고 위 칸(40칸 · 50칸 줄 모두)과 겹치지 않게 */
    function paint(rows) {
      var col = {};
      rows.forEach(function (r) {
        if (photo(r)) return;
        var avoid = [col[r.no - 1], col[r.no - 40], col[r.no - 50], col[r.no + 1]], k = (r.no * 7) % PAL.length;
        for (var t = 0; t < PAL.length && avoid.indexOf(PAL[k]) >= 0; t++) k = (k + 1) % PAL.length;
        col[r.no] = PAL[k]; r.pal = PAL[k];
      });
    }
    function face(r, cls) {
      var el = document.createElement('span'), im = document.createElement('img'), fb = '/assets/cast/wall/gradient-' + (r.pal || 'purple-pink') + '.webp';
      el.className = cls; im.alt = ''; im.decoding = 'async'; im.loading = 'lazy';
      im.onerror = function () { im.onerror = null; im.src = '/assets/cast/wall/gradient-purple-pink.webp'; };
      im.src = photo(r) || fb; el.appendChild(im); return el;
    }
    function who(r, sub) {
      var t = document.createElement('div'), b = document.createElement('b'), s = document.createElement('span');
      b.innerHTML = '<i></i>'; $('i', b).textContent = 'No.' + pad(r.no); b.appendChild(document.createTextNode(' ' + (r.nick || '디토 친구')));
      s.textContent = sub; t.appendChild(b); t.appendChild(s); return t;
    }
    seen(sec, function () {
      rpc('landing_members', { p_limit: 400 }).then(function (r) {
        var rows = (r && r.rows) || [], total = (r && r.total) || 0; if (!total || !rows.length) return;
        paint(rows);
        var byNo = {}; rows.forEach(function (m) { byNo[m.no] = m; });
        var box = document.createElement('div'); box.className = 'x-mem';
        box.innerHTML =
          '<div class="x-mem-top"><p class="x-mem-n"><b id="xMemN">0</b><span>/ 1,000명</span></p>' +
          '<div class="x-mem-pg" role="progressbar" aria-valuemin="0" aria-valuemax="1000"><i></i></div>' +
          '<p class="x-mem-s"></p></div>' +
          '<div class="x-mem-gw"><ol class="x-mem-g" aria-label="1,000칸 중 들어온 순서대로 채워진 자리"></ol><div class="x-mem-card" role="status" aria-live="polite" hidden></div></div>' +
          '<div class="x-mem-foot"><p class="x-mem-k">최근 들어온 친구</p><ol class="x-mem-r"></ol><p class="x-mem-leg"><i></i>한 칸이 한 사람이에요</p></div>';
        var pg = $('.x-mem-pg', box); pg.setAttribute('aria-valuenow', total); pg.setAttribute('aria-label', '1,000자리 중 ' + total + '자리가 채워졌어요');
        pg.style.setProperty('--p', Math.max(0.6, total / CAP * 100).toFixed(2) + '%');
        $('.x-mem-s', box).textContent = (r.today ? '오늘 ' + r.today + '명이 들어왔어요. ' : '') + '남은 자리 ' + (CAP - total).toLocaleString('ko-KR') + '개';
        var g = $('.x-mem-g', box), card = $('.x-mem-card', box), gw = $('.x-mem-gw', box), frag = document.createDocumentFragment(), pinned = null;
        function show(b, m, pin) {
          card.textContent = ''; card.appendChild(face(m, 'x-mem-f')); card.appendChild(who(m, ago(m.at) + ' 들어왔어요')); card.hidden = false;
          var R = gw.getBoundingClientRect(), c = b.getBoundingClientRect(), x = c.left - R.left + c.width / 2, y = c.top - R.top;
          card.style.left = Math.max(8, Math.min(R.width - card.offsetWidth - 8, x - card.offsetWidth / 2)).toFixed(0) + 'px';
          card.style.top = (y < card.offsetHeight + 14 ? y + c.height + 10 : y - card.offsetHeight - 10).toFixed(0) + 'px';
          $$('button[aria-pressed]', g).forEach(function (x) { x.removeAttribute('aria-pressed'); }); b.setAttribute('aria-pressed', 'true');
          if (pin) pinned = b;
        }
        function hide() { if (pinned) return; card.hidden = true; $$('button[aria-pressed]', g).forEach(function (x) { x.removeAttribute('aria-pressed'); }); }
        for (var n = 1; n <= CAP; n++) {
          var li = document.createElement('li'), m = byNo[n];
          if (m) {
            var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'No.' + pad(n) + ' ' + (m.nick || '디토 친구'));
            b.style.setProperty('--d', Math.min((n - 1) * 24, 1600) + 'ms'); b.appendChild(face(m, 'x-mem-f'));
            (function (b, m) {
              b.addEventListener('click', function (e) { e.stopPropagation(); pinned = null; show(b, m, true); });
              if (FINE) { b.addEventListener('pointerenter', function () { if (!pinned) show(b, m, false); }); b.addEventListener('pointerleave', hide); }
              b.addEventListener('focus', function () { show(b, m, false); }); b.addEventListener('blur', hide);
            })(b, m);
            li.className = 'on'; li.appendChild(b);
          } else if (n <= total) li.className = 'on x-mem-old';          // 목록 밖 옛 자리 (400명 넘게 들어온 뒤)
          else if (n === total + 1) { li.className = 'x-mem-next'; li.title = 'No.' + pad(n) + ' 다음 자리'; }
          frag.appendChild(li);
        }
        g.appendChild(frag);
        document.addEventListener('click', function (e) { if (pinned && !gw.contains(e.target)) { pinned = null; hide(); } });
        var rl = $('.x-mem-r', box);
        rows.slice(-5).reverse().forEach(function (m) {
          var li = document.createElement('li'); li.appendChild(face(m, 'x-mem-f')); li.appendChild(who(m, ago(m.at))); rl.appendChild(li);
        });
        wallBox.hidden = true; wallBox.parentNode.insertBefore(box, wallBox);
        var hp = $('header p:not(.h8-k)', sec); if (hp) hp.textContent = '1,000자리 중 들어온 순서대로 한 칸씩 채워져요. 칸에 올리면 누가 언제 들어왔는지 보여요. 아이디는 보이지 않아요.';
        var nEl = $('#xMemN', box), t0 = 0, dur = RM ? 0 : 1400;
        function tick(now) { if (!t0) t0 = now; var k = dur ? clamp((now - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3); nEl.textContent = Math.round(total * e).toLocaleString('ko-KR'); if (k < 1) requestAnimationFrame(tick); }
        requestAnimationFrame(function () { box.classList.add('in'); requestAnimationFrame(tick); });
      }, function () { /* 서버 함수가 없으면 예시 판을 그대로 둔다 */ });
    }, 0.05);
  }

  /* 소개 카드 속 작은 주파수 (점 물결) */
  function fourFq() {
    var cv = $('#xFourFq'); if (!cv || !cv.getContext) return;
    var x = cv.getContext('2d'), live = false, raf = 0;
    function paint(now) {
      var W = 220, H = 90, t = RM ? 1.2 : now / 1000, cols = 22, rows = 9, cg = W / cols, rg = H / rows; x.clearRect(0, 0, W, H);
      for (var c = 0; c < cols; c++) {
        var env = Math.sin((c + 0.5) / cols * Math.PI), lv = 0.4 + (0.5 + 0.5 * Math.sin(t * 2.2 - c * 0.55)) * env * 3.6, g = c / (cols - 1);
        for (var r = 0; r < rows; r++) { var d = Math.abs(r - 4), on = d <= lv; x.globalAlpha = on ? 1 - d * 0.14 : 0.18; x.fillStyle = on ? 'rgb(' + Math.round(170 + 80 * g) + ',' + Math.round(74 + 77 * g) + ',' + Math.round(244 - 18 * g) + ')' : '#B9B2C6'; x.beginPath(); x.arc(cg * (c + 0.5), rg * (r + 0.5), on ? 3.4 - d * 0.3 : 1.8, 0, 6.2832); x.fill(); }
      }
      x.globalAlpha = 1;
    }
    function loop(now) { raf = 0; if (!live) return; paint(now); raf = requestAnimationFrame(loop); }
    paint(0); visible(cv, function (v) { live = v && !RM; if (live && !raf) raf = requestAnimationFrame(loop); });
  }

  /* ── 사진 띠 (skeep.site 메인 구간의 평평한 커버플로를 그대로 옮김): 기울임 없이 옆으로 흐르고, 가운데에서 멀수록 작아진다.
     한 번도 완전히 멈추지 않고 흐르되 가운데 자리 근처에서는 거의 멈춘 듯 머문다(quint). 가운데에서 가까운 다섯 장만 보인다.
     수치: 한 칸 2.2초 · 처음 1.6초 머묾 · 한 칸마다 0.17씩 작아지고 0.5가 바닥 · 틈 = 무대 폭 × 0.16 ── */
  function cover() {
    var box = $('#xCov'), stage = box && $('.x-cov-st', box); if (!stage) return;
    var cards = $$('.x-cov-c', stage), n = cards.length; if (n < 2) return;
    // The rolling strip has its own selections. The gallery and its size picker share their original samples.
    function selection(handle, kind, id) {
      var profile = P[handle];
      var widget = profile && profile.widgets.find(function (w) { return w.kind === kind && (!id || w.id === id); });
      return widget && widget.data;
    }
    var selections = {
      image: window.DittoScenes.roll.image,
      music: window.DittoScenes.roll.music,
      video: Object.assign({}, selection('rollbytae','video'), {img:window.DittoScenes.roll.video}),
      gif: window.DittoScenes.roll.gif,
      guestbook: window.DittoScenes.roll.guestbook,
      status: {emoji:'🛹', label:'보드 타는 중'},
      playlist: window.DittoScenes.roll.playlist,
      together: window.DittoScenes.roll.together
    };
    if (DW) cards.forEach(function (card) {
      var item = DW.catalog.find(function (c) { return c.kind === card.dataset.kind; });
      if (!item) return;
      var size = item.sizes.find(function (s) { return s.w === +card.dataset.w && s.h === +card.dataset.h; }) || item.defaultSize;
      var widget = { kind:item.kind, x:0, y:0, w:size.w, h:size.h, data:selections[item.kind] || item.sample };
      var rect = DW.rect(widget);
      card.style.width = DW.cq(rect.w);
      card.style.height = DW.cq(rect.h);
      card.replaceChildren(DW.box(widget));
    });
    var STEP = 0.04, SHOW = 5, PERIOD = 2200, HOLD = 1600, base = [], lastF = 0, kEl = $('#xCovK');
    function quint(t) { return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2; }
    function sc(ax) { return Math.max(0.88, 1 - ax * STEP); }
    function rel(r) { while (r > n / 2) r -= n; while (r < -n / 2) r += n; return r; }
    function measure() { for (var i = 0; i < n; i++) base[i] = cards[i].offsetWidth || 1; }
    function render(f) {
      var G = stage.offsetWidth * 0.16, items = [];
      for (var i = 0; i < n; i++) { var r = rel(i - f); items.push({ i: i, rel: r, ax: Math.abs(r), w: base[i] * sc(Math.abs(r)) }); }
      var vis = {}; items.slice().sort(function (a, b) { return a.ax - b.ax; }).slice(0, SHOW).forEach(function (it) { vis[it.i] = true; });
      items.sort(function (a, b) { return a.rel - b.rel; });
      var x = [], zero = 0, found = false;
      for (var k = 0; k < items.length; k++) {            // 왼쪽부터 폭을 쌓아 놓고, 가운데(rel 0)가 무대 한가운데에 오게 민다 — 틈은 늘 같다
        x[k] = k === 0 ? 0 : x[k - 1] + items[k - 1].w / 2 + G + items[k].w / 2;
        if (items[k].rel === 0) { zero = x[k]; found = true; }
        else if (!found && k > 0 && items[k - 1].rel < 0 && items[k].rel > 0) { var t = -items[k - 1].rel / (items[k].rel - items[k - 1].rel); zero = x[k - 1] + t * (x[k] - x[k - 1]); found = true; }
      }
      for (k = 0; k < items.length; k++) {
        var it = items[k], c = cards[it.i];
        c.style.transform = 'translate(-50%,-50%) translateX(' + (x[k] - zero).toFixed(1) + 'px) scale(' + sc(it.ax).toFixed(4) + ')';
        c.style.opacity = vis[it.i] ? '1' : '0'; c.style.zIndex = 100 - Math.round(it.ax * 10);
        var on = it.ax < 0.5; if (on !== c._on) { c._on = on; c.classList.toggle('on', on); c.tabIndex = on ? 0 : -1; if (on) active(c); }
      }
    }
    function active(c) {            // 가운데에 온 사진에 맞춰 꼬리말이 바뀌고, 제목의 그 낱말이 움직인다
      if (kEl && kEl.textContent !== c.dataset.k) { kEl.textContent = c.dataset.k; kEl.classList.remove('sw'); void kEl.offsetWidth; kEl.classList.add('sw'); }
      if (window.__dittoWord) window.__dittoWord(c.dataset.v);
    }
    if (RM) {
      box.classList.add('x-cov-static');
      cards.forEach(function (card) { card.addEventListener('focus', function () { active(card); }); });
      return;
    }
    addEventListener('resize', function () { measure(); render(lastF); });
    measure(); render(0);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); render(lastF); });

    var t0 = null, raf = 0, live = false, acc = 0, prev = 0;
    function tick(now) {
      raf = 0; if (!live) return; if (t0 === null) { t0 = now; prev = now; }
      acc += Math.min(now - prev, 100); prev = now;            // 화면 밖에서는 시간이 흐르지 않는다
      var el = acc - HOLD, f = 0; if (el >= 0) { var cy = el / PERIOD, wh = Math.floor(cy); f = wh + quint(cy - wh); }
      lastF = f; render(f); raf = requestAnimationFrame(tick);
    }
    visible(box, function (v) { live = v; if (v && !raf) { prev = performance.now(); raf = requestAnimationFrame(tick); } });
  }

  /* ── 선언문 제목 둘레: 점과 실선으로 그린 관계망. 촘촘히 이어져 있지만 내려갈수록 서로 멀어지고 선은 옅어진다 ── */
  function far() {
    var el = $('#xFar'); if (!el) return;
    var NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'); el.appendChild(svg);
    var hash = function (i, s) { var x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
    var N = 30, pts = [], L = [], i, k;
    for (i = 0; i < N; i++) {            // 제목이 놓인 가운데는 비우고 둘레에만 놓는다 (타원 띠 위)
      var a = (i + hash(i, 1) * 0.7) / N * 6.2832, rr = 0.8 + hash(i, 2) * 0.34;
      pts.push({ x: 0.5 + Math.cos(a) * 0.5 * rr, y: 0.5 + Math.sin(a) * 0.52 * rr, r: 3.4 + hash(i, 3) * 5.6, f: 0.25 + hash(i, 4) * 0.5, p: hash(i, 5) * 6.28, c: hash(i, 6) < 0.14 ? 'm' : hash(i, 6) < 0.5 ? 'f' : '' });
    }
    for (i = 0; i < N; i++) { L.push([i, (i + 1) % N, 1]); if (hash(i, 7) < 0.62) L.push([i, (i + 2 + Math.floor(hash(i, 8) * 2)) % N, 0.8]); if (hash(i, 9) < 0.3) L.push([i, (i + 5 + Math.floor(hash(i, 10) * 9)) % N, 0.45]); }
    var lines = L.map(function () { var l = document.createElementNS(NS, 'line'); svg.appendChild(l); return l; });
    var dots = pts.map(function (p) { var c = document.createElementNS(NS, 'circle'); if (p.c) c.setAttribute('class', p.c); svg.appendChild(c); return c; });
    var W = 0, H = 0, q = 0, live = false, raf = 0;
    function size() { W = el.clientWidth; H = el.clientHeight; svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); }
    function draw(t) {
      var sp = 1 + q * 0.3, sm = W < 600 ? 0.7 : 1, xy = pts.map(function (p) {
        return [(0.5 + (p.x - 0.5) * sp) * W + (RM ? 0 : Math.sin(t * p.f + p.p) * 7), (0.5 + (p.y - 0.5) * sp) * H + (RM ? 0 : Math.cos(t * p.f * 0.8 + p.p) * 7)];
      });
      L.forEach(function (l, n) { var A = xy[l[0]], B = xy[l[1]]; lines[n].setAttribute('x1', A[0].toFixed(1)); lines[n].setAttribute('y1', A[1].toFixed(1)); lines[n].setAttribute('x2', B[0].toFixed(1)); lines[n].setAttribute('y2', B[1].toFixed(1)); lines[n].setAttribute('stroke-opacity', (l[2] * (1 - q * 0.72)).toFixed(3)); });
      pts.forEach(function (p, n) { dots[n].setAttribute('cx', xy[n][0].toFixed(1)); dots[n].setAttribute('cy', xy[n][1].toFixed(1)); dots[n].setAttribute('r', (p.r * sm * (1 - q * 0.25)).toFixed(2)); });
    }
    function tick(now) { raf = 0; if (!live) return; draw(now / 1000); raf = requestAnimationFrame(tick); }
    size(); draw(0); seen(el, function () { el.classList.add('in'); }, 0.2);
    addEventListener('resize', function () { size(); draw(performance.now() / 1000); });
    if (RM) return;
    var lite = window.matchMedia && matchMedia('(max-width: 760px)').matches;            // 휴대폰: 떠다니는 움직임 없이 스크롤할 때만 다시 그린다
    visible(el, function (v) { live = v && !lite; if (live && !raf) raf = requestAnimationFrame(tick); });
    var tk = false; addEventListener('scroll', function () { if (tk) return; tk = true; requestAnimationFrame(function () { tk = false; var r = el.getBoundingClientRect(); if (r.bottom < -100 || r.top > innerHeight + 100) return; q = clamp((innerHeight * 0.35 - r.top) / (r.height * 0.9)); if (lite) draw(0); }); }, { passive: true });
  }

  /* ── 초대장 받는 순서: 사진 → 이름·아이디 → 뽑기 → 코드. 지금 하고 있는 칸이 켜진다 ── */
  function ticketPreview() {
    var card = $('.x-tk3-card');
    if (!card) return;
    var angle = 0, drag = null, skipClick = false;
    var timer = 0, inView = false;
    function scheduleTurn(delay) {
      clearTimeout(timer);
      if (RM || !inView || document.hidden || drag) return;
      timer = setTimeout(function () {
        card.classList.add('auto-turn');
        settle(angle + 180);
        scheduleTurn(2600);
      }, delay);
    }
    function takeControl() {
      clearTimeout(timer);
      card.classList.remove('auto-turn');
    }
    function rotate(y, x) {
      card.style.setProperty('--turn', y + 'deg');
      card.style.setProperty('--tilt', x + 'deg');
    }
    function settle(next) {
      angle = next;
      rotate(angle, 0);
      card.setAttribute('aria-pressed', String(Math.abs(angle / 180) % 2 === 1));
    }
    card.addEventListener('pointerdown', function (e) {
      if (!e.isPrimary || e.button !== 0) return;
      takeControl();
      drag = {id:e.pointerId, x:e.clientX, dx:0};
      skipClick = false;
      card.setPointerCapture(e.pointerId);
    });
    card.addEventListener('pointermove', function (e) {
      var box = card.getBoundingClientRect();
      var x = (e.clientX - box.left) / box.width, y = (e.clientY - box.top) / box.height;
      card.style.setProperty('--hx', 100*x + '%');
      card.style.setProperty('--hy', 100*y + '%');
      if (drag && drag.id === e.pointerId) {
        drag.dx = e.clientX - drag.x;
        if (Math.abs(drag.dx) > 5) skipClick = true;
        if (skipClick) {
          card.classList.add('dragging');
          rotate(angle + 180*drag.dx/box.width, (0.5-y)*8);
        }
      } else if (!drag && !card.classList.contains('auto-turn') && e.pointerType === 'mouse') rotate(angle + (x-.5)*14, (.5-y)*12);
    });
    function end(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var flip = e.type === 'pointerup' && Math.abs(drag.dx) > card.clientWidth * .18;
      card.classList.remove('dragging');
      settle(angle + (flip ? Math.sign(drag.dx)*180 : 0));
      drag = null;
      scheduleTurn(3500);
    }
    ['pointerup','pointercancel','lostpointercapture'].forEach(function (type) { card.addEventListener(type,end); });
    card.addEventListener('pointerleave', function () { if (!drag) rotate(angle,0); });
    card.addEventListener('click', function () { takeControl(); if (!skipClick) settle(angle+180); skipClick=false; scheduleTurn(3500); });
    card.addEventListener('keydown', function (e) {
      if (!['Enter',' ','ArrowLeft','ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      takeControl();
      if (!e.repeat) settle(angle + (e.key === 'ArrowLeft' ? -180 : 180));
      scheduleTurn(3500);
    });
    visible(card, function (show) { inView = show; scheduleTurn(750); });
    document.addEventListener('visibilitychange', function () { scheduleTurn(750); });
  }

  function flow() {
    var ol = $('#xFlow'); if (!ol) return;
    var lis = $$('li', ol), mach = $('#tmMach'), nm = $('#tmDisp'), id = $('#tmName'), tc = $('#tc'), done = $('#tcDone'), use = $('#h8CamUse'), used = false;
    function calc() {
      var s = 0; if (used || (nm && nm.value) || (id && id.value)) s = 1;
      if (nm && id && nm.value.trim() && id.value.trim().length >= 3) s = 2;
      if (mach && /(^| )(out|ready|full)( |$)/.test(mach.className)) s = 3;
      if (tc && done && !tc.hidden && !done.hidden) s = 4;
      lis.forEach(function (li, i) { li.classList.toggle('on', i === s); li.classList.toggle('done', i < s); if (i === s) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
    }
    if (use) use.addEventListener('click', function () { used = true; calc(); });
    [nm, id].forEach(function (el) { if (el) el.addEventListener('input', calc); });
    if ('MutationObserver' in window) { var mo = new MutationObserver(calc); [mach, tc, done].forEach(function (el) { if (el) mo.observe(el, { attributes: true, attributeFilter: ['class', 'hidden'] }); }); }
    calc();
  }

  /* ── 안드로이드 사전 예약: 이메일을 남기면 출시 알림을 보낸다 (서버 join_android_waitlist).
     서버 함수가 아직 없으면 예전처럼 메일 앱으로 보내게 둔다. 스토어 사전 등록 주소가 생기면 window.DITTO_ANDROID_URL 로 넘기면 그 주소로 간다 ── */
  function android() {
    var btn = $('#xAndBtn'); if (!btn) return;
    if (window.DITTO_ANDROID_URL) { btn.addEventListener('click', function () { location.href = window.DITTO_ANDROID_URL; }); return; }
    var d = document.createElement('dialog'); d.className = 'x-and'; d.id = 'xAnd'; d.setAttribute('aria-labelledby', 'xAndH');
    var mail = 'mailto:support@ditto.place?subject=' + encodeURIComponent('안드로이드 사전 예약') + '&body=' + encodeURIComponent('안드로이드 앱이 나오면 이 주소로 알려 주세요.');
    d.innerHTML = '<form class="x-and-in" novalidate><img src="assets/v8/appicon.webp" alt="" width="104" height="104"><h4 id="xAndH">안드로이드는 준비하고 있어요</h4>' +
      '<p>이메일을 남겨 주시면 안드로이드 앱이 나올 때 가장 먼저 알려 드릴게요.</p>' +
      '<label class="x-and-f"><span class="x-sr">이메일</span><input type="email" id="xAndE" inputmode="email" autocomplete="email" placeholder="이메일 주소" maxlength="254" required></label>' +
      '<label class="x-and-c"><input type="checkbox" id="xAndOk"><span>안드로이드 출시 알림을 받기 위해 이메일을 모으는 데 동의해요. <small>알림을 보낸 뒤 바로 지워요. <a href="/privacy/" target="_blank" rel="noopener">개인정보 처리방침</a></small></span></label>' +
      '<p class="x-and-m" id="xAndM" aria-live="polite"></p>' +
      '<div class="x-and-a"><button type="submit" class="x-and-go" disabled>출시 알림 받기</button><button type="button" class="x-and-x">닫기</button></div></form>';
    document.body.appendChild(d);
    var f = $('form', d), em = $('#xAndE', d), ok = $('#xAndOk', d), go = $('.x-and-go', d), m = $('#xAndM', d), sent = false;
    var valid = function () { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em.value.trim()); };
    function check() { if (!sent) go.disabled = !(valid() && ok.checked); }
    em.addEventListener('input', function () { m.textContent = ''; check(); }); ok.addEventListener('change', check);
    f.addEventListener('submit', function (e) {
      e.preventDefault(); if (sent) { d.close(); return; } if (!valid()) { m.textContent = '이메일 주소를 다시 확인해 주세요.'; return; } if (!ok.checked) return;
      go.disabled = true; go.textContent = '보내는 중…';
      var mailAddr = em.value.trim();
      rpc('join_android_waitlist', { p_email: mailAddr, p_consent: true }).then(function (r) {
        sent = true; ga('android_waitlist_join', { already: !!(r && r.already) });
        /* 완료 화면: 입력 칸 · 동의 줄을 걷고, 무엇이 됐는지와 다음에 무슨 일이 생기는지만 */
        f.classList.add('done'); f.innerHTML = '<span class="x-and-ok" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>' +
          '<h4 id="xAndH"></h4><p class="x-and-ok-t"></p><p class="x-and-mail"></p><p class="x-and-ok-s"></p>' +
          '<div class="x-and-a"><button type="submit" class="x-and-go">확인</button></div>';
        $('h4', f).textContent = r && r.already ? '이미 신청해 주셨어요' : '신청이 완료됐어요';
        $('.x-and-ok-t', f).textContent = r && r.already ? '안드로이드 앱이 나오면 아래 주소로 가장 먼저 알려 드릴게요.' : '고마워요! 안드로이드 앱이 나오면 아래 주소로 가장 먼저 알려 드릴게요.';
        $('.x-and-mail', f).textContent = mailAddr;
        $('.x-and-ok-s', f).textContent = '알림 메일을 보낸 뒤에는 이메일을 바로 지워요.';
        setTimeout(function () { var b = $('.x-and-go', f); if (b) b.focus(); }, 50);
      }, function (er) {
        go.textContent = '출시 알림 받기'; check();
        if (er && (er.code === 'PGRST202' || er.status === 404)) { m.innerHTML = '지금은 신청을 받을 수 없어요. <a href="' + mail + '">메일로 알려 주세요</a>.'; }
        else if (er && /invalid_email/.test(er.message)) m.textContent = '이메일 주소를 다시 확인해 주세요.';
        else m.textContent = '지금은 보내지 못했어요. 잠시 뒤에 다시 눌러 주세요.';
      });
    });
    btn.addEventListener('click', function () { ga('android_waitlist_open'); if (d.showModal) { d.showModal(); setTimeout(function () { em.focus(); }, 60); } else location.href = mail; });
    $('.x-and-x', d).addEventListener('click', function () { d.close(); });
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
  }

  /* ── 첫 화면: 여러 사람의 플래터가 한 장씩 넘어간다. 옆 플래터를 누르면 가운데로 온다 ── */
  function roll() {
    var P = window.DittoIntroPlatters;
    var trio = $('.fx-trio'), DP = window.DittoPlatter; if (!trio || !DP) return;
    var ORDER = [['soramaybe', 'sora'], ['jiuallday', 'jiu'], ['haeunzip', 'haeun'], ['junishere', 'jun'], ['yeseofilm', 'yeseo'], ['rianafterdark', 'rian'], ['nariday', 'nari'], ['dohyunlinks', 'dohyun']];
    var kids = [].slice.call(trio.children), items = [];
    ORDER.forEach(function (o, i) {
      var el = kids[i], p = P[o[0]];
      if (!el) {
        if (!p) return;
        el = document.createElement('div');
        el.innerHTML = '<div class="h8-scr"><div class="h8-scr-in"><div class="h8-hb"><img src="assets/rooms/rav-' + o[1] + '.webp" alt="" width="38" height="38" loading="lazy"><div><b></b><span></span></div></div><div class="dpl"></div></div></div>';
        var hb = $('.h8-hb', el); hb.style.setProperty('--hb-a', p.handleStyle.top); hb.style.setProperty('--hb-b', p.handleStyle.bottom);
        $('b', hb).textContent = p.name; $('span', hb).textContent = '@' + o[0];
        trio.appendChild(el); DP.create($('.dpl', el), { widgets: clone(p.widgets), editable: false, removable: false });
      }
      el.className = 'x-roll-i'; items.push(el);
    });
    var n = items.length; if (n < 3) return;
    trio.classList.add('x-roll');
    var c = 1, tm = 0, live = false, hold = false;
    function rel(i) { var r = i - c; while (r > n / 2) r -= n; while (r < -n / 2) r += n; return r; }
    function render() { items.forEach(function (el, i) { var r = rel(i); el.style.setProperty('--o', Math.max(-2, Math.min(2, r))); el.dataset.p = r === 0 ? 'c' : Math.abs(r) === 1 ? 's' : 'h'; }); }
    function go(i) { c = (i + n) % n; render(); }
    function loop() { clearInterval(tm); tm = 0; if (!live || RM) return; tm = setInterval(function () { if (!hold && !document.hidden) go(c + 1); }, 4200); }
    items.forEach(function (el, i) { el.addEventListener('click', function () { if (i !== c) { go(i); loop(); } }); });
    if (FINE) { trio.addEventListener('pointerenter', function () { hold = true; }); trio.addEventListener('pointerleave', function () { hold = false; }); }
    render(); visible(trio, function (v) { live = v; loop(); });
  }

  /* ── 이런 기능 있으면 좋겠어요: 남긴 글이 세 줄로 흘러 올라간다 ──
     서버 연결 전에는 예시 글을 쓰고, 남긴 글은 이 기기에만 둔다.
     연결되면 window.DITTO_WISHES = [{ n: 번호, t: '글' }, …] 로 목록을, window.DITTO_WISH_SEND = function (글) { return Promise } 로 보내기를 넘기면 된다 */
  function wish() {
    var box = $('#xWishR'), form = $('#xWishF'), inp = $('#xWishIn'); if (!box || !form || !inp) return;
    var real = window.DITTO_WISHES && window.DITTO_WISHES.length ? window.DITTO_WISHES : null, live = false, len = $('#xWishLen'), msg = $('#xWishMsg'), btn = $('button', form);
    var SAMPLE = ['친구랑 같이 쓰는 달력 위젯이 있으면 좋겠어요', '플래터 바탕을 요일마다 다르게 걸고 싶어요', '디토한 위젯만 모아 보는 서랍', '방명록에 그림으로 답하기', '주파수가 열리면 둘만의 위젯이 생겼으면', '여행 간 날은 지도 위젯으로 남기고 싶어요', '친구 생일을 미리 알려 주는 위젯', '음악 위젯에서 친구랑 같이 듣기', '안드로이드에서도 쓰고 싶어요', '플래터를 계절마다 통째로 보관하기', '그룹 대화에서 투표하기', '위젯에 손글씨로 메모하기', '오늘 기분을 색으로만 남기기', '친구 플래터에 스티커 붙이고 가기', '같이 찍은 사진을 한 롤로 모아 보기', '홈 화면 위젯을 더 크게', '읽은 책 한 줄을 남기는 위젯', '운동 기록을 친구와 나란히 보기', '디토한 사람들끼리 작은 방이 열리면 좋겠어요', '영상 위젯에 자막 달기', '다크 모드 테마가 더 많았으면', '친구와 만난 날 도장 찍기', '내 플래터를 포스터로 뽑기', '위젯 크기를 더 자유롭게 바꾸기'];
    var IC = ['ditto', 'group', 'comment', 'guest', 'reaction', 'invite', 'near'], mine = [];
    try { mine = JSON.parse(localStorage.getItem('ditto.wish') || '[]') || []; } catch (e) { mine = []; }
    function card(t, i, tag, own) {
      var d = document.createElement('div'); d.className = 'x-wish-c ' + (own ? 'mine' : 'c' + (1 + (i * 7 + (i >> 1)) % 4));
      d.innerHTML = '<p><i class="x-ic t-' + IC[(i * 3 + 1) % IC.length] + '"></i><span></span></p><b></b>'; $('span', d).textContent = tag; $('b', d).textContent = t; return d;
    }
    function build() {
      box.textContent = '';
      /* 남긴 바람이 예시보다 적으면 둘을 섞고(남긴 글 2 : 예시 1), 예시 수를 넘으면 남긴 글만 보여 준다 */
      var R = (real || []).filter(function (w) { return mine.indexOf(w.t) < 0; }).map(function (w) { return { t: w.t, tag: Number(w.n).toLocaleString('ko-KR') + '번째 바람' }; });
      var S = SAMPLE.map(function (t) { return { t: t, tag: '예시' }; }), rest = [];
      if (R.length >= SAMPLE.length) rest = R;
      else { var ri = 0, si = 0; while (ri < R.length || si < S.length) { if (ri < R.length && (rest.length % 3 !== 2 || si >= S.length)) rest.push(R[ri++]); else rest.push(S[si++]); } }
      var list = mine.map(function (t) { return { t: t, tag: '내가 남긴 바람', own: true }; }).concat(rest);
      var cols = [[], [], []]; list.forEach(function (w, i) { cols[i % 3].push([w, i]); });
      cols.forEach(function (col) {
        var c = document.createElement('div'); c.className = 'x-wish-col';
        for (var k = 0; k < (RM ? 1 : 2); k++) col.forEach(function (x) { var el = card(x[0].t, x[1], x[0].tag, x[0].own); if (k) el.setAttribute('aria-hidden', 'true'); c.appendChild(el); });
        box.appendChild(c);
      });
    }
    function count() { var v = inp.value.trim(); len.textContent = inp.value.length + '/60'; btn.disabled = v.length < 2; }
    inp.addEventListener('input', count);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); if (!btn.disabled) form.requestSubmit ? form.requestSubmit() : btn.click(); } });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var v = inp.value.replace(/\s+/g, ' ').trim(); if (v.length < 2) return;
      var done = function (saved) {
        mine.unshift(v); mine = mine.slice(0, 5); try { localStorage.setItem('ditto.wish', JSON.stringify(mine)); } catch (er) { /* 저장을 못 해도 화면에는 보인다 */ }
        inp.value = ''; count(); build(); msg.textContent = saved ? '남겨 주셔서 고마워요. 꼼꼼히 읽을게요.' : '남겼어요. 아직은 이 기기에서만 보여요.';
      };
      var send = typeof window.DITTO_WISH_SEND === 'function' ? window.DITTO_WISH_SEND : live ? function (t) { return rpc('post_landing_wish', { p_body: t }); } : null;
      if (send) { var sendFn = send; btn.disabled = true; Promise.resolve(sendFn(v)).then(function () { done(true); load(); ga('wish_post'); }, function () { btn.disabled = false; msg.textContent = '지금은 보내지 못했어요. 잠시 뒤에 다시 눌러 주세요.'; }); }
      else done(false);
    });
    function load() {
      return rpc('landing_wishes_list', { p_limit: 60 }).then(function (r) {
        live = true; real = (r && r.rows) || [];
        if (msg && !msg.dataset.said) msg.textContent = real.length >= SAMPLE.length ? '이름 없이 모여요. 한 번 남긴 글은 고치거나 지울 수 없어요.' : '남겨 주신 바람과 예시가 함께 흘러요. 이름 없이 모여요.';
        build();
      }, function () { /* 서버 함수가 아직 없으면 예시와 이 기기의 글만 */ });
    }
    form.addEventListener('submit', function () { if (msg) msg.dataset.said = '1'; });
    if (real && msg) msg.textContent = '이름 없이 모여요. 한 번 남긴 글은 고치거나 지울 수 없어요.';
    count(); build(); seen(box, load, 0.01);
  }

  /* ── 첫 화면 글: 내려가는 만큼 위로 흐려지며 물러난다 (toss.im 첫 화면의 물러남: 40px · 투명도) ── */
  function heroOut() {
    var t = $('.fx-hero3-t'), sec = $('#top'); if (!t || !sec || RM) return;
    var tick = false;
    function set() { tick = false; var h = Math.max(1, sec.offsetHeight * 0.55), q = clamp((scrollY - 40) / h); t.style.setProperty('--out', (q * q * (3 - 2 * q)).toFixed(3)); }
    addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(set); } }, { passive: true });
    set();
  }

  /* ── 사진은 화면에 그릴 때 따로 풀게 한다 (스크롤 중에 사진을 푸느라 멈칫하지 않게) ── */
  function lazyDecode() { $$('img').forEach(function (im) { if (!im.complete) im.decoding = 'async'; }); }

  var fns = [widgets, ditto, island, warp, heroType, stickers, wall, members, cover, far, ticketPreview, flow, android, roll, wish, heroOut, lazyDecode];
  window.__dittoX = fns;
  function boot() { fns.forEach(function (fn) { try { fn(); } catch (e) { if (window.console) console.error('[v8 x]', fn.name, e); } }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
