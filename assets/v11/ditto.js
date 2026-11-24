/* Ditto process: shared source, deliberate copy, group provenance, and the first signal.
   Actual widget renderers/grid rules; all actions remain a local demonstration. */
(function () {
  'use strict';
  var root = document.getElementById('d9Demo');
  var DW = window.DittoWidgets, DP = window.DittoPlatter, people = window.DITTO_PLATTERS;
  if (!root || !DW || !DP || !people || !people.soramaybe) return;
  if (root.dataset.initialized) return;
  root.dataset.initialized = 'v11';
  root.closest('section').classList.add('d11');
  var $ = function (id) { return document.getElementById(id); };
  // One open theatre. Copy and controls sit outside its graphic plane.
  var section = root.closest('section'), intro = section.querySelector('.d9-heading > p:not(.h8-k)');
  if (intro) { intro.classList.add('d11-intro'); section.querySelector('.d9-rules > div').prepend(intro); }
  $('dt-h8').classList.add('d11-sr-only');
  var theatre = $('d9Stage'), copy = root.querySelector('.d9-scene-copy');
  root.insertBefore(copy, theatre);
  var dock = document.createElement('div'); dock.className = 'd11-dock';
  dock.appendChild($('d9HoldArea'));
  var cue = document.createElement('p'); cue.className = 'd11-cue'; cue.id = 'd11Cue';
  cue.innerHTML = '한 번의 디토, <b>두 사람의 공간에.</b>';
  dock.appendChild(cue); theatre.after(dock);
  theatre.appendChild(root.querySelector('.d9-route'));
  var art = document.createElement('div'); art.className = 'd11-transfer-art'; art.setAttribute('aria-hidden','true');
  art.innerHTML = '<svg viewBox="0 0 1000 440" preserveAspectRatio="none"><defs><marker id="d11-arrow" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="10" markerHeight="10" orient="auto-start-reverse"><path d="M2 2 L10 6 L2 10" fill="none" stroke="currentColor" stroke-width="1.5"/></marker></defs><path class="d11-arc" d="M272 180 C410 6 590 6 728 180"/><path class="d11-arc d11-arc-return" d="M700 300 C540 408 410 408 272 300"/></svg><span class="d11-transfer-mark"><img src="assets/dittobadge-32.svg" width="52" height="52" alt=""><span>Ditto!</span></span>';
  theatre.prepend(art);
  var destination = document.createElement('span'); destination.className='d11-destination'; destination.textContent='내 취향이 머물 자리';
  root.querySelector('.d9-receiving-board').prepend(destination);
  $('d9GroupMessage').querySelector('p').textContent='소라의 사진, 우리 소풍 생각나지 않아?';
  $('d9HoldHint').textContent='3초 전에 떼면 취소돼요. 키보드는 스페이스 또는 엔터.';
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var EASE = 'cubic-bezier(.22,1,.36,1)';
  var source = people.soramaybe.widgets.find(function (w) { return w.id === 'fs-03-sora-picnic'; }) || people.soramaybe.widgets.find(function (w) { return w.kind === 'image' && w.ditto; });
  if (!source) return;
  source = clone(source); source.w = source.h = 4; source.x = source.y = 0; source.id = 'd9-source'; source.ditto = true;
  delete source.data.img; delete source.data.audio; delete source.data.ytId;
  source.data.title = '함께한 소풍';
  var stage = $('d9Stage'), field = root.querySelector('.d9-original-field'), original = null;
  var holder = $('d9Hold'), holdLabel = $('d9HoldLabel'), holdCount = $('d9HoldCount'), status = $('d9Status');
  var steps = Array.prototype.slice.call(root.querySelectorAll('[data-d9-step]'));
  var connections = Array.prototype.slice.call(root.querySelectorAll('.d9-connection'));
  var personNodes = Array.prototype.slice.call(root.querySelectorAll('.d9-person'));
  var stepBar = root.querySelector('.d9-steps'), stepInk = document.createElement('i'), cardState = document.createElement('div');
  stepInk.className = 'd9-step-ink'; stepInk.setAttribute('aria-hidden', 'true'); stepBar.appendChild(stepInk);
  root.insertBefore(stepBar, root.querySelector('.d9-navigation'));
  cardState.className = 'd9-card-state'; cardState.setAttribute('aria-hidden', 'true'); field.insertBefore(cardState, field.firstChild);
  connections.forEach(function (connection) { var packet = document.createElement('em'); packet.className = 'd9-route-packet'; packet.setAttribute('aria-hidden', 'true'); connection.appendChild(packet); });
  var step = -1, version = 0, board = null, flight = null, settle = null, activeAnimations = [], timers = [];
  var holdStart = 0, holdFrame = 0, holdPointer = null, holdKey = null, pendingFocus = null, sceneVisible = true;
  var COPY = [
    ['01 — 열어 둔 원본', '소라의 순간을, 지우의 공간에.', '마음에 드는 순간을 내 공간에도. 원본은 그대로 남고, 원작자의 출처가 담긴 사본을 간직해요.'],
    ['02 — 3초 꾹', '마음에 들면, 디토!', '위젯과 원작자를 확인하고 3초 동안 꾹 눌러요. 누르고 있는 동안 색이 차오르고, 손을 떼면 멈춰요.'],
    ['03 — 출처와 사본', '그 순간이 내 공간에도.', '소라의 사진이 지우의 플래터 맨 앞에 놓였어요. 내용과 원작자의 출처가 함께 남고, 소라에게도 알림이 가요.'],
    ['04 — 친구의 친구', '취향이 한 사람 더 닿아요.', '지우가 소라의 원본을 그룹에 공유했어요. 하은도 여기서 원본을 디토해요. 지우가 가져온 사본을 다시 디토하는 건 아니에요.'],
    ['05 — 이어지는 신호', '아직 낯설지만, 통했어요.', '하은의 플래터에도 소라의 출처가 남았어요. 둘은 아직 친구가 아니지만, 이 작은 교류로 주파수가 시작돼요.']
  ];
  function copyWidget(id) { return { id: id, kind: source.kind, x: 0, y: 0, w: 4, h: 4, data: clone(source.data), source: { name: '소라', handle: 'soramaybe' } }; }
  function animate(el, frames, options) {
    if (!el || !el.animate || reduced.matches || !sceneVisible) return null;
    var a = el.animate(frames, Object.assign({ duration: 400, easing: EASE, fill: 'none' }, options));
    activeAnimations.push(a);
    a.finished.then(function () { activeAnimations = activeAnimations.filter(function (v) { return v !== a; }); }, function () {});
    return a;
  }
  function later(fn, delay) {
    var token = version;
    var t = setTimeout(function () { if (token === version) fn(); }, delay);
    timers.push(t); return t;
  }
  function stopScene() {
    version++; timers.forEach(clearTimeout); timers = [];
    activeAnimations.forEach(function (a) { a.cancel(); }); activeAnimations = [];
    if (flight) { flight.remove(); flight = null; }
    settle = null; delete root.dataset.arrival;
  }
  function show(id, yes) {
    var el = $(id);
    if (!yes && el.contains(document.activeElement)) pendingFocus = $('d9Next');
    el.hidden = !yes; el.inert = !yes;
  }
  function focusVisible() {
    if (pendingFocus) { pendingFocus.focus({ preventScroll: true }); pendingFocus = null; }
  }
  function renderOriginal(copy) {
    var copyAlready = original && original.classList.contains('dw-ditto');
    if (original && copyAlready === copy) return;
    original = DW.box(copy ? copyWidget('d9-haeun-copy') : source);
    $('d9Original').replaceChildren(original);
  }
  function makeBoard(who, withCopy) {
    if (board) board.destroy();
    var profile = people[who === 'haeun' ? 'haeunzip' : 'jiuallday'];
    var widgets = (profile ? profile.widgets : []).filter(function (w) { return ['text', 'status', 'music'].indexOf(w.kind) >= 0; }).slice(0, 3).sort(function(a,b){ return (a.kind === 'music') - (b.kind === 'music'); }).map(function (w, i) {
      w = clone(w); w.id = 'd9-base-' + i; w.x = w.kind === 'music' ? 0 : (i % 2) * 4; w.y = w.kind === 'music' ? 2 : Math.floor(i / 2) * 2; w.w = w.kind === 'music' ? 6 : 4; w.h = w.kind === 'music' ? 3 : 2; delete w.ditto; delete w.source; return w;
    });
    board = DP.create($('d9Receiving'), { widgets: widgets, editable: false, removable: false, minRows: 6, maxRows: 16 });
    if (withCopy) board.add(copyWidget('d9-copy'), { front: true, animate: false });
    $('d9CollectorInitial').textContent = who === 'haeun' ? '하' : '지';
    $('d9CollectorName').textContent = (who === 'haeun' ? '하은' : '지우') + '의 플래터';
    var slots = root.querySelector('.d9-slots');
    slots.querySelector('i').classList.toggle('on', !!withCopy);
    slots.querySelector('b').textContent = (withCopy ? '1' : '0') + ' / 3';
    slots.setAttribute('aria-label', '디토 3칸 중 ' + (withCopy ? '1' : '0') + '칸 사용');
  }
  function updateStepInk(instant) {
    var before = stepInk.getBoundingClientRect(), br = stepBar.getBoundingClientRect(), next = steps[Math.max(0, step)].getBoundingClientRect();
    stepInk.style.setProperty('--step-left', (next.left - br.left) + 'px');
    stepInk.style.setProperty('--step-width', next.width + 'px');
    if (!instant && before.width > 0) animate(stepInk, [
      { transform: 'translateX(' + (before.left - br.left) + 'px) scaleX(' + before.width / next.width + ')' },
      { transform: 'translateX(' + (next.left - br.left) + 'px) scaleX(1)' }
    ], { duration: 360 });
  }
  function flip(el, before, duration) {
    if (!before || !before.width || !el) return;
    var after = el.getBoundingClientRect(); if (!after.width || !after.height) return;
    var dx = before.left - after.left, dy = before.top - after.top, sx = before.width / after.width, sy = before.height / after.height;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < .01 && Math.abs(sy - 1) < .01) return;
    animate(el, [{ transformOrigin: 'top left', transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')' }, { transformOrigin: 'top left', transform: 'translate(0,0) scale(1)' }], { duration: duration || 500 });
  }
  function enter(el, delay, direction) {
    if (!el || el.hidden) return;
    var rest = getComputedStyle(el).transform; rest = rest === 'none' ? '' : rest + ' ';
    animate(el, [{ opacity: 0, transform: rest + 'translateY(' + (direction < 0 ? -12 : 12) + 'px)' }, { opacity: 1, transform: rest + 'translateY(0)' }], { duration: 360, delay: delay || 0 });
  }
  function routeSignal(index, delay) {
    var connection = connections[index], packet = connection.querySelector('.d9-route-packet'), length = Math.max(0, connection.clientWidth - packet.offsetWidth);
    var to = personNodes[index + 1].querySelector('.d9-avatar');
    animate(packet, [{ opacity: 0, transform: 'translateX(0)' }, { opacity: 1, transform: 'translateX(' + (length * .12) + 'px)', offset: .12 }, { opacity: 1, transform: 'translateX(' + length + 'px)', offset: .85 }, { opacity: 0, transform: 'translateX(' + length + 'px)' }], { duration: 640, delay: delay || 0 });
    animate(to, [{ transform: 'scale(1)' }, { transform: 'scale(1.12)', offset: .35 }, { transform: 'scale(1)' }], { duration: 320, delay: (delay || 0) + 480 });
  }
  var heights = [-1,-1,0,0,2,0,1,0,3,0,1,0,2,0,0,-1,-1];
  $('d9Wave').replaceChildren();
  for (var r = 0; r < 9; r++) for (var c = 0; c < 17; c++) {
    var dot = document.createElement('i'); dot.dataset.column = c;
    if (heights[c] >= 0 && Math.abs(r - 4) <= heights[c]) dot.className = 'is-signal';
    $('d9Wave').appendChild(dot);
  }
  function revealSignal() {
    root.querySelectorAll('.d9-wave .is-signal').forEach(function (dot) {
      animate(dot, [{ opacity: .2, transform: 'scale(.5)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 300, delay: 60 + Number(dot.dataset.column) * 18 });
    });
  }
  function setSourceContext(n, arriving) {
    var isGroup = n === 3 || arriving;
    $('d9SourceContext').textContent = isGroup ? '지우와 하은의 그룹 채팅' : n === 4 ? '하은의 플래터' : '소라의 플래터';
    $('d9SourceInitial').textContent = isGroup ? '지' : n === 4 ? '하' : '소';
    $('d9SourceName').textContent = isGroup ? '지우' : n === 4 ? '하은' : '소라';
    $('d9SourceHandle').textContent = isGroup ? '@jiuallday' : n === 4 ? '@haeunzip' : '@soramaybe';
    cardState.innerHTML = n === 4 && !arriving ? '<b>하은이 간직한 디토</b><span>1 / 3</span>' : '<b>소라의 원본</b><span>디토 허용</span>';
    $('d9SourceNote').textContent = n === 4 ? '하은이 가져온 사본에도 소라의 출처가 남아요.' : '디토 표시가 있는 위젯만 가져올 수 있어요.';
    renderOriginal(n === 4 && !arriving);
  }
  function cancelHold(message) {
    var was = !!holdStart;
    holdStart = 0; holdKey = null; holdPointer = null;
    if (holdFrame) cancelAnimationFrame(holdFrame); holdFrame = 0;
    delete root.dataset.holding;
    holder.classList.remove('is-holding'); holder.style.setProperty('--hold', '0');
    holdLabel.textContent = '내 플래터로 디토하기'; holdCount.textContent = '3초 꾹';
    if (was && message) status.textContent = message;
  }
  function changeStep(n, options) {
    options = options || {}; n = Math.max(0, Math.min(4, n));
    if (n === step && !options.force) return;
    var old = step, before = field.getBoundingClientRect(), direction = n < old ? -1 : 1;
    cancelHold(); stopScene(); step = n; root.dataset.step = n;
    if (options.arriving) root.dataset.arrival = 'haeun';
    steps.forEach(function (button, i) { button.setAttribute('aria-pressed', String(i === n)); button.dataset.completed = String(i < n); });
    personNodes.forEach(function (person, i) { var active = n >= 3 ? 2 : n >= 1 ? 1 : 0; person.dataset.state = i < active ? 'done' : i === active ? 'current' : 'quiet'; });
    $('d9StepLabel').textContent = COPY[n][0]; $('d9SceneTitle').textContent = COPY[n][1]; $('d9SceneBody').textContent = COPY[n][2];
    setSourceContext(n, options.arriving);
    show('d9GroupMessage', n === 3); show('d9OriginalRule', n === 3); show('d9SourceNote', n !== 3 && !options.arriving);
    show('d9Notice', n === 2 && !options.copying); show('d9OpenState', false); show('d9HoldArea', n === 1 || n === 3);
    show('d9Collection', n <= 3 || !!options.arriving); show('d9Gate', n === 4 && !options.arriving);
    $('d9Recipient').querySelector('.d9-avatar').textContent = n === 3 ? '하' : '지';
    $('d9Recipient').lastElementChild.textContent = (n === 3 ? '하은' : '지우') + '의 플래터로 가져와요';
    $('d9Prev').disabled = n === 0;
    $('d9Next').innerHTML = n === 4 ? '주파수로 이어 보기 <span aria-hidden="true">↓</span>' : '다음 장면 <span aria-hidden="true">→</span>';
    if (n <= 3 || options.arriving) makeBoard(n === 3 || options.arriving ? 'haeun' : 'jiu', n === 2 && !options.copying);
    show('d11Cue', n !== 1 && n !== 3);
    cue.innerHTML = n === 4 ? '출처는 이어지고, <b>관계는 이제 시작.</b>' : n === 2 ? '지우의 공간에도, <b>소라의 출처와 함께.</b>' : '한 번의 디토, <b>두 사람의 공간에.</b>';
    destination.hidden = n === 2 && !options.copying;
    root.querySelector('.d9-collection-note').innerHTML = n < 2 ? '디토하면 맨 앞에 놓여요.<br>기존 위젯은 자리를 내줘요.' : '내 플래터 맨 앞에, <b>원작자의 출처와 함께.</b>';
    status.textContent = options.message || (n === 1 || n === 3 ? '버튼을 3초 동안 꾹 눌러 디토해 보세요.' : n === 4 ? '위젯의 출처는 이어지고, 관계는 이제 시작돼요.' : '단계를 고르거나 다음 장면으로 이어가 보세요.');
    updateStepInk(old < 0);
    if (old >= 0) {
      flip(field, before, 480); enter(root.querySelector('.d9-scene-copy'), 0, direction);
      ['d9OpenState','d9HoldArea','d9Collection','d9Gate'].forEach(function (id) { enter($(id), 80, direction); });
      if (n === 3) enter($('d9GroupMessage'), 80, 1);
      if (n === 2 && !options.copying) { routeSignal(0, 80); enter($('d9Notice'), 200); }
      if (n === 4 && !options.arriving) { routeSignal(1, 80); revealSignal(); }
    }
    focusVisible();
  }
  function animateCopy(from, to, done) {
    if (reduced.matches || !document.body.animate || !sceneVisible || !from.width || !to || !to.width) { done(); return; }
    var token = version;
    flight = document.createElement('div'); flight.className = 'd9-flight'; flight.setAttribute('aria-hidden', 'true');
    flight.style.width = from.width + 'px'; flight.style.height = from.height + 'px';
    var grid = document.createElement('div'); grid.className = 'd9-flight-board dpl'; grid.style.width = (from.width * 358 / 175) + 'px';
    grid.appendChild(DW.box(copyWidget('d9-travelling-copy'))); flight.appendChild(grid); document.body.appendChild(flight);
    var moving = flight, sx = to.width / from.width, sy = to.height / from.height;
    function transform(x, y, xScale, yScale, rotation) { return 'translate(' + x + 'px,' + y + 'px) scale(' + xScale + ',' + yScale + ') rotate(' + rotation + 'deg)'; }
    var a = animate(moving, [
      { transform: transform(from.left, from.top, 1, 1, 0), opacity: .95 },
      { transform: transform(from.left + (to.left - from.left) * .43, from.top + (to.top - from.top) * .43 - 70, 1 + (sx - 1) * .43, 1 + (sy - 1) * .43, -3), opacity: 1, offset: .45 },
      { transform: transform(to.left, to.top, sx, sy, 0), opacity: 1 }
    ], { duration: 760, fill: 'forwards' });
    settle = function () { if (token !== version) return; moving.remove(); if (flight === moving) flight = null; settle = null; done(); };
    if (a) a.finished.then(function () { if (settle && token === version) settle(); }, function () {});
    else settle();
  }
  function markSlotFilled() {
    var slots = root.querySelector('.d9-slots'), first = slots.querySelector('i');
    first.classList.add('on'); slots.querySelector('b').textContent = '1 / 3'; slots.setAttribute('aria-label', '디토 3칸 중 1칸 사용');
    animate(first, [{ transform: 'translateY(-5px)', opacity: .3 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 250 });
  }
  function finishHaeun() {
    var before = board && board.rectOf('d9-copy');
    delete root.dataset.arrival;
    setSourceContext(4, false); show('d9Collection', false); show('d9Gate', true); show('d9SourceNote', true);
    if (before) flip(field, { left: before.left, top: before.top, width: before.width, height: before.height }, 500);
    enter($('d9Gate'), 100, 1); revealSignal();
    status.textContent = '하은이 디토했어요. 출처는 소라, 관계는 이제 시작이에요.';
    focusVisible();
  }
  function finishHold() {
    if (!holdStart) return;
    var who = step === 3 ? 'haeun' : 'jiu', from = original.getBoundingClientRect();
    cancelHold();
    changeStep(who === 'haeun' ? 4 : 2, { copying: true, arriving: who === 'haeun', message: (who === 'haeun' ? '하은' : '지우') + '의 플래터로, 원작자의 출처와 함께 옮기고 있어요.' });
    $('d9Next').focus({ preventScroll: true });
    var token = version, receiving = board, to = receiving.cellRect(0, 0, 4, 4);
    routeSignal(who === 'haeun' ? 1 : 0);
    animateCopy(from, to, function () {
      if (token !== version) return;
      receiving.add(copyWidget('d9-copy'), { front: true, animate: !reduced.matches });
      destination.hidden = true;
      markSlotFilled();
      if (who === 'haeun') {
        if (reduced.matches) finishHaeun(); else later(finishHaeun, 320);
      } else {
        show('d9Notice', true); enter($('d9Notice'), 0, 1);
        status.textContent = '지우가 디토했어요. 소라의 출처와 함께 3칸 중 1칸에 간직했어요.';
      }
    });
  }
  function tick(now) {
    if (!holdStart) return;
    var progress = Math.min(1, (now - holdStart) / 3000);
    holder.style.setProperty('--hold', progress.toFixed(4)); holdCount.textContent = Math.max(1, Math.ceil(3 - progress * 3)) + '초';
    if (progress >= 1) { finishHold(); return; }
    holdFrame = requestAnimationFrame(tick);
  }
  function beginHold() {
    if (holdStart || (step !== 1 && step !== 3)) return;
    root.dataset.holding = 'true'; holder.classList.add('is-holding'); holdLabel.textContent = '조금만 더 꾹 눌러요';
    status.textContent = '누르고 있어요. 3초 전에 떼면 취소돼요.';
    holdStart = performance.now(); holdFrame = requestAnimationFrame(tick);
  }
  holder.addEventListener('pointerdown', function (event) { if (event.button !== 0 || !event.isPrimary) return; holdPointer = event.pointerId; beginHold(); });
  holder.addEventListener('pointerleave', function () { if (holdPointer !== null) cancelHold('손이 버튼을 벗어나 디토를 취소했어요. 다시 꾹 눌러 보세요.'); });
  window.addEventListener('pointerup', function (event) { if (event.pointerId === holdPointer) cancelHold('손을 떼어 디토를 취소했어요. 다시 꾹 눌러 보세요.'); });
  window.addEventListener('pointercancel', function () { if (holdPointer !== null) cancelHold('디토를 취소했어요. 다시 꾹 눌러 보세요.'); });
  holder.addEventListener('keydown', function (event) { if (event.key !== ' ' && event.key !== 'Enter') return; event.preventDefault(); if (event.repeat) return; holdKey = event.key; beginHold(); });
  holder.addEventListener('keyup', function (event) { if (event.key === holdKey) { event.preventDefault(); cancelHold('키에서 손을 떼어 디토를 취소했어요. 다시 꾹 눌러 보세요.'); } });
  holder.addEventListener('blur', function () { cancelHold('디토를 취소했어요.'); });
  holder.addEventListener('contextmenu', function (event) { event.preventDefault(); });
  window.addEventListener('blur', function () { cancelHold(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) { cancelHold(); if (settle) settle(); } });
  window.addEventListener('scroll', function () { if (settle) settle(); }, { passive: true });
  window.addEventListener('resize', function () { cancelHold(); if (settle) settle(); updateStepInk(true); });
  reduced.addEventListener('change', function () {
    cancelHold();
    if (reduced.matches) {
      if (settle) settle();
      activeAnimations.forEach(function (a) { a.finish(); });
      if (root.dataset.arrival) { timers.forEach(clearTimeout); timers = []; finishHaeun(); }
    }
  });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (entries) { sceneVisible = entries[0].isIntersecting; if (!sceneVisible) { cancelHold(); if (settle) settle(); } }, { threshold: 0 }).observe(root);
  steps.forEach(function (button, i) { button.addEventListener('click', function () { changeStep(i); }); });
  $('d9Prev').addEventListener('click', function () { changeStep(step - 1); });
  $('d9Next').addEventListener('click', function () {
    if (step < 4) changeStep(step + 1);
    else { var target = document.getElementById('h8-freq-head'); if (target) target.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' }); }
  });
  $('d9Replay').addEventListener('click', function () { changeStep(0, { force: true }); });
  changeStep(0);
})();
