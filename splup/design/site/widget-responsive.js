(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports
    ? require('../tokens/widget-responsive.json') : root.DittoResponsiveTokens);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DittoResponsive = api;
})(globalThis, function (spec) {
  'use strict';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  function finite(v, name) {
    if (!Number.isFinite(v)) throw new TypeError(`${name} must be finite`);
    return v;
  }
  function grid(viewport) {
    const g = spec.grid;
    const width = clamp(finite(viewport, 'viewport'), g.minViewport, g.maxViewport);
    const cell = (width - 2 * g.margin - (g.columns - 1) * g.gap) / g.columns;
    return { width, cell, pitch: cell + g.gap, platterWidth: width - 2 * g.margin };
  }
  function spanSize(span, viewport) {
    if (!Number.isInteger(span) || span < 1 || span > spec.grid.rows) throw new RangeError('invalid span');
    return span * grid(viewport).pitch - spec.grid.gap;
  }
  function widget(id) {
    const w = spec.widgets.find(w => w.id === id);
    if (!w) throw new RangeError(`Unknown widget: ${id}`);
    return w;
  }
  function allowedSizes(id, viewport = 390, attributed = false, scale = 1) {
    const w = widget(id), a = spec.attribution;
    const footer = scale > 1 ? a.largeFooterHeight : a.footerHeight;
    return spec.profiles[w.profile].sizes.filter(([x, y]) => !attributed ||
      (x >= a.minColumns && y >= a.minRows && spanSize(x, viewport) >= a.minFrameWidth && spanSize(y, viewport) - footer >= a.minContentHeight));
  }
  // A bounding rectangle is NOT a legal-size contract. Keep incomparable min/max choices.
  function extrema(sizes) {
    return {
      min: sizes.filter(([x, y]) => !sizes.some(([a, b]) => a <= x && b <= y && (a < x || b < y))),
      max: sizes.filter(([x, y]) => !sizes.some(([a, b]) => a >= x && b >= y && (a > x || b > y)))
    };
  }
  function musicLayout(width, height, scale = 1) {
    if (finite(width, 'width') <= 0 || finite(height, 'height') <= 0) throw new RangeError('positive bounds required');
    const m = spec.music, t = spec.typography;
    scale = clamp(finite(scale, 'scale'), 1, 2);
    const padding = Math.min(width, height) < m.compactThreshold ? m.compactPadding : m.padding;
    const innerWidth = Math.max(0, width - 2 * padding), innerHeight = Math.max(0, height - 2 * padding);
    const ratio = width / height;
    const mode = height / width >= m.railRatio ? 'rail' : ratio > m.squareRatioHigh ? 'row'
      : ratio < m.squareRatioLow ? 'column' : 'square';
    const titleLineHeight = Math.ceil(t.titleLineHeight * scale), artistLineHeight = Math.ceil(t.artistLineHeight * scale);
    const maxLines = mode === 'rail' ? 4 : 2;
    const imageBudget = mode === 'column' || mode === 'rail' ? m.minArtwork + m.gap : 0;
    const textHeightBudget = Math.max(0, innerHeight - imageBudget);
    const showArtist = textHeightBudget >= titleLineHeight + t.metadataGap + artistLineHeight;
    const artistHeight = showArtist ? t.metadataGap + artistLineHeight : 0;
    const titleLines = Math.min(maxLines, Math.max(0, Math.floor((textHeightBudget - artistHeight) / titleLineHeight)));
    const metadataHeight = titleLines * titleLineHeight + artistHeight;
    let artwork = 0, textWidth = innerWidth;
    if (mode === 'row') {
      artwork = Math.max(0, Math.min(m.maxRowArtwork, innerHeight,
        Math.floor((innerWidth - m.gap) * .44), innerWidth - m.gap - m.minTextWidth));
      if (artwork < m.minArtwork) artwork = 0;
      textWidth = innerWidth - (artwork ? artwork + m.gap : 0);
    } else if (mode === 'column' || mode === 'rail') {
      artwork = Math.max(0, Math.min(m.maxColumnArtwork, innerWidth, innerHeight - metadataHeight - m.gap));
      if (artwork < m.minArtwork) artwork = 0;
    } else artwork = Math.min(width, height);
    return { mode, width, height, padding, gap: m.gap, artwork, textWidth, innerWidth, innerHeight,
      titleLines, showArtist, metadataHeight, titleLineHeight, artistLineHeight,
      titleSize: t.titleSize * scale, artistSize: t.artistSize * scale,
      detailRequired: !showArtist || titleLines < 2, fits: titleLines >= 1 && metadataHeight <= innerHeight };
  }
  return { spec, grid, spanSize, widget, allowedSizes, extrema, musicLayout };
});
