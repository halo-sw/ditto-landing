/* v7 — 인터랙션: 히어로 이미지 띠, 큰 선언, 고정 스크롤 세 줄, 콜라주, 꾹 눌러 디토, 주파수 파형 */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

  /* 등장 */
  var els = [].slice.call(document.querySelectorAll('.k-ch .k-intro > *, .k-ch .k-st > *, .k-ch .k-2-l, .k-ch .k-wc li, .k-ch .dz, .k-ch .fz, .k-ch .k-pl li'));
  els.forEach(function (el) { el.setAttribute('data-n', ''); });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { var sib = [].indexOf.call(e.target.parentNode.children, e.target); e.target.style.transitionDelay = Math.min(sib, 8) * 50 + 'ms'; e.target.classList.add('on'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  els.forEach(function (el) { io.observe(el); });

  /* 히어로: 가운데가 가장 큰 이미지 띠가 천천히 흐른다 */
  var cf = $('kCf');
  if (cf) {
    var figs = [].slice.call(cf.children), n = figs.length, t0 = performance.now(), drag = 0, vis = true;
    var lay = function (now) {
      var t = reduce ? 2 : (now - t0) / 3400 + drag, gap = cf.offsetHeight * 0.98;
      for (var i = 0; i < n; i++) {
        var d = ((i - t) % n + n) % n; if (d > n / 2) d -= n;
        var a = Math.abs(d), sc = Math.max(0.4, 1 - a * 0.2), x = d * gap * (1 - Math.min(a, 4) * 0.075);
        figs[i].style.transform = 'translate(-50%,-50%) translateX(' + x.toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')';
        figs[i].style.opacity = a > n / 2 - 0.6 ? 0 : 1; figs[i].style.zIndex = 10 - Math.round(a);
      }
      if (!reduce && vis) requestAnimationFrame(lay);
    };
    new IntersectionObserver(function (es) { var was = vis; vis = es[0].isIntersecting; if (vis && !was && !reduce) requestAnimationFrame(lay); }).observe(cf);
    requestAnimationFrame(lay);
  }

  /* 스크롤 장면 */
  var say = $('k-say'), pin = $('kPin'), col = $('kCol'), pinN = $('kPinN'), NAMES = ['플래터 01', '디토 02', '주파수 03'], tk = false;
  var prog = function (el) { var r = el.getBoundingClientRect(); return clamp(-r.top / (r.height - innerHeight)); };
  var onScroll = function () {
    tk = false;
    if (say) { var p = prog(say); say.style.setProperty('--p', clamp(p / 0.55)); say.style.setProperty('--q', clamp((p - 0.5) / 0.3)); }
    if (pin) { var i = Math.min(2, Math.floor(prog(pin) * 3)); if (pin.dataset.i != i) { pin.dataset.i = i; pinN.textContent = NAMES[i]; } }
    if (col) { var r = col.getBoundingClientRect(), pc = clamp((innerHeight - r.top) / (r.height + innerHeight)); col.style.setProperty('--p', pc); col.style.setProperty('--q', clamp((prog(col) - 0.15) / 0.35)); }
  };
  if (!reduce) { addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(onScroll); } }, { passive: true }); addEventListener('resize', onScroll); onScroll(); }

  /* 디토: 3초 동안 꾹 */
  var dz = $('dz'), t = $('dzT'), hint = $('dzH');
  if (dz && t) {
    var HOLD = 3000, start = 0, raf = 0, touched = false, auto = 0, seen = false;
    var tell = function (s) { hint.textContent = s; };
    var tick = function (now) {
      var p = Math.min(1, (now - start) / HOLD);
      t.style.setProperty('--p', p);
      if (p < 1) { tell(Math.ceil((1 - p) * 3) + '초만 더'); raf = requestAnimationFrame(tick); }
      else { raf = 0; dz.classList.add('done'); t.style.setProperty('--p', 0); tell('디토! 내 플래터에 놓였어요'); if (!touched) auto = setTimeout(replay, 3200); }
    };
    var down = function () { if (raf) return; dz.classList.remove('done'); start = performance.now(); raf = requestAnimationFrame(tick); };
    var up = function () { if (!raf) return; cancelAnimationFrame(raf); raf = 0; t.style.setProperty('--p', 0); tell('중간에 떼면 취소돼요. 다시 꾹'); };
    var replay = function () { if (touched) return; dz.classList.remove('done'); tell('꾹 눌러 보세요'); auto = setTimeout(down, 900); };
    var mine = function () { if (!touched) { touched = true; clearTimeout(auto); if (raf) { cancelAnimationFrame(raf); raf = 0; t.style.setProperty('--p', 0); } } };
    t.addEventListener('pointerdown', function (e) { mine(); if (t.setPointerCapture) t.setPointerCapture(e.pointerId); down(); });
    ['pointerup', 'pointercancel'].forEach(function (nm) { t.addEventListener(nm, function () { if (touched) up(); }); });
    t.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    t.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); mine(); down(); } });
    t.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') up(); });
    if (reduce) { dz.classList.add('done'); tell('꾹 누르면 내 플래터에 놓여요'); }
    else new IntersectionObserver(function (es, o) { if (es[0].isIntersecting && !seen) { seen = true; o.disconnect(); auto = setTimeout(down, 700); } }, { threshold: 0.6 }).observe(dz);
  }

  /* 주파수: 점으로 된 파형이 단계마다 차오른다 */
  var fz = $('fz'), svg = $('fzW');
  if (fz && svg) {
    var COLS = 49, ROWS = 11, NS = 'http://www.w3.org/2000/svg', dots = [];
    for (var c = 0; c < COLS; c++) {
      dots[c] = [];
      for (var r = 0; r < ROWS; r++) {
        var d = document.createElementNS(NS, 'circle');
        d.setAttribute('cx', 5 + c * 10); d.setAttribute('cy', 5 + r * 10); d.setAttribute('r', 2);
        svg.appendChild(d); dots[c][r] = d;
      }
    }
    var shape = function (c) { var x = c / (COLS - 1), env = Math.pow(Math.sin(x * Math.PI), 0.7); return env * (0.25 + 0.75 * Math.abs(Math.sin(c * 1.9 + 0.5) * Math.cos(c * 0.37))) + 0.08; };
    var AMP = [0.14, 0.5, 0.78, 1.05], DAY = [1, 8, 15, 21];
    var btns = [].slice.call(fz.querySelectorAll('.fz-st button')), day = $('fzD'), cur = -1, timer = 0, mineF = false;
    var set = function (s) {
      cur = s; fz.dataset.st = s; day.textContent = DAY[s];
      btns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === s); });
      var mid = (ROWS - 1) / 2;
      for (var c = 0; c < COLS; c++) {
        var h = Math.round(shape(c) * AMP[s] * mid);
        for (var r = 0; r < ROWS; r++) {
          var on = Math.abs(r - mid) <= h, el = dots[c][r];
          el.classList.toggle('on', on); el.setAttribute('r', on ? 3.6 : 2);
          el.style.transitionDelay = (c * 9) + 'ms';
        }
      }
    };
    btns.forEach(function (b, k) { b.addEventListener('click', function () { mineF = true; clearInterval(timer); set(k); }); });
    set(reduce ? 3 : 0);
    if (!reduce) new IntersectionObserver(function (es) {
      clearInterval(timer);
      if (es[0].isIntersecting && !mineF) timer = setInterval(function () { set((cur + 1) % 4); }, 2200);
    }, { threshold: 0.5 }).observe(fz);
  }
})();
