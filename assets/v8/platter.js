/* Ditto! v8 · platter.js → window.DittoPlatter
 *
 * 플래터 컨트롤러 — 진짜 플래터를 페이지에 놓고, 배치가 바뀌면 부드럽게 옮기고(FLIP · transform),
 * 편집 모드에서는 앱처럼 끌어 옮기고 핸들로 크기를 바꾼다. 규칙 계산은 전부 DittoGrid(platter-grid.js)가 한다.
 *
 * 앱에서 옮긴 것 (prj_Ditto!/DittoPrototype):
 *   A  = Model/AppState.swift            beginDrag·updateDrag·endDrag 2388-2526 · beginResize·updateResize·endResize 2539-2622
 *   B  = Views/PlatterGridBoard.swift    편집 표시(점·고스트·선택 테두리·🗑·핸들) 59-61 · 144-188 · 202-241 · 262-318
 *   I  = Views/PlatterInteraction.swift  꾹 누르기 0.18초 · 허용 움직임 10pt 20-33, 핸들은 바로 76-82
 *   M  = DesignSystem/Foundations/Motion.swift  Motion.settle·push = smooth 0.35 · appear = smooth 0.4 · lift = snappy 0.3 · DDSMotion.sheet = spring(0.35, 0.86)
 *
 * 터치에서 페이지 스크롤을 뺏지 않는 방법 (앱과 같은 문법):
 *   위젯을 0.18초 꾹 누르고 있으면(그동안 10px 넘게 움직이지 않으면) 끌기가 시작된다. 그 전에 손가락이 움직이면 페이지가 그대로 스크롤된다.
 *   끌기가 시작된 뒤에만 touchmove 를 막는다. 마우스는 누른 채 4px 움직이면 바로 끌기 (꾹 누르고 있어도 시작).
 *   크기 핸들(44px)은 앱처럼 누르는 즉시 시작한다 (touch-action: none 은 핸들에만).
 *
 * DittoPlatter.create(rootEl, opts) → instance
 *   opts: widgets [{id, kind, x, y, w, h, data, …}] · editable=false · showGrid=false · onChange({type, id, layout}) · maxRows (기본 48)
 *         minRows (기본 0 = 내용 높이. 앱의 빈 캔버스 높이는 16) · resizeSnap 'cells'(앱의 핸들) | 'sizes'(크기 칩 크기만)
 *         removable=true (선택한 위젯의 🗑) · holdToEdit=false (보기 모드에서 0.5초 꾹 → 편집 모드, 앱 I:22)
 *         autoScroll=true (끄는 중 화면 위아래 56px 안에서 최대 420px/s 로 페이지를 민다, B:125-142)
 *         renderer (기본 window.DittoWidgets) · onSelect(id|null) · onInteract({phase:'start'|'end', kind:'move'|'resize', id})
 */
(function () {
  'use strict';

  // ───────── 모션 (M:58-65 · M:13-20) ─────────
  // SwiftUI .smooth(duration: d) = 튕김 없는 스프링(response d, 감쇠비 1), .snappy(duration: d) = 감쇠비 0.85.
  function spring(response, damping) {
    var w = 2 * Math.PI / response;
    var T = damping >= 1 ? 9.233 / w : 6.908 / (damping * w);      // 남은 거리가 0.1% 아래로 내려가는 때
    return { w: w, z: Math.min(damping, 1), T: T, response: response };
  }
  var MOTION = {
    settle: spring(0.35, 1),     // Motion.settle — 놓기 · 삭제 · 되돌리기
    push: spring(0.35, 1),       // Motion.push   — 끄는 동안 밀려나는 위젯
    appear: spring(0.40, 1),     // Motion.appear — 새 위젯
    lift: spring(0.30, 0.85),    // Motion.lift   — 들어 올리기
    sheet: spring(0.35, 0.86)    // DDSMotion.sheet — 편집 모드 드나들기
  };
  // 목표까지 남은 거리 x0, 속도 v0 에서 t 초 뒤의 [남은 거리, 속도]
  function springAt(sp, t, x0, v0) {
    var w = sp.w, z = sp.z;
    if (z >= 1) {
      var B = v0 + w * x0, e = Math.exp(-w * t);
      return [(x0 + B * t) * e, (B - w * (x0 + B * t)) * e];
    }
    var wd = w * Math.sqrt(1 - z * z), C = (v0 + z * w * x0) / wd, en = Math.exp(-z * w * t);
    var c = Math.cos(wd * t), s = Math.sin(wd * t);
    return [en * (x0 * c + C * s), en * (-z * w * (x0 * c + C * s) + wd * (C * c - x0 * s))];
  }
  function easeString(sp) {      // CSS linear() — scale · opacity · 높이 전환에 쓴다
    var n = 24, out = [];
    for (var i = 0; i <= n; i++) out.push((1 - springAt(sp, sp.T * i / n, 1, 0)[0]).toFixed(4));
    out[n] = '1';
    return 'linear(' + out.join(',') + ')';
  }
  var LINEAR_OK = false;
  try { LINEAR_OK = !!(window.CSS && CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)')); } catch (e) { /* 옛 브라우저 */ }
  var reduceMq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reduced() { return !!(reduceMq && reduceMq.matches); }

  var HOLD_EDIT = 180, HOLD_BROWSE = 500;   // I:22 — 편집 중 0.18초, 보기 모드에서 편집 진입 0.5초
  var SLOP_TOUCH = 10, SLOP_MOUSE = 4;      // I:23 — 허용 움직임 10pt
  var TOUCH_LIFT = 20;                      // A:2411 — 끄는 위젯은 손가락보다 20pt 위에 뜬다 (터치만)
  var EDGE = 56, EDGE_SPEED = 420;          // B:131 · B:137
  var EDIT_PAD_ROWS = 3;                    // B:59-61 — 끄는 동안 아래로 늘릴 수 있는 여유 3줄

  // ───────── 값 하나(자리 또는 크기)의 움직임 ─────────
  // 쉬는 값은 cqw 로 style 에 두고, 움직이는 동안만 px 키프레임(WAAPI)을 얹는다. 도중에 목표가 바뀌면
  // 지금 위치와 속도를 식으로 구해(스타일을 읽지 않는다) 이어서 간다 — SwiftUI 스프링이 목표를 바꿀 때와 같다.
  function Track(el, rest, frame) {
    this.el = el; this.rest = rest; this.frame = frame; this.val = null; this.a = null;
  }
  Track.prototype.read = function () {
    var a = this.a, n = this.val ? this.val.length : 0, i, p = [], v = [];
    if (!a) { for (i = 0; i < n; i++) { p.push(this.val[i]); v.push(0); } return { p: p, v: v }; }
    var ct = a.wa.currentTime;
    var t = ((ct == null ? 0 : ct) - a.delay) / 1000;
    if (t <= 0) return { p: a.from.slice(), v: a.v0.slice() };
    if (t >= a.sp.T) { for (i = 0; i < n; i++) { p.push(a.to[i]); v.push(0); } return { p: p, v: v }; }
    for (i = 0; i < n; i++) {
      var s = springAt(a.sp, t, a.from[i] - a.to[i], a.v0[i]);
      p.push(a.to[i] + s[0]); v.push(s[1]);
    }
    return { p: p, v: v };
  };
  Track.prototype.stop = function () {
    if (this.a) { var wa = this.a.wa; this.a = null; try { wa.cancel(); } catch (e) { /* 이미 끝남 */ } }
  };
  Track.prototype.jump = function (vals) {
    this.stop(); this.val = vals.slice(); this.rest(this.el, vals);
  };
  /** 목표를 vals 로. sp 가 없거나 scale 이 0 이면 바로 놓는다. 움직임이 있으면 Animation 을 돌려준다. */
  Track.prototype.to = function (vals, sp, scale, delay, startFrom) {
    if (!this.val || !sp || !scale || !this.el.animate || reduced()) { this.jump(vals); return null; }
    var cur = startFrom ? { p: startFrom, v: vals.map(function () { return 0; }) } : this.read();
    this.stop();
    this.val = vals.slice(); this.rest(this.el, vals);
    var i, moving = false;
    for (i = 0; i < vals.length; i++) if (Math.abs(cur.p[i] - vals[i]) > 0.05 || Math.abs(cur.v[i]) > 2) moving = true;
    if (!moving) return null;
    var T = sp.T, n = Math.max(8, Math.round(T * 60)), frames = [];
    for (var k = 0; k <= n; k++) {
      var p = [];
      for (i = 0; i < vals.length; i++) p.push(k === n ? vals[i] : vals[i] + springAt(sp, T * k / n, cur.p[i] - vals[i], cur.v[i])[0]);
      frames.push(this.frame(p, scale));
    }
    var wa = this.el.animate(frames, { duration: T * 1000, delay: delay || 0, fill: 'backwards', easing: 'linear' });
    var self = this, rec = { wa: wa, sp: sp, from: cur.p, to: vals.slice(), v0: cur.v, delay: delay || 0 };
    this.a = rec;
    wa.onfinish = function () { if (self.a === rec) self.a = null; };
    return wa;
  };

  function cq(n, DW) { return (n * 100 / DW).toFixed(4) + 'cqw'; }
  function done(wa) {            // 끝나거나 취소되면 풀리는 약속
    if (!wa || !wa.finished) return Promise.resolve();
    return wa.finished.then(function () { }, function () { });
  }
  function make(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }

  // ───────── 인스턴스 ─────────
  function create(root, opts) {
    var G = window.DittoGrid;
    if (!G) throw new Error('DittoPlatter: platter-grid.js(DittoGrid)를 먼저 불러 주세요');
    if (!root || root.nodeType !== 1) throw new Error('DittoPlatter.create: 루트 요소가 필요해요');
    opts = opts || {};
    var RND = opts.renderer || window.DittoWidgets || null;
    var DW = G.DESIGN_W, UNIT = G.UNIT, GUT = G.GUT;
    var maxRows = Math.max(2, Math.min(G.MAX_ROWS, opts.maxRows || G.MAX_ROWS));
    var minRows = Math.min(maxRows, opts.minRows || 0);
    var snapMode = opts.resizeSnap === 'sizes' ? 'sizes' : 'cells';
    var removable = opts.removable !== false;
    var autoScroll = opts.autoScroll !== false;

    var items = [], byId = {};
    var st = { editable: false, grid: false, selected: null, dead: false };
    var drag = null, rez = null, pend = null, raf = 0, lastTick = 0, simToken = 0;
    var scale = 0;                                   // 디자인 1px 이 화면에서 몇 px 인지
    var offs = [];                                   // 해제할 리스너

    function on(target, type, fn, o) { target.addEventListener(type, fn, o); offs.push(function () { target.removeEventListener(type, fn, o); }); }
    function emit(name, arg) { var fn = opts[name]; if (typeof fn === 'function') { try { fn(arg); } catch (e) { if (window.console) console.error(e); } } }
    function c(n) { return cq(n, DW); }

    // DOM
    var hadDpl = root.classList.contains('dpl');
    root.classList.add('dpl', 'dpl-grid');
    var sizer = make('div', 'dpl-sizer'), dots = make('div', 'dpl-dots'), ghost = make('div', 'dpl-ghost');
    var del = make('button', 'dpl-del'), handle = make('span', 'dpl-handle');
    sizer.setAttribute('aria-hidden', 'true'); dots.setAttribute('aria-hidden', 'true'); ghost.setAttribute('aria-hidden', 'true');
    del.type = 'button'; del.setAttribute('aria-label', '위젯 삭제');                 // B:273
    handle.setAttribute('aria-hidden', 'true'); handle.title = '위젯 크기 조절';       // B:298 (키보드는 Shift + 화살표)
    handle.appendChild(make('i'));
    root.appendChild(sizer); root.appendChild(dots); root.appendChild(ghost);
    if (LINEAR_OK) {
      ['settle', 'appear', 'lift', 'sheet'].forEach(function (k) {
        root.style.setProperty('--dpl-e-' + k, easeString(MOTION[k]));
        root.style.setProperty('--dpl-t-' + k, Math.round(MOTION[k].T * 1000) + 'ms');
      });
    }
    var ghostPos = new Track(ghost, restPos, framePos), ghostSize = new Track(ghost, restSize, frameSize);

    function restPos(el, v) { el.style.transform = 'translate(' + c(v[0]) + ',' + c(v[1]) + ')'; }
    function framePos(v, s) { return { transform: 'translate(' + (v[0] * s).toFixed(2) + 'px,' + (v[1] * s).toFixed(2) + 'px)' }; }
    function restSize(el, v) { el.style.width = c(v[0]); el.style.height = c(v[1]); }
    function frameSize(v, s) { return { width: (v[0] * s).toFixed(2) + 'px', height: (v[1] * s).toFixed(2) + 'px' }; }

    function measure() { var w = root.getBoundingClientRect().width; scale = w / DW; return scale; }
    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function (es) { var w = es[0] && es[0].contentRect ? es[0].contentRect.width : 0; scale = w / DW; });
      ro.observe(root);
    } else on(window, 'resize', measure);
    measure();

    // ───────── 위젯 한 칸 ─────────
    function plain(it) { return { id: it.id, kind: it.kind, x: it.x, y: it.y, w: it.w, h: it.h }; }
    function layout() { return items.map(plain); }
    function syncWidget(it) { it.widget.x = it.x; it.widget.y = it.y; it.widget.w = it.w; it.widget.h = it.h; }
    function label(it) {      // B:226 — "열 n, 행 n, w×h"
      var name = it.widget.name || (it.widget.data && (it.widget.data.title || it.widget.data.text)) || it.kind;
      it.el.setAttribute('aria-label', String(name).slice(0, 40) + ' · 열 ' + (it.x + 1) + ', 행 ' + (it.y + 1) + ', ' + it.w + '×' + it.h);
    }
    function applyBox(it) {
      var bs = null;
      try { bs = RND && RND.boxStyle ? RND.boxStyle(it.widget) : null; } catch (e) { bs = null; }
      var r = bs && typeof bs.radius === 'number' ? bs.radius : G.radius(it.kind, it.w, it.h);
      it.el.style.setProperty('--dpl-r', c(r));
      var line = '', glow = '';
      if (RND && RND.applyBox) {
        // DittoWidgets 가 상자에 종류 클래스 · 바탕 · 모서리 · 1px 테두리(dw-hl) · 후광(dw-glow)을 직접 입힌다 (platter.css)
        try { RND.applyBox(it.box, it.widget); } catch (e) { if (window.console) console.error(e); }
      } else {
        it.box.className = 'dw dw-' + (/^[a-zA-Z]+$/.test(it.kind) ? it.kind : 'x');
        it.box.style.background = bs && bs.background ? bs.background : '';
        if (bs && bs.border) line = typeof bs.border === 'string' ? bs.border : (bs.border.color || '');
        if (bs && bs.glow) {
          var g = bs.glow;
          glow = typeof g === 'string' ? g : c(g.x || 0) + ' ' + c(g.y || 0) + ' ' + c(g.blur || 0) + ' ' + c(g.spread || 0) + ' ' + (g.color || 'transparent');
        }
      }
      if (line) it.ring.style.setProperty('--dpl-line', line); else it.ring.style.removeProperty('--dpl-line');
      if (glow) it.card.style.setProperty('--dpl-glow', glow); else it.card.style.removeProperty('--dpl-glow');
      it.box.setAttribute('data-w', it.w); it.box.setAttribute('data-h', it.h);
      it.el.classList.toggle('is-compact', Math.min(it.w, it.h) <= 2);            // B:265
    }
    function renderContent(it) {
      var node = null;
      try { node = RND && RND.render ? RND.render(it.widget) : null; } catch (e) { if (window.console) console.error(e); }
      it.content = node || null;
      if (node) it.box.appendChild(node);
    }
    function updateContent(it) {
      if (!RND) return;
      try {
        if (RND.update && it.content) RND.update(it.content, it.widget);
        else if (RND.render) { if (it.content && it.content.parentNode) it.content.parentNode.removeChild(it.content); renderContent(it); }
      } catch (e) { if (window.console) console.error(e); }
    }
    function makeItem(wd) {
      var it = { id: wd.id, kind: wd.kind, x: wd.x, y: wd.y, w: wd.w, h: wd.h, widget: {} };
      for (var k in wd) if (Object.prototype.hasOwnProperty.call(wd, k)) it.widget[k] = wd[k];
      it.el = make('div', 'dpl-item'); it.card = make('div', 'dpl-card'); it.box = make('div', 'dw'); it.ring = make('i', 'dpl-ring');
      it.el.setAttribute('data-id', it.id); it.el.setAttribute('role', 'group'); it.el.setAttribute('aria-roledescription', '위젯');
      it.card.appendChild(it.box); it.card.appendChild(it.ring); it.el.appendChild(it.card);
      it.pos = new Track(it.el, restPos, framePos);
      it.size = new Track(it.el, restSize, frameSize);
      it.pos.jump([G.px(it.x), G.px(it.y)]);
      it.size.jump([G.pw(it.w), G.pw(it.h)]);
      applyBox(it); renderContent(it); label(it);
      if (st.editable) it.el.tabIndex = 0;
      byId[it.id] = it;
      return it;
    }
    function dropItem(it) {
      it.pos.stop(); it.size.stop();
      if (it.fly) { try { it.fly.cancel(); } catch (e) { /* 끝남 */ } }
      if (it.el.parentNode) it.el.parentNode.removeChild(it.el);
      delete byId[it.id];
    }

    function fade(el, from, to, sp) {            // 새 위젯은 서서히 나타나고(A:2800) 지운 위젯은 서서히 사라진다(A:2884)
      return el.animate([{ opacity: from }, { opacity: to }], { duration: sp.T * 1000, easing: LINEAR_OK ? easeString(sp) : 'ease-out', fill: to === 0 ? 'forwards' : 'none' });
    }
    function leave(it, animate) {                // 목록에서는 이미 빠진 위젯의 요소를 걷어 낸다
      var gone = function () { it.pos.stop(); it.size.stop(); if (it.el.parentNode) it.el.parentNode.removeChild(it.el); return true; };
      if (it.fly) { try { it.fly.cancel(); } catch (e) { /* 끝남 */ } it.fly = null; }
      if (animate === false || reduced() || !it.el.animate) return Promise.resolve(gone());
      it.el.classList.add('is-leaving');
      it.el.removeAttribute('tabindex');
      return done(fade(it.el, 1, 0, MOTION.settle)).then(gone);
    }

    // ───────── 높이 (S:26-29 · B:59-61) ─────────
    function shownRows(list, extraBottom) {
      var b = Math.max(G.contentRows(list), extraBottom || 0);
      return Math.max(1, Math.min(maxRows, Math.max(minRows, b)));
    }
    var heightRows = -1;
    function setHeight(n, animate) {
      if (n === heightRows) return;
      heightRows = n;
      if (animate === false || reduced()) {
        sizer.style.transition = 'none'; sizer.style.height = c(G.pw(n));
        void sizer.offsetHeight; sizer.style.transition = '';
      } else sizer.style.height = c(G.pw(n));
    }

    // ───────── 배치 적용 ─────────
    /** nl 의 자리·크기로 모든 위젯을 옮긴다 (자리는 transform, 크기는 그 위젯 하나의 width·height). o: {spring, animate, stagger} */
    function commit(nl, o) {
      o = o || {};
      var sp = o.animate === false ? null : (o.spring || MOTION.settle);
      var waits = [], order = {}, sorted = nl.slice().sort(function (a, b) { return a.y - b.y || a.x - b.x; });
      sorted.forEach(function (n, i) { order[n.id] = i; });
      var next = [];
      nl.forEach(function (n) {
        var it = byId[n.id];
        if (!it) return;
        var resized = it.w !== n.w || it.h !== n.h;
        it.x = n.x; it.y = n.y; it.w = n.w; it.h = n.h; syncWidget(it);
        var delay = o.stagger ? order[n.id] * o.stagger : 0;
        if (it.fly) { try { it.fly.cancel(); } catch (e) { /* 끝남 */ } it.fly = null; }
        waits.push(done(it.pos.to([G.px(n.x), G.px(n.y)], sp, scale, delay)));
        if (resized || it.size.a || (it.size.val && (Math.abs(it.size.val[0] - G.pw(n.w)) > 0.01 || Math.abs(it.size.val[1] - G.pw(n.h)) > 0.01))) {
          waits.push(done(it.size.to([G.pw(n.w), G.pw(n.h)], sp, scale, delay)));
        }
        if (resized) { applyBox(it); updateContent(it); }
        label(it);
        next.push(it);
      });
      items = next;
      setHeight(shownRows(nl), o.animate !== false);
      return Promise.all(waits);
    }

    // ───────── 선택 · 편집 표시 ─────────
    function select(id) {
      if (id != null && !byId[id]) id = null;
      if (st.selected === id) return;
      var prev = st.selected && byId[st.selected];
      if (prev) prev.el.classList.remove('is-selected');
      if (del.parentNode) del.parentNode.removeChild(del);
      if (handle.parentNode) handle.parentNode.removeChild(handle);
      st.selected = id;
      if (id != null) {
        var it = byId[id];
        it.el.classList.add('is-selected');
        if (st.editable) { if (removable) it.el.appendChild(del); it.el.appendChild(handle); }
      }
      emit('onSelect', id);
    }
    function setEditable(v) {
      v = !!v;
      if (st.editable === v) return;
      cancelInteraction();
      if (!v) select(null);
      st.editable = v;
      root.classList.toggle('is-editing', v);                                      // 앱은 DDSMotion.sheet 로 드나든다 (A:2363 · A:2367)
      items.forEach(function (it) { if (v) it.el.tabIndex = 0; else it.el.removeAttribute('tabindex'); });
      if (v && st.selected != null && byId[st.selected]) {
        if (removable) byId[st.selected].el.appendChild(del);
        byId[st.selected].el.appendChild(handle);
      }
    }
    function setGridVisible(v) { st.grid = !!v; root.classList.toggle('is-grid', st.grid); }

    // ───────── 고스트 (B:162-188) ─────────
    function showGhost(x, y, w, h, it, valid, fill, first) {
      var r = null;
      if (RND && RND.boxStyle) {
        try {
          var probe = {};
          for (var k in it.widget) if (Object.prototype.hasOwnProperty.call(it.widget, k)) probe[k] = it.widget[k];
          probe.w = w; probe.h = h;
          var b = RND.boxStyle(probe);
          if (b && typeof b.radius === 'number') r = b.radius;
        } catch (e) { r = null; }
      }
      ghost.style.setProperty('--dpl-r', c(r == null ? G.radius(it.kind, w, h) : r));   // B:165-166 — 위젯과 같은 반경
      ghost.classList.toggle('is-bad', !valid);
      ghost.classList.toggle('is-fill', !!fill);
      if (first) { ghostPos.jump([G.px(x), G.px(y)]); ghostSize.jump([G.pw(w), G.pw(h)]); ghost.classList.add('is-on'); }
      else { ghostPos.to([G.px(x), G.px(y)], MOTION.push, scale); ghostSize.to([G.pw(w), G.pw(h)], MOTION.push, scale); }
    }
    function hideGhost() { ghost.classList.remove('is-on'); }

    function pointIn(cx, cy) {
      var r = root.getBoundingClientRect(), s = r.width / DW || 1;
      scale = r.width / DW;
      return { x: (cx - r.left) / s, y: (cy - r.top) / s, rect: r };
    }
    function previewOthers(moverId, map) {
      items.forEach(function (it) {
        if (it.id === moverId) return;
        var p = map && map[it.id] ? map[it.id] : it;
        it.pos.to([G.px(p.x), G.px(p.y)], MOTION.push, scale);               // A:2444 · A:2592
      });
    }
    function interacting(on, kind, id) {
      root.classList.toggle('is-interacting', on);
      emit('onInteract', { phase: on ? 'start' : 'end', kind: kind, id: id });
    }

    // ───────── 끌어 옮기기 (A:2388-2526) ─────────
    function beginDrag(id, p, lift) {
      var it = byId[id];
      if (!it || drag || rez) return false;
      select(id);
      var top = { x: G.px(it.x), y: G.px(it.y) };
      drag = {
        id: id, it: it, origin: { x: it.x, y: it.y }, cell: { x: it.x, y: it.y }, valid: true, map: null,
        entry: { x: 0, y: 1 },                                                     // A:2397
        grab: { x: p.x - top.x, y: p.y - top.y }, prev: { x: top.x, y: top.y }, lift: lift || 0,
        // 한 번 끌어서 내려갈 수 있는 끝 = 지금 보이는 줄 + 3줄 (앱의 보드 높이 B:59-61). 끝없이 늘어나지 않게 한다.
        rowEnd: Math.max(it.y + it.h, Math.min(maxRows, shownRows(layout()) + EDIT_PAD_ROWS))
      };
      it.pos.jump([top.x, top.y]);
      it.el.classList.add('is-dragging');
      interacting(true, 'move', id);
      recomputeDrag(true);
      return true;
    }
    function updateDrag(p) {
      var d = drag;
      if (!d || !isFinite(p.x) || !isFinite(p.y)) return;
      var nx = p.x - d.grab.x, ny = p.y - d.grab.y - d.lift;                       // A:2410-2411
      d.entry.x = d.entry.x * 0.7 + (nx - d.prev.x) * 0.3;                         // A:2412-2413
      d.entry.y = d.entry.y * 0.7 + (ny - d.prev.y) * 0.3;
      d.prev = { x: nx, y: ny };
      d.it.pos.jump([nx, ny]);
      var col = Math.max(0, Math.min(G.COLS - d.it.w, Math.round(nx / UNIT)));     // A:2425-2426
      var row = Math.max(0, Math.min(d.rowEnd - d.it.h, Math.round(ny / UNIT)));
      if (col !== d.cell.x || row !== d.cell.y) { d.cell = { x: col, y: row }; recomputeDrag(false); }
    }
    function recomputeDrag(first) {
      var d = drag, it = d.it;
      var r = G.preview(layout(), d.id, { x: d.cell.x, y: d.cell.y, w: it.w, h: it.h },
        { dirs: G.entryDirs(d.entry.x, d.entry.y), origin: d.origin, maxRows: maxRows });   // A:2439-2448
      d.valid = r.valid; d.map = r.valid ? r.map : null; d.result = r.valid ? r.layout : null;
      previewOthers(d.id, d.map);
      showGhost(d.cell.x, d.cell.y, it.w, it.h, it, d.valid, true, first);
      setHeight(shownRows(d.result || layout(), d.cell.y + it.h), true);
    }
    function endDrag(cancel, outside) {
      var d = drag;
      if (!d) return;
      if (!cancel) recomputeDrag(false);                                           // A:2501
      var ok = !cancel && d.valid && !outside && !!d.result;                       // A:2502-2505
      var before = layout(), target = ok ? d.result : before;
      drag = null;
      d.it.el.classList.remove('is-dragging');
      d.it.el.classList.add('is-settling');
      hideGhost();
      var it = d.it;
      commit(target, { spring: MOTION.settle }).then(function () { it.el.classList.remove('is-settling'); });   // A:2512 · A:2521
      interacting(false, 'move', d.id);
      if (ok && !G.same(before, target)) emit('onChange', { type: 'move', id: d.id, layout: layout() });
    }

    // ───────── 크기 바꾸기 (A:2539-2622) ─────────
    function beginResize(id) {
      var it = byId[id];
      if (!it || drag || rez) return false;
      select(id);
      rez = { id: id, it: it, base: [G.pw(it.w), G.pw(it.h)], snap: { w: it.w, h: it.h }, valid: true, map: null, result: null };
      it.size.jump(rez.base);
      it.el.classList.add('is-resizing');
      interacting(true, 'resize', id);
      showGhost(it.x, it.y, it.w, it.h, it, true, false, true);
      return true;
    }
    function updateResize(dx, dy) {
      var r = rez;
      if (!r || !isFinite(dx) || !isFinite(dy)) return;
      var it = r.it;
      var maxWc = Math.min(G.HANDLE_MAX_W, G.COLS - it.x), maxHc = Math.min(G.HANDLE_MAX_H, maxRows - it.y);   // A:2558
      var minP = G.pw(G.MIN_SIZE);
      function rub(v, mn, mx) {             // A:2562-2570 — 한계를 넘은 만큼은 40%만, 최대 28
        if (v > mx) return mx + Math.min((v - mx) * 0.4, 28);
        if (v < mn) return mn + Math.max((v - mn) * 0.4, -28);
        return v;
      }
      var liveW = rub(r.base[0] + dx, minP, G.pw(maxWc)), liveH = rub(r.base[1] + dy, minP, G.pw(maxHc));
      it.size.jump([liveW, liveH]);
      var s = G.clampSize(it.kind, (liveW + GUT) / UNIT, (liveH + GUT) / UNIT,
        { x: it.x, y: it.y, item: plain(it), snap: snapMode, maxRows: maxRows });     // A:2576-2584
      if (s.w !== r.snap.w || s.h !== r.snap.h) { r.snap = s; recomputeResize(); }
    }
    function recomputeResize() {
      var r = rez, it = r.it;
      var res = G.preview(layout(), r.id, { x: it.x, y: it.y, w: r.snap.w, h: r.snap.h },
        { dirs: G.DIRS, origin: { x: it.x, y: it.y }, maxRows: maxRows });           // A:2588-2590
      r.valid = res.valid; r.map = res.valid ? res.map : null; r.result = res.valid ? res.layout : null;
      previewOthers(r.id, r.map);
      showGhost(it.x, it.y, r.snap.w, r.snap.h, it, r.valid, false, false);
      setHeight(shownRows(r.result || layout(), it.y + r.snap.h), true);
    }
    function endResize(cancel) {
      var r = rez;
      if (!r) return;
      if (!cancel) recomputeResize();                                                // A:2602-2604
      var ok = !cancel && r.valid && !!r.result;
      var before = layout(), target = ok ? r.result : before;
      rez = null;
      r.it.el.classList.remove('is-resizing');
      hideGhost();
      commit(target, { spring: MOTION.settle });                                     // A:2612
      interacting(false, 'resize', r.id);
      if (ok && !G.same(before, target)) emit('onChange', { type: 'resize', id: r.id, layout: layout() });
    }
    function cancelInteraction() {                                                   // A:2530-2536 — 미리보기는 쓰지 않는다
      simToken++;
      clearPend();
      if (drag) endDrag(true);
      if (rez) endResize(true);
      stopLoop();
    }

    // ───────── 포인터 ─────────
    var ptr = { id: null, x: 0, y: 0, type: '', dirty: false };
    function clearPend() { if (pend) { clearTimeout(pend.timer); pend = null; } }
    function capture(el, id) { try { el.setPointerCapture(id); } catch (e) { /* 이미 놓음 */ } }
    function startLoop() { if (!raf) { lastTick = 0; raf = requestAnimationFrame(tick); } }
    function stopLoop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    function tick(now) {
      raf = 0;
      if (!drag && !rez) return;
      var dt = lastTick ? Math.min(Math.max((now - lastTick) / 1000, 0), 1 / 30) : 1 / 60;   // I:150
      lastTick = now;
      if (drag && !drag.sim) {
        if (autoScroll && ptr.id != null) edgeScroll(dt);
        if (ptr.dirty) { ptr.dirty = false; updateDrag(pointIn(ptr.x, ptr.y)); }
      } else if (rez && !rez.sim && ptr.dirty) {
        ptr.dirty = false;
        var s = scale || 1;
        updateResize((ptr.x + window.pageXOffset - rez.sx) / s, (ptr.y + window.pageYOffset - rez.sy) / s);
      }
      if (drag || rez) raf = requestAnimationFrame(tick);
    }
    function edgeScroll(dt) {                                                       // B:125-142
      var vh = window.innerHeight, r = root.getBoundingClientRect(), v = 0;
      if (ptr.y < EDGE && r.top < 0) v = -Math.min(1, (EDGE - ptr.y) / EDGE);
      else if (ptr.y > vh - EDGE && r.bottom > vh) v = Math.min(1, (ptr.y - (vh - EDGE)) / EDGE);
      if (!v) return;
      var before = window.pageYOffset;
      window.scrollBy(0, v * EDGE_SPEED * dt);
      if (window.pageYOffset !== before) ptr.dirty = true;                          // A:2450-2469 — 스크롤된 만큼 다시 계산
    }

    function activateMove() {
      var p = pend;
      if (!p) return;
      pend = null;
      if (!st.editable) {                                                           // I:42-44 — 꾹 눌러 편집 모드로
        if (!opts.holdToEdit) return;
        setEditable(true);
      }
      var touch = p.type !== 'mouse';
      var at = touch ? pointIn(ptr.x, ptr.y) : pointIn(p.sx, p.sy);
      if (!beginDrag(p.id, at, touch ? TOUCH_LIFT : 0)) return;
      ptr.id = p.pointerId;
      capture(byId[p.id].el, p.pointerId);
      ptr.dirty = true;
      startLoop();
    }
    function onDown(e) {
      if (st.dead) return;
      if ((drag && drag.sim) || (rez && rez.sim)) cancelInteraction();          // 자동 시연 중이면 멈추고 손을 따른다
      if (drag || rez || pend) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      var t = e.target, hEl = t.closest ? t.closest('.dpl-handle') : null;
      if (hEl && st.editable && st.selected != null && root.contains(hEl)) {        // I:76-82 — 핸들은 바로
        e.preventDefault();
        if (!beginResize(st.selected)) return;
        rez.sx = e.clientX + window.pageXOffset; rez.sy = e.clientY + window.pageYOffset;
        ptr.id = e.pointerId; ptr.x = e.clientX; ptr.y = e.clientY; ptr.type = e.pointerType; ptr.dirty = false;
        capture(handle, e.pointerId);
        startLoop();
        return;
      }
      if (t.closest && t.closest('.dpl-del')) return;
      var el = t.closest ? t.closest('.dpl-item') : null;
      if (!el || el.parentNode !== root) { if (st.editable) pend = { canvas: true, pointerId: e.pointerId, sx: e.clientX, sy: e.clientY, type: e.pointerType }; return; }
      if (!st.editable && !opts.holdToEdit) return;
      var id = el.getAttribute('data-id');
      if (!byId[id]) return;
      ptr.x = e.clientX; ptr.y = e.clientY; ptr.type = e.pointerType; ptr.id = null;
      pend = { id: id, pointerId: e.pointerId, sx: e.clientX, sy: e.clientY, type: e.pointerType, timer: 0 };
      pend.timer = setTimeout(activateMove, st.editable ? HOLD_EDIT : HOLD_BROWSE);
      if (e.pointerType === 'mouse') { capture(el, e.pointerId); if (st.editable) e.preventDefault(); if (el.focus) el.focus({ preventScroll: true }); }
    }
    function onMove(e) {
      if (pend && e.pointerId === pend.pointerId) {
        ptr.x = e.clientX; ptr.y = e.clientY;
        if (pend.canvas) return;
        var ddx = e.clientX - pend.sx, ddy = e.clientY - pend.sy;
        var far = Math.sqrt(ddx * ddx + ddy * ddy) > (pend.type === 'mouse' ? SLOP_MOUSE : SLOP_TOUCH);
        if (!far) return;
        if (pend.type === 'mouse' && st.editable) { clearTimeout(pend.timer); activateMove(); }
        else clearPend();                                                           // 터치: 스크롤하려는 손가락이다
        return;
      }
      if ((drag || rez) && e.pointerId === ptr.id) { ptr.x = e.clientX; ptr.y = e.clientY; ptr.dirty = true; }
    }
    function onUp(e) {
      if (pend && e.pointerId === pend.pointerId) {
        var p = pend; clearPend();
        if (!st.editable) return;
        if (p.canvas) { if (Math.abs(e.clientX - p.sx) + Math.abs(e.clientY - p.sy) < SLOP_TOUCH) select(null); }   // B:68 (앱은 편집을 끝낸다)
        else select(p.id);                                                          // B:347-351
        return;
      }
      if (e.pointerId !== ptr.id) return;
      ptr.x = e.clientX; ptr.y = e.clientY; ptr.id = null;
      if (drag && !drag.sim) {
        var pt = pointIn(e.clientX, e.clientY), r = pt.rect, pad = 24;              // A:2502-2504
        updateDrag(pt);
        var out = e.clientX < r.left - pad || e.clientX > r.right + pad || e.clientY < r.top - pad - TOUCH_LIFT;
        endDrag(false, out);
        stopLoop();
      } else if (rez && !rez.sim) {
        var s = scale || 1;
        updateResize((e.clientX + window.pageXOffset - rez.sx) / s, (e.clientY + window.pageYOffset - rez.sy) / s);
        endResize(false);
        stopLoop();
      }
    }
    function onCancel(e) {
      if (pend && e.pointerId === pend.pointerId) { clearPend(); return; }
      if (e.pointerId !== ptr.id) return;
      ptr.id = null;
      if (drag && !drag.sim) { endDrag(true); stopLoop(); }                         // I:55-56
      else if (rez && !rez.sim) { endResize(true); stopLoop(); }
    }
    function busy() { return !!((drag && !drag.sim) || (rez && !rez.sim)); }
    on(root, 'pointerdown', onDown);
    on(root, 'pointermove', onMove);
    on(root, 'pointerup', onUp);
    on(root, 'pointercancel', onCancel);
    on(root, 'lostpointercapture', onCancel);     // 손을 떼는 신호 없이 포인터를 잃으면 되돌린다 (정상 종료 뒤에는 ptr.id 가 비어 있어 무시)
    on(root, 'touchmove', function (e) { if (busy() && e.cancelable) e.preventDefault(); }, { passive: false });
    on(root, 'contextmenu', function (e) { if (busy() || (pend && pend.type !== 'mouse')) e.preventDefault(); });
    on(root, 'selectstart', function (e) { if (st.editable) e.preventDefault(); });
    on(root, 'dragstart', function (e) { if (st.editable) e.preventDefault(); });
    on(root, 'click', function (e) {        // 편집 중에는 위젯 안의 동작(재생·링크)이 눌리지 않게 — 앱도 편집 중 탭은 선택뿐이다 (B:347-351)
      if (!st.editable) return;
      var t = e.target;
      if (t.closest && t.closest('.dpl-del')) { e.preventDefault(); if (st.selected != null) api.remove(st.selected); return; }
      if (t.closest && t.closest('.dpl-item')) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    on(root, 'focusin', function (e) {
      if (!st.editable || drag || rez) return;
      var el = e.target.closest ? e.target.closest('.dpl-item') : null;
      if (el && el === e.target && el.parentNode === root) select(el.getAttribute('data-id'));
    });
    on(root, 'keydown', function (e) {
      if (!st.editable) return;
      if (e.key === 'Escape') { if (drag || rez) cancelInteraction(); else select(null); return; }
      var el = e.target.closest ? e.target.closest('.dpl-item') : null;
      if (!el || el.parentNode !== root || drag || rez) return;
      var it = byId[el.getAttribute('data-id')];
      if (!it) return;
      var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (d) {
        e.preventDefault();
        select(it.id);
        if (e.shiftKey) keyResize(it, d[0], d[1]);
        else api.move(it.id, it.x + d[0], it.y + d[1], { dirs: G.entryDirs(d[0], d[1]) });
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && removable && e.target === el) { e.preventDefault(); api.remove(it.id); }
    });
    // Shift + 화살표 = 핸들을 한 칸 끈 것 (같은 규칙 · A:2576-2590). 'sizes' 에서는 그 방향의 다음 허용 크기로.
    function keyResize(it, dx, dy) {
      var w = it.w + dx, h = it.h + dy;
      if (snapMode === 'sizes' || it.kind === 'together') {
        var all = G.sizesFor(it.kind, plain(it)).filter(function (s) {
          return (dx ? (s.w - it.w) * dx > 0 : true) && (dy ? (s.h - it.h) * dy > 0 : true);
        }).sort(function (a, b) { return (Math.abs(a.w - it.w) + Math.abs(a.h - it.h)) - (Math.abs(b.w - it.w) + Math.abs(b.h - it.h)); });
        if (!all.length) return;
        w = all[0].w; h = all[0].h;
      }
      api.resize(it.id, w, h, { mode: 'handle' });
    }

    // ───────── 공개 API ─────────
    function rectOfCells(x, y, w, h) {
      var r = root.getBoundingClientRect(), s = r.width / DW;
      var o = { left: r.left + G.px(x) * s, top: r.top + G.px(y) * s, width: G.pw(w) * s, height: G.pw(h) * s };
      o.right = o.left + o.width; o.bottom = o.top + o.height; o.x = o.left; o.y = o.top;
      return o;
    }
    function raise(it, cls, p) {
      it.el.classList.add(cls);
      return p.then(function (v) { it.el.classList.remove(cls); return v; });
    }
    var api = {
      /** 지금 배치 [{id, kind, x, y, w, h}] (끄는 중이면 확정된 배치) */
      layout: layout,
      /** 배치를 통째로 바꾼다. 목록에 없는 위젯은 지우고, 새 id(kind 가 있는 것)는 만든다. o: {animate=true, duration(ms · 스프링 길이), stagger(ms)} → Promise */
      setLayout: function (nl, o) {
        o = o || {};
        cancelInteraction();
        var keep = {}, waits = [];
        var still = o.animate === false || reduced();
        nl.forEach(function (n) { keep[n.id] = true; });
        items.slice().forEach(function (it) {
          if (keep[it.id]) return;
          if (st.selected === it.id) select(null);
          delete byId[it.id];
          waits.push(leave(it, o.animate));
        });
        items = items.filter(function (it) { return keep[it.id]; });
        nl.forEach(function (n) {
          if (byId[n.id] || !n.kind) return;
          var it = makeItem(n);
          root.appendChild(it.el); items.push(it);
          if (!still && it.el.animate) waits.push(done(fade(it.el, 0, 1, MOTION.appear)));
        });
        var sp = o.duration ? spring(o.duration / 1000, 1) : MOTION.settle;
        waits.push(commit(nl, { spring: sp, animate: o.animate, stagger: o.stagger }));
        return Promise.all(waits).then(function () { });
      },
      /** 옮긴다 (손을 뗄 때와 같은 규칙). o: {animate=true, dirs, duration, silent} → Promise<boolean> (옮겨졌는지) */
      move: function (id, x, y, o) {
        o = o || {};
        cancelInteraction();
        var it = byId[id], before = layout();
        if (!it) return Promise.resolve(false);
        var nl = G.move(before, id, x, y, { dirs: o.dirs, maxRows: maxRows });
        var changed = !G.same(before, nl);
        var p = raise(it, 'is-settling', commit(nl, { spring: o.duration ? spring(o.duration / 1000, 1) : MOTION.settle, animate: o.animate }));
        if (changed && !o.silent) emit('onChange', { type: 'move', id: id, layout: layout() });
        return p.then(function () { return changed; });
      },
      /** 크기를 바꾼다. o.mode 'preset'(기본 · 크기 칩) | 'handle'(핸들). o: {animate=true, duration, silent} → Promise<boolean> */
      resize: function (id, w, h, o) {
        o = o || {};
        cancelInteraction();
        var it = byId[id], before = layout();
        if (!it) return Promise.resolve(false);
        var nl = G.resize(before, id, w, h, { mode: o.mode, snap: o.snap || (o.mode === 'handle' ? snapMode : undefined), maxRows: maxRows });
        var changed = !G.same(before, nl);
        var sp = o.duration ? spring(o.duration / 1000, 1) : (o.mode === 'handle' ? MOTION.settle : MOTION.push);   // A:2612 · A:2648
        var p = raise(it, 'is-settling', commit(nl, { spring: sp, animate: o.animate }));
        if (changed && !o.silent) emit('onChange', { type: 'resize', id: id, layout: layout() });
        return p.then(function () { return changed; });
      },
      /** 위젯을 더한다. 자리는 앱 규칙: 기본 = 첫 빈자리, o.front = 디토해 온 위젯(맨 앞에 놓고 나머지를 아래로).
       *  widget 에 x, y 가 있고 그 자리가 비어 있으면 그대로 둔다 (o.at === false 면 무시).
       *  o.fromRect {left, top, width, height}(화면 좌표)를 주면 그 자리에서 날아와 앉는다.
       *  o: {fromRect, animate=true, front, start, limit, silent} → Promise<{id, kind, x, y, w, h} | null> */
      add: function (wd, o) {
        o = o || {};
        cancelInteraction();
        if (!wd || wd.id == null || byId[wd.id]) return Promise.resolve(null);
        var before = layout(), nl = null;
        var seed = { id: wd.id, kind: wd.kind, w: wd.w, h: wd.h };
        if (o.at !== false && !o.front && wd.x != null && wd.y != null && wd.w && wd.h) {
          var fixed = before.concat([{ id: wd.id, kind: wd.kind, x: wd.x, y: wd.y, w: wd.w, h: wd.h }]);
          if (G.isValid(fixed, maxRows)) nl = fixed;
        }
        if (!nl) nl = G.place(before, seed, { front: !!o.front, start: o.start, limit: o.limit, maxRows: maxRows });
        var placed = null;
        for (var i = 0; i < nl.length; i++) if (nl[i].id === wd.id) placed = nl[i];
        if (!placed) return Promise.resolve(null);
        var full = {};
        for (var k in wd) if (Object.prototype.hasOwnProperty.call(wd, k)) full[k] = wd[k];
        full.x = placed.x; full.y = placed.y; full.w = placed.w; full.h = placed.h;
        var it = makeItem(full);
        root.appendChild(it.el);
        items.push(it);
        var still = o.animate === false || reduced() || !scale || !it.el.animate;
        var waits = [commit(nl, { spring: MOTION.appear, animate: o.animate })];        // A:2800 · A:3097
        if (!still) {
          var T = MOTION.appear.T * 1000;
          if (o.fromRect) {
            var r = root.getBoundingClientRect(), s = scale, fr = o.fromRect;
            var fx = fr.left - r.left, fy = fr.top - r.top, tx = G.px(it.x) * s, ty = G.px(it.y) * s;
            var sx = fr.width / (G.pw(it.w) * s), sy = fr.height / (G.pw(it.h) * s);
            var n = Math.max(8, Math.round(MOTION.appear.T * 60)), frames = [];
            for (var f = 0; f <= n; f++) {
              var q = f === n ? 1 : 1 - springAt(MOTION.appear, MOTION.appear.T * f / n, 1, 0)[0];
              frames.push({ transform: 'translate(' + (fx + (tx - fx) * q).toFixed(2) + 'px,' + (fy + (ty - fy) * q).toFixed(2) + 'px) scale(' + (sx + (1 - sx) * q).toFixed(4) + ',' + (sy + (1 - sy) * q).toFixed(4) + ')' });
            }
            it.fly = it.el.animate(frames, { duration: T, easing: 'linear' });
            root.classList.add('is-receiving');
            waits.push(raise(it, 'is-flying', done(it.fly)).then(function () { it.fly = null; root.classList.remove('is-receiving'); }));
          } else {
            waits.push(done(fade(it.el, 0, 1, MOTION.appear)));
          }
        }
        if (!o.silent) emit('onChange', { type: 'add', id: wd.id, layout: layout() });
        return Promise.all(waits).then(function () { return plain(it); });
      },
      /** 지운다 — 나머지는 제자리 (앱은 자동으로 당겨 올리지 않는다). o: {animate=true, silent} → Promise<boolean> */
      remove: function (id, o) {
        o = o || {};
        cancelInteraction();
        var it = byId[id];
        if (!it) return Promise.resolve(false);
        if (st.selected === id) select(null);
        items = items.filter(function (x) { return x !== it; });
        delete byId[id];
        var nl = layout();
        setHeight(shownRows(nl), o.animate !== false);
        if (!o.silent) emit('onChange', { type: 'remove', id: id, layout: nl });
        return leave(it, o.animate);
      },
      /** [정리하기] — 위로 당겨 빈 줄을 없앤다 (앱에서는 버튼을 누를 때만). → Promise<boolean> */
      compact: function (o) {
        o = o || {};
        cancelInteraction();
        var before = layout(), nl = G.compact(before, maxRows), changed = !G.same(before, nl);
        var p = commit(nl, { spring: MOTION.settle, animate: o.animate });
        if (changed && !o.silent) emit('onChange', { type: 'move', id: null, layout: layout() });
        return p.then(function () { return changed; });
      },
      /** 위젯 상자(.dw) 요소 */
      elOf: function (id) { return byId[id] ? byId[id].box : null; },
      /** 위젯이 앉을 자리의 화면 좌표 (움직이는 중이어도 도착 자리). {left, top, width, height, right, bottom} */
      rectOf: function (id) { var it = byId[id]; return it ? rectOfCells(it.x, it.y, it.w, it.h) : null; },
      /** 임의 칸의 화면 좌표 — 날아올 자리 계산용 */
      cellRect: rectOfCells,
      setEditable: setEditable,
      isEditable: function () { return st.editable; },
      setGridVisible: setGridVisible,
      select: select,
      selected: function () { return st.selected; },
      /** 강조 = 앱의 선택 테두리(1.5 · #A25AD6). o.dimOthers 면 나머지를 흐리게 */
      highlight: function (ids, o) {
        var set = {}; (ids || []).forEach(function (i) { set[i] = true; });
        items.forEach(function (it) { if (set[it.id]) it.el.classList.add('is-hl'); else if (o && o.dimOthers) it.el.classList.add('is-dim'); });
      },
      /** 흐리게 = 앱의 비활성 투명도(0.38) */
      dim: function (ids) { (ids || []).forEach(function (i) { if (byId[i]) byId[i].el.classList.add('is-dim'); }); },
      clearMarks: function () { items.forEach(function (it) { it.el.classList.remove('is-hl', 'is-dim'); }); },
      /** 자동 시연 — 손으로 끄는 것과 똑같이 들어 올려 (x, y) 칸까지 끌고 놓는다 (지나는 칸마다 다른 위젯이 밀린다).
       *  o: {duration=900(ms), hold=180(ms), path: 'line'} → Promise<boolean> */
      simulateDrag: function (id, x, y, o) {
        o = o || {};
        cancelInteraction();
        var it = byId[id];
        if (!it) return Promise.resolve(false);
        if (reduced() || !scale) return api.move(id, x, y, { animate: false });
        var before = layout(), token = ++simToken;
        var from = { x: G.px(it.x) + G.pw(it.w) / 2, y: G.px(it.y) + G.pw(it.h) / 2 };
        var cx = Math.max(0, Math.min(G.COLS - it.w, x)), cy = Math.max(0, Math.min(Math.max(it.y, Math.min(maxRows, shownRows(before) + EDIT_PAD_ROWS) - it.h), y));
        var to = { x: G.px(cx) + G.pw(it.w) / 2, y: G.px(cy) + G.pw(it.h) / 2 };
        var dur = o.duration || 900, hold = o.hold == null ? HOLD_EDIT : o.hold;
        return new Promise(function (resolve) {
          if (!beginDrag(id, from, 0)) { resolve(false); return; }
          drag.sim = true;
          var t0 = 0;
          function step(now) {
            if (token !== simToken || !drag || !drag.sim) { resolve(false); return; }
            if (!t0) t0 = now;
            var u = Math.min(1, Math.max(0, (now - t0 - hold) / dur));
            var e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
            updateDrag({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e });
            if (u < 1) { requestAnimationFrame(step); return; }
            setTimeout(function () {
              if (token !== simToken || !drag) { resolve(false); return; }
              endDrag(false, false);
              resolve(!G.same(before, layout()));
            }, 120);
          }
          requestAnimationFrame(step);
        });
      },
      /** 자동 시연 — 핸들을 끌어 w×h 칸으로. o: {duration=700(ms)} → Promise<boolean> */
      simulateResize: function (id, w, h, o) {
        o = o || {};
        cancelInteraction();
        var it = byId[id];
        if (!it) return Promise.resolve(false);
        if (reduced() || !scale) return api.resize(id, w, h, { mode: 'handle', animate: false });
        var before = layout(), token = ++simToken, dur = o.duration || 700;
        var dx = G.pw(w) - G.pw(it.w), dy = G.pw(h) - G.pw(it.h);
        return new Promise(function (resolve) {
          if (!beginResize(id)) { resolve(false); return; }
          rez.sim = true;
          var t0 = 0;
          function step(now) {
            if (token !== simToken || !rez || !rez.sim) { resolve(false); return; }
            if (!t0) t0 = now;
            var u = Math.min(1, (now - t0) / dur), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
            updateResize(dx * e, dy * e);
            if (u < 1) { requestAnimationFrame(step); return; }
            setTimeout(function () {
              if (token !== simToken || !rez) { resolve(false); return; }
              endResize(false);
              resolve(!G.same(before, layout()));
            }, 120);
          }
          requestAnimationFrame(step);
        });
      },
      /** 리스너 · 타이머 · 애니메이션 · 만든 요소를 모두 걷어 낸다 */
      destroy: function () {
        if (st.dead) return;
        cancelInteraction();
        st.dead = true;
        clearPend(); stopLoop();
        if (ro) ro.disconnect();
        offs.forEach(function (off) { off(); }); offs = [];
        items.slice().forEach(dropItem); items = [];
        ghostPos.stop(); ghostSize.stop();
        [sizer, dots, ghost, del, handle].forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
        root.classList.remove('dpl-grid', 'is-editing', 'is-grid', 'is-interacting', 'is-receiving');
        if (!hadDpl) root.classList.remove('dpl');
        ['settle', 'appear', 'lift', 'sheet'].forEach(function (k) { root.style.removeProperty('--dpl-e-' + k); root.style.removeProperty('--dpl-t-' + k); });
      }
    };

    // 처음 그리기
    var first = (opts.widgets || []).map(function (w) { return w; });
    first.forEach(function (w) { var it = makeItem(w); root.appendChild(it.el); items.push(it); });
    setHeight(shownRows(layout()), false);
    if (opts.showGrid) setGridVisible(true);
    if (opts.editable) setEditable(true);
    return api;
  }

  window.DittoPlatter = { create: create, MOTION: MOTION, HOLD_MS: HOLD_EDIT };
})();
