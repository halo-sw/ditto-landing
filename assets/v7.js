/* v7 — 인터랙션: 히어로 이미지 띠, 큰 선언, 고정 스크롤 세 줄, 콜라주, 꾹 눌러 디토, 주파수 파형 */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

  /* 등장 */
  var els = [].slice.call(document.querySelectorAll('.k-ch .k-intro > *, .k-ch .k-st > *, .k-ch .k-nm li, .k-ch .hd, .k-ch .k-pl li'));
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

  /* 주파수: 화면 뒤의 세로 막대. 단계가 오를수록 길어지고 색이 선명해진다 */
  var fq = $('n-freq'), cv = $('fqC');
  if (fq && cv && cv.getContext) {
    var ctx = cv.getContext('2d'), W = 0, H = 0, D = 1, cols = [], GAP = 20;
    var COL = [[142, 136, 154], [7, 231, 180], [127, 128, 255], [199, 123, 255]], AMP = [0.1, 0.34, 0.6, 0.92], DAY = [1, 8, 15, 21];
    var SAY = ['아직 스치는 사이예요', '교류가 쌓이는 중이에요', '한 번 더 함께하면 열려요', '친구 신청을 보낼 수 있어요'];
    var st = 0, amp = AMP[0], rgb = COL[0].slice(), mx = -9999, live = false, rafF = 0, timerF = 0, mineF = false;
    var btns = [].slice.call(fq.querySelectorAll('.fq-st button')), dayEl = $('fqD'), sayEl = $('fqS');
    var rnd = function (i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    var size = function () {
      var r = fq.getBoundingClientRect(); D = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height;
      cv.width = Math.round(W * D); cv.height = Math.round(H * D); cols = [];
      for (var i = 0, n = Math.ceil(W / GAP) + 1; i < n; i++) cols.push({ a: rnd(i), b: rnd(i + 99), c: rnd(i + 777), thick: rnd(i + 31) > 0.42 });
      if (!live) draw(performance.now());
    };
    var rr = function (x, y, w, h) { var r = w / 2; ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill(); };
    var draw = function (now) {
      var t = now / 1000, k = 0.045;
      amp += (AMP[st] - amp) * k; for (var j = 0; j < 3; j++) rgb[j] += (COL[st][j] - rgb[j]) * k;
      var c = Math.round(rgb[0]) + ',' + Math.round(rgb[1]) + ',' + Math.round(rgb[2]);
      ctx.setTransform(D, 0, 0, D, 0, 0); ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < cols.length; i++) {
        var o = cols[i], x = i * GAP + 0.5, near = Math.exp(-Math.pow((x - mx) / 110, 2));
        var wave = 0.5 + 0.5 * Math.sin(t * (0.5 + o.a * 0.9) + o.b * 6.28), a = Math.min(1, amp * (0.35 + 0.65 * wave) + near * 0.28);
        var yc = H * (0.5 + (o.c - 0.5) * 0.5 + Math.sin(t * 0.21 + o.a * 6.28) * 0.05), len = H * a * (0.25 + o.b * 0.75);
        ctx.fillStyle = 'rgba(' + c + ',' + (0.2 + a * 0.3).toFixed(3) + ')'; ctx.fillRect(x, yc - len / 2, 1, len);
        if (o.thick) { var th = Math.max(8, len * (0.12 + o.a * 0.42)), ty = yc - len / 2 + (len - th) * (0.5 + 0.5 * Math.sin(t * (0.3 + o.c * 0.5) + o.a * 9)); ctx.fillStyle = 'rgba(' + c + ',' + (0.3 + a * 0.6).toFixed(3) + ')'; rr(x - 3.5, ty, 8, th); }
      }
      if (live && !reduce) rafF = requestAnimationFrame(draw);
    };
    var setSt = function (s) {
      st = s; fq.dataset.st = s; dayEl.textContent = DAY[s]; sayEl.textContent = SAY[s];
      btns.forEach(function (b, i) { b.setAttribute('aria-pressed', i === s); });
      if (reduce) { amp = AMP[s]; rgb = COL[s].slice(); draw(0); }
    };
    btns.forEach(function (b, i) { b.addEventListener('click', function () { mineF = true; clearInterval(timerF); setSt(i); }); });
    fq.addEventListener('pointermove', function (e) { mx = e.clientX - fq.getBoundingClientRect().left; });
    fq.addEventListener('pointerleave', function () { mx = -9999; });
    addEventListener('resize', size); size(); setSt(reduce ? 3 : 0);
    new IntersectionObserver(function (es) {
      var on = es[0].isIntersecting; clearInterval(timerF); cancelAnimationFrame(rafF); live = on;
      if (on && !reduce) { rafF = requestAnimationFrame(draw); if (!mineF) timerF = setInterval(function () { setSt((st + 1) % 4); }, 2600); }
    }, { threshold: 0.25 }).observe(fq);
  }
})();
