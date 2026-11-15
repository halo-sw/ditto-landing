/* Splup 디자인 가이드 — 핵심 컴포넌트 4판 (2026-11-15)
   핸들 색을 고르면 디토하기 버튼 색이 따라오고, 적은 제목이 위젯 규격 그림에 들어간다. 디토가 끝나면 시트 안 토스트로 결과를 알린다. */
(function () {
  'use strict';
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return [].slice.call((el || document).querySelectorAll(s)); };
  function play() {
    var root = $('#xp'); if (!root) return;
    /* 02 · 디토하기: 가이드 '디토하기 버튼' 문서가 그려 둔 실제 버튼 여섯 개(색별)를 복제해 장착한다 (3초 · 떼면 취소 · 압력감) */
    var dbox = $('#xpDitto'), cap = $('#xpDittoCap'), src = $$('#ditto-long-press .cs-button-palettes .cs-hold-control'), ctls = [], cur = 0;
    var CAP = { idle: '디토하기 / 기본', cancelled: '디토하기 / 기본', holding: '디토하기 / 누름', pending: '디토하기 / 가져오는 중', complete: '디토하기 / 완료', error: '디토하기 / 다시 시도' };
    if (dbox && src.length && window.SplupDittoHold) {
      src.forEach(function (el, i) {
        var html = el.outerHTML, ids = html.match(/splup-ditto-\d+/g) || [];
        ids.filter(function (v, k, arr) { return arr.indexOf(v) === k; }).forEach(function (id) { html = html.split(id).join('xp-' + id); });      // 숨은 문서의 그림 정의를 가리키지 않게 이름을 새로 준다
        dbox.insertAdjacentHTML('beforeend', html); dbox.lastElementChild.hidden = i !== 0;
      });
      var proxy = { querySelectorAll: function (s) { return dbox.querySelectorAll(s); }, querySelector: function () { return null; }, getElementById: function (id) { return document.getElementById(id); }, createElement: function (t) { return document.createElement(t); }, body: document.body, addEventListener: function (n, f) { document.addEventListener(n, f); } };
      Object.defineProperty(proxy, 'hidden', { get: function () { return document.hidden; } });
      ctls = window.SplupDittoHold.mount(proxy, window);
      $$('[data-ditto-hold]', dbox).forEach(function (b, i) {            // 상태가 바뀌면 아래 설명을 바꾸고, 끝나면 토스트로 알린 뒤 처음으로 돌아간다
        var last = '';
        new MutationObserver(function () {
          var st = b.dataset.holdState; if (st === last) return; last = st; if (i !== cur) return;
          cap.textContent = CAP[st] || CAP.idle;
          if (st === 'complete') { toast('내 플래터에 담았어요'); setTimeout(function () { if (ctls[i]) ctls[i].reset(); }, 2200); }
        }).observe(b, { attributes: true, attributeFilter: ['data-hold-state'] });
      });
    }
    function step(st) { var k = st === 'holding' || st === 'pending' || st === 'complete' ? st : 'idle'; $$('#xkSteps li').forEach(function (li) { li.classList.toggle('on', li.dataset.s === k); }); }
    /* 디토하기 버튼 — 앱의 DittoHoldButton 그대로: 3초 누르면 요청, 떼면 취소. 누르는 동안 Fluid 3색이 왼쪽부터 차오른다 */
    var FAM = [   // 핸들 색 점과 같은 순서: 바탕 · 차오르는 세 색 · 깊은 색 · 코어 세기
      ['#A25AD6', '#AA4AF4', '#6655D2', '#FA97E2', '#6F26A4', 0.4], ['#6655D2', '#6655D2', '#7841C4', '#AA4AF4', '#2C2F3A', 0.4], ['#F877C8', '#FA97E2', '#FF2CBF', '#FF5488', '#FF2CBF', 0.4],
      ['#F2955F', '#FF925D', '#F9F871', '#FA97E2', '#FF925D', 0.75], ['#48B5F4', '#48B5F4', '#27E5F2', '#398FE8', '#398FE8', 0.75], ['#2CCFA6', '#07E7B4', '#F9F871', '#39B9CC', '#39B9CC', 0.75]];
    var hb = $('#xaHold'), hl = $('#xaHoldL'), hraf = 0, ht0 = 0, hstate = 'idle', htm = 0;
    function family(i) { if (!hb) return; var f = FAM[i] || FAM[0]; ['--base', '--c0', '--c1', '--c2', '--deep', '--core'].forEach(function (k, n) { hb.style.setProperty(k, f[n]); }); var sg = document.getElementById('xkStage'); if (sg) ['--splup-demo-base', '--splup-demo-c0', '--splup-demo-c1', '--splup-demo-c2'].forEach(function (k, n) { sg.style.setProperty(k, f[n]); }); }
    function hset(st, p) {
      hstate = st; hb.dataset.state = st; var fill = st === 'requesting' ? 1 : st === 'holding' ? 0.08 + 0.92 * (1 - Math.pow(1 - p, 1.6)) : 0;
      hb.style.setProperty('--f', fill.toFixed(3)); hb.style.setProperty('--e', (-30 + 130 * fill).toFixed(1) + '%');
      hl.textContent = st === 'requesting' ? '가져오는 중...' : st === 'holding' ? '계속 누르세요' : '내 플래터에 디토하기';
      if (cap) cap.textContent = st === 'requesting' ? CAP.pending : st === 'holding' ? CAP.holding : CAP.idle;
    }
    function htick(now) { var p = Math.min(1, (now - ht0) / 3000); if (hstate !== 'holding') return; hset('holding', p); if (p >= 1) { hset('requesting', 1); htm = setTimeout(function () { hset('idle', 0); toast('내 플래터에 담았어요'); }, 650); return; } hraf = requestAnimationFrame(htick); }
    function hdown(e) { if (hstate !== 'idle') return; if (e.pointerId != null) { try { hb.setPointerCapture(e.pointerId); } catch (er) { /* 잡지 못해도 누르기는 된다 */ } } ht0 = performance.now(); hset('holding', 0); hraf = requestAnimationFrame(htick); }
    function hup() { if (hstate !== 'holding') return; cancelAnimationFrame(hraf); hset('idle', 0); }
    if (hb) {
      hb.addEventListener('pointerdown', hdown); ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { hb.addEventListener(n, hup); });
      hb.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); hdown(e); } });
      hb.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') hup(); });
      hb.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      family(0);
    }
    /* 큰 타일의 시연(Stageshow)이 지금 어느 단계인지 알려 오면 왼쪽 아래 단계 표시를 맞춘다 */
    var stage = $('#xkStage'); window.addEventListener('splup-ditto-demo', function (e) { step(e.detail); });
    /* 01 · 팔레트: 고른 색이 디토 버튼(시연과 실제 버튼 모두)에 적용된다 */
    var hs = $$('#xpPal .xk-dot'), hd = $('#xkH');
    hs.forEach(function (h, i) { h.addEventListener('click', function () {
      hs.forEach(function (x) { x.setAttribute('aria-pressed', x === h); }); cur = i; family(i); if (stage) stage.dataset.family = i; if (hd) { hd.style.setProperty('--a', h.style.getPropertyValue('--a')); hd.style.setProperty('--b', h.style.getPropertyValue('--b')); }
      ctls.forEach(function (c) { c.reset(); }); $$('.cs-hold-control', dbox).forEach(function (c, k) { c.hidden = k !== i; }); if (cap) cap.textContent = CAP.idle; if (stage) { stage.style.setProperty('--splup-demo-a', h.style.getPropertyValue('--a')); stage.style.setProperty('--splup-demo-b', h.style.getPropertyValue('--b')); }
    }); });
    /* 토스트 */
    var tz = $('#xpTz');
    var tt = 0, t0 = tz ? $('.xp-toast span', tz).textContent : ''; function toast(text) { if (!tz) return; var t = $('.xp-toast', tz); $('span', t).textContent = text; t.classList.remove('in'); void t.offsetWidth; t.classList.add('in'); clearTimeout(tt); tt = setTimeout(function () { $('span', t).textContent = t0; t.classList.remove('in'); void t.offsetWidth; t.classList.add('in'); }, 2400); }
    /* 02 · 입력: 글자 수는 칸 안 오른쪽에. 적은 제목은 03의 위젯에 바로 들어간다 */
    var inp = $('#xpIn'), cnt = $('#xpCnt'), icap = $('#xpInCap'), wd = $('#xpW');
    function sync() { var n = Array.from(inp.value).length; cnt.textContent = n + '/12'; if (wd) $('span', wd).textContent = inp.value || '표시 제목'; }
    if (inp) {
      inp.addEventListener('input', sync);
      inp.addEventListener('focus', function () { icap.textContent = '텍스트 입력 / 포커스'; });
      inp.addEventListener('blur', function () { icap.textContent = '텍스트 입력 / 기본'; });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
      sync();
    }
    /* 03 · 규격과 색 */
    var szs = $$('#xpSz button'), ds = $$('#xpCol .d'), pick = $('#xpPick');
    function ink(hex) { var m = hex.replace('#', '').match(/../g).map(function (v) { return parseInt(v, 16); }); return (m[0] * 299 + m[1] * 587 + m[2] * 114) / 1000 < 140 ? '#FFFFFF' : '#1C1722'; }
    function color(c) { if (!wd) return; wd.style.setProperty('--wc', c || '#FFFFFF'); wd.style.setProperty('--wk', c ? ink(c) : '#1C1722'); }
    szs.forEach(function (b) { b.addEventListener('click', function () { szs.forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); if (wd) { wd.style.setProperty('--w', b.dataset.w); wd.style.setProperty('--h', b.dataset.h); } }); });
    ds.forEach(function (b) { b.addEventListener('click', function () { ds.forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); color(b.dataset.c); }); });
    if (pick) pick.addEventListener('input', function () { ds.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); color(pick.value); });
    $$('.xb-chips button', root).forEach(function (b, i, all) { b.addEventListener('click', function () { all.forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); }); });
    $$('.xb-sw', root).forEach(function (b) { b.addEventListener('click', function () { b.setAttribute('aria-checked', b.getAttribute('aria-checked') !== 'true'); }); });
    $$('.xb-bub .chip', root).forEach(function (b) { b.addEventListener('click', function () { var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); b.classList.toggle('mine', on); var n = b.querySelector('i'); if (n) n.textContent = on ? 2 : 1; }); });
    $$('.xb-react button:not(.more)', root).forEach(function (b, i, all) { b.addEventListener('click', function () { var on = b.getAttribute('aria-pressed') === 'true'; all.forEach(function (x) { x.removeAttribute('aria-pressed'); }); if (!on) b.setAttribute('aria-pressed', 'true'); }); });
    var rs = $('#xpReset'); if (rs) rs.addEventListener('click', function () { ds.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); color(''); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', play); else play();
})();
