/* Ditto landing v5: scroll scenes for the white layout. Everything is skipped when motion is reduced. */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var ease = function (t) { return t * t * (3 - 2 * t); };

  /* the extras behind the invitation */
  var more = $('moreOpen');
  function openMore() { document.body.classList.add('more-on'); window.dispatchEvent(new Event('resize')); }
  if (more) more.addEventListener('click', openMore);
  if (/^#(play|smap|sb)/.test(location.hash) || /[?&]t=/.test(location.search)) openMore();
  document.querySelectorAll('a[href="#play"],a[href="#smap"]').forEach(function (a) { a.addEventListener('click', openMore); });

  /* numbers that count up once */
  var counts = [].slice.call(document.querySelectorAll('[data-count]'));
  function fmt(el, v) { var d = +el.dataset.dec || 0; el.firstChild.nodeValue = v.toFixed(d); }
  if (!reduce && 'IntersectionObserver' in window) {
    counts.forEach(function (el) { fmt(el, 0); });
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; cio.unobserve(e.target);
        var el = e.target, to = +el.dataset.count, t0 = performance.now();
        (function f(n) { var p = clamp((n - t0) / 1100, 0, 1); fmt(el, to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); })(t0);
      });
    }, { threshold: .4 });
    counts.forEach(function (el) { cio.observe(el); });
  }

  /* hero belt: tiles grow as they pass the middle */
  var belt = $('hxBelt');
  if (belt) {
    var tiles = [].slice.call(belt.children), N = tiles.length, x = 0, W = 0, slot = 0, last = 0, seen = true;
    var size = function () { W = belt.clientWidth; slot = clamp(W * .215, 156, 330); };
    size(); addEventListener('resize', size);
    var place = function () {
      var L = N * slot;
      tiles.forEach(function (t, i) {
        var p = ((i * slot + x) % L + L) % L; if (p > L / 2) p -= L;
        var d = clamp(Math.abs(p) / (W * .55), 0, 1), s = 1.2 - .66 * ease(d);
        t.style.transform = 'translateX(' + p.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
        t.style.zIndex = Math.round((1 - d) * 10);
      });
    };
    place();
    if (!reduce) {
      new IntersectionObserver(function (e) { seen = e[0].isIntersecting; if (seen) { last = 0; requestAnimationFrame(tick); } }).observe(belt);
      var tick = function (n) { if (!seen) return; if (last) x -= Math.min(40, n - last) * .036; last = n; place(); requestAnimationFrame(tick); };
    }
  }

  /* dot-matrix wave from the app's frequency screen: five peaks, colour = stage */
  var STAGE = ['#8E919E', '#2BC4A8', '#5A5BF2'], SPEED = [3.4, 2.6, 1.6, 2.1];
  function waveColor(s, x) {
    if (s < 3) return STAGE[s];
    if (x > .85) return '#FA97E2';
    var k = x / .85; return 'rgb(' + Math.round(199 - 29 * k) + ',' + Math.round(155 - 81 * k) + ',' + Math.round(255 - 11 * k) + ')';
  }
  function wave(cv, s, amp, t, dim) {
    var w = cv.clientWidth, h = cv.clientHeight; if (!w) return;
    var d = Math.min(2, devicePixelRatio || 1), pw = Math.round(w * d), ph = Math.round(h * d);
    if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
    var g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h);
    var rows = 9, p = h / rows, cols = Math.min(45, Math.floor(w / p)), x0 = (w - cols * p) / 2 + p / 2, ph2 = t / SPEED[s] * Math.PI * 2;
    for (var c = 0; c < cols; c++) {
      var x = c / (cols - 1), env = Math.pow(Math.abs(Math.sin(x * Math.PI * 5 + .35)), 1.3), sway = 1 + .28 * Math.sin(ph2 + c * .55), half = env * sway * (.5 + amp * 3.5);
      for (var r = 0; r < rows; r++) {
        var lit = Math.abs(r - 4) <= half;
        g.beginPath(); g.arc(x0 + c * p, p / 2 + r * p, p * (lit ? .4 : .2), 0, 6.3); g.fillStyle = lit ? waveColor(s, x) : dim; g.fill();
      }
    }
  }

  /* three weeks of two people. Stage per day comes from FREQUENCY_POLICY (21-day decay, 10 points, 4 days, a shared interaction). */
  var fpEl = $('fp'), fpDay = 21;
  var FP_S = '000000011112222222333', FP_C = ['#8E919E', '#2BC4A8', '#5A5BF2', '#AA4AF4'];
  var FP_E = [[2, '지우가 하은의 플래터에 들렀어요'], [4, '하은도 지우의 플래터에 들렀어요'], [5, '소라의 사진에 함께 댓글을 달았어요'], [8, '같은 날 그룹 채팅에서 이야기했어요'], [10, '재민의 위젯에 함께 댓글을 달았어요'], [12, '지우가 하은의 창가 사진을 디토했어요'], [15, '같은 사진에 함께 반응을 남겼어요'], [17, '하은이 지우의 플래터에 다시 들렀어요'], [19, '하은도 지우의 사진을 디토했어요']];
  var FP_M = ['잔잔하게 이어지는 중', '선명하게 이어지는 중', '곧 친구 신청이 열려요', '친구 신청이 열렸어요'];
  var fpCv = $('fpWave'), fpS = 3, fpAmp = 1, fpTicks = [];
  function fpSet(day) {
    fpDay = day; var s = +FP_S[day - 1], past = FP_E.filter(function (e) { return e[0] <= day; }).reverse();
    $('fpDay').textContent = day;
    var log = $('fpLog'), html = past.slice(0, 5).map(function (e) { return '<li><em>' + e[0] + '일째</em><span>' + e[1] + '</span></li>'; }).join('');
    if (log._h !== html) { log._h = html; log.innerHTML = html; }
    [].forEach.call($('fpStage').children, function (li, i) { li.classList.toggle('on', i === s); });
    fpTicks.forEach(function (el, i) {
      var d = i + 1, ev = FP_E.some(function (e) { return e[0] === d; });
      el.className = (d <= day && ev ? 'ev' : d <= day ? 'p' : '') + (d === day ? ' now' : '');
      el.style.setProperty('--c', FP_C[+FP_S[i]]);
    });
    $('fpMsg').textContent = FP_M[s]; $('fpBtn').classList.toggle('on', s === 3); fpS = s;
  }
  if (fpEl) {
    var tk = $('fpTicks'); for (var fi = 0; fi < 21; fi++) { var ti = document.createElement('i'); tk.appendChild(ti); fpTicks.push(ti); }
    fpSet(21);
  }
  var sxCv = document.querySelector('.sxw');
  if (reduce) { if (fpCv) wave(fpCv, 3, 1, 0, 'rgba(28,23,34,.09)'); if (sxCv) wave(sxCv, 3, 1, 0, 'rgba(255,255,255,.1)'); return; }

  /* scroll progress of a tall section, 0 at its top and 1 when its last screen is reached */
  var prog = function (el) { var r = el.getBoundingClientRect(), span = r.height - innerHeight; return span > 0 ? clamp(-r.top / span, 0, 1) : 0; };

  var film = $('film'), figure = film && film.querySelector('.film-f'), caption = film && film.querySelector('.film-t');
  var shift = $('shift'), rows = shift ? [].slice.call(shift.querySelectorAll('li')) : [];
  var gather = $('platter'), pieces = gather ? [].slice.call(gather.querySelectorAll('.gt')) : [], copy = gather && gather.querySelector('.gather-c');
  var scenes = shift ? [].slice.call(shift.querySelectorAll('.sc')) : [], shT = 0, shI = 0;
  var feedT = shift ? [].slice.call(shift.querySelectorAll('.s3 .t')) : [], feedBox = feedT.length && feedT[0].parentNode;
  var gnb = $('gnb'), darks = [film, shift].filter(Boolean);
  /* feed: one column that runs on; platter: the same widgets, placed */
  feedT.forEach(function (el) {
    el._p = { x: +el.style.getPropertyValue('--x'), y: +el.style.getPropertyValue('--y'), w: +el.style.getPropertyValue('--w') };
  });
  function feedLayout() {
    var y = 8;
    feedT.forEach(function (el) { var ar = el.naturalWidth ? el.naturalHeight / el.naturalWidth : 1; el._f = y; y += 56 * ar + 4; });
  }
  feedT.forEach(function (el) { el.addEventListener('load', feedLayout); }); feedLayout();
  function feedDraw(t) {
    var u = feedBox.clientWidth / 100, run = clamp(t / .42, 0, 1), k = ease(clamp((t - .36) / .64, 0, 1));
    feedT.forEach(function (el) {
      var p = el._p, fy = el._f - run * 46, x = 22 + (p.x - 22) * k, y = fy + (p.y - fy) * k, s = (56 + (p.w - 56) * k) / p.w;
      el.style.transform = 'translate(' + (x * u).toFixed(1) + 'px,' + (y * u).toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
      el.style.filter = k < 1 ? 'grayscale(' + (1 - k).toFixed(2) + ') brightness(' + (.72 + .28 * k).toFixed(2) + ')' : '';
    });
  }
  /* the two live waves only draw while on screen */
  var liveFp = false, liveSx = false, waving = false;
  function waveLoop(n) {
    if (!liveFp && !liveSx) { waving = false; return; }
    var t = n / 1000;
    if (liveFp && fpCv) { fpAmp += ([.12, .46, .76, 1][fpS] - fpAmp) * .08; wave(fpCv, fpS, fpAmp, t, 'rgba(28,23,34,.09)'); }
    if (liveSx && sxCv && shI === 0) { var a = clamp((shT - .3) / .7, 0, 1); wave(sxCv, Math.min(3, Math.floor(a * 4)), a, t, 'rgba(255,255,255,.1)'); }
    requestAnimationFrame(waveLoop);
  }
  function waveStart() { if (!waving) { waving = true; requestAnimationFrame(waveLoop); } }
  if (fpEl) new IntersectionObserver(function (e) { liveFp = e[0].isIntersecting; if (liveFp) waveStart(); }).observe(fpEl);
  if (shift) new IntersectionObserver(function (e) { liveSx = e[0].isIntersecting; if (liveSx) waveStart(); }).observe(shift);

  pieces.forEach(function (p, i) {
    p._dx = parseFloat(p.dataset.dx) * .55; p._dy = parseFloat(p.dataset.dy) * .55; p._at = i / pieces.length * .34;
  });

  var ticking = false;
  var SH1 = 140 / 380;
  function frame() {
    ticking = false;
    if (film) {
      var p = prog(film), o = ease(clamp(p / .62, 0, 1));
      figure.style.setProperty('--c', (1 - o).toFixed(3));
      var t = clamp((p - .42) / .3, 0, 1);
      caption.style.opacity = t.toFixed(3);
      caption.style.transform = 'translateY(' + ((1 - t) * 24).toFixed(1) + 'px)';
    }
    if (shift) {
      var sp = prog(shift), q = sp < SH1 ? sp / SH1 : 1 + (sp - SH1) / (1 - SH1) * 3; shI = Math.min(3, Math.floor(q)); shT = ease(clamp((q - shI - .1) / .62, 0, 1));
      rows.forEach(function (r, i) { r.classList.toggle('cur', i === shI); r.classList.toggle('on', i < shI || (i === shI && shT > .35)); });
      scenes.forEach(function (s, i) { s.classList.toggle('cur', i === shI); s.style.setProperty('--t', (i < shI ? 1 : i > shI ? 0 : shT).toFixed(3)); });
      if (shI === 2 || q < 3.2) feedDraw(shI === 2 ? shT : shI > 2 ? 1 : 0);
    }
    if (gather) {
      var g = prog(gather), vw = innerWidth / 100, vh = innerHeight / 100;
      pieces.forEach(function (el) {
        var k = ease(clamp((g + .08 - el._at) / .46, 0, 1));
        el.style.opacity = clamp(.6 + k * 1.2, 0, 1).toFixed(3);
        el.style.transform = 'translate(' + (el._dx * .6 * vw * (1 - k)).toFixed(1) + 'px,' + (el._dy * .6 * vh * (1 - k)).toFixed(1) + 'px) scale(' + (.82 + .18 * k).toFixed(3) + ')';
      });
      var c = clamp((g - .62) / .2, 0, 1);
      copy.style.opacity = c.toFixed(3);
      copy.style.transform = 'translateY(' + ((1 - c) * 18).toFixed(1) + 'px)';
    }
    if (fpEl) { var day = 1 + Math.round(clamp(prog(fpEl) / .94, 0, 1) * 20); if (day !== fpDay) fpSet(day); }
    if (gnb) { var gy = 40, over = darks.some(function (el) { var r = el.getBoundingClientRect(); return r.top <= gy && r.bottom >= gy; }); gnb.classList.toggle('dark', over); }
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  frame();
})();

/* the three shooting steps switch the real screen beside them */
(function () {
  var list = document.getElementById('cst'), ph = document.getElementById('cstP'); if (!list || !ph) return;
  var bs = [].slice.call(list.querySelectorAll('button')), imgs = [].slice.call(ph.querySelectorAll('img'));
  bs.forEach(function (b, i) { b.addEventListener('click', function () {
    bs.forEach(function (x, k) { x.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    imgs.forEach(function (m, k) { m.classList.toggle('on', k === i); });
  }); });
})();
