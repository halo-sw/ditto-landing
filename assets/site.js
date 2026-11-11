/* site — 하위 페이지 공통 동작: 히어로 물러남, 왼쪽 눈금, 등장, 세로 띠, 마무리 */
(function () {
  'use strict';
  if (!document.body.classList.contains('sp')) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var hero = document.querySelector('.sh0'), nx = document.querySelector('.nx');
  var secs = [].slice.call(document.querySelectorAll('[data-tk]')), tk = document.querySelector('.tk'), marks = [];
  if (tk) secs.forEach(function (s, i) {
    var a = document.createElement('a'); a.href = '#' + s.id; a.setAttribute('aria-label', s.dataset.tk); a.title = s.dataset.tk; tk.appendChild(a); marks.push(a);
  });
  var busy = false;
  var onScroll = function () {
    busy = false; var vh = innerHeight;
    if (hero && !reduce) hero.style.setProperty('--hp', clamp(scrollY / vh).toFixed(3));
    if (nx && !reduce) { var r = nx.getBoundingClientRect(); nx.style.setProperty('--g', clamp((vh - r.top) / vh - 0.25).toFixed(3) * 1.34 > 1 ? 1 : (clamp((vh - r.top) / vh - 0.25) * 1.34).toFixed(3)); }
    var cur = -1; secs.forEach(function (s, i) { if (s.getBoundingClientRect().top < vh * 0.5) cur = i; });
    marks.forEach(function (m, i) { m.setAttribute('aria-current', i === cur); });
  };
  addEventListener('scroll', function () { if (!busy) { busy = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll); onScroll();

  /* 등장 */
  var els = [].slice.call(document.querySelectorAll('.pc li, .tl li, .wl > li, .fg li, .ba li, .st, .bw, .db p'));
  if (!reduce) {
    els.forEach(function (el) { el.style.opacity = 0; el.style.transform = 'translateY(24px)'; el.style.transition = 'opacity .8s ease, transform 1s cubic-bezier(.2,.7,.2,1)'; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; var el = e.target, k = [].indexOf.call(el.parentNode.children, el);
        el.style.transitionDelay = Math.min(k, 6) * 60 + 'ms'; el.style.opacity = 1; el.style.transform = 'none'; io.unobserve(el);
        setTimeout(function () { el.style.transitionDelay = ''; }, 1200);
      });
    }, { threshold: 0.15 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* 세로 띠 */
  [].forEach.call(document.querySelectorAll('.st'), function (st) {
    var bs = [].slice.call(st.querySelectorAll('button'));
    bs.forEach(function (b) {
      var pick = function () { bs.forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); };
      b.addEventListener('click', pick); b.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') pick(); });
    });
  });
})();
