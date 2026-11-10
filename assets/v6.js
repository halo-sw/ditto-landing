/* Ditto landing v6: motion on top of v5. Skipped when motion is reduced; nothing here changes copy or data. */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  var IO = 'IntersectionObserver' in window;
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  /* reading progress along the floating menu */
  var gnb = document.getElementById('gnb'), tk = false;
  function prog() { tk = false; var h = document.documentElement.scrollHeight - innerHeight; if (gnb) gnb.style.setProperty('--sp', h > 0 ? Math.min(1, scrollY / h).toFixed(4) : 0); }
  addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(prog); } }, { passive: true }); prog();

  if (reduce || !IO) return;

  var once = function (el, fn, opt) { new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { fn(); o.disconnect(); } }, opt || { rootMargin: '0px 0px -8% 0px', threshold: .1 }).observe(el); };

  /* headings rise line by line (only plain <br> breaks, so responsive breaks keep working) */
  $$('.ed h2, .cs-t').forEach(function (el) {
    if (/<br[^>]*class=/i.test(el.innerHTML)) return;
    el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i).map(function (l, i) { return '<span class="ln" style="--l:' + i + '"><span>' + l + '</span></span>'; }).join('');
    once(el, function () { el.classList.add('in'); });
  });

  /* blocks come into focus, staggered within their row */
  $$('.cell, .card, .rit article, .two > div, .big, .tagline, .gc, .cs, .cs2, .cs-row figure, .ed-b, .chap-n, .chap-w, .chap-l, .t3-k, .t3-t').forEach(function (el) {
    var i = [].indexOf.call(el.parentNode.children, el);
    el.classList.add('v6r'); el.style.setProperty('--d', Math.min(i, 5));
    once(el, function () { el.classList.add('in'); });
  });

  if (!fine) return;

  /* screens lean toward the pointer */
  $$('.gc, .cs2, .card').forEach(function (box) {
    var tg = box.querySelector('.gc-ph') || box.querySelector('.cs2-p') || box.querySelector('figure img'); if (!tg) return;
    tg.classList.add('v6t');
    box.addEventListener('pointermove', function (e) {
      var r = box.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      tg.style.transform = 'perspective(1100px) rotateY(' + (x * 8).toFixed(2) + 'deg) rotateX(' + (y * -6).toFixed(2) + 'deg) translateY(-6px)';
    });
    box.addEventListener('pointerleave', function () { tg.style.transform = ''; });
  });

  /* pointer dot: grows on things you can press, becomes a label where you can drag */
  var drag = { roCv: 'Drag' };
  Object.keys(drag).forEach(function (id) { var el = document.getElementById(id); if (el) el.dataset.cur = drag[id]; });
  $$('.wsp-st').forEach(function (el) { el.dataset.cur = 'Drag'; });
  var c = document.createElement('i'); c.className = 'v6cur'; c.setAttribute('aria-hidden', 'true'); c.innerHTML = '<b></b>'; document.body.appendChild(c);
  var lb = c.firstChild, x = 0, y = 0, tx = 0, ty = 0, shown = false;
  addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return; tx = e.clientX; ty = e.clientY;
    if (!shown) { shown = true; x = tx; y = ty; c.classList.add('on'); }
    var el = e.target.closest ? e.target.closest('[data-cur],a,button,summary,input,label') : null, lab = el && el.dataset.cur;
    c.classList.toggle('lb', !!lab); c.classList.toggle('lg', !!el && !lab && !/^(INPUT|LABEL)$/.test(el.tagName));
    if (lab && lb.textContent !== lab) lb.textContent = lab; if (!lab && lb.textContent) lb.textContent = '';
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', function () { shown = false; c.classList.remove('on'); });
  (function tick() { x += (tx - x) * .22; y += (ty - y) * .22; c.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'; requestAnimationFrame(tick); })();
})();

/* v6 2차: 첫 화면이 영상 구간으로 이어지고, 세 단어가 차례로 켜진다 */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, IO = 'IntersectionObserver' in window;
  var $ = function (id) { return document.getElementById(id); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var hero = $('top'), run = $('t3'), words = $$('#t3W li'), descs = $$('#t3D > div'), bars = $$('.t3-bar i'), stage = $('t3V'), panes = $$('.t3-p', stage), num = $('t3N'), cur = -1;

  /* film: plays only while it is on screen */
  var v = $('filmV');
  if (v) {
    if (reduce || !IO) v.setAttribute('controls', '');
    else new IntersectionObserver(function (es) { if (es[0].isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); }, { threshold: .15 }).observe(v);
  }

  function setStep(i) {
    if (i === cur || !stage) return; cur = i; stage.dataset.i = i; num.textContent = i + 1;
    [words, descs, bars, panes].forEach(function (a) { a.forEach(function (el, k) { el.classList.toggle('on', k === i); }); });
  }
  var tk = false;
  function update() {
    tk = false;
    if (hero && !reduce) hero.style.setProperty('--hp', clamp(scrollY / (innerHeight * .85), 0, 1).toFixed(4));
    if (run) { var r = run.getBoundingClientRect(), span = r.height - innerHeight; setStep(reduce || span <= 0 ? 0 : Math.min(2, Math.floor(clamp(-r.top / span, 0, .999) * 3))); }
  }
  addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update); update();
  words.forEach(function (li, i) { li.querySelector('a').addEventListener('click', function (e) {
    if (reduce || !run) return; e.preventDefault(); var r = run.getBoundingClientRect();
    scrollTo({ top: r.top + scrollY + (i + .5) / 3 * (r.height - innerHeight), behavior: 'smooth' });
  }); });

  /* frequency: the dots between two people take on colour, stage by stage */
  var cv = $('t3C'), lab = $('t3F'); if (!cv) return;
  var ctx = cv.getContext('2d'), ST = [['고요함', '#8E919E', .2], ['선명함', '#2BC4A8', .5], ['곧 열림', '#5A5BF2', .78], ['친구 신청이 열렸어요', '#AA4AF4', 1]];
  var s = 0, amp = .2, col = [142, 145, 158], W = 0, H = 0, D = 1, live = false, t0 = 0;
  var rgb = function (h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); };
  function size() { var b = cv.getBoundingClientRect(); W = b.width; H = b.height; D = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(W * D); cv.height = Math.round(H * D); }
  function draw(now) {
    var t = now / 1000, ns = reduce ? 3 : Math.floor(((now - t0) / 1500) % 4);
    if (ns !== s) { s = ns; lab.textContent = ST[s][0]; lab.style.color = s ? ST[s][1] : ''; }
    amp += (ST[s][2] - amp) * .07; var tc = rgb(ST[s][1]); col = col.map(function (x, i) { return x + (tc[i] - x) * .09; });
    if (!W) size(); ctx.setTransform(D, 0, 0, D, 0, 0); ctx.clearRect(0, 0, W, H);
    var rows = 11, gap = Math.max(6, Math.min(H / rows, W / 22)), cols = Math.max(3, Math.floor(W / gap)), x0 = (W - (cols - 1) * gap) / 2, mid = 5, cs = col.map(Math.round).join(',');
    for (var c = 0; c < cols; c++) {
      var u = c / (cols - 1), env = Math.pow(Math.sin(Math.PI * u), 1.1), w = (Math.sin(c * .7 + t * 4) * .5 + Math.sin(c * 1.5 - t * 2.4) * .3 + Math.sin(c * .3 + t * 1.2) * .2) * .5 + .5;
      var h = (c % 3 === 1 ? 1 : .45) * env * amp * (.35 + .65 * w) * mid;
      for (var r = 0; r < rows; r++) { var dy = Math.abs(r - mid), on = dy <= h + .001; ctx.fillStyle = on ? 'rgba(' + cs + ',' + (.7 + .3 * (1 - dy / 6)).toFixed(2) + ')' : 'rgba(22,18,27,.1)'; ctx.beginPath(); ctx.arc(x0 + c * gap, H / 2 + (r - mid) * gap, on ? gap * .32 : gap * .15, 0, 6.3); ctx.fill(); }
    }
  }
  function loop(now) { if (!live) return; if (cur === 2) draw(now); requestAnimationFrame(loop); }
  addEventListener('resize', function () { W = 0; });
  if (reduce || !IO) { size(); draw(0); return; }
  new IntersectionObserver(function (es) { var on = es[0].isIntersecting; if (on && !live) { live = true; t0 = performance.now(); requestAnimationFrame(loop); } else if (!on) live = false; }).observe(stage);
})();
