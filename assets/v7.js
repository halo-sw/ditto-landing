/* v7 — 인터랙션: 히어로 이미지 띠, 큰 선언, 고정 스크롤 세 줄, 콜라주, 꾹 눌러 디토, 주파수 파형 */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

  /* 등장 */
  var els = [].slice.call(document.querySelectorAll('.k-ch .k-intro > *, .k-ch .k-st > *, .k-ch .k-nm li, .k-ch .hd, .k-ch .k-pl li, .k-ch .ci-l li'));
  els.forEach(function (el) { el.setAttribute('data-rv', ''); });
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
  var pin = $('kPin'), say = $('k-say'), col = $('kCol'), railS = $('n-play'), rail = $('kRail'), fqW = $('n-freq'), lastY = scrollY, lastT = performance.now(), pinN = $('kPinN'), NAMES = (pin && pin.dataset.names) ? pin.dataset.names.split('|') : ['플래터 01', '디토 02', '주파수 03'], tk = false;
  var prog = function (el) { var r = el.getBoundingClientRect(); return clamp(-r.top / (r.height - innerHeight)); };
  var onScroll = function () {
    tk = false;
    if (say) { var p = prog(say); say.style.setProperty('--p', clamp(p / 0.55)); say.style.setProperty('--q', clamp((p - 0.5) / 0.3)); }
    if (pin) { var i = Math.min(2, Math.floor(prog(pin) * 3)); if (pin.dataset.i != i) { pin.dataset.i = i; pinN.textContent = NAMES[i]; } }
    if (rail) { rail.style.setProperty('--rx', (prog(railS) * Math.max(0, rail.scrollWidth - innerWidth)).toFixed(1)); }
    if (fqW && window.__fqStage) { var now = performance.now(), v = Math.abs(scrollY - lastY) / Math.max(16, now - lastT); lastY = scrollY; lastT = now; window.__fqStage(prog(fqW), v); }
    if (col) { var r = col.getBoundingClientRect(), pc = clamp((innerHeight - r.top) / (r.height + innerHeight)); col.style.setProperty('--p', pc); col.style.setProperty('--q', clamp((prog(col) - 0.15) / 0.35)); }
  };
  if (!reduce) { addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(onScroll); } }, { passive: true }); addEventListener('resize', onScroll); onScroll(); }

  /* 디토: 3초 동안 꾹 */
  var hd = $('hd'), hb = $('hdB'), hn = $('hdN'), hh = $('hdH');
  if (hd && hb) {
    var HOLD = 3000, start = 0, raf = 0, touched = false, auto = 0, seen = false;
    var tick = function (now) {
      var p = Math.min(1, (now - start) / HOLD);
      hd.style.setProperty('--p', p);
      if (p < 1) { hn.textContent = Math.ceil((1 - p) * 3); raf = requestAnimationFrame(tick); }
      else { raf = 0; hd.classList.add('done'); hn.textContent = '디토'; hh.textContent = '내 플래터에 놓였어요'; if (!touched) auto = setTimeout(replay, 2800); }
    };
    var reset = function (msg) { hd.classList.remove('done'); hd.style.setProperty('--p', 0); hn.textContent = '꾹'; hh.textContent = msg; };
    var down = function () { if (raf) return; reset('누르고 있어요'); start = performance.now(); raf = requestAnimationFrame(tick); };
    var up = function () { if (!raf) return; cancelAnimationFrame(raf); raf = 0; reset('중간에 떼면 취소돼요. 다시 꾹'); };
    var replay = function () { if (touched) return; reset('원을 3초 동안 눌러 보세요'); auto = setTimeout(down, 1000); };
    var mine = function () { if (!touched) { touched = true; clearTimeout(auto); if (raf) { cancelAnimationFrame(raf); raf = 0; } } };
    hb.addEventListener('pointerdown', function (e) { mine(); if (hb.setPointerCapture) hb.setPointerCapture(e.pointerId); down(); });
    ['pointerup', 'pointercancel'].forEach(function (nm) { hb.addEventListener(nm, function () { if (touched) up(); }); });
    hb.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    hb.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); mine(); down(); } });
    hb.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') up(); });
    if (reduce) { hd.classList.add('done'); hn.textContent = '디토'; hh.textContent = '3초 동안 누르면 내 플래터에 놓여요'; }
    else new IntersectionObserver(function (es, o) { if (es[0].isIntersecting && !seen) { seen = true; o.disconnect(); auto = setTimeout(down, 700); } }, { threshold: 0.6 }).observe(hd);
  }

  /* 숫자: 보일 때 한 번 세어 올린다 */
  var nm = $('kNm');
  if (nm && !reduce) {
    var bs = [].slice.call(nm.querySelectorAll('b[data-to]'));
    bs.forEach(function (b) { if (+b.dataset.to) b.textContent = '0'; });
    new IntersectionObserver(function (es, o) {
      if (!es[0].isIntersecting) return; o.disconnect();
      bs.forEach(function (b, k) {
        var to = +b.dataset.to, t1 = performance.now() + k * 140, dur = 1100;
        var step = function (now) { var p = clamp((now - t1) / dur), e = 1 - Math.pow(1 - p, 3); b.textContent = Math.round(to * e); if (p < 1) requestAnimationFrame(step); };
        if (to) requestAnimationFrame(step);
      });
    }, { threshold: 0.4 }).observe(nm);
  }

  /* 주파수: 위에서 내려오는 막대(나)와 아래에서 올라오는 막대(친구)가 단계마다 서로에게 닿아 간다 */
  var fq = $('fq'), fqWrap = $('n-freq'), cv = $('fqC');
  if (fq && cv && cv.getContext) {
    var ctx = cv.getContext('2d'), W = 0, H = 0, D = 1, cols = [], GAP = 18;
    var COL = [[142, 136, 154], [7, 231, 180], [127, 128, 255], [199, 123, 255]], SYNC = [0.04, 0.38, 0.72, 1], DAY = [1, 8, 15, 21];
    var NAME = ['고요함', '선명함', '곧 열림', '열림'], SAY = ['아직 스치는 사이예요', '교류가 쌓이는 중이에요', '한 번 더 함께하면 열려요', '친구 신청이 열렸어요'];
    var st = 0, sy = SYNC[0], rgb = COL[0].slice(), mx = -9999, live = false, rafF = 0, vel = 0, dayNow = 1;
    var btns = [].slice.call(fq.querySelectorAll('.fq-st button')), dayEl = $('fqD'), sayEl = $('fqS'), nameEl = $('fqN'), daysEl = $('fqDays'), ticks = [];
    if (daysEl) for (var q = 0; q < 21; q++) { var li = document.createElement('li'); daysEl.appendChild(li); ticks.push(li); }
    var rnd = function (i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    var size = function () {
      var r = fq.getBoundingClientRect(); D = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height;
      cv.width = Math.round(W * D); cv.height = Math.round(H * D); cols = [];
      for (var i = 0, n = Math.ceil(W / GAP) + 1; i < n; i++) cols.push({ a: rnd(i), b: rnd(i + 99), c: rnd(i + 777), ta: rnd(i + 31) > 0.36, tb: rnd(i + 57) > 0.36 });
      if (!live) draw(performance.now());
    };
    var cap = function (x, y, w, h) { if (h < w) h = w; var r = w / 2; ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill(); };
    var draw = function (now) {
      var t = now / 1000, k = 0.04; vel *= 0.93;
      sy += (SYNC[st] - sy) * k; for (var j = 0; j < 3; j++) rgb[j] += (COL[st][j] - rgb[j]) * k;
      var cA = Math.round(rgb[0]) + ',' + Math.round(rgb[1]) + ',' + Math.round(rgb[2]);
      var cB = Math.round(rgb[0] + (255 - rgb[0]) * 0.55) + ',' + Math.round(rgb[1] + (255 - rgb[1]) * 0.55) + ',' + Math.round(rgb[2] + (255 - rgb[2]) * 0.55);
      ctx.setTransform(D, 0, 0, D, 0, 0); ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < cols.length; i++) {
        var o = cols[i], x = i * GAP + 0.5, near = Math.exp(-Math.pow((x - mx) / 120, 2));
        /* 두 사람이 만나는 선: 화면 가운데를 천천히 굽이친다 */
        var meet = H * (0.5 + 0.11 * Math.sin(i * 0.21 + t * 0.45) + 0.045 * Math.sin(i * 0.63 - t * 0.7));
        var wa = 0.5 + 0.5 * Math.sin(t * (0.45 + o.a * 0.8) + o.b * 6.28), wb = 0.5 + 0.5 * Math.sin(t * (0.5 + o.c * 0.8) + o.a * 6.28);
        var gap = H * (1 - sy) * (0.5 + 0.36 * o.b) + 5 - near * H * 0.05 - vel * H * 0.04; if (gap < 5) gap = 5;
        var off = (1 - sy) * H * 0.16;
        var tipA = meet - gap / 2 - off * wa * o.a, tipB = meet + gap / 2 + off * wb * o.c;
        var al = 0.16 + sy * 0.34 + near * 0.2;
        ctx.fillStyle = 'rgba(' + cA + ',' + al.toFixed(3) + ')'; ctx.fillRect(x, 0, 1, Math.max(0, tipA));
        ctx.fillStyle = 'rgba(' + cB + ',' + (al * 0.8).toFixed(3) + ')'; ctx.fillRect(x, tipB, 1, Math.max(0, H - tipB));
        var th = 10 + (H * 0.16 * sy + 14) * (0.3 + 0.7 * o.b);
        if (o.ta) { ctx.fillStyle = 'rgba(' + cA + ',' + (0.4 + sy * 0.55).toFixed(3) + ')'; cap(x - 3.5, tipA - th, 8, th); }
        if (o.tb) { ctx.fillStyle = 'rgba(' + cB + ',' + (0.34 + sy * 0.5).toFixed(3) + ')'; cap(x - 3.5, tipB, 8, th * (0.6 + 0.4 * o.c)); }
        /* 닿는 순간: 만나는 자리에 작은 빛 */
        if (sy > 0.9 && o.ta && o.tb) { var g = (sy - 0.9) * 10 * (0.5 + 0.5 * Math.sin(t * 2 + i)); ctx.fillStyle = 'rgba(255,255,255,' + (0.5 * g).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(x + 0.5, meet, 2.2 + g * 1.6, 0, 6.3); ctx.fill(); }
      }
      if (live && !reduce) rafF = requestAnimationFrame(draw);
    };
    var paintDays = function (dn) { ticks.forEach(function (li, i) { li.className = i < dn ? 'on' : ''; }); };
    var setSt = function (s) {
      st = s; fq.dataset.st = s; sayEl.textContent = SAY[s]; if (nameEl) nameEl.textContent = NAME[s];
      btns.forEach(function (b, i) { b.setAttribute('aria-pressed', i === s); });
      if (reduce) { sy = SYNC[s]; rgb = COL[s].slice(); dayEl.textContent = DAY[s]; paintDays(DAY[s]); draw(0); }
    };
    /* 스크롤이 시간표: 내려갈수록 날이 가고 단계가 오른다. 버튼은 그 단계의 위치로 데려간다 */
    btns.forEach(function (b, i) { b.addEventListener('click', function () {
      if (reduce) { setSt(i); return; }
      var r = fqWrap.getBoundingClientRect(), top = r.top + scrollY, span = r.height - innerHeight;
      scrollTo({ top: top + span * (i * 0.25 + 0.12), behavior: 'smooth' });
    }); });
    window.__fqStage = function (p, v) {
      var s = Math.min(3, Math.floor(p * 4)); if (s !== st) setSt(s);
      var dn = Math.max(1, Math.min(21, Math.round(1 + p * 21.5))); if (dn !== dayNow) { dayNow = dn; dayEl.textContent = dn; paintDays(dn); }
      vel = Math.min(1, vel + v * 0.25);
    };
    fq.addEventListener('pointermove', function (e) { mx = e.clientX - fq.getBoundingClientRect().left; });
    fq.addEventListener('pointerleave', function () { mx = -9999; });
    addEventListener('resize', size); size(); setSt(reduce ? 3 : 0); paintDays(reduce ? 21 : 1);
    new IntersectionObserver(function (es) {
      var on = es[0].isIntersecting; cancelAnimationFrame(rafF); live = on;
      if (on && !reduce) rafF = requestAnimationFrame(draw);
    }, { threshold: 0.05 }).observe(fq);
  }
})();
