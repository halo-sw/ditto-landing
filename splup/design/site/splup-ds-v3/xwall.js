/* Splup 디자인 가이드 — 컴포넌트 견본 벽 (2026-11-21)
   화면 전체 너비에 칸을 빈틈없이 쌓는다(가장 낮은 열부터). 모든 칸은 눌러 볼 수 있다.
   값은 앱 정본: 핸들 10색 = DGrad.handleTones · 디토 버튼 6색 = DittoJellyPalette · 채움 = DittoBrandFamily.fluid · 내 말풍선 = ChatStyle.myBubble */
(function () {
  'use strict';
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return [].slice.call((el || document).querySelectorAll(s)); };
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = $('#xp.xw'); if (!root) return;

  /* ── 벽 쌓기: 열 너비 ≥ 250, 칸은 가장 낮은 열(넓은 칸은 두 열 중 더 낮은 쪽)에 ── */
  var tiles = $$('.xw-t', root), GAP = 16, raf = 0;
  function pack() {
    raf = 0;
    var W = root.clientWidth; if (!W) return;
    var cols = Math.max(1, Math.min(6, Math.floor((W + GAP) / (380 + GAP)))), cw = (W - GAP * (cols - 1)) / cols, h = [];
    for (var i = 0; i < cols; i++) h.push(0);
    root.classList.toggle('one', cols === 1);
    var lastOf = [];
    tiles.forEach(function (t) { t.style.minHeight = ''; t.classList.remove('fill'); });
    tiles.forEach(function (t) {
      var span = Math.min(cols, +(t.dataset.span || 1)), best = 0, bestY = Infinity;
      for (var c = 0; c + span <= cols; c++) { var y = Math.max.apply(null, h.slice(c, c + span)); if (y < bestY - 1) { bestY = y; best = c; } }
      t.style.width = (cw * span + GAP * (span - 1)).toFixed(1) + 'px';
      t.style.transform = 'translate(' + (best * (cw + GAP)).toFixed(1) + 'px,' + bestY.toFixed(1) + 'px)';
      var th = t.offsetHeight; for (var k = best; k < best + span; k++) { h[k] = bestY + th + GAP; lastOf[k] = span === 1 ? { t: t, y: bestY } : null; }
    });
    /* 바닥을 맞춘다: 열마다 마지막 칸을 가장 긴 열 끝까지 늘리고 내용은 가운데로 */
    var bottom = Math.max.apply(null, h) - GAP;
    if (cols > 1) lastOf.forEach(function (L) { if (L && bottom - L.y > L.t.offsetHeight + 1) { L.t.style.minHeight = (bottom - L.y).toFixed(1) + 'px'; L.t.classList.add('fill'); } });
    h = h.map(function () { return bottom + GAP; });
    root.style.height = Math.max.apply(null, h) - GAP + 'px';
    if (!root.classList.contains('packed')) { root.classList.add('packed'); setTimeout(function () { root.classList.add('ready'); }, 600); }
  }
  function later() { if (!raf) raf = requestAnimationFrame(pack); }
  if ('ResizeObserver' in window) { var ro = new ResizeObserver(later); ro.observe(root); tiles.forEach(function (t) { ro.observe(t); }); }
  addEventListener('resize', later); addEventListener('load', later); later();

  /* ── 디토하기 버튼: 앱 아이콘 계열 6가지 (바탕 그라데이션 · 차오르는 Fluid 3색 · 깊은 색 · 코어 세기) ── */
  var FAM = [
    { id: 'Purple', name: '퍼플', bg: 'linear-gradient(var(--ang,99deg),#AA4AF4 0,#AA4AF4 36%,#6655D2 100%)', f: ['#AA4AF4', '#6655D2', '#FA97E2'], deep: '#6F26A4', core: .4 },
    { id: 'DeepPurple', name: '딥 퍼플', bg: 'linear-gradient(var(--ang,99deg),#6655D2 0,#6655D2 36%,#2C2F3A 100%)', f: ['#6655D2', '#7841C4', '#AA4AF4'], deep: '#2C2F3A', core: .4 },
    { id: 'Pink', name: '핑크', bg: 'linear-gradient(var(--ang,99deg),#FA97E2 0,#FA97E2 25%,#FF2CBF 90%,#FF5488 100%)', f: ['#FA97E2', '#FF2CBF', '#FF5488'], deep: '#FF2CBF', core: .4 },
    { id: 'Peach', name: '피치', bg: 'linear-gradient(var(--ang,99deg),#FF925D 0,#FF925D 28%,#F9F871 100%)', f: ['#FF925D', '#F9F871', '#FA97E2'], deep: '#FF925D', core: .75 },
    { id: 'Cyan', name: '시안', bg: 'linear-gradient(var(--ang,99deg),#48B5F4 0,#48B5F4 25%,#27E5F2 100%)', f: ['#48B5F4', '#27E5F2', '#398FE8'], deep: '#398FE8', core: .75 },
    { id: 'Mint', name: '민트', bg: 'linear-gradient(var(--ang,99deg),#07E7B4 0,#07E7B4 28%,#F9F871 100%)', f: ['#07E7B4', '#F9F871', '#39B9CC'], deep: '#39B9CC', core: .75 }
  ];
  var hb = $('#xaHold'), famBox = $('#xwFam'), icBox = $('#xwIcons'), famNow = 0;
  function family(i) {
    famNow = i; var f = FAM[i];
    if (hb) {
      hb.style.setProperty('--bgrad', f.bg); hb.style.setProperty('--base', f.f[0]);
      ['--c0', '--c1', '--c2'].forEach(function (k, n) { hb.style.setProperty(k, f.f[n]); });
      hb.style.setProperty('--deep', f.deep); hb.style.setProperty('--core', f.core);
      var r = hb.getBoundingClientRect(); if (r.width) hb.style.setProperty('--ang', (90 + Math.atan(r.height / r.width) * 180 / Math.PI).toFixed(1) + 'deg');   // SwiftUI 대각선(0,0→1,1)을 가로로 긴 버튼에 맞춘 각도
    }
    var sg = $('#xkStage'); if (sg) ['--splup-demo-base', '--splup-demo-c0', '--splup-demo-c1', '--splup-demo-c2'].forEach(function (k, n) { sg.style.setProperty(k, n ? f.f[n - 1] : f.f[0]); });
    $$('button', famBox).forEach(function (b, k) { b.setAttribute('aria-checked', k === i); });
    $$('button', icBox).forEach(function (b) { b.setAttribute('aria-checked', b.dataset.f === String(i) && b.dataset.on === '1'); });
  }
  if (famBox) FAM.forEach(function (f, i) {
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-label', f.name); b.style.background = f.bg.replace('var(--ang,99deg)', '135deg');
    b.addEventListener('click', function () { $$('button', icBox).forEach(function (x) { x.dataset.on = ''; }); var ic = $('[data-f="' + i + '"]', icBox); if (ic) ic.dataset.on = '1'; family(i); });
    famBox.appendChild(b);
  });
  if (icBox) [['Default', '기본', 0], ['PurpleGlass', '퍼플 글래스', 0], ['PinkGlass', '핑크 글래스', 2], ['PeachGlass', '피치 글래스', 3], ['CyanGlass', '시안 글래스', 4], ['MintGlass', '민트 글래스', 5], ['DeepPurpleGlass', '딥 퍼플 글래스', 1], ['PurplePlain', '퍼플', 0], ['PinkPlain', '핑크', 2], ['PeachPlain', '피치', 3], ['CyanPlain', '시안', 4], ['MintPlain', '민트', 5]].forEach(function (a, k) {
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.dataset.f = a[2]; b.dataset.on = k === 0 ? '1' : '';
    b.innerHTML = '<img src="play-assets/appicon-' + a[0] + '.webp" alt="" width="120" height="120" loading="lazy" decoding="async">'; b.setAttribute('aria-label', a[1] + ' 앱 아이콘');
    b.addEventListener('click', function () { $$('button', icBox).forEach(function (x) { x.dataset.on = ''; }); b.dataset.on = '1'; family(a[2]); });
    icBox.appendChild(b);
  });
  if (hb) { family(0); addEventListener('resize', function () { family(famNow); }); }

  /* ── 프로필 핸들 10색: 위 밝은 색(lightLoc까지 유지) → 아래 기본색, 위 18% 흰빛, 글자색은 대비 규칙대로 ── */
  var TONES = [['red', '레드', '#f3687a', 12.4, '#c23c4e', 0], ['orange', '오렌지', '#FBC2A7', 64, '#f6844f', 1], ['yellow', '옐로', '#FAECAE', 64, '#f5d95d', 1], ['lime', '라임', '#E3F0B1', 64, '#c6e062', 1], ['teal', '틸', '#A5E2D1', 64, '#4bc5a3', 1],
    ['blue', '블루', '#ACCAF4', 64, '#5894e8', 1], ['indigo', '인디고', '#B3AAE9', 64, '#6655d2', 0], ['gray', '그레이', '#D9D9D9', 64, '#b3b3b3', 1], ['charcoal', '차콜', '#979797', 64, '#2f2f2f', 0], ['gold', '골드', '#D5C8A6', 64, '#ab914d', 1]];
  var hd = $('#xwH'), toneBox = $('#xwTones'), toneCap = $('#xwToneCap');
  function tone(i) {
    var t = TONES[i]; if (!hd) return;
    hd.style.setProperty('--hl', t[2]); hd.style.setProperty('--hp', t[3] + '%'); hd.style.setProperty('--hb', t[4]); hd.style.setProperty('--hk', t[5] ? '#171719' : '#FFFFFF');
    hd.classList.toggle('lt', !t[5]);
    $$('button', toneBox).forEach(function (b, k) { b.setAttribute('aria-checked', k === i); });
    if (toneCap) toneCap.textContent = t[1] + ', 위 ' + t[2].toUpperCase() + ' → 아래 ' + t[4].toUpperCase();
  }
  if (toneBox) TONES.forEach(function (t, i) {
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-label', t[1]);
    b.style.background = 'linear-gradient(180deg,' + t[2] + ' ' + t[3] + '%,' + t[4] + ' 100%)'; b.addEventListener('click', function () { tone(i); }); toneBox.appendChild(b);
  });
  tone(6);

  /* ── 토스트 (견본 칸 공용) ── */
  var tz = $('#xpTz'), tzT = 0, tz0 = tz ? $('.xp-toast span', tz).textContent : '';
  function toast(text) { if (!tz) return; var t = $('.xp-toast', tz); $('span', t).textContent = text; t.classList.remove('in'); void t.offsetWidth; t.classList.add('in'); clearTimeout(tzT); tzT = setTimeout(function () { $('span', t).textContent = tz0; }, 2400); }
  var undo = $('#xwUndo'); if (undo) undo.addEventListener('click', function () { var p = undo.parentNode; $('span', p).textContent = '위젯을 되돌렸어요'; undo.hidden = true; setTimeout(function () { $('span', p).textContent = '위젯을 지웠어요'; undo.hidden = false; }, 2000); });

  /* ── 채팅방: 보내기 · 꾹 눌러 반응 · 두 번 눌러 ❤️ · 반응 칩 켜고 끄기 ── */
  var room = $('#xwRoom'), form = $('#xwRoomIn'), bar = $('#xwRbar'), target = null, lpT = 0;
  function chip(box, emo, mine) {
    var b = $$('button', box).filter(function (x) { return x.firstChild && x.firstChild.nodeValue === emo; })[0];
    if (!b) { b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-pressed', 'false'); b.innerHTML = emo + '<i>0</i>'; box.appendChild(b); bindChip(b); }
    var on = b.getAttribute('aria-pressed') === 'true'; if (mine === on) return;
    var n = +$('i', b).textContent + (mine ? 1 : -1); b.setAttribute('aria-pressed', mine); b.classList.toggle('on', mine);
    if (n <= 0) b.remove(); else $('i', b).textContent = n;
    later();
  }
  function bindChip(b) { b.addEventListener('click', function () { chip(b.parentNode, b.firstChild.nodeValue, b.getAttribute('aria-pressed') !== 'true'); }); }
  function rxBox(msg) { var bx = $('.xw-rx', msg); if (!bx) { bx = document.createElement('span'); bx.className = 'xw-rx'; var host = $('div', msg) || msg; (msg.classList.contains('me') ? msg : host).appendChild(bx); } return bx; }
  if (room) {
    $$('.xw-rx button', room).forEach(bindChip);
    room.addEventListener('pointerdown', function (e) {
      var bb = e.target.closest('.bb'); if (!bb) return; clearTimeout(lpT);
      lpT = setTimeout(function () { target = bb.closest('.xw-msg'); var R = room.parentNode.getBoundingClientRect(), r = bb.getBoundingClientRect(); bar.hidden = false; bar.style.top = Math.max(52, r.top - R.top - 50) + 'px'; bb.classList.add('lift'); }, 380);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (n) { room.addEventListener(n, function () { clearTimeout(lpT); }); });
    room.addEventListener('dblclick', function (e) { var bb = e.target.closest('.bb'); if (!bb) return; chip(rxBox(bb.closest('.xw-msg')), '❤️', true); bb.classList.remove('beat'); void bb.offsetWidth; bb.classList.add('beat'); });
    room.addEventListener('contextmenu', function (e) { if (e.target.closest('.bb')) e.preventDefault(); });
    $$('button', bar).forEach(function (b) { b.addEventListener('click', function () { if (target) chip(rxBox(target), b.textContent, true); closeBar(); }); });
    document.addEventListener('pointerdown', function (e) { if (!bar.hidden && !bar.contains(e.target) && !e.target.closest('.bb')) closeBar(); });
  }
  function closeBar() { bar.hidden = true; $$('.bb.lift', room).forEach(function (x) { x.classList.remove('lift'); }); target = null; }
  if (form) {
    var inp = $('input', form), go = $('.go', form);
    inp.addEventListener('input', function () { go.disabled = !inp.value.trim(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var v = inp.value.trim(); if (!v) return;
      var ms = $$('.xw-msg', room), lastMsg = ms[ms.length - 1];
      if (lastMsg && lastMsg.classList.contains('me')) { lastMsg.classList.remove('last'); if (!lastMsg.classList.contains('first')) lastMsg.classList.add('mid'); }
      var m = document.createElement('div'); m.className = 'xw-msg me last' + (lastMsg && lastMsg.classList.contains('me') ? '' : ' first') + ' new';
      m.innerHTML = '<time>지금 <u>3</u></time><span class="bb"></span>'; $('.bb', m).textContent = v; room.appendChild(m);
      inp.value = ''; go.disabled = true; room.scrollTop = room.scrollHeight;
      setTimeout(function () { var u = $('u', m); if (u) u.remove(); }, 1600);
    });
  }

  /* ── 초대 코드 6칸 ── */
  var otp = $('#xwOtp'), otpCap = $('#xwOtpCap');
  if (otp) {
    var cells = [];
    for (var i = 0; i < 6; i++) { var c = document.createElement('input'); c.type = 'text'; c.maxLength = 1; c.inputMode = 'text'; c.autocomplete = 'off'; c.setAttribute('aria-label', (i + 1) + '번째 글자'); otp.appendChild(c); cells.push(c); }
    'DT7K'.split('').forEach(function (ch, k) { cells[k].value = ch; });
    function check() { var v = cells.map(function (x) { return x.value; }).join(''); otp.classList.toggle('ok', v.length === 6); otpCap.textContent = v.length === 6 ? '좋아요! 코드를 확인했어요.' : '받은 코드를 그대로 넣어요. 붙여 넣어도 돼요.'; }
    cells.forEach(function (c, k) {
      c.addEventListener('input', function () { c.value = c.value.replace(/[^0-9a-z]/gi, '').toUpperCase().slice(-1); if (c.value && cells[k + 1]) cells[k + 1].focus(); check(); });
      c.addEventListener('keydown', function (e) { if (e.key === 'Backspace' && !c.value && cells[k - 1]) { cells[k - 1].focus(); cells[k - 1].value = ''; check(); } });
      c.addEventListener('paste', function (e) { var t = (e.clipboardData.getData('text') || '').replace(/[^0-9a-z]/gi, '').toUpperCase().slice(0, 6); if (!t) return; e.preventDefault(); t.split('').forEach(function (ch, j) { if (cells[j]) cells[j].value = ch; }); (cells[t.length] || cells[5]).focus(); check(); });
    });
    check();
  }

  /* ── 하나만 고르는 줄들 (종류 칩 · 화면 나누기 · 탭 바) ── */
  function radio(sel, attr) { $$(sel).forEach(function (box) { $$('button', box).forEach(function (b, k, all) { b.addEventListener('click', function () { all.forEach(function (x) { x.setAttribute(attr, x === b); }); }); }); }); }
  radio('.xw-filter', 'aria-checked'); radio('.xw-split', 'aria-checked'); radio('#xwTab', 'aria-selected');

  /* ── 알림 수락 · 댓글 좋아요 · 친구 신청 ── */
  $$('.xw-acc').forEach(function (b) { b.addEventListener('click', function () { var li = b.closest('li'), p = $('p', li); p.firstChild.nextSibling.nodeValue = '님과 친구가 됐어요.'; b.remove(); toast('결님과 친구가 됐어요'); }); });
  $$('.xw-cm .hz').forEach(function (b) { b.addEventListener('click', function () { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); }); });
  $$('.xw-req').forEach(function (b) { b.addEventListener('click', function () { var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); b.textContent = on ? '신청했어요' : '친구 신청'; }); });

  /* ── 카메라 셔터 ── */
  var sh = $('.xw-sh'), shN = $('#xwShotN'), shots = 0;
  if (sh) sh.addEventListener('click', function () { shots++; shN.textContent = shots + '장'; var t = sh.closest('.xw-t'); t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash'); });

  /* ── 올리는 중: 화면에 보일 때만 0 → 100% 되풀이 ── */
  var up = $('#xwUp');
  if (up) {
    var upI = $('i', up), upS = $('small', up), upB = $('b', up), pct = 0, upT = 0;
    function upTick() { pct = pct >= 100 ? 0 : Math.min(100, pct + 4 + Math.random() * 7); upI.style.width = pct + '%'; upS.textContent = Math.round(pct) + '%'; upB.textContent = pct >= 100 ? '올렸어요' : '사진 올리는 중'; up.classList.toggle('done', pct >= 100); upT = setTimeout(upTick, pct >= 100 ? 1600 : 260); }
    seen(up, function (on) { clearTimeout(upT); if (on && !RM) upTick(); else if (on) { upI.style.width = '72%'; upS.textContent = '72%'; } });
  }

  /* ── 다크 모드 ── */
  var dk = $('#xwDk'), md = dk && $('.xw-mode', dk);
  if (md) md.addEventListener('click', function () { var on = md.getAttribute('aria-checked') !== 'true'; md.setAttribute('aria-checked', on); dk.classList.toggle('dark', on); $('b', md).textContent = on ? '어두운 화면' : '밝은 화면'; });

  /* ── 주파수 점 물결 (랜딩과 같은 그림) ── */
  var fq = $('#xwFq');
  if (fq && fq.getContext) {
    var x = fq.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), fr = 0, fqOn = false;
    fq.width = 240 * dpr; fq.height = 96 * dpr; x.scale(dpr, dpr);
    function paintFq(now) {
      var W = 240, H = 96, t = RM ? 1.2 : now / 1000, cols = 24, rows = 9, cg = W / cols, rg = H / rows; x.clearRect(0, 0, W, H);
      for (var c = 0; c < cols; c++) {
        var env = Math.sin((c + 0.5) / cols * Math.PI), lv = 0.4 + (0.5 + 0.5 * Math.sin(t * 2.2 - c * 0.55)) * env * 3.6, g = c / (cols - 1);
        for (var r = 0; r < rows; r++) { var d = Math.abs(r - 4), on = d <= lv; x.globalAlpha = on ? 1 - d * 0.14 : 0.2; x.fillStyle = on ? 'rgb(' + Math.round(170 + 80 * g) + ',' + Math.round(74 + 77 * g) + ',' + Math.round(244 - 18 * g) + ')' : '#C9C3D3'; x.beginPath(); x.arc(cg * (c + 0.5), rg * (r + 0.5), on ? 3.4 - d * 0.3 : 1.7, 0, 6.2832); x.fill(); }
      }
      x.globalAlpha = 1; if (fqOn && !RM) fr = requestAnimationFrame(paintFq);
    }
    seen(fq, function (on) { fqOn = on; cancelAnimationFrame(fr); if (on) fr = requestAnimationFrame(paintFq); });
    paintFq(1200);
  }

  /* ── 컬러: 눌러서 복사 ── */
  var sw = $('#xwSw');
  if (sw) [['Splup 퍼플', '#AA4AF4'], ['딥 퍼플', '#6655D2'], ['플래터 핑크', '#FA97E2'], ['누름 퍼플', '#8C2BD6'], ['잉크', '#241C2B'], ['밤', '#181818']].forEach(function (c) {
    var b = document.createElement('button'); b.type = 'button'; b.style.setProperty('--c', c[1]); b.innerHTML = '<i></i><b></b><small></small>'; $('b', b).textContent = c[0]; $('small', b).textContent = c[1];
    b.addEventListener('click', function () { if (navigator.clipboard) navigator.clipboard.writeText(c[1]).catch(function () {}); toast(c[1] + ' 복사했어요'); });
    sw.appendChild(b);
  });

  /* ── 스티커 ── */
  var stk = $('#xwStk');
  if (stk) ['bubble-duck', 'jelly-saturn', 'citrus-bolt', 'grape-knot', 'ice-dolphin', 'jelly-cactus', 'cola-dino', 'jelly-egg'].forEach(function (n, k) {
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', '스티커'); b.style.setProperty('--r', ((k * 37) % 17 - 8) + 'deg');
    b.innerHTML = '<img src="/assets/cast/pack-stickers/01-jelly/' + n + '.webp" alt="" loading="lazy" decoding="async">';
    b.addEventListener('click', function () { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); });
    stk.appendChild(b);
  });

  /* ── 플래터: 랜딩과 같은 코드(DittoPlatter)로, 위젯 종류마다 하나씩. 꾹 눌러 옮기고 모서리로 크기 바꾸기 ── */
  /* 앱 플래터 = 8칸 격자(칸 사이 8, 양옆 16, 화면 390). 12종을 빈칸 없이 8×16에 */
  var KINDS = [['music', '음악', 0, 0, 4, 2], ['dday', 'D-Day', 4, 0, 2, 2], ['social', '소셜', 6, 0, 2, 2], ['image', '사진', 0, 2, 4, 4], ['block', '포스트', 4, 2, 4, 4],
    ['todo', 'To-do', 0, 6, 3, 4], ['playlist', '플레이리스트', 3, 6, 3, 4], ['guestbook', '방명록', 6, 6, 2, 2], ['gif', 'GIF', 6, 8, 2, 2],
    ['video', '영상', 0, 10, 6, 4], ['sticker', '스티커 보드', 6, 10, 2, 6], ['text', '글', 0, 14, 6, 2]];
  var plBox = $('#xwPlatter'), inst = null;
  function widgets() {
    var P = window.DITTO_PLATTERS || {}, pick = {};
    Object.keys(P).forEach(function (h) { (P[h].widgets || []).forEach(function (w) { if (!pick[w.kind]) pick[w.kind] = w; }); });
    return KINDS.filter(function (k) { return pick[k[0]]; }).map(function (k) { var w = JSON.parse(JSON.stringify(pick[k[0]])); w.id = 'xw-' + k[0]; w.x = k[2]; w.y = k[3]; w.w = k[4]; w.h = k[5]; return w; });
  }
  function makePlatter() {
    if (!plBox || !window.DittoPlatter) return;
    if (inst && inst.destroy) inst.destroy();
    var ws = widgets();
    inst = window.DittoPlatter.create(plBox, { widgets: ws, editable: true, removable: false, minRows: 16,
      onChange: function (e) { sizes(e.layout); }, onSelect: function (id) { mark(id); } });
    buildKinds(ws); later();
  }
  /* 위젯 규격표: 종류마다 지금 크기(너비×높이)와 6칸 격자 위 자리 그림. 플래터에서 끌면 같이 바뀐다 */
  var kinds = $('#xwKinds');
  function buildKinds(ws) {
    if (!kinds) return; kinds.textContent = '';
    var nm = {}; KINDS.forEach(function (k) { nm[k[0]] = k[1]; });
    ws.forEach(function (w) {
      var li = document.createElement('li'), b = document.createElement('button'); b.type = 'button'; b.dataset.id = w.id;
      b.innerHTML = '<span class="t"><b></b><i></i></span><span class="fp" aria-hidden="true"><i></i></span>';
      b.querySelector('b').textContent = nm[w.kind] || w.kind;
      b.addEventListener('click', function () { if (inst && inst.select) inst.select(w.id); mark(w.id); });
      li.appendChild(b); kinds.appendChild(li);
    });
    var n = document.getElementById('xwKindN'); if (n) n.textContent = ws.length;
    sizes(ws);
  }
  function sizes(lay) {
    if (!kinds) return;
    (lay || []).forEach(function (w) {
      var b = kinds.querySelector('[data-id="' + w.id + '"]'); if (!b) return;
      var i = b.querySelector('.t i'), was = i.textContent, now = w.w + '×' + w.h; i.textContent = now;
      var fp = b.querySelector('.fp i'); fp.style.setProperty('--w', w.w); fp.style.setProperty('--h', Math.min(w.h, 8));
      if (was && was !== now) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
    });
  }
  function mark(id) { if (kinds) [].forEach.call(kinds.querySelectorAll('button'), function (b) { b.setAttribute('aria-current', b.dataset.id === id ? 'true' : 'false'); }); }
  var rs = $('#xwPlReset'); if (rs) rs.addEventListener('click', makePlatter);
  if (plBox) { if (window.DittoPlatter) makePlatter(); else addEventListener('load', makePlatter); }

  function seen(el, cb) {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(function (es) { cb(es[0].isIntersecting); }).observe(el);
  }
})();
