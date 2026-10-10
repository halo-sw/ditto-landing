/* Design preview only. Original material lives inside the floating wrapper. */
window.DittoWidgetFloating = (() => {
  const recipe = window.DittoWidgetFloatingTokens;
  const style = document.documentElement.style;
  const rgb = [1, 3, 5].map(i => parseInt(recipe.shadowColor.slice(i, i + 2), 16));
  for (const [key, entry] of Object.entries(recipe.effects)) {
    entry.shadows.forEach((s, i) => {
      const p = `--wf-shadow-${key}-${i}`;
      style.setProperty(p + '-color', `rgba(${rgb.join(',')},${s.alpha})`);
      style.setProperty(p + '-y', s.y + 'px');
      style.setProperty(p + '-blur', s.blur + 'px');
    });
    style.setProperty('--wf-' + key, entry.shadows.map((_, i) =>
      `0 var(--wf-shadow-${key}-${i}-y) var(--wf-shadow-${key}-${i}-blur) var(--wf-shadow-${key}-${i}-color)`
    ).join(','));
  }
  for (const [key, value] of Object.entries(recipe.motion)) {
    if (typeof value !== 'number') continue;
    const unit = key.endsWith('Ms') ? 'ms' : ['liftY', 'scrollCancelDistance'].includes(key) ? 'px' : '';
    style.setProperty('--wf-motion-' + key, value + unit);
  }
  style.setProperty('--wf-selection', recipe.selection.color);
  style.setProperty('--wf-selection-width', recipe.selection.width + 'px');
  style.setProperty('--wf-selection-offset', recipe.selection.offset + 'px');
  style.setProperty('--wf-ease', `cubic-bezier(${recipe.motion.ease.join(',')})`);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set();
  function track(a) {
    animations.add(a);
    a.finished.then(() => animations.delete(a), () => animations.delete(a));
    return a;
  }
  function stopAll() { for (const a of animations) a.cancel(); animations.clear(); }
  reduced.addEventListener('change', stopAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); });
  window.addEventListener('blur', stopAll);
  return {
    recipe,
    get reduced() { return reduced.matches; },
    get animationCount() { return animations.size; },
    stopAll,
    capture(root) { return root?.querySelector('.wf-visual')?.getBoundingClientRect(); },
    settle(root, previous, displayScale, cancelled = false) {
      if (!root || !previous || reduced.matches || document.hidden || !document.hasFocus()) return;
      const visual = root.querySelector('.wf-visual');
      if (!visual) return;
      const next = visual.getBoundingClientRect();
      if (!next.width || !next.height) return;
      const dx = (previous.left - next.left) / displayScale;
      const dy = (previous.top - next.top) / displayScale;
      const duration = cancelled ? recipe.motion.cancelMs : recipe.motion.dropMs;
      const timing = { duration, easing: `cubic-bezier(${recipe.motion.ease.join(',')})` };
      // Keep grid coordinates committed; only the visual layer settles into place.
      const animation = track(visual.animate([
        { transformOrigin: '0 0', transform: `translate(${dx}px,${dy}px) scale(${previous.width / next.width},${previous.height / next.height})` },
        { transformOrigin: '0 0', transform: 'none' }
      ], timing));
      root.style.zIndex = '20';
      animation.finished.then(() => { root.style.zIndex = ''; }, () => { root.style.zIndex = ''; });
      const shadow = visual.querySelector('.wf-release-shadow');
      if (shadow) track(shadow.animate([{ opacity: 1 }, { opacity: 0 }], timing));
    }
  };
})();
