/* Ditto landing v6: motion on top of v5. Skipped when motion is reduced; nothing here changes copy or data. */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  var IO = 'IntersectionObserver' in window;
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  if (reduce || !IO) return;

  var once = function (el, fn, opt) { new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { fn(); o.disconnect(); } }, opt || { rootMargin: '0px 0px -8% 0px', threshold: .1 }).observe(el); };

  /* headings rise line by line (only plain <br> breaks, so responsive breaks keep working) */
  $$('.ed h2, .cs-t').forEach(function (el) {
    if (/<br[^>]*class=/i.test(el.innerHTML)) return;
    el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i).map(function (l, i) { return '<span class="ln" style="--l:' + i + '"><span>' + l + '</span></span>'; }).join('');
    once(el, function () { el.classList.add('in'); });
  });

  /* blocks come into focus, staggered within their row */
  $$('.cell, .card, .rit article, .two > div, .big, .tagline, .gc, .cs, .cs2, .cs-row figure, .ed-b, .t3-k, .t3-t, .get-b, .pg-c > *, .ro-read li, .bridge, .why6-k, .why6 h2, .why6-d, .why6-b').forEach(function (el) {
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

/* v6 2차: 첫 화면이 사진 구간으로 이어지고, 만든 이유는 접어 둔다 */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  var hero = $('top'), tk = false;
  function update() { tk = false; if (hero && !reduce) hero.style.setProperty('--hp', Math.max(0, Math.min(1, scrollY / (innerHeight * .85))).toFixed(4)); }
  addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update); update();

  /* the three words: when one scene has played through, the next word takes over */
  var cxp = $('cxPanel');
  if (cxp) cxp.addEventListener('cx:end', function (e) { if (window.__cxQA) window.__cxQA((e.detail + 1) % 3); });

  /* platter grid: tiles settle into their cells, then the size chips light up the widgets of that size */
  var pg = $('pgB');
  if (pg) {
    var chips = [].slice.call(document.querySelectorAll('.pg-sz button')), pi = -1, pt = 0, touched = false;
    var pick = function (i) { pi = i; chips.forEach(function (c, k) { c.setAttribute('aria-pressed', k === i); }); if (i < 0) pg.removeAttribute('data-on'); else pg.dataset.on = chips[i].dataset.sz; };
    chips.forEach(function (c, k) { c.addEventListener('click', function () { touched = true; clearInterval(pt); pick(pi === k ? -1 : k); }); });
    if (reduce || !('IntersectionObserver' in window)) pg.classList.add('in');
    else new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { pg.classList.add('in'); if (!touched && !pt) pt = setInterval(function () { pick(pi + 1 < chips.length ? pi + 1 : -1); }, 2200); }
      else { clearInterval(pt); pt = 0; }
    }, { threshold: .35 }).observe(pg);
  }

  /* the reasons: folded until asked for */
  var btn = $('why6B'), pane = $('why6P');
  if (btn && pane) {
    var label = btn.querySelector('span');
    var set = function (open, jump) {
      pane.hidden = !open; btn.setAttribute('aria-expanded', open); label.textContent = open ? '접기' : '자세히 펼쳐 보기';
      window.dispatchEvent(new Event('resize'));
      if (open && jump) requestAnimationFrame(function () { var y = pane.getBoundingClientRect().top + scrollY - 70; scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); });
    };
    btn.addEventListener('click', function () { set(pane.hidden, true); });
    var need = function () { return /^#(deeper|together|groupchat|cameras|features|why|shift|impact)$/.test(location.hash); };
    if (need()) { set(true); var el = document.querySelector(location.hash); if (el) el.scrollIntoView(); }
    addEventListener('hashchange', function () { if (need() && pane.hidden) { set(true); var el = document.querySelector(location.hash); if (el) el.scrollIntoView(); } });
  }
})();
