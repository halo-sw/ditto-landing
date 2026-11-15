/* Ditto! v8 · platter-grid.js → window.DittoGrid
 *
 * 플래터 그리드 엔진 — DOM 없이 계산만 한다. 앱의 규칙을 그대로 옮겼다.
 *   출처 S  = prj_Ditto!/DittoPrototype/Model/GridEngine.swift        (S:줄 번호)
 *   출처 A  = prj_Ditto!/DittoPrototype/Model/AppState.swift           (A:줄 번호)
 *   출처 WF = prj_Ditto!/DittoPrototype/DesignSystem/Elements/WidgetFrame.swift
 *   출처 TB = prj_Ditto!/DittoPrototype/Views/TogetherBooth.swift
 *   출처 AT = prj_Ditto!/DittoPrototype/DesignSystem/Foundations/Atomic.swift
 *
 * 배치 한 칸 = {id, kind, x, y, w, h} (x = 열 col, y = 행 row, 모두 칸 수 정수).
 * 모든 함수는 받은 배열을 고치지 않고 새 배열을 돌려준다 (칸 밖의 다른 필드는 그대로 복사).
 * 놓을 수 없는 요청은 앱처럼 아무것도 바꾸지 않는다 — 같은 내용의 새 배열이 돌아온다 (DittoGrid.same 으로 확인).
 *
 * 자체 점검:  node assets/v8/platter-grid.js --test
 */
(function (root) {
  'use strict';

  // ───────── 상수 (S:7-24) ─────────
  var COLS = 8;            // S:8
  var ROWS = 16;           // S:9   기본으로 보이는 줄 수 · 위젯 한 개 높이 한도
  var MAX_ROWS = 48;       // S:12  플래터가 아래로 늘어날 수 있는 끝
  var GUT = 8;             // S:13
  var MARGIN = 16;         // S:14
  var SCREEN_W = 390;      // S:18  디자인 기준 화면 폭
  var DESIGN_W = SCREEN_W - MARGIN * 2;                 // S:23  358
  var CELL = (DESIGN_W - GUT * (COLS - 1)) / COLS;      // S:21  37.75
  var UNIT = CELL + GUT;                                // S:22  45.75
  var HANDLE_MAX_W = 6, HANDLE_MAX_H = 8, MIN_SIZE = 2; // A:2558 · A:2576-2577
  var MAX_OWN_WIDGETS = 10;                             // A:2784 (디토 위젯은 세지 않는다)
  var DIRS = ['down', 'right', 'left', 'up'];           // A:2437 · A:2590

  function px(c) { return c * UNIT; }                   // S:34
  function pw(n) { return n * UNIT - GUT; }             // S:35

  // ───────── 크기 (WF:13-33 · TB:578-589 · A:2698-2707) ─────────
  var SERVICE_SIZES = [[2, 2], [4, 2], [6, 2], [3, 3], [4, 3], [3, 4], [4, 4], [6, 4], [4, 6], [6, 6], [6, 8], [2, 6]]; // WF:52
  var KIND_SIZES = {
    todo: [[3, 4], [4, 4], [4, 3], [6, 2]],                        // WF:22-23
    status: [[2, 2], [3, 3], [4, 4], [6, 6], [4, 2], [6, 2]],      // WF:24-26
    together: [[2, 4], [3, 6], [4, 8], [6, 2]]                     // WF:27-28
  };
  var DEFAULT_SIZE = {                                             // A:2698-2707 (sizeMap)
    status: [2, 2], text: [4, 2], image: [4, 4], music: [4, 2], video: [4, 3], social: [2, 2], gif: [2, 2], block: [4, 3],
    mood: [4, 2], guestbook: [4, 3], diary: [4, 2], dday: [4, 2], nowplaying: [4, 2], place: [2, 2], weather: [2, 2], steps: [2, 2],
    ask: [3, 4], qna: [3, 4], ghost: [3, 3], paparazzi: [4, 4], voice: [2, 2], bucket: [3, 4], todo: [3, 4], collection: [4, 4],
    playlist: [3, 4], sticker: [4, 4], poke: [2, 2], secret: [3, 3], together: [4, 4], vintageCamera: [4, 4]
  };

  // 크기 칩 순서 — 정사각 → 가로 → 세로, 묶음 안에서는 면적 작은 순, 같으면 덜 길쭉한 것 먼저 (WF:42-48)
  function ordered(sizes) {
    function key(s) {
      var shape = s[0] === s[1] ? 0 : (s[0] > s[1] ? 1 : 2);
      return [shape, s[0] * s[1], Math.max(s[0], s[1]) / Math.max(1, Math.min(s[0], s[1]))];
    }
    return sizes.slice().sort(function (a, b) {
      var ka = key(a), kb = key(b);
      return ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2];
    });
  }
  /** 크기 칩으로 고를 수 있는 크기 [{w,h}] — 앱의 SizeBar (WF:19 · Overlays.swift:110-112).
   *  Together 는 놓인 위젯의 방향에 따라 좁힌다: 가로(w > h) = 6×2 하나, 세로 = 2×4 · 3×6 · 4×8 (TB:581-585). */
  function sizesFor(kind, item) {
    var list = KIND_SIZES[kind] || SERVICE_SIZES;
    if (kind === 'together' && item && item.w > 0 && item.h > 0) {
      list = item.w > item.h ? [[6, 2]] : [[2, 4], [3, 6], [4, 8]];
      return list.map(function (s) { return { w: s[0], h: s[1] }; });     // TB:583 은 정렬하지 않는다
    }
    return ordered(list).map(function (s) { return { w: s[0], h: s[1] }; });
  }
  function defaultSize(kind) {
    var s = DEFAULT_SIZE[kind];
    return s ? { w: s[0], h: s[1] } : null;
  }
  function nearest(sizes, w, h) {      // A:2581 — |Δw| + |Δh| 가 가장 작은 것, 같으면 앞의 것
    var best = null, bd = Infinity;
    for (var i = 0; i < sizes.length; i++) {
      var d = Math.abs(sizes[i].w - w) + Math.abs(sizes[i].h - h);
      if (d < bd) { bd = d; best = sizes[i]; }
    }
    return best;
  }
  /** 핸들로 끌어 바꿀 때 붙는 크기 (A:2558 · A:2576-2584).
   *  앱의 핸들은 칸 단위로 자유롭다: 폭 2…min(6, 8 − x), 높이 2…min(8, 끝 줄 − y). Together 만 허용 크기 중 가장 가까운 것.
   *  opts.snap === 'sizes' 면 모든 종류를 sizesFor 중 가장 가까운 크기에 붙인다 (웹 전용 선택지 · Together 규칙을 넓힌 것).
   *  opts: {x, y, item, snap, maxRows}. 맞는 크기가 없으면 item 의 지금 크기를 돌려준다 (A:2583). */
  function clampSize(kind, w, h, opts) {
    opts = opts || {};
    var R = opts.maxRows || MAX_ROWS;
    var x = opts.x || 0, y = opts.y || 0, item = opts.item || null;
    var maxW = Math.min(HANDLE_MAX_W, COLS - x), maxH = Math.min(HANDLE_MAX_H, R - y);
    var nw = Math.max(MIN_SIZE, Math.min(maxW, Math.round(w)));
    var nh = Math.max(MIN_SIZE, Math.min(maxH, Math.round(h)));
    if (kind === 'together' || opts.snap === 'sizes') {
      var allowed = sizesFor(kind, item).filter(function (s) { return s.w <= maxW && s.h <= maxH; });
      var best = nearest(allowed, nw, nh);
      if (best) return { w: best.w, h: best.h };
      return item ? { w: item.w, h: item.h } : { w: nw, h: nh };
    }
    return { w: nw, h: nh };
  }

  // ───────── 모서리 (S:37-39 · AT:23-29) ─────────
  var RADIUS_STEPS = [8, 12, 16, 20, 28];     // AT:14-18
  function snapRadius(v) {                    // AT:23-29 — 가장 가까운 단계, 같은 거리면 큰 쪽
    var best = RADIUS_STEPS[0];
    for (var i = 1; i < RADIUS_STEPS.length; i++) {
      var a = RADIUS_STEPS[i], da = Math.abs(a - v), db = Math.abs(best - v);
      if (da < db || (da === db && a > best)) best = a;
    }
    return best;
  }
  /** 위젯 모서리 반경 (358 폭 기준 px). 음악은 모든 크기 28, 나머지는 12 + (짧은 변 − 2) × 2 를 20 에서 멈추고 단계에 맞춘다. */
  function radius(kind, w, h) {
    if (kind === 'music') return 28;                                     // S:39
    return snapRadius(Math.min(20, 12 + (Math.min(w, h) - 2) * 2));      // S:37
  }

  // ───────── 겹침 · 범위 · 유효성 (S:41-77) ─────────
  function overlap(a, b) {                                               // S:42-52
    if (!(a.w > 0 && a.h > 0 && b.w > 0 && b.h > 0)) return false;
    return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  }
  function isInt(n) { return typeof n === 'number' && isFinite(n) && Math.floor(n) === n; }
  function inBounds(r, maxRows) {                                        // S:56-60
    var R = maxRows || MAX_ROWS;
    return isInt(r.x) && isInt(r.y) && isInt(r.w) && isInt(r.h)
      && r.w > 0 && r.w <= COLS && r.h > 0 && r.h <= ROWS
      && r.x >= 0 && r.x <= COLS - r.w && r.y >= 0 && r.y <= R - r.h;
  }
  function isValid(list, maxRows) {                                      // S:63-77
    var R = maxRows || MAX_ROWS;
    if (list.length > COLS * R) return false;
    var ids = {}, occ = [];
    for (var i = 0; i < list.length; i++) {
      var it = list[i], id = String(it.id == null ? '' : it.id);
      if (!id || ids[id] || !inBounds(it, R)) return false;
      ids[id] = true;
      var mask = ((1 << it.w) - 1) << it.x;
      for (var row = it.y; row < it.y + it.h; row++) {
        if ((occ[row] | 0) & mask) return false;
        occ[row] = (occ[row] | 0) | mask;
      }
    }
    return true;
  }
  function overlaps(list) {            // 겹친 쌍 [[idA, idB], …] — 점검용
    var out = [];
    for (var i = 0; i < list.length; i++) for (var j = i + 1; j < list.length; j++) {
      if (overlap(list[i], list[j])) out.push([list[i].id, list[j].id]);
    }
    return out;
  }
  function colliders(list, rect, exceptId) {
    return list.filter(function (o) { return o.id !== exceptId && overlap(rect, o); });
  }
  function bottom(list) {
    var b = 0;
    for (var i = 0; i < list.length; i++) b = Math.max(b, list[i].y + list[i].h);
    return b;
  }
  /** 이 배치를 담는 줄 수 — 기본 16줄, 위젯이 더 아래에 있으면 그만큼 (S:26-28). */
  function rows(list, maxRows) {
    var R = maxRows || MAX_ROWS;
    return Math.min(R, Math.max(Math.min(ROWS, R), bottom(list)));
  }
  /** 위젯이 실제로 닿은 마지막 줄 (기본 16줄을 깔지 않는다 — 웹에서 플래터 높이를 내용에 맞출 때). */
  function contentRows(list) { return bottom(list); }

  function copy(it) { var o = {}; for (var k in it) if (Object.prototype.hasOwnProperty.call(it, k)) o[k] = it[k]; return o; }
  function clone(list) { return list.map(copy); }
  function find(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function same(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) {
      var p = a[i], q = b[i];
      if (p.id !== q.id || p.x !== q.x || p.y !== q.y || p.w !== q.w || p.h !== q.h) return false;
    }
    return true;
  }
  function byRowColId(a, b) {                                            // S:129-131 · S:277
    return a.y - b.y || a.x - b.x || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  }

  // 옮기는 위젯의 목표 칸 + 밀려난 자리를 합친 배치가 유효한지 (S:81-94)
  function applyMap(list, moverId, rect, map) {
    return list.map(function (it) {
      var n = copy(it);
      if (it.id === moverId) { n.x = rect.x; n.y = rect.y; n.w = rect.w; n.h = rect.h; }
      else if (map && map[it.id]) { n.x = map[it.id].x; n.y = map[it.id].y; }
      return n;
    });
  }
  function validPlacement(list, moverId, rect, map, R) { return isValid(applyMap(list, moverId, rect, map), R); }

  // ───────── 빈자리 찾기 (S:96-122) ─────────
  function fitIn(list, w, h, start, rowLimit) {                          // S:108-122
    if (rowLimit < h) return null;
    var rowCount = rowLimit - h + 1;
    var firstRow = Math.min(Math.max(start, 0), rowCount);
    for (var offset = 0; offset < rowCount; offset++) {
      var y = (firstRow + offset) % rowCount;
      for (var x = 0; x <= COLS - w; x++) {
        var nr = { x: x, y: y, w: w, h: h }, hit = false;
        for (var i = 0; i < list.length; i++) if (overlap(nr, list[i])) { hit = true; break; }
        if (!hit) return { x: x, y: y };
      }
    }
    return null;
  }
  /** 첫 빈자리 — start 줄부터 훑고 맨 위로 돌아온다. 먼저 지금 보이는 줄(기본 16줄 또는 위젯이 닿은 줄) 안에서 찾고,
   *  없으면 맨 위부터 끝 줄(48)까지 늘려 찾는다 (S:103-107). 없으면 null. */
  function firstFit(list, w, h, start, maxRows) {
    var R = maxRows || MAX_ROWS;
    if (!inBounds({ x: 0, y: 0, w: w, h: h }, R) || !isValid(list, R)) return null;
    return fitIn(list, w, h, start || 0, rows(list, R)) || fitIn(list, w, h, 0, R);
  }
  function findFree(list, w, h, maxRows) { return firstFit(list, w, h, 0, maxRows); }   // S:97-99

  // ───────── 밀어내기 (S:124-186) ─────────
  /** 옮기는 위젯을 rect 에 놓을 때 겹치는 위젯을 dirs 순서로 밀어 본다. 한 번 밀린 위젯이 또 다른 위젯을 밀 수 있는 깊이는 3,
   *  시도는 모두 합쳐 1,024 번. 돌려주는 값은 모든 위젯의 새 자리 {id: {x, y}} 또는 null (놓을 수 없음). */
  function resolve(list, moverId, rect, dirs, maxRows) {
    var R = maxRows || MAX_ROWS;
    if (!inBounds(rect, R) || !isValid(list, R) || !find(list, moverId)) return null;       // S:127
    var pos = {};
    list.forEach(function (it) { pos[it.id] = { x: it.x, y: it.y }; });                    // S:128
    var others = list.filter(function (it) { return it.id !== moverId; }).sort(byRowColId); // S:129-131
    var directions = [];
    (dirs || DIRS).forEach(function (d) { if (DIRS.indexOf(d) >= 0 && directions.indexOf(d) < 0) directions.push(d); }); // S:132-135
    var attemptsLeft = 1024;                                                               // S:138

    function rectOf(it) { var p = pos[it.id]; return { x: p.x, y: p.y, w: it.w, h: it.h }; }
    function snapshot() { var s = {}; for (var k in pos) s[k] = pos[k]; return s; }

    function push(it, block, depth, ancestors) {                                           // S:145-179
      if (depth > 3 || ancestors[it.id]) return false;
      var id = it.id;
      for (var d = 0; d < directions.length; d++) {
        if (attemptsLeft <= 0) return false;
        attemptsLeft -= 1;
        var p = pos[id], np = { x: p.x, y: p.y };
        switch (directions[d]) {
          case 'down': np.y = block.y + block.h; break;
          case 'up': np.y = block.y - it.h; break;
          case 'right': np.x = block.x + block.w; break;
          case 'left': np.x = block.x - it.w; break;
        }
        var nr = { x: np.x, y: np.y, w: it.w, h: it.h };
        if (!inBounds(nr, R) || overlap(nr, rect)) continue;                               // S:161
        var hitsAncestor = false;                                                          // S:164
        for (var a = 0; a < others.length; a++) {
          if (ancestors[others[a].id] && overlap(nr, rectOf(others[a]))) { hitsAncestor = true; break; }
        }
        if (hitsAncestor) continue;
        var saved = snapshot();
        pos[id] = np;
        var guard = {};
        for (var k in ancestors) guard[k] = true;
        guard[id] = true;
        var ok = true;
        for (var i = 0; i < others.length; i++) {                                          // S:169-174
          var o = others[i];
          if (o.id === id) continue;
          if (overlap(nr, rectOf(o))) {
            ok = push(o, nr, depth + 1, guard);
            if (!ok) break;
          }
        }
        if (ok) {                                                                          // S:175
          var clear = true;
          for (var j = 0; j < others.length; j++) {
            if (others[j].id !== id && overlap(nr, rectOf(others[j]))) { clear = false; break; }
          }
          if (clear) return true;
        }
        pos = saved;                                                                       // S:176
      }
      return false;
    }

    for (var n = 0; n < others.length; n++) {                                              // S:181-183
      if (overlap(rect, rectOf(others[n])) && !push(others[n], rect, 1, {})) return null;
    }
    return validPlacement(list, moverId, rect, pos, R) ? pos : null;                       // S:184-185
  }

  /** 맞바꾸기 — 겹치는 위젯이 딱 하나이고 크기가 같으면 그 위젯이 옮기는 위젯의 원래 자리로 간다 (S:188-203). */
  function trySwap(list, moverId, rect, origin, maxRows) {
    var R = maxRows || MAX_ROWS;
    var mv = find(list, moverId);
    if (!inBounds(rect, R) || !isValid(list, R) || !mv || rect.w !== mv.w || rect.h !== mv.h) return null;
    var hit = colliders(list, rect, moverId);
    if (hit.length !== 1 || hit[0].w !== mv.w || hit[0].h !== mv.h) return null;
    var nr = { x: origin.x, y: origin.y, w: hit[0].w, h: hit[0].h };
    if (!inBounds(nr, R)) return null;
    var pos = {};
    list.forEach(function (it) { pos[it.id] = { x: it.x, y: it.y }; });
    pos[hit[0].id] = { x: nr.x, y: nr.y };
    return validPlacement(list, moverId, rect, pos, R) ? pos : null;
  }

  /** 미리보기 — 끄는 동안 앱이 칸이 바뀔 때마다 부르는 계산 (S:205-217).
   *  겹치는 것이 없으면 그대로, 있으면 밀어내기 → 안 되면 맞바꾸기 → 그래도 안 되면 valid = false.
   *  opts: {dirs, origin, maxRows}. 돌려주는 값: {valid, map ({id: {x, y}} 또는 null), layout (valid 일 때 적용한 새 배치, 아니면 원래 배치의 사본)}. */
  function preview(list, moverId, rect, opts) {
    opts = opts || {};
    var R = opts.maxRows || MAX_ROWS;
    var mv = find(list, moverId);
    if (!inBounds(rect, R) || !isValid(list, R) || !mv) return { valid: false, map: null, layout: clone(list) };
    var origin = opts.origin || { x: mv.x, y: mv.y };
    var map = null, valid;
    if (!colliders(list, rect, moverId).length) {
      valid = validPlacement(list, moverId, rect, null, R);                                // S:211-213
    } else {
      map = resolve(list, moverId, rect, opts.dirs || DIRS, R) || trySwap(list, moverId, rect, origin, R);   // S:214-215
      valid = !!map;
    }
    return { valid: valid, map: valid ? map : null, layout: valid ? applyMap(list, moverId, rect, map) : clone(list) };
  }

  /** 끌 때 미는 방향 순서 — 손가락이 들어온 쪽이 먼저, 나머지는 아래 · 오른쪽 · 왼쪽 · 위 (A:2434-2438).
   *  (dx, dy) 는 손가락의 최근 이동 (앱은 0.7 / 0.3 으로 섞은 값 A:2412-2413, 시작 값은 (0, 1) A:2397). */
  function entryDirs(dx, dy) {
    var primary = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    return [primary].concat(DIRS.filter(function (d) { return d !== primary; }));
  }

  // ───────── 옮기기 · 크기 바꾸기 · 추가 · 삭제 ─────────
  /** 위젯을 (x, y) 칸으로 옮긴다 — 손을 뗄 때의 확정과 같다 (A:2425-2426 범위 맞춤 · A:2495-2519).
   *  opts: {dirs, origin, maxRows}. dirs 를 주지 않으면 원래 자리에서 목표 칸으로 가는 방향을 들어온 방향으로 본다
   *  (제자리면 앱의 시작 값처럼 아래). 놓을 수 없으면 원래 배치 그대로. */
  function move(list, id, x, y, opts) {
    opts = opts || {};
    var R = opts.maxRows || MAX_ROWS, it = find(list, id);
    if (!it) return clone(list);
    var col = Math.max(0, Math.min(COLS - it.w, Math.round(x)));
    var row = Math.max(0, Math.min(R - it.h, Math.round(y)));
    var origin = opts.origin || { x: it.x, y: it.y };
    var dx = col - origin.x, dy = row - origin.y;
    var dirs = opts.dirs || ((dx || dy) ? entryDirs(dx, dy) : entryDirs(0, 1));
    return preview(list, id, { x: col, y: row, w: it.w, h: it.h }, { dirs: dirs, origin: origin, maxRows: R }).layout;
  }

  /** 크기를 바꾼다. opts.mode:
   *   'preset' (기본) — 크기 칩을 누른 것과 같다 (A:2624-2650). 오른쪽·아래로 넘치면 자리를 당겨 넣고, 겹치면 아래 · 오른쪽 · 왼쪽 · 위로 민다.
   *                     밀 수 없으면 그대로 ("공간이 부족해 크기를 바꿀 수 없어요"). Together 는 허용 크기만.
   *   'handle'        — 오른쪽 아래 핸들을 끌어 놓은 것과 같다 (A:2555-2622). 왼쪽 위는 제자리, 크기는 clampSize 로 맞추고,
   *                     밀어내기가 안 되면 같은 크기 하나와 맞바꾸기까지 본다.
   *  opts: {mode, snap, maxRows}. */
  function resize(list, id, w, h, opts) {
    opts = opts || {};
    var R = opts.maxRows || MAX_ROWS, it = find(list, id);
    if (!it) return clone(list);
    if (opts.mode === 'handle') {
      var s = clampSize(it.kind, w, h, { x: it.x, y: it.y, item: it, snap: opts.snap, maxRows: R });
      return preview(list, id, { x: it.x, y: it.y, w: s.w, h: s.h }, { dirs: DIRS, origin: { x: it.x, y: it.y }, maxRows: R }).layout;
    }
    if (it.w === w && it.h === h) return clone(list);                                      // A:2627
    if (it.kind === 'together' && !sizesFor('together', it).some(function (o) { return o.w === w && o.h === h; })) return clone(list); // A:2628-2630
    var rect = { x: Math.max(0, Math.min(it.x, COLS - w)), y: Math.max(0, Math.min(it.y, R - h)), w: w, h: h };   // A:2631-2633
    if (!inBounds(rect, R)) return clone(list);                                            // A:2634
    var map = null;
    if (colliders(list, rect, id).length) {                                                // A:2636-2641
      map = resolve(list, id, rect, DIRS, R);
      if (!map) return clone(list);
    }
    var out = applyMap(list, id, rect, map);
    return isValid(out, R) ? out : clone(list);                                            // A:2647
  }

  /** 디토 = 맨 앞에 — (0, 0) 에 w×h 를 놓고, 겹치는 위젯만 위에서부터 같은 열에서 아래 빈 줄로 내린다.
   *  아래로 자리가 없으면 다른 빈 곳. 돌려주는 값은 밀린 뒤의 나머지 위젯 (줄 · 열 · id 순) 또는 null (S:271-296). */
  function insertAtFront(list, newId, w, h, maxRows) {
    var R = maxRows || MAX_ROWS;
    if (!isValid(list, R)) return null;
    var front = { x: 0, y: 0, w: w, h: h };
    if (!inBounds(front, R)) return null;
    var placed = [front], out = [];
    var sorted = clone(list).sort(byRowColId);
    function hits(r) { for (var i = 0; i < placed.length; i++) if (overlap(placed[i], r)) return true; return false; }
    for (var n = 0; n < sorted.length; n++) {
      var it = sorted[n], r = { x: it.x, y: it.y, w: it.w, h: it.h };
      if (hits(r)) {
        var y = r.y;
        while (inBounds({ x: r.x, y: y, w: r.w, h: r.h }, R) && hits({ x: r.x, y: y, w: r.w, h: r.h })) y += 1;
        var down = { x: r.x, y: y, w: r.w, h: r.h };
        if (inBounds(down, R)) r = down;
        else {
          var spot = firstFit(out.concat([{ id: newId, x: 0, y: 0, w: w, h: h }]), it.w, it.h, 0, R);
          if (!spot) return null;
          r = { x: spot.x, y: spot.y, w: it.w, h: it.h };
        }
      }
      it.x = r.x; it.y = r.y;
      placed.push(r); out.push(it);
    }
    return isValid(out.concat([{ id: newId, x: 0, y: 0, w: w, h: h }]), R) ? out : null;
  }

  /** 새 위젯을 놓는다.
   *   기본         — 첫 빈자리 (A:2787-2796 · S:103-107). 크기는 item.w/h, 없으면 종류의 기본 크기 (A:2698-2707). opts.start = 훑기 시작할 줄 (A:2790).
   *   opts.front   — 디토해 온 위젯의 자리 (A:3105-3110): 맨 앞에 놓고 나머지를 아래로 → 안 되면 빈자리 → 안 되면 2×2 로 줄여 빈자리.
   *   opts.limit   — true 면 내 플래터 한도도 본다: 디토 위젯을 뺀 위젯이 10개면 놓지 않는다 (A:2784).
   *  놓을 수 없으면 원래 배치 그대로 (앱은 '가득 찼어요' 시트). 새 위젯은 배열 맨 뒤에 붙는다. */
  function place(list, item, opts) {
    opts = opts || {};
    var R = opts.maxRows || MAX_ROWS;
    var def = defaultSize(item.kind);
    var w = item.w || (def && def.w), h = item.h || (def && def.h);
    if (!w || !h || item.id == null || find(list, item.id)) return clone(list);            // A:2787-2789
    var n = copy(item);
    if (opts.front) {
      var shifted = insertAtFront(list, item.id, w, h, R);
      if (shifted) { n.x = 0; n.y = 0; n.w = w; n.h = h; return shifted.concat([n]); }
      var s1 = findFree(list, w, h, R);
      if (s1) { n.x = s1.x; n.y = s1.y; n.w = w; n.h = h; return clone(list).concat([n]); }
      var s2 = findFree(list, 2, 2, R);
      if (s2) { n.x = s2.x; n.y = s2.y; n.w = 2; n.h = 2; return clone(list).concat([n]); }
      return clone(list);
    }
    if (opts.limit && isFull(list)) return clone(list);
    var spot = firstFit(list, w, h, opts.start || 0, R);
    if (!spot) return clone(list);
    n.x = spot.x; n.y = spot.y; n.w = w; n.h = h;
    var out = clone(list).concat([n]);
    return isValid(out, R) ? out : clone(list);                                            // A:2797
  }
  function isFull(list) {                                                                  // A:2784
    return list.filter(function (it) { return it.kind !== 'ditto'; }).length >= MAX_OWN_WIDGETS;
  }

  /** 지운다 — 나머지는 제자리 (자동으로 당겨 올리지 않는다 · A:2864-2890 · S:221). */
  function remove(list, id) {
    return clone(list).filter(function (it) { return it.id !== id; });
  }

  /** [정리하기] — 세로 순서를 지키며 각 위젯을 같은 열에서 가장 위의 빈 자리로 당긴다. 누를 때만 (S:221-241). */
  function compact(list, maxRows) {
    var R = maxRows || MAX_ROWS;
    if (!isValid(list, R)) return clone(list);
    var placed = [], result = clone(list);
    var order = list.map(function (_, i) { return i; }).sort(function (a, b) { return list[a].y - list[b].y || list[a].x - list[b].x; });
    order.forEach(function (index) {
      var w = copy(list[index]), best = w.y;
      for (var y = w.y - 1; y >= 0; y--) {
        var probe = { x: w.x, y: y, w: w.w, h: w.h }, hit = false;
        for (var i = 0; i < placed.length; i++) if (overlap(placed[i], probe)) { hit = true; break; }
        if (hit) break;
        best = y;
      }
      w.y = best;
      placed.push(w);
      result[index] = w;
    });
    return isValid(result, R) ? result : clone(list);
  }

  /** 겹치거나 칸 밖으로 나간 배치를 바로잡는다 — 위에서부터 제자리를 지키고, 겹친 것만 빈 곳으로, 빈 곳이 없으면 2×2 로 (S:244-264). */
  function repair(list, maxRows) {
    var R = maxRows || MAX_ROWS;
    if (isValid(list, R)) return clone(list);
    var kept = [], moved = [], ids = {};
    clone(list).sort(function (a, b) { return a.y - b.y || a.x - b.x; }).forEach(function (w) {
      var id = String(w.id == null ? '' : w.id);
      if (!id || ids[id]) return;
      ids[id] = true;
      w.w = Math.min(Math.max(w.w | 0, 1), COLS); w.h = Math.min(Math.max(w.h | 0, 1), ROWS);
      w.x = Math.min(Math.max(w.x | 0, 0), COLS - w.w); w.y = Math.min(Math.max(w.y | 0, 0), R - w.h);
      if (colliders(kept, w).length) moved.push(w); else kept.push(w);
    });
    moved.forEach(function (w) {
      var s = firstFit(kept, w.w, w.h, 0, R);
      if (!s) { s = firstFit(kept, 2, 2, 0, R); if (!s) return; w.w = 2; w.h = 2; }
      w.x = s.x; w.y = s.y;
      kept.push(w);
    });
    return isValid(kept, R) ? kept : clone(list);
  }

  var G = {
    COLS: COLS, ROWS: ROWS, MAX_ROWS: MAX_ROWS, GUT: GUT, MARGIN: MARGIN, DESIGN_W: DESIGN_W, CELL: CELL, UNIT: UNIT,
    HANDLE_MAX_W: HANDLE_MAX_W, HANDLE_MAX_H: HANDLE_MAX_H, MIN_SIZE: MIN_SIZE, MAX_OWN_WIDGETS: MAX_OWN_WIDGETS, DIRS: DIRS.slice(),
    px: px, pw: pw,
    sizesFor: sizesFor, defaultSize: defaultSize, clampSize: clampSize, radius: radius,
    overlap: overlap, overlaps: overlaps, colliders: colliders, inBounds: inBounds, isValid: isValid,
    rows: rows, contentRows: contentRows, same: same, clone: clone,
    firstFit: firstFit, findFree: findFree, resolve: resolve, trySwap: trySwap, preview: preview, entryDirs: entryDirs,
    place: place, move: move, resize: resize, remove: remove, compact: compact, repair: repair, insertAtFront: insertAtFront, isFull: isFull
  };

  // ───────── 자체 점검 (node assets/v8/platter-grid.js --test) ─────────
  function selfTest() {
    var pass = 0, fail = 0;
    function L(rowsOf) {       // 'id kind x y w h' 줄 → 배치
      return rowsOf.map(function (s) { var p = s.split(' '); return { id: p[0], kind: p[1], x: +p[2], y: +p[3], w: +p[4], h: +p[5] }; });
    }
    function S(list) { return list.map(function (i) { return i.id + '@' + i.x + ',' + i.y + ' ' + i.w + 'x' + i.h; }).join(' | '); }
    function eq(name, got, want) {
      var a = typeof got === 'string' ? got : JSON.stringify(got), b = typeof want === 'string' ? want : JSON.stringify(want);
      if (a === b) { pass++; } else { fail++; console.log('FAIL ' + name + '\n   got  ' + a + '\n   want ' + b); }
    }
    var base = L(['a image 0 0 4 4', 'b music 4 0 4 2', 'c status 4 2 2 2', 'd text 6 2 2 2', 'e block 0 4 4 3']);

    // 1 · 상수 — S:8-23: 8열, 16줄, 끝 48줄, 거터 8, 390 화면에서 폭 358 · 칸 37.75 · 피치 45.75
    eq('01 constants', [G.COLS, G.ROWS, G.MAX_ROWS, G.GUT, G.DESIGN_W, G.CELL, G.UNIT], [8, 16, 48, 8, 358, 37.75, 45.75]);
    // 2 · 길이 — S:34-35: px(c) = c × 피치, pw(n) = n × 피치 − 거터
    eq('02 geometry', [G.px(2), G.pw(2), G.pw(8)], [91.5, 83.5, 358]);
    // 3 · 모서리 — S:37 + AT:23-29: 2칸 12 · 3칸 14→16(같은 거리면 큰 쪽) · 4칸 16 · 5칸 18→20 · 6칸 20
    eq('03 radius', [G.radius('image', 2, 2), G.radius('image', 3, 3), G.radius('image', 4, 4), G.radius('image', 6, 5), G.radius('image', 6, 8)], [12, 16, 16, 20, 20]);
    // 4 · 음악 모서리 — S:39: 모든 크기 28 (DDSRadius.sheet)
    eq('04 radius music', [G.radius('music', 2, 2), G.radius('music', 6, 6)], [28, 28]);
    // 5 · 겹침 — S:42-52: 맞닿은 것은 겹침이 아니다, 넓이 0 은 겹치지 않는다
    eq('05 overlap', [G.overlap({ x: 0, y: 0, w: 4, h: 4 }, { x: 4, y: 0, w: 2, h: 2 }), G.overlap({ x: 0, y: 0, w: 4, h: 4 }, { x: 3, y: 3, w: 2, h: 2 }), G.overlap({ x: 0, y: 0, w: 0, h: 4 }, { x: 0, y: 0, w: 2, h: 2 })], [false, true, false]);
    // 6 · 범위 — S:56-60: 폭 ≤ 8, 높이 ≤ 16(ROWS), 아래 끝은 48(MAX_ROWS)
    eq('06 inBounds', [G.inBounds({ x: 6, y: 0, w: 2, h: 2 }), G.inBounds({ x: 7, y: 0, w: 2, h: 2 }), G.inBounds({ x: 0, y: 0, w: 2, h: 17 }), G.inBounds({ x: 0, y: 46, w: 2, h: 2 }), G.inBounds({ x: 0, y: 47, w: 2, h: 2 })], [true, false, false, true, false]);
    // 7 · 유효성 — S:63-77: 같은 id 두 번 · 빈 id · 겹침은 모두 무효
    eq('07 isValid', [G.isValid(base), G.isValid(base.concat(L(['a text 0 8 2 2']))), G.isValid(base.concat(L(['z text 3 3 2 2']))), G.isValid([{ id: '', x: 0, y: 0, w: 2, h: 2 }])], [true, false, false, false]);
    // 8 · 줄 수 — S:26-28: 기본 16, 위젯이 더 아래에 있으면 그만큼, 48 에서 멈춤
    eq('08 rows', [G.rows([]), G.rows(base), G.rows(L(['a image 0 18 4 4'])), G.contentRows(base)], [16, 16, 22, 7]);
    // 9 · 첫 빈자리 — S:108-122: 줄 먼저, 그 안에서 열. base 의 첫 2×2 빈자리는 (4, 4)
    eq('09 firstFit', G.firstFit(base, 2, 2, 0), { x: 4, y: 4 });
    // 10 · 시작 줄 — S:113-115: start 줄부터 훑고 끝에 닿으면 맨 위로 돌아온다
    eq('10 firstFit start/wrap', [G.firstFit(base, 8, 2, 5), G.firstFit(L(['a image 0 0 8 14']), 8, 4, 14)], [{ x: 0, y: 7 }, { x: 0, y: 14 }]);
    // 11 · 아래로 늘리기 — S:105-106: 보이는 16줄에 자리가 없으면 맨 위부터 48줄까지
    eq('11 firstFit extends', G.firstFit(L(['a image 0 0 8 16']), 4, 4, 0), { x: 0, y: 16 });
    // 12 · 미리보기, 겹침 없음 — S:211-213: 지도 없이 valid
    var p12 = G.preview(base, 'c', { x: 4, y: 4, w: 2, h: 2 });
    eq('12 preview free', [p12.valid, p12.map], [true, null]);
    // 13 · 아래로 밀기 — S:153-154: 밀린 위젯은 막는 것의 바로 아래 줄로 (원래 줄에서 한 칸씩이 아니다)
    eq('13 push down', S(G.move(base, 'c', 0, 3, { dirs: ['down', 'right', 'left', 'up'] })), 'a@0,5 4x4 | b@4,0 4x2 | c@0,3 2x2 | d@6,2 2x2 | e@0,9 4x3');
    // 14 · 방향 우선 — S:148 + A:2434-2438: 들어온 방향을 먼저 시도한다. 오른쪽으로 들어오면 오른쪽으로 민다
    eq('14 push right first', S(G.move(L(['a status 0 0 2 2', 'b status 2 0 2 2']), 'a', 1, 0, { dirs: G.entryDirs(1, 0) })), 'a@1,0 2x2 | b@3,0 2x2');
    // 15 · 같은 배치, 아래 우선 — 같은 목표라도 방향 순서가 다르면 결과가 다르다
    eq('15 push down first', S(G.move(L(['a status 0 0 2 2', 'b status 2 0 2 2']), 'a', 1, 0, { dirs: G.entryDirs(0, 1) })), 'a@1,0 2x2 | b@2,2 2x2');
    // 16 · 연쇄 — S:169-174: 밀린 위젯이 다음 위젯을 민다 (깊이 3 까지 · S:146)
    eq('16 chain', S(G.move(L(['a status 0 0 2 2', 'b status 2 0 2 2', 'c status 4 0 2 2', 'd status 6 2 2 2']), 'a', 1, 0, { dirs: ['right'] })), 'a@1,0 2x2 | b@3,0 2x2 | c@5,0 2x2 | d@6,2 2x2');
    // 17 · 깊이 한도 — S:146: 네 번째 연쇄는 실패 → 한 방향뿐이면 놓을 수 없다 (원래 배치 그대로)
    var deep = L(['m status 0 0 2 2', 'a status 0 2 2 2', 'b status 0 4 2 2', 'c status 0 6 2 2', 'd status 0 8 2 2']);
    eq('17 depth limit', [G.same(G.move(deep, 'm', 0, 1, { dirs: ['down'] }), deep), S(G.move(deep.slice(0, 4), 'm', 0, 1, { dirs: ['down'] }))], [true, 'm@0,1 2x2 | a@0,3 2x2 | b@0,5 2x2 | c@0,7 2x2']);
    // 18 · 맞바꾸기 — S:188-203 + S:215: 밀 수 없고, 겹친 것이 같은 크기 하나면 원래 자리와 바꾼다
    var full = L(['a image 0 0 4 16', 'b image 4 0 4 16']);
    eq('18 swap', S(G.move(full, 'a', 4, 0, { maxRows: 16 })), 'a@4,0 4x16 | b@0,0 4x16');
    // 19 · 맞바꾸기 불가 — S:196: 겹친 것의 크기가 다르면 바꾸지 않는다 → 무효, 원래 배치 그대로 (A:2515-2516)
    var full2 = L(['a image 0 0 8 12', 'b image 0 12 8 4']);
    eq('19 no swap → unchanged', G.same(G.move(full2, 'a', 0, 2, { maxRows: 16 }), full2), true);
    // 20 · 범위 맞춤 — A:2425-2426: 목표 칸은 0…(8 − w), 0…(48 − h) 로 맞춘다
    eq('20 move clamp', S(G.move(L(['a image 0 0 4 4']), 'a', 9, -3)), 'a@4,0 4x4');
    // 21 · 핸들 크기 — A:2558 + A:2576-2577: 2…min(6, 8 − x) × 2…min(8, 48 − y)
    eq('21 handle clamp', [G.clampSize('image', 9, 12, { x: 0, y: 0 }), G.clampSize('image', 1, 1, { x: 0, y: 0 }), G.clampSize('image', 6, 3, { x: 4, y: 0 }), G.clampSize('image', 5, 7, { x: 0, y: 0 })], [{ w: 6, h: 8 }, { w: 2, h: 2 }, { w: 4, h: 3 }, { w: 5, h: 7 }]);
    // 22 · Together — A:2579-2584 + TB:581-585: 방향 고정, 허용 크기 중 가장 가까운 것
    var tg = { id: 't', kind: 'together', x: 0, y: 0, w: 2, h: 4 };
    eq('22 together snap', [G.clampSize('together', 2, 5, { x: 0, y: 0, item: tg }), G.clampSize('together', 3, 5, { x: 0, y: 0, item: tg }), G.clampSize('together', 6, 8, { x: 0, y: 0, item: tg }), G.sizesFor('together', { w: 6, h: 2 })], [{ w: 2, h: 4 }, { w: 3, h: 6 }, { w: 4, h: 8 }, [{ w: 6, h: 2 }]]);
    // 23 · 크기 칩 — WF:52 + WF:42-48: 12 크기, 정사각 → 가로 → 세로
    eq('23 sizesFor default', G.sizesFor('image').map(function (s) { return s.w + 'x' + s.h; }).join(' '), '2x2 3x3 4x4 6x6 4x2 4x3 6x2 6x4 3x4 2x6 4x6 6x8');
    // 24 · 예외 종류 — WF:22-26: To-do 4 크기, 상태 6 크기
    eq('24 sizesFor todo/status', [G.sizesFor('todo').map(function (s) { return s.w + 'x' + s.h; }).join(' '), G.sizesFor('status').map(function (s) { return s.w + 'x' + s.h; }).join(' ')], ['4x4 4x3 6x2 3x4', '2x2 3x3 4x4 6x6 4x2 6x2']);
    // 25 · 핸들로 키우기 — A:2588-2590: 왼쪽 위는 제자리, 겹치면 아래 · 오른쪽 · 왼쪽 · 위 순서로 민다
    eq('25 resize handle', S(G.resize(base, 'c', 4, 4, { mode: 'handle' })), 'a@0,0 4x4 | b@4,0 4x2 | c@4,2 4x4 | d@6,6 2x2 | e@0,4 4x3');
    // 26 · 크기 칩으로 키우기 — A:2631-2633: 오른쪽으로 넘치면 자리를 당겨 넣는다 (x 6 → 2)
    eq('26 resize preset shifts', S(G.resize(L(['d text 6 0 2 2']), 'd', 6, 2)), 'd@2,0 6x2');
    // 27 · 크기 칩, 자리 없음 — A:2639-2640: 밀 수 없으면 그대로 (맞바꾸기는 하지 않는다)
    var tight = L(['a image 0 0 4 8', 'b image 4 0 4 16', 'c image 0 8 4 8']);
    eq('27 resize preset no room', G.same(G.resize(tight, 'a', 6, 8, { maxRows: 16 }), tight), true);
    // 28 · Together 크기 칩 — A:2628-2630: 허용 크기가 아니면 그대로
    eq('28 together preset', [G.same(G.resize([tg], 't', 4, 4), [tg]), S(G.resize([tg], 't', 3, 6))], [true, 't@0,0 3x6']);
    // 29 · 추가 — A:2787-2796: 기본 크기(sizeMap)로 첫 빈자리에, 배열 맨 뒤에
    eq('29 place', S(G.place(base, { id: 'n', kind: 'music' })), S(base) + ' | n@4,4 4x2');
    // 30 · 가득 — A:2784: 디토를 뺀 위젯이 10개면 limit 옵션에서 놓지 않는다
    var ten = []; for (var i = 0; i < 10; i++) ten.push({ id: 'w' + i, kind: 'status', x: (i % 4) * 2, y: Math.floor(i / 4) * 2, w: 2, h: 2 });
    eq('30 limit 10', [G.isFull(ten), G.place(ten, { id: 'n', kind: 'status' }, { limit: true }).length, G.place(ten, { id: 'n', kind: 'status' }).length], [true, 10, 11]);
    // 31 · 디토 = 맨 앞 — S:271-296 + A:3105: (0, 0) 에 놓고, 겹친 것만 같은 열에서 아래 빈 줄로
    eq('31 ditto front', S(G.place(base, { id: 'n', kind: 'ditto', w: 4, h: 4 }, { front: true })), 'a@0,4 4x4 | b@4,0 4x2 | c@4,2 2x2 | d@6,2 2x2 | e@0,8 4x3 | n@0,0 4x4');
    // 32 · 삭제 — A:2864-2890: 지워도 나머지는 제자리 (자동 정리 없음)
    eq('32 remove', S(G.remove(base, 'a')), 'b@4,0 4x2 | c@4,2 2x2 | d@6,2 2x2 | e@0,4 4x3');
    // 33 · 정리하기 — S:223-241: 세로 순서를 지키며 같은 열에서 위로
    eq('33 compact', S(G.compact(G.remove(base, 'a'))), 'b@4,0 4x2 | c@4,2 2x2 | d@6,2 2x2 | e@0,0 4x3');
    // 34 · 바로잡기 — S:248-264: 위에서부터 제자리, 겹친 것만 빈 곳으로
    eq('34 repair', S(G.repair(L(['a image 0 0 4 4', 'b image 2 2 4 4']))), 'a@0,0 4x4 | b@4,0 4x4');
    // 35 · 입력 보존 — 어떤 함수도 받은 배열을 고치지 않는다
    var frozen = JSON.stringify(base);
    G.move(base, 'c', 0, 3); G.resize(base, 'c', 6, 6); G.place(base, { id: 'q', kind: 'ditto', w: 4, h: 4 }, { front: true }); G.compact(base); G.remove(base, 'a');
    eq('35 inputs untouched', JSON.stringify(base), frozen);
    // 36 · 무작위 — 어떤 순서로 옮기고 · 키우고 · 더하고 · 지워도 겹침이 없고 8열을 벗어나지 않는다 (S:184 · A:2511 · A:2611)
    var seed = 20261111, bad = 0;
    function rnd(n) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; }
    var cur = clone(base);
    for (var step = 0; step < 4000; step++) {
      var op = rnd(10), tgt = cur.length ? cur[rnd(cur.length)] : null;
      if (op < 5 && tgt) cur = G.move(cur, tgt.id, rnd(9) - 1, rnd(20) - 1, { dirs: G.entryDirs(rnd(3) - 1, rnd(3) - 1) });
      else if (op < 7 && tgt) cur = G.resize(cur, tgt.id, 1 + rnd(7), 1 + rnd(9), { mode: 'handle' });
      else if (op < 8 && tgt) { var sz = G.sizesFor(tgt.kind, tgt); var pick = sz[rnd(sz.length)]; cur = G.resize(cur, tgt.id, pick.w, pick.h); }
      else if (op < 9) cur = G.place(cur, { id: 'r' + step, kind: ['status', 'image', 'music', 'ditto'][rnd(4)], w: 2 + rnd(3), h: 2 + rnd(3) }, { front: rnd(2) === 0, limit: true });
      else if (tgt && cur.length > 3) cur = G.remove(cur, tgt.id);
      if (!G.isValid(cur) || G.overlaps(cur).length || cur.some(function (it) { return it.x < 0 || it.x + it.w > 8 || it.w < 1 || it.h < 1; })) bad++;
    }
    eq('36 fuzz 4000 steps', bad, 0);

    console.log((fail ? 'FAILED' : 'ok') + ' — ' + pass + ' passed, ' + fail + ' failed');
    return fail === 0;
  }
  G._selfTest = selfTest;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = G;
    if (typeof require !== 'undefined' && require.main === module && process.argv.indexOf('--test') >= 0) {
      process.exit(selfTest() ? 0 : 1);
    }
  } else {
    root.DittoGrid = G;
  }
})(typeof window !== 'undefined' ? window : this);
