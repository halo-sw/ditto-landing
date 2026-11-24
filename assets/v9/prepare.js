/* Landing media contract: real widget components, no borrowed photo content. */
(function () {
  'use strict';
  var W = window.DittoWidgets, P = window.DITTO_PLATTERS;
  if (!W || !P) return;
  function clean(o) {
    if (!o || typeof o !== 'object') return;
    Object.keys(o).forEach(function (k) {
      if (['img','avatar','audio','poster','ytId'].indexOf(k) >= 0) o[k] = '';
      else if (k === 'shots') o[k] = [];
      else clean(o[k]);
    });
  }
  Object.keys(P).forEach(function (k) { clean(P[k]); });
  W.catalog.forEach(function (c) { clean(c.sample); });
  var labels = { image: '사진', gif: 'GIF', video: '영상', together: '함께 찍은 네 컷' };
  function decorate(el, w) {
    if (!el || !w) return el;
    el.querySelectorAll('img:not([src]),img[src=""]').forEach(function (im) { im.remove(); });
    if (labels[w.kind]) {
      el.classList.add('v9-empty-media');
      var field = document.createElement('div');field.className='v9-field';field.setAttribute('aria-hidden','true');
      var plus=document.createElement('span');plus.textContent='＋';
      var label=document.createElement('b');label.textContent=labels[w.kind];
      field.append(plus,label);el.prepend(field);
      if(w.kind==='together') field.classList.add('four');
    }
    return el;
  }
  var render=W.render, update=W.update, box=W.box;
  W.render=function(w){return decorate(render(w),w);};
  W.update=function(el,w){update(el,w);decorate(el,w);};
  W.box=function(w){var el=box(w);decorate(el.firstElementChild,w);return el;};
})();
