/* ditto.place v8 — platter widget renderer (browser). Styles: assets/v8/platter.css
 *
 * Draws real Ditto platter widgets in HTML/CSS at any size the app allows. Sources, in order of authority:
 *   1. the app            prj_Ditto!/DittoPrototype/Views (WidgetContent · PostWidget · TodoWidget · DDayWidget · MusicCDPTile ·
 *                         StandardServiceTiles · StickerBoard · TogetherBooth · DittoWidgetTile) and Model/GridEngine.swift
 *   2. assets/platter/render.js   the browser port that already follows the app's current widget designs
 *   3. scripts/platter.py         the build-time renderer behind /demo/<handle>/ (older designs for some kinds)
 *
 * window.DittoWidgets
 *   render(widget)            → HTMLElement  content (".dw-c") that fills a widget box drawn at widget.w × widget.h cells
 *   update(el, widget)        → void         re-draw into the same element after a size or data change
 *   boxStyle(widget)          → { radius, background, border, glow }   design px at 358 width (see below)
 *   catalog                   → [{ kind, name, group, section, desc, sizes:[{w,h}], defaultSize:{w,h}, freeResize, dittoable, sample }]
 *   kinds                     → every kind render() draws (others fall back to an emoji + title tile)
 *   — conveniences —
 *   applyBox(boxEl, widget)   → boxEl        puts class "dw dw-<kind> [dw-hl|dw-glow]", radius and background on a box
 *   place(boxEl, widget)      → boxEl        left/top/width/height in cqw from x,y,w,h cells
 *   box(widget)               → HTMLElement  ".dw" box, styled, placed, labelled, with its content inside (el.firstChild)
 *   label(widget)             → string       accessible name ("사진, 🎂 초는 내가") — box() sets it as aria-label
 *   platter(persona|widgets)  → HTMLElement  ".dpl" root with every widget (persona = an entry of window.DITTO_PLATTERS)
 *   rect(widget)              → { x, y, w, h }  design px · cq(px) → "…cqw" · radius(widget) · dittoable(kind)
 *   metrics                   → { width:358, unit:45.75, gutter:8, cols:8, minW:2, maxW:6, minH:2, maxH:8 }
 *   config                    → { look:'app'|'web', lazy:true }
 *       look 'app' (default)  the widget as the app draws it today.
 *       look 'web'            exactly what scripts/platter.py draws (pixel parity with /demo/<handle>/). Differs for
 *                             block · todo · status(square) · video · image title · text line height · guestbook.
 *
 * render() and update() only build markup: they never read layout (no forced reflow). Text that has to be fitted
 * (post title/body lines, the 2-column social handle) is measured on an offscreen canvas at design px. If Pretendard is
 * declared on the page but not loaded yet, the element re-measures itself once the face arrives and redraws only when
 * the markup changes. Nothing is fetched by this file; <audio>/<video> are never created (music.audio is data only).
 * The content element must sit in a positioned box (".dw") inside a ".dpl" root: all lengths are cqw of that root.
 *
 * ── Widget ───────────────────────────────────────────────────────────────────────────────────────────────
 *   { id, kind, x, y, w, h, data:{…}, ditto?:true, source?:{ name, handle?, avatar? }, priv?:bool }
 *     x,y,w,h   grid cells (8 columns; pitch 45.75 design px incl. 8 gutter; a w×h widget is w*45.75−8 by h*45.75−8)
 *     ditto     the owner opened it for ditto → halo (boxStyle.glow). Only image · gif · video · polaroid can be opened.
 *     source    it is a ditto copy → drawn as the app's DittoWidgetTile (photo/emoji/title + white source chip +
 *               DittoBadge top-right) whatever its kind. name is shown as given ("@bomcut" or "봄");
 *               handle (without @) wins over name when present.
 *
 * ── data per kind ────────────────────────────────────────────────────────────────────────────────────────
 *   style (text · image · status · video · social · dday · sticker) = { bg?:'#RRGGBB', fg?:'#RRGGBB', bold?, italic?, underline?,
 *           strike?, align?:'left'|'center'|'right', pos?:'tl'|'tc'|'tr'|'ml'|'mc'|'mr'|'bl'|'bc'|'br' }
 *   text       { text, style? }
 *   image      { img, title?, style? }
 *   status     { emoji, label?, style? }                    wider than tall = emoji + label line · else emoji pattern (1·3·6)
 *   music      { title, artist?, img?, palette?:[top,mid,bottom], audio?, ytId?, poster?, provider?, album? }
 *                palette = MusicArtworkPalette stops (precomputed); provider defaults from audio/ytId
 *   video      { img?, title?, ytId?, letterbox?:bool, local?:bool, style? }   letterbox = 4:3 YouTube thumbnail with black bars
 *   guestbook  { title?, entries:[{ name, message, avatar?, handle? }] }      newest first; only entries[0] is drawn
 *   block      { title?, text?, img?, count?:'글 3개', emoji? }               the 포스트 widget (data type is "block" in the app)
 *   todo       { title?, cats:[{ id, name, color:'pink'|'blue'|'green'|'cocoa'|'purple' }], items:[{ text, done, cat? }],
 *                week?:[[color…]×7] (Sun→Sat: sections completed that day), today?:0–6 }
 *   dday       { title?, date?:'YYYY-MM-DD' | inDays?:number, up?:bool, theme?:'bar'|'grid'|'gradient'|'photo',
 *                palette?:'purple'|'midnight'|'cyan'|'pink'|'apricot'|'coral'|'yellow'|'lime', start?:'YYYY-MM-DD',
 *                progress?:bool, img?, style?, now?:'YYYY-MM-DD' }
 *   social     { label, img?, style? }
 *   sticker    { stickers:[{ img?|e?, x, y, r?, s?, big? }], style? }         x,y = 0–1 of the tile · r = degrees · big = photo cut-out (88pt)
 *   together   { shots:[img×4], layout?:'strip'|'row', frame?:'#FFFFFF', tagged?:[name…] }
 *   gif        { img?, emoji? }
 *   playlist   { title?, songs:[title…] }
 *   mood       { emoji?, text? } · diary { text?, date? } · place { label, title? } · weather { emoji?, title, label }
 *   voice      { label? } · nowplaying { title, artist } · collection { title?, items:[title…] }
 *   polaroid   { img?, frames?:[img…], caption? } · paparazzi { img?, frames?, title?, by? } · ask { text? }
 *   ditto      { img?, emoji?, title?, caption? }  (+ widget.source)
 */
(function () {
  'use strict';

  var DW = 358, UNIT = 45.75, GUT = 8, COLS = 8;
  var config = { look: 'app', lazy: true };
  var DITTOABLE = { image: 1, gif: 1, polaroid: 1, video: 1 };   // WType.dittoableSet (2026-11-09: music is out)

  // ───────────────────────── basics ─────────────────────────

  function isStr(x) { return typeof x === 'string'; }
  function u(n) { return (n * 100 / DW).toFixed(3) + 'cqw'; }
  function esc(s) {
    return String(s === undefined || s === null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
  }
  function trim(s) { return isStr(s) ? s.trim() : ''; }
  function app() { return config.look !== 'web'; }
  function hexOk(c) { return isStr(c) && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(c); }
  function styleOf(d) { return d && d.style && typeof d.style === 'object' ? d.style : {}; }
  function fg(d, dflt) { var c = styleOf(d).fg; return hexOk(c) ? c : dflt; }
  function hexA(h, a) {
    if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
    return 'rgba(' + parseInt(h.slice(1, 3), 16) + ',' + parseInt(h.slice(3, 5), 16) + ',' + parseInt(h.slice(5, 7), 16) + ',' + a + ')';
  }
  function imgTag(cls, src, extra) {
    return '<img' + (cls ? ' class="' + cls + '"' : '') + ' src="' + esc(src) + '" alt=""' + (config.lazy ? ' loading="lazy"' : '') + ' decoding="async" draggable="false"' + (extra || '') + '>';
  }

  // Colour emoji: with a translucent text colour the browser fades the emoji too. The app draws them in full colour.
  var EMO_RE = null;
  try { EMO_RE = new RegExp('(?:\\p{Extended_Pictographic}|\\p{Regional_Indicator}{2})(?:\\uFE0F|\\u20E3|[\\u{1F3FB}-\\u{1F3FF}]|\\u200D\\p{Extended_Pictographic}\\uFE0F?)*', 'gu'); } catch (e) { EMO_RE = null; }
  /** escaped text; in the app look emoji are wrapped so they keep their colour */
  function E(s) {
    var h = esc(s);
    return app() && EMO_RE ? h.replace(EMO_RE, '<span class="dw-emo">$&</span>') : h;
  }
  function graphemes(s) {
    s = isStr(s) ? s : '';
    try {
      if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        return Array.from(new Intl.Segmenter('ko', { granularity: 'grapheme' }).segment(s), function (x) { return x.segment; });
      }
    } catch (e) { /* fall through */ }
    var out = [];
    Array.from(s).forEach(function (c) {
      var cp = c.codePointAt(0);
      if (out.length && (cp === 0xFE0F || cp === 0x200D || (cp >= 0x1F3FB && cp <= 0x1F3FF) || out[out.length - 1].slice(-1) === '‍')) out[out.length - 1] += c;
      else out.push(c);
    });
    return out;
  }

  // Text measuring without touching layout — offscreen canvas at design px (everything scales together, so the
  // line count at 358 holds at any platter width). Falls back to average glyph widths when there is no canvas.
  var FONT = '"Pretendard Variable","Pretendard",-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif';
  var mctx = null, mfail = false, fontMiss = null;
  /** true when the web font this text needs is declared on the page but not loaded yet (the measure used a fallback) */
  function fontPending(s, size, weight) {
    try {
      var f = document.fonts;
      if (!f || !f.check) return false;
      return !f.check(weight + ' ' + size + 'px "Pretendard Variable"', s) || !f.check(weight + ' ' + size + 'px "Pretendard"', s);
    } catch (e) { return false; }
  }
  function textW(s, size, weight) {
    var n = Array.from(s).length;
    if (fontMiss && fontMiss.length < 8 && fontPending(s, size, weight)) fontMiss.push([weight + ' ' + size + 'px', s]);
    if (!mctx && !mfail) {
      try { mctx = document.createElement('canvas').getContext('2d'); } catch (e) { mctx = null; }
      if (!mctx) mfail = true;
    }
    if (mctx) {
      mctx.font = weight + ' ' + size + 'px ' + FONT;
      return mctx.measureText(s).width - n * size * 0.01;
    }
    var wd = 0;
    Array.from(s).forEach(function (c) { wd += c.charCodeAt(0) > 0x2E7F ? size * 0.93 : c === ' ' ? size * 0.25 : size * 0.56; });
    return wd - n * size * 0.01;
  }
  /** how many lines s takes at width (word-break: keep-all — breaks at spaces, long words wrap anywhere) */
  function lineCount(s, size, weight, width, max) {
    var words = String(s).split(/\s+/).filter(function (x) { return x; });
    if (!words.length || width <= 0) return words.length ? 1 : 0;
    var sp = textW(' ', size, weight), lines = 1, cur = 0;
    for (var i = 0; i < words.length; i++) {
      var ww = textW(words[i], size, weight);
      if (cur > 0 && cur + sp + ww > width + 0.5) { lines++; cur = 0; }
      if (ww > width) { lines += Math.ceil(ww / width) - 1; cur = ww % width; }
      else cur += (cur > 0 ? sp : 0) + ww;
      if (max && lines >= max) return max;
    }
    return lines;
  }

  // ───────────────────────── glyphs ─────────────────────────

  var ARROW = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M3 7l4-4M4 3h3v3" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CAMERA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.4-2h6.2l1.4 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  var YT_WEB = '<svg viewBox="0 0 20 14.4" aria-hidden="true"><rect width="20" height="14.4" rx="5.6" fill="#f00"/><path d="M8.4 4.4v5.6l4.6-2.8z" fill="#fff"/></svg>';
  var YT = '<svg viewBox="0 0 20 14.4" aria-hidden="true"><rect width="20" height="14.4" rx="5.6" fill="#f00"/><path d="M7.4 4.2v6l5.2-3z" fill="#fff"/></svg>';   // YouTubeBadge: 1 × .72, r .28, triangle .26 × .3
  var PENCIL = '<svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor"><path d="m10.7 1.9 1.2-1.2a1.4 1.4 0 0 1 2 0l1.4 1.4a1.4 1.4 0 0 1 0 2L14.1 5.3zM9.8 2.8l3.4 3.4-7.5 7.5-4.4 1 1-4.4z"/></svg>';
  var CHECK = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.6 6.3 5 8.6l4.4-5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var NOTE = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4.6 9.2V3l5-1.2v6.1" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><circle cx="3.5" cy="9.3" r="1.4" fill="currentColor"/><circle cx="8.5" cy="8.1" r="1.4" fill="currentColor"/></svg>';
  var PLAY = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.6 1.9v8.2L10 6z" fill="#fff"/></svg>';
  var BOOTH = '<svg viewBox="0 0 28 24" aria-hidden="true"><rect x="7.5" y="1.5" width="19" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 9.5h-1a1.5 1.5 0 0 0-1.5 1.5v9A2.5 2.5 0 0 0 3.5 22.5h13A2.5 2.5 0 0 0 19 20v-.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="17" cy="8.5" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  // ditto mark (app asset ditto-appicon-mark, 214 × 204)
  var MARK = '<svg viewBox="0 0 214 204" aria-hidden="true"><g fill="currentColor"><path d="M176.502 20.1889C176.502 20.1889 151.492 0.354846 97.6641 0C94.3642 19.1617 88.339 51.3127 81.3034 89.5053C79.088 54.665 59.1585 48.6326 48.2761 50.8924C21.3295 56.5046 -9.02822 106.398 2.52162 142.172C14.1642 178.236 66.5 169.869 87.9867 165.452C87.9497 165.34 87.9219 165.228 87.8848 165.125C87.4862 128.819 92.0468 78.7012 124.629 47.6988C139.08 33.9532 161.782 21.2254 176.511 20.1982L176.502 20.1889ZM67.0839 146.169C62.5604 151.146 52.4473 144.413 43.4095 132.572C24.8334 108.209 25.7047 80.905 39.1641 80.7369C46.45 80.6435 53.6153 86.1997 61.2256 109.106C65.7121 122.618 69.7906 143.181 67.0747 146.169H67.0839Z"/><path d="M153.996 156.046C151.332 158.734 147.415 158.93 145.465 153.751C144.379 150.849 141.687 144.093 134.633 134.976C130.845 130.077 123.716 122.659 119.186 114.046C114.332 104.817 113.375 99.5919 114.146 91.7629C115.158 81.6385 125.257 69.1251 139.33 69.993C164.012 71.514 162.165 103.922 162.165 103.922C162.165 103.922 176.803 73.0536 200.279 83.1595C213.209 88.7303 215.892 105.275 212.875 114.046C206.953 131.253 185 138.009 176.608 142.068C163.965 148.171 160.494 149.496 153.987 156.046H153.996Z"/><path d="M141.594 204C150.822 204 158.303 196.48 158.303 187.204C158.303 177.927 150.822 170.407 141.594 170.407C132.366 170.407 124.885 177.927 124.885 187.204C124.885 196.48 132.366 204 141.594 204Z"/></g></svg>';
  var BADGE_SRC = '/assets/cast/pack-stickers/00-ditto-basic/sticker-app-icon-purple.webp';
  var ASK_ART = '/assets/cast/objects/ask-box.webp';

  // ───────────────────────── shared pieces ─────────────────────────

  /** StandardServiceTiles.ServiceTile — label · content · title · subtitle */
  function serviceTile(W, H, label, title, subtitle, content) {
    var a = app();
    var small = W < 110 && H < 120;
    var inset = small ? 7 : W < 110 ? 8 : 12;
    var ts = small ? 10 : W < 150 ? 13 : 17;
    var meta = a ? 11 : 10;   // app: DDSType.widgetMeta 11 Medium
    if (W / Math.max(H, 1) >= 1.7) {
      return '<div class="dw-st dw-st-w" style="padding:' + u(inset) + ';gap:' + u(10) + '">' +
        '<div class="dw-st-body" style="flex:none;width:' + u(Math.min(H - inset * 2, W * 0.35)) + '">' + content + '</div>' +
        '<div class="dw-st-col" style="gap:' + u(4) + '"><p class="dw-st-label" style="font-size:' + u(a ? 11 : 9) + '">' + esc(label) + '</p>' +
        '<p class="dw-st-title" style="font-size:' + u(13) + (a ? ';font-weight:600' : '') + ';-webkit-line-clamp:1">' + E(title) + '</p>' +
        '<p class="dw-st-sub" style="font-size:' + u(a ? 11 : 10) + '">' + E(subtitle) + '</p></div></div>';
    }
    var parts = ['<div class="dw-st" style="padding:' + u(inset) + ';gap:' + u(small ? 3 : 6) + '">'];
    if (H >= 160) parts.push('<div class="dw-st-label" style="font-size:' + u(meta) + '">' + esc(label) + ARROW + '</div>');
    parts.push('<div class="dw-st-body">' + content + '</div>');
    parts.push('<div class="dw-st-title" style="font-size:' + u(ts) + ';-webkit-line-clamp:' + (W < 110 && !small ? 2 : 1) + '">' + E(small ? label : title) + '</div>');
    if (!small && H >= 160) parts.push('<div class="dw-st-sub" style="font-size:' + u(meta) + '">' + E(subtitle) + '</div>');
    parts.push('</div>');
    return parts.join('');
  }
  function centred(emoji, text, sub, gap, es, ts, cls) {
    return '<div class="dw-ss' + (cls ? ' ' + cls : '') + '" style="gap:' + u(gap) + '"><span style="font-size:' + u(es) + '">' + esc(emoji) + '</span>' +
      '<b style="font-size:' + u(ts) + '">' + esc(text) + '</b>' + (sub === null ? '' : '<span class="dw-sub" style="font-size:' + u(11) + '">' + esc(sub) + '</span>') + '</div>';
  }
  var TEXT_POS = { tl: ['flex-start', 'flex-start'], tc: ['flex-start', 'center'], tr: ['flex-start', 'flex-end'],
    ml: ['center', 'flex-start'], mc: ['center', 'center'], mr: ['center', 'flex-end'],
    bl: ['flex-end', 'flex-start'], bc: ['flex-end', 'center'], br: ['flex-end', 'flex-end'] };
  function deco(st) { return [st.underline ? 'underline' : '', st.strike ? 'line-through' : ''].filter(function (x) { return x; }).join(' '); }

  // ───────────────────────── renderers: (widget, W, H, data) → html | { html, bg?, cls? } ─────────────────────────
  var R = {};

  // ── 텍스트 — WidgetContent.textView: 13 Medium · padding 12 · style (colour · weight · decoration · align · position)
  R.text = function (w, W, H, d) {
    if (d.note) {
      var compact = w.w <= 2;
      var inset = compact ? 10 : 12, gap = compact ? 2 : 5;
      var line = compact ? 16 : 20;
      var lines = Math.max(1, Math.floor((H - 2 * inset - 13 - gap) / line));
      var memoStyle = 'color:' + fg(d, '#332c23') + ';padding:' + u(inset) + ';gap:' + u(gap);
      var bodyStyle = 'font-size:' + u(compact ? 13 : 15) + ';line-height:' + u(line) + ';-webkit-line-clamp:' + lines;
      return '<div class="dw-memo" style="' + memoStyle + '"><span>메모</span><p style="' + bodyStyle + '">' + E(d.text) + '</p></div>';
    }
    var st = styleOf(d), pos = TEXT_POS[st.pos] || TEXT_POS.tl, dc = deco(st);
    var align = st.align === 'center' || st.align === 'right' ? st.align : 'left';
    var css = 'padding:' + u(12) + ';font-size:' + u(13) + ';line-height:' + u(app() ? 22.6 : 20) + ';color:' + fg(d, 'rgba(18,18,18,.72)') + ';' +
      'justify-content:' + pos[0] + ';align-items:' + pos[1] + ';text-align:' + align + ';' +
      'font-weight:' + (st.bold ? 700 : 500) + ';' + (st.italic ? 'font-style:italic;' : '') + (dc ? 'text-decoration:' + dc + ';' : '');
    if (!app()) return '<div class="dw-tx" style="' + css + '"><p>' + E(d.text) + '</p></div>';
    // SwiftUI: 13pt lines 15.5 tall + lineSpacing 7.15, no leading above the first or below the last line; whole lines only
    var n = Math.max(1, Math.floor((H - 24 + 7.15) / 22.65));
    return '<div class="dw-tx" style="' + css + '"><p style="margin:' + u(-3.55) + ' 0;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:' + n + '">' + E(d.text) + '</p></div>';
  };

  // ── 이미지 — WidgetContent.imageView · imageTitleSpec (Figma Splup/Widget/image)
  function imageTitleSpec(cw, ch) {
    var st;
    if (cw === 2 && ch === 2) st = [12, 16];
    else if (cw === 2) st = [14, 20];
    else if (cw === 3 || ch === 2) st = [14, 20];
    else if (cw === 4 && ch === 3) st = [17, 24];
    else if (cw === 4) st = [18, 26];
    else if (cw === 6 && ch === 4) st = [20, 28];
    else st = [22, 30];
    var lines = cw === 2 && ch === 2 ? 3 : (cw <= 2 && ch >= 6) ? 4 : 2;
    return [st[0], st[1], lines, cw <= 2 ? 8 : cw <= 4 ? 12 : 16];
  }
  R.image = function (w, W, H, d) {
    if (d.meme) return memeImage(d);
    var title = trim(d.title);
    var inner = d.img ? imgTag('dw-cover', d.img) + '<span class="dw-soft"></span>' : '<span class="dw-ph">' + CAMERA + '</span>';
    if (!title) return inner;
    if (!app()) {
      var fs = w.w <= 2 ? 12 : (w.w <= 3 || w.h <= 2) ? 14 : 17, pd = w.w <= 2 ? 8 : w.w <= 4 ? 12 : 16;
      return inner + '<p class="dw-im-title" style="font-size:' + u(fs) + ';padding:' + u(pd) + ' ' + u(pd) + ' ' + u(20) + '">' + esc(title) + '</p>';
    }
    var sp = imageTitleSpec(w.w, w.h), st = styleOf(d), dc = deco(st);
    var row = isStr(st.pos) ? st.pos[0] : 't';
    var align = st.align === 'center' || st.align === 'right' ? st.align : 'left';
    var css = 'font-size:' + u(sp[0]) + ';line-height:' + u(sp[1]) + ';-webkit-line-clamp:' + sp[2] + ';color:' + fg(d, '#fff') + ';text-align:' + align +
      ';font-weight:' + (st.bold ? 700 : 600) + (st.italic ? ';font-style:italic' : '') + (dc ? ';text-decoration:' + dc : '');
    var pad = sp[3], box;
    if (row === 'b') box = 'dw-im-cap dw-b" style="padding:' + u(20) + ' ' + u(pad) + ' ' + u(pad);
    else if (row === 'm') box = 'dw-im-cap dw-m" style="padding:' + u(pad);
    else box = 'dw-im-cap" style="padding:' + u(pad) + ' ' + u(pad) + ' ' + u(20);
    return inner + '<div class="' + box + '"><p style="' + css + '">' + E(title) + '</p></div>';
  };

  // ── 상태 — WidgetContent.statusView: wider than tall = emoji 22 + label 16 SemiBold · else StatusEmojiPattern
  function emojiPattern(e, size) {
    var cs = graphemes(e);
    if (cs.length <= 1) return '<span class="dw-ep" style="font-size:' + u(size) + '">' + esc(e) + '</span>';
    var rows = [];
    for (var i = 0; i < cs.length; i += 3) rows.push(cs.slice(i, i + 3));
    var s = size * (rows.length > 1 ? 0.5 : 0.56);
    return '<span class="dw-ep" style="gap:' + u(s * 0.12) + '">' + rows.map(function (r) {
      return '<span style="gap:' + u(s * 0.08) + '">' + r.map(function (c) { return '<i style="font-size:' + u(s) + '">' + esc(c) + '</i>'; }).join('') + '</span>';
    }).join('') + '</span>';
  }
  R.status = function (w, W, H, d) {
    var emoji = isStr(d.emoji) ? d.emoji : '', label = isStr(d.label) ? d.label : '', color = fg(d, '#171719');
    if (!app()) {
      if (w.w > w.h) return '<div class="dw-ss dw-ss-h" style="padding:0 ' + u(14) + ';gap:' + u(9) + '"><span style="font-size:' + u(22) + '">' + esc(emoji) + '</span>' +
        '<b style="font-size:' + u(16) + ';color:' + color + '">' + esc(label) + '</b></div>';
      return '<div class="dw-ss" style="gap:' + u(6) + '"><span style="font-size:' + u(28) + '">' + esc(emoji) + '</span>' +
        '<b style="font-size:' + u(13) + ';color:' + color + '">' + esc(label) + '</b></div>';
    }
    if (w.w > w.h) return '<div class="dw-ss dw-ss-h dw-app" style="padding:0 ' + u(14) + ';gap:' + u(9) + '"><span style="font-size:' + u(22) + '">' + esc(emoji) + '</span>' +
      '<b style="font-size:' + u(16) + ';line-height:' + u(21) + ';color:' + color + ';-webkit-line-clamp:2">' + E(label) + '</b></div>';
    return '<div class="dw-ss dw-app" style="gap:' + u(6) + '">' + emojiPattern(emoji, Math.min(W, H) * 0.36) +
      (label ? '<b style="font-size:' + u(13) + ';color:' + color + '">' + E(label) + '</b>' : '') + '</div>';
  };

  // ── 영상 — WidgetContent.videoView · videoSpec (Figma Splup/Widget/video)
  function videoSpec(cw, ch) {   // [font, lines, inset, shade height, play diameter]
    if (cw === 2 && ch === 2) return [12, 0, 8, 0, 28];
    if (cw === 2) return [12, 3, 8, 76, 32];
    if (cw === 3 && ch === 3) return [14, 2, 12, 72, 32];
    if (cw === 3) return [14, 2, 12, 72, 44];
    if (cw === 4 && ch === 2) return [14, 1, 12, 52, 32];
    if (cw === 4 && ch === 3) return [17, 2, 12, 80, 32];
    if (cw === 4) return [18, 1, 12, 56, 44];
    if (ch === 2) return [14, 1, 16, 56, 32];
    if (ch === 4) return [20, 1, 16, 64, 44];
    return [22, 1, 16, 66, 44];
  }
  R.video = function (w, W, H, d) {
    var title = trim(d.title);
    if (!app()) {
      var px = w.w >= 3 ? 16 : 12, py = w.w >= 3 ? 14 : 10;
      return (d.img ? imgTag('dw-cover', d.img) : '') + '<div class="dw-vd-shade dw-web"></div>' +
        '<p class="dw-vd-title dw-web" style="font-size:' + u(17) + ';line-height:' + u(24) + ';padding:' + u(py) + ' ' + u(px) + ' 0">' + esc(title) + '</p>' +
        '<span class="dw-vd-yt" style="width:' + u(20) + ';height:' + u(14.4) + ';right:' + u(14) + ';bottom:' + u(12) + '">' + YT_WEB + '</span>';
    }
    var s = videoSpec(w.w, w.h), inner = '';
    if (d.img) {
      if (d.letterbox) {
        // 4:3 YouTube thumbnail with black bars baked in: show only the 16:9 picture, covering the tile
        var a = 16 / 9, iw, ih;
        if (W / H >= a) { iw = W; ih = W / a * 4 / 3; } else { iw = H * a; ih = H * a * 3 / 4; }
        inner += imgTag('dw-vd-poster', d.img, ' style="width:' + (iw / W * 100).toFixed(3) + '%;height:' + (ih / H * 100).toFixed(3) + '%;left:' + ((W - iw) / 2 / W * 100).toFixed(3) + '%;top:' + ((H - ih) / 2 / H * 100).toFixed(3) + '%"');
      } else inner += imgTag('dw-cover', d.img);
    }
    if (title && s[1] > 0) {
      inner += '<span class="dw-vd-shade dw-app" style="height:' + u(s[3]) + '"></span>' +
        '<p class="dw-vd-title dw-app" style="font-size:' + u(s[0]) + ';line-height:' + u(s[0] * 1.3) + ';padding:' + u(s[2]) + ' ' + u(s[2]) + ' 0;-webkit-line-clamp:' + s[1] + ';color:' + fg(d, '#fff') + '">' + E(title) + '</p>';
    }
    inner += '<span class="dw-vd-play" style="width:' + u(s[4]) + ';height:' + u(s[4]) + '"><i style="width:' + u(s[4] * 0.42) + ';height:' + u(s[4] * 0.42) + '">' + PLAY + '</i></span>';
    if (d.ytId || !d.local) inner += '<span class="dw-vd-yt" style="width:' + u(16) + ';height:' + u(11.52) + ';right:' + u(s[2]) + ';bottom:' + u(s[2]) + '">' + YT + '</span>';
    return inner;
  };

  // ── 음악 — MusicCDPTile · MusicCDPLayout.of (Figma Splup/Widget/music 2142:145642)
  // d = design size · disc/info = [x, y, w] · t/a = [size, line] · src = service mark · prog = [x, y, w] · vh = video height
  function musicLayout(ww, hh) {
    if (ww >= 6 && hh >= 8) return { d: [275.5, 370], disc: [171.5, 200, 88], info: [16, 260, 147.5], t: [24, 29], a: [14, 19], gap: 4, prog: [16, 333, 243.5], vh: 244, vl: [16, 215] };
    if (ww >= 6 && hh >= 6) return { d: [275.5, 275.5], disc: [187.5, 119, 72], info: [16, 171, 163.5], t: [22, 26], a: [13, 18], gap: 4, prog: [16, 238.5, 243.5], vh: 155, vl: [16, 126] };
    if (ww <= 2 && hh >= 4) return { d: [86.5, 275.5], disc: [12, 16, 62.5], info: [12, 102, 62.5], t: [14, 18], lines: 2, a: [11, 16], gap: 4, c: true, src: ['icon', 240.5] };
    if (hh <= 2) {
      if (ww >= 6) return { d: [275.5, 86.5], disc: [205, 16, 54.5], info: [16, 12, 177], t: [17, 20], a: [12, 17], gap: 4, src: ['y19', 16, 55] };
      if (ww >= 4) return { d: [181, 86.5], disc: [106.5, 12, 62.5], info: [12, 16.75, 82.5], t: [14, 18], a: [10, 14], gap: 2, src: ['inline'] };
      return { d: [86.5, 86.5], disc: [18.5, 8, 49.5], info: [8, 65.5, 70.5], t: [10, 13] };
    }
    if (ww >= 6) return { d: [275.5, 181], disc: [159.5, 16, 100], info: [16, 20, 131.5], t: [20, 24], lines: 2, a: [12, 17], gap: 4, src: ['y19', 16, 105], prog: [16, 144, 243.5] };
    if (hh >= 6) return { d: [181, 275.5], disc: [26.5, 16, 128], info: [16, 160, 149], t: [18, 22], a: [12, 17], gap: 4, c: true, src: ['y19', 52.5, 212], prog: [16, 238.5, 149] };
    if (ww <= 3 && hh <= 3) return { d: [133.75, 133.75], disc: [33, 12, 67.75], info: [12, 87.75, 109.75], t: [12, 18], a: [10, 14], gap: 2, c: true };
    if (hh <= 3) return { d: [181, 133.75], disc: [56.63, 12, 67.75], info: [12, 87.75, 157], t: [14, 18], a: [10, 14], gap: 2, c: true };
    if (ww <= 3) return { d: [133.75, 181], disc: [18.88, 12, 96], info: [12, 116, 109.75], t: [12, 18], a: [10, 14], gap: 2, c: true };
    return { d: [181, 181], disc: [42.5, 12, 96], info: [28.5, 125, 124], t: [14, 18], a: [10, 14], gap: 2, c: true };
  }
  var MUSIC_NEUTRAL = ['#e3e3e3', '#d7d7d7', '#dbdbdb'];   // MusicArtworkPalette.neutral (grey 160 → 70/58/62 % white)
  function musicBg(d) {
    var p = d && Array.isArray(d.palette) && d.palette.length >= 3 && d.palette.every(hexOk) ? d.palette : MUSIC_NEUTRAL;
    return 'linear-gradient(135deg,' + p[0] + ' 0%,' + p[1] + ' 48%,' + p[2] + ' 100%)';
  }
  R.music = function (w, W, H, d) {
    var L = musicLayout(w.w, w.h), a = app();
    var sx = W / L.d[0], sy = H / L.d[1];
    var title = trim(d.title) || '음악', artist = trim(d.artist);
    var media = String(d.audio || '');
    var big = Math.min(W, H) >= 200 && !!d.ytId;     // MusicPlayback.usesVideo
    var provider = d.provider || (big ? 'YouTube' : /deezer/.test(media) ? 'Deezer' : /apple|itunes|mzstatic/.test(media) ? 'Apple Music' : '미리듣기');
    function mark(s) {
      if (provider === 'YouTube Music') return '<i class="dw-mu-mk" style="width:' + u(s) + ';height:' + u(s) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#f00"/><circle cx="12" cy="12" r="7.25" fill="none" stroke="#fff"/><path d="M10 8.5v7l5.6-3.5z" fill="#fff"/></svg></i>';
      if (provider === 'YouTube') return '<i class="dw-mu-mk" style="width:' + u(s) + ';height:' + u(s * 0.72) + '">' + YT + '</i>';
      if (provider === 'Apple Music') return '<i class="dw-mu-mk dw-am" style="width:' + u(s) + ';height:' + u(s) + ';border-radius:' + u(s * 0.24) + '"><b style="width:' + u(s * 0.6) + ';height:' + u(s * 0.6) + '">' + NOTE + '</b></i>';
      return '<i class="dw-mu-mk dw-pv" style="width:' + u(s * 0.7) + ';height:' + u(s * 0.7) + '">' + NOTE + '</i>';
    }
    var out = '';
    if (a && L.vh) {   // 6×6 · 6×8: poster (or the cover) with a bottom shade and the service name; the CD overlaps its edge
      var poster = d.poster || d.img;
      out += '<span class="dw-mu-vid" style="height:' + u(L.vh * sy) + ';border-radius:0 0 ' + u(14) + ' ' + u(14) + '">' + (poster ? imgTag('', poster) : '') + '<i></i>' +
        '<em style="left:' + u(L.vl[0] * sx) + ';top:' + u(L.vl[1] * sy) + ';font-size:' + u(9) + '">' + esc(provider) + '</em></span>';
    }
    var dd = L.disc[2] * Math.min(sx, sy);
    var dx = L.disc[0] * sx + (L.disc[2] * sx - dd) / 2, dy = L.disc[1] * sy + (L.disc[2] * sy - dd) / 2;
    out += '<span class="dw-cd" style="left:' + u(dx) + ';top:' + u(dy) + ';width:' + u(dd) + ';height:' + u(dd) + '">' +
      '<span class="dw-cd-rot">' + (d.img ? imgTag('', d.img) : '') + '<span class="dw-cd-grooves"></span></span><span class="dw-cd-sheen"></span>' +
      '<span class="dw-cd-hub"></span><span class="dw-cd-hole"></span></span>';
    var t = L.lines > 1 && a
      ? '<b class="dw-ml" style="font-size:' + u(L.t[0]) + ';line-height:' + u(L.t[1]) + ';-webkit-line-clamp:' + L.lines + '">' + esc(title) + '</b>'
      : '<b style="font-size:' + u(L.t[0]) + ';line-height:' + u(L.t[1]) + '">' + esc(title) + '</b>';
    var ar = L.a && artist ? '<span style="font-size:' + u(L.a[0]) + ';line-height:' + u(L.a[1]) + '">' + esc(artist) + '</span>' : '';
    var inl = a && L.src && L.src[0] === 'inline' ? '<span class="dw-mu-src" style="gap:' + u(5) + ';font-size:' + u(10) + ';height:' + u(17) + ';margin-top:' + u(1) + '">' + mark(16) + '<span>' + esc(provider) + '</span></span>' : '';
    out += '<span class="dw-mu-info' + (L.c ? ' dw-ctr' : '') + '" style="left:' + u(L.info[0] * sx) + ';top:' + u(L.info[1] * sy) + ';width:' + u(L.info[2] * sx) + (a ? ';gap:' + u(L.gap || 2) : '') + '">' + t + ar + inl + '</span>';
    if (a && L.src && L.src[0] === 'y19') {
      out += '<span class="dw-mu-src' + (L.c ? ' dw-ctr' : '') + '" style="left:' + u((L.c ? L.info[0] : L.src[1]) * sx) + ';top:' + u(L.src[2] * sy) + ';height:' + u(19) + ';gap:' + u(5) + ';font-size:' + u(10) + (L.c ? ';width:' + u(L.info[2] * sx) : '') + '">' + mark(19) + '<b>' + esc(provider) + '</b></span>';
    } else if (a && L.src && L.src[0] === 'icon') {
      out += '<span class="dw-mu-src dw-ctr" style="left:0;right:0;top:' + u(L.src[1] * sy) + ';height:' + u(19) + '">' + mark(19) + '</span>';
    }
    if (a && L.prog) {   // 3pt track #B8ACB4 · knob 6 · time 9/12 (preview = 30 s)
      out += '<span class="dw-mu-prog" style="left:' + u(L.prog[0] * sx) + ';top:' + u(L.prog[1] * sy) + ';width:' + u(L.prog[2] * sx) + ';gap:' + u(6) + '">' +
        '<span class="dw-mu-track" style="height:' + u(3) + '"><i></i></span><span class="dw-mu-time" style="font-size:' + u(9) + ';height:' + u(12) + '"><span>0:00</span><span>' + (big ? '--:--' : '0:30') + '</span></span></span>';
    } else if (!a && media) {
      out += '<span class="dw-mu-bar" style="left:' + u(14) + ';right:' + u(14) + ';bottom:' + u(9) + ';height:' + u(3) + '"><i></i></span>';
    }
    return { html: out, bg: musicBg(d) };
  };

  // ── 방명록 — StandardServiceTiles.SpecialGuestbookTile
  R.guestbook = function (w, W, H, d) {
    var entry = Array.isArray(d.entries) && d.entries[0];
    var tiny = w.w <= 2 && w.h <= 2, strip = w.h <= 2 && !tiny;
    var pad = Math.min(W, H) < 100 ? 8 : 12;
    if (!entry || !trim(entry.message)) {
      return '<div class="dw-note-preview' + (strip ? ' horizontal' : '') + '" style="padding:' + u(pad) + '">' +
        imgTag('', '/assets/cast/objects/guestbook-note.webp') + '<b>방명록</b></div>';
    }
    var face = imgTag('dw-visit-face', entry.avatar || d.ownerAvatar || d.img || '/assets/app/av-flare-1.jpg');
    var name = '<b>' + esc(entry.name || '친구') + '</b>';
    var title = tiny || strip ? '' : '<strong>방명록</strong>';
    var body = tiny ? face + name : title + '<div class="dw-visit-row">' + face + name +
      '</div><p class="dw-visit-bubble"><span>' + esc(entry.message) + '</span></p>';
    var lines = strip ? 1 : Math.max(1, Math.floor((H - 2 * pad - 76) / 17));
    return '<div class="dw-visit dw-visit-' + (tiny ? 'tiny' : strip ? 'strip' : 'stack') +
      '" style="padding:' + u(pad) + ';--face:' + u(tiny ? 30 : 24) + ';--lines:' + lines + '">' + body + '</div>';
  };

  function blockWeb(w, W, H, d) {
    var tiny = w.w <= 2 && w.h <= 2, large = w.w >= 6 && w.h >= 4, horizontal = w.h <= 2 && !tiny, compact = w.h <= 3;
    var pad = tiny ? 8 : large ? 16 : 12;
    var emojiH = (tiny || compact || horizontal) ? 24 : 32, emojiSize = emojiH === 24 ? 20 : 24;
    var bigSrc = w.w >= 4 && w.h >= 4;
    var bfs = large ? 17 : 14, blh = large ? 26 : 20, sfs = bigSrc ? 14 : 12, slh = bigSrc ? 20 : 16;
    var emoji = trim(d.emoji);
    var source = d.title === undefined || d.title === null ? '나의 아카이브 함' : trim(d.title);
    var avail = H - 2 * pad - (source ? (tiny ? 4 : 8) + slh : 0);
    var lines = Math.max(1, Math.floor((horizontal || !emoji ? avail : avail - emojiH - 4) / blh));
    var e = emoji ? '<span class="dw-bl-emoji" style="font-size:' + u(emojiSize) + ';height:' + u(emojiH) + '">' + esc(emoji) + '</span>' : '';
    var body = '<p class="dw-bl-text" style="font-size:' + u(bfs) + ';line-height:' + u(blh) + ';-webkit-line-clamp:' + lines + '">' + esc(d.text) + '</p>';
    var src = source ? '<p class="dw-bl-src" style="font-size:' + u(sfs) + ';line-height:' + u(slh) + '"><span>' + esc(source) + '</span>›</p>' : '';
    return { html: '<div class="dw-bl' + (horizontal ? ' dw-bl-h' : '') + '" style="padding:' + u(pad) + ';gap:' + u(tiny ? 4 : 8) + '"><div class="dw-bl-main">' + e + body + '</div>' + src + '</div>', cls: 'dw-web' };
  }
  R.block = function (w, W, H, d) {
    if (!d.collection && !app()) return blockWeb(w, W, H, d);
    var title = trim(d.title), excerpt = trim(String(d.text || '').replace(/\n+/g, ' '));
    var photo = isStr(d.img) && d.img ? d.img : null, label = trim(d.count);
    var head = title || excerpt, body = title ? excerpt : '';
    var characters = Array.from(body);
    if (characters.length > 36) body = characters.slice(0, 36).join('').trimEnd() + '…';
    var pad = Math.min(W, H) < 100 ? 12 : 16;
    function eyebrow(onPhoto, count) {
      var c = count !== false && label && W >= 140;
      return '<span class="dw-po-eb' + (onPhoto ? ' dw-on' : '') + '" style="font-size:' + u(11) + ';gap:' + u(4) + '">' +
        '<i style="width:' + u(11) + ';height:' + u(11) + '">' + PENCIL + '</i><b>포스트</b>' + (c ? '<em>·</em><span>' + esc(label) + '</span>' : '') + '</span>';
    }
    function t(fs, lh, wt, lines, color) {
      return '<p class="dw-po-t" style="font-size:' + u(fs) + ';line-height:' + u(lh) + ';font-weight:' + wt + ';-webkit-line-clamp:' + lines + ';color:' + color + '">' + E(head) + '</p>';
    }
    function b(fs, lh, color, lines) {
      return '<p class="dw-po-b" style="font-size:' + u(fs) + ';line-height:' + u(lh) + ';color:' + color + ';-webkit-line-clamp:' + lines + '">' + E(body) + '</p>';
    }
    /** body that fills what is left under the title: whole lines only, ellipsis on the last one */
    function fit(fs, lh, color, avail) {
      if (!body) return '';
      var n = Math.floor((avail + 1) / lh);
      return n >= 1 ? b(fs, lh, color, n) : '';
    }
    function ph(wd, ht) { return '<span class="dw-po-ph" style="width:' + (wd === '100%' ? '100%' : u(wd)) + ';height:' + u(ht) + '">' + imgTag('', photo) + '</span>'; }
    function cover(fs, lh, lines, ex) {
      return imgTag('dw-cover', photo) + '<span class="dw-po-shade"></span>' +
        '<div class="dw-po-cov" style="padding:' + u(pad) + ';gap:' + u(5) + '">' + (W >= 120 ? eyebrow(true) : '') + t(fs, lh, 600, lines, '#fff') +
        (ex && body ? b(12, 16.8, 'rgba(255,255,255,.85)', 1) : '') + '</div>';
    }
    var EB = 14.3;   // eyebrow line: 11 × 1.3
    if (!head) {
      var ctr = w.h >= 3;
      return '<div class="dw-po-empty' + (ctr ? ' dw-ctr' : '') + '" style="padding:' + u(pad) + ';gap:' + u(8) + '">' +
        '<span class="dw-po-ico" style="width:' + u(32) + ';height:' + u(32) + '"><i style="width:' + u(15) + ';height:' + u(15) + '">' + PENCIL + '</i></span>' +
        '<b style="font-size:' + u(13) + '">' + (w.h <= 2 && w.w <= 2 ? '포스트 쓰기' : '긴 이야기는 여기에 써요') + '</b></div>';
    }
    if (w.h <= 2 && w.w <= 2) {
      return photo ? cover(14, 17, 3, false)
        : '<div class="dw-po-col dw-po-fill" style="padding:' + u(pad) + '"><i class="dw-po-pen" style="width:' + u(14) + ';height:' + u(14) + '">' + PENCIL + '</i><span class="dw-grow" style="min-height:' + u(6) + '"></span>' + t(16, 23, 600, Math.max(1, Math.min(3, Math.floor((H - pad * 2 - 20) / 23))), '#171719') + '</div>';
    }
    if (w.h <= 2) {
      return '<div class="dw-po-row dw-po-fill">' + (photo ? ph(H, H) : '') +
        '<div class="dw-po-col dw-mid" style="padding:0 ' + u(pad) + ';gap:' + u(6) + '">' + eyebrow(false, !photo) +
        t(16, 19, 600, !title && w.w >= 6 ? 2 : 1, '#171719') + (body ? b(12, 16.8, '#70737c', w.w >= 6 ? 2 : 1) : '') + '</div></div>';
    }
    if (w.w <= 2) {
      var em = !photo && trim(d.emoji) ? '<span style="font-size:' + u(28) + ';line-height:1.2">' + esc(trim(d.emoji)) + '</span>' : '';
      var room = H - (photo ? W : 0) - pad * 2 - (em ? 33.6 + 8 : 0) - EB - 8 - (label ? 14.3 + 8 : 0);
      return '<div class="dw-po-col dw-po-fill">' + (photo ? ph('100%', W) : '') +
        '<div class="dw-po-col" style="flex:1 1 auto;padding:' + u(pad) + ';gap:' + u(8) + '">' + em + eyebrow(false) +
        t(16, 23, 600, Math.max(1, Math.min(photo ? 4 : 6, Math.floor((room + 4) / 23))), '#171719') + '<span class="dw-grow"></span>' +
        (label ? '<p style="flex:none;font-size:' + u(11) + ';line-height:1.3;font-weight:500;color:#70737c;white-space:nowrap">' + esc(label) + ' ›</p>' : '') + '</div></div>';
    }
    var tw, tl, used;
    if (w.w >= 6 && w.h <= 4) {
      tw = W - (photo ? W * 0.45 : 0) - pad * 2;
      tl = Math.min(lineCount(head, 19, 700, tw, title ? 2 : 4), Math.max(1, Math.floor((H - pad * 2 - EB - 8) / 26.6)));
      used = pad * 2 + EB + 8 + tl * 26.6 + 8;
      return '<div class="dw-po-row dw-po-fill">' + (photo ? ph(W * 0.45, H) : '') +
        '<div class="dw-po-col" style="flex:1 1 auto;padding:' + u(pad) + ';gap:' + u(8) + '">' + eyebrow(false) + t(19, 26.6, 700, tl, '#171719') + fit(14, 21, '#46474c', H - used) + '</div></div>';
    }
    if (photo && w.h <= 3) return cover(17, 23.8, 2, true);
    var big = w.h >= 6 || (!photo && w.h >= 4);
    var phH = photo ? Math.round(H * (w.h >= 6 ? 0.52 : 0.40)) : 0, gap = big ? 10 : 7;
    var tfs = big ? 22 : 17, tlh = big ? (title ? 29.7 : 33.7) : (title ? 23.8 : 27.8), twt = big ? 700 : 600;
    tw = W - pad * 2;
    tl = Math.min(lineCount(head, tfs, twt, tw, title ? 2 : 8), Math.max(1, Math.floor((H - phH - pad * 2 - EB - gap) / tlh)));
    used = phH + pad * 2 + EB + gap + tl * tlh + gap;
    return '<div class="dw-po-col dw-po-fill">' + (photo ? ph('100%', phH) : '') +
      '<div class="dw-po-col" style="flex:1 1 auto;padding:' + u(pad) + ';gap:' + u(gap) + '">' + eyebrow(false) + t(tfs, tlh, twt, tl, '#171719') +
      (big ? fit(16, 24.8, '#46474c', H - used) : fit(12, 16.8, '#46474c', H - used)) + '</div></div>';
  };

  // ── D-Day — Views/DDayWidget.swift (2026-10-15: 그리드 · 포토 · 그라디언트 · 미니멀 바)
  // SplupDDayPalette: [background, accent, text, secondary]
  var DD_PAL = {
    purple: ['#F2E8FF', '#AA4AF4', '#582082', '#862FC6'], midnight: ['#421763', '#D6AEFF', '#F2E8FF', '#E5CEFF'],
    cyan: ['#D8F8FB', '#27E5F2', '#153E4B', '#153E4B'], pink: ['#FCE6F6', '#FA97E2', '#541E48', '#A83688'],
    apricot: ['#FFE7D9', '#FF925D', '#582C1B', '#582C1B'], coral: ['#FFE3EB', '#FF5488', '#5A1831', '#B92E5B'],
    yellow: ['#FFF9CE', '#F9F871', '#403E1B', '#403E1B'], lime: ['#EAF5CE', '#B0DE33', '#303F1C', '#303F1C']
  };
  function ddSpec(cw, ch) {
    function S(pad, title, number, date, o) {
      o = o || {};
      return { pad: pad, title: title, number: number, date: date, longDate: !!o.l, big: !!o.b, stacked: !!o.s, wide: !!o.w, grid: o.g || null, miniDots: o.n || 7, miniBar: o.mb || 40 };
    }
    if (cw === 2 && ch === 2) return S(8, 10, 24, null, { n: 5, mb: 28 });
    if (cw === 4 && ch === 2) return S(12, 12, 30, 10, { w: 1, n: 8 });
    if (cw === 6 && ch === 2) return S(12, 13, 34, 11, { w: 1, n: 10 });
    if (cw === 2) return S(8, 10, 24, 10, { s: 1, n: 6, mb: 32 });
    if (cw === 3 && ch === 3) return S(12, 12, 34, 10, { n: 7 });
    if (cw === 4 && ch === 3) return S(12, 13, 38, 11, { l: 1, n: 8 });
    if (cw === 3) return ch === 2 ? S(12, 12, 28, 10, { w: 1, n: 7 }) : S(12, 12, 36, 10, { n: 7 });   // 3×2 (drag only): the app's 3-column spec (number 36) does not fit two rows — shrunk here
    if (cw === 4 && ch === 4) return S(16, 14, 44, 11, { l: 1, b: 1, g: [8, 4, 10.2, 117, 48] });
    if (cw === 6 && ch === 4) return S(16, 15, 52, 12, { l: 1, b: 1, g: [10, 3, 8.3, 236, 31] });
    if (cw === 4) return S(16, 14, 48, 12, { l: 1, b: 1, g: [8, 8, 14.3, 133, 139] });
    if (cw === 6 && ch >= 8) return S(16, 18, 72, 13, { l: 1, b: 1, g: [10, 10, 17.7, 216, 202] });
    if (cw === 6 && ch === 3) return S(12, 14, 44, 11, { l: 1, n: 10 });   // 6×3 (drag only): the app's 6-column spec (number 64 + dot grid) does not fit three rows — compact here
    if (cw === 6) return S(16, 16, 64, 12, { l: 1, b: 1, g: [10, 7, 14.1, 217, 116] });
    // 5 columns (drag only): the app falls back to the 4-column spec, scaled by k
    var nc = Math.floor(Math.min(Math.max(cw, 2), 6) / 2) * 2, nh = Math.min(Math.max(ch, 2), 8);
    if (nc === cw && nh === ch) return S(12, 12, 34, 10, {});
    return ddSpec(nc, nh);
  }
  function dayNum(v) {   // 'YYYY-MM-DD' | Date | ms → whole local days
    var dt;
    if (isStr(v)) { var m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(v); if (!m) return null; dt = new Date(+m[1], +m[2] - 1, +m[3]); }
    else if (v instanceof Date) dt = new Date(v.getFullYear(), v.getMonth(), v.getDate());
    else if (typeof v === 'number' && isFinite(v)) { var x = new Date(v); dt = new Date(x.getFullYear(), x.getMonth(), x.getDate()); }
    else return null;
    return Math.round(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()) / 864e5);
  }
  function ddayModel(d) {
    var now = dayNum(d.now) !== null ? dayNum(d.now) : dayNum(new Date());
    var target = dayNum(d.date);
    if (target === null && typeof d.inDays === 'number') target = now + Math.round(d.inDays);
    var up = d.up === true, sign = 'D-Day', value = '';
    if (target !== null) {
      if (up) { var nu = now - target; if (nu >= 0) { sign = 'D+'; value = String(nu); } else { sign = 'D−'; value = String(-nu); } }
      else { var n = target - now; if (n !== 0) { sign = n > 0 ? 'D−' : 'D+'; value = String(Math.abs(n)); } }
    }
    var progress = 1, milestone = '';
    if (target !== null) {
      if (up) {
        var d0 = Math.max(0, now - target);
        var nx = Math.min((Math.floor(d0 / 100) + 1) * 100, (Math.floor(d0 / 365) + 1) * 365);
        var pv = Math.max(Math.floor(d0 / 100) * 100, Math.floor(d0 / 365) * 365);
        progress = (d0 - pv) / Math.max(1, nx - pv);
        milestone = nx + '일까지 ' + (nx - d0) + '일';
      } else {
        var st = dayNum(d.start), start = st !== null ? st : target - 30;
        progress = Math.min(1, Math.max(0, (now - start) / Math.max(1, target - start)));
      }
    }
    return { target: target, up: up, sign: sign, value: value, progress: progress, milestone: milestone };
  }
  function ddayTheme(d) { return d.theme === 'aqua' ? 'gradient' : ({ grid: 1, photo: 1, gradient: 1, bar: 1 })[d.theme] ? d.theme : 'bar'; }
  function ddayPal(d) { return DD_PAL[isStr(d.palette) && DD_PAL[d.palette] ? d.palette : 'purple']; }
  function ddayBg(d) {
    var theme = ddayTheme(d), p = ddayPal(d);
    if (theme === 'gradient' || (theme === 'photo' && !d.img)) return 'linear-gradient(to bottom right,' + p[0] + ',' + p[1] + ')';
    return p[0];
  }
  R.dday = function (w, W, H, d) {
    var M = ddayModel(d);
    if (!app()) {   // platter.py: 'D-n' 26 Bold serif italic #4a3f8f · title 11
      var lb = M.target === null || M.sign === 'D-Day' ? 'D-DAY' : (M.sign === 'D−' ? 'D-' + M.value : (+M.value > 365 ? '1년+' : 'D+' + M.value));
      return '<div class="dw-dd" style="gap:' + u(4) + '"><b style="font-size:' + u(lb.length <= 4 ? 26 : 21) + '">' + lb + '</b><span style="font-size:' + u(11) + '">' + esc(d.title) + '</span></div>';
    }
    var theme = ddayTheme(d), p = ddayPal(d), sp = ddSpec(w.w, w.h), k = Math.max(0.4, W / (47.25 * w.w - 8));
    var photo = theme === 'photo' && d.img ? d.img : null;
    var ink = photo ? '#fff' : fg(d, p[2]);
    var sub = photo ? '#fff' : fg(d, theme === 'grid' || theme === 'bar' ? p[3] : p[2]);
    var showProgress = (theme === 'grid' || theme === 'bar') && d.progress !== false;
    var showDate = sp.date !== null && (!sp.wide || theme === 'photo') && M.target !== null;
    function dateText(long) {
      if (M.target === null) return '';
      var dt = new Date(M.target * 864e5), y = dt.getUTCFullYear(), mo = ('0' + (dt.getUTCMonth() + 1)).slice(-2), da = ('0' + dt.getUTCDate()).slice(-2);
      return long ? y + '.' + mo + '.' + da : mo + '.' + da;
    }
    var fsN = sp.number * k;
    // .minimumScaleFactor: the number never runs past the tile — shrink it when the label is long
    var label = M.sign === 'D-Day' ? 'D-Day' : M.sign + M.value;
    var room = W - sp.pad * k * 2, need = (sp.stacked && M.sign !== 'D-Day' ? Math.max(2, M.value.length) : label.length) * fsN * 0.6;
    if (need > room) fsN = Math.max(fsN * 0.4, fsN * room / need);
    var count = M.sign === 'D-Day' ? '<b class="dw-dd-n" style="font-size:' + u(fsN) + '">D-Day</b>'
      : sp.stacked ? '<b class="dw-dd-n dw-stack" style="font-size:' + u(fsN) + '"><span>' + M.sign + '</span><span>' + M.value + '</span></b>'
      : '<b class="dw-dd-n" style="font-size:' + u(fsN) + ';gap:' + u(k) + '"><span>' + M.sign + '</span><span>' + M.value + '</span></b>';
    var title = trim(d.title);
    var head = '<span class="dw-dd-h" style="gap:' + u((sp.big ? 6 : 3) * k) + '">' +
      (title ? '<span class="dw-dd-t" style="font-size:' + u(sp.title * k) + ';line-height:' + u(sp.title * k * 1.3) + '">' + E(title) + '</span>' : '') + count + '</span>';
    function dateLabel(long) { return '<span class="dw-dd-d" style="font-size:' + u((sp.date || 10) * k) + ';color:' + sub + '">' + dateText(long) + '</span>'; }
    function bar(width, h) {
      return '<span class="dw-dd-bar" style="' + (width ? 'width:' + u(width) + ';flex:none;' : '') + 'height:' + u(h) + ';background:' + hexA(p[1], 0.18) + '"><i style="width:max(' + u(h) + ',' + (M.progress * 100).toFixed(2) + '%);background:' + p[1] + '"></i></span>';
    }
    function miniDots() {
      var n = sp.miniDots, on = Math.floor(n * M.progress) + (M.progress > 0 ? 1 : 0), o = '';
      for (var i = 0; i < n; i++) o += '<i style="width:' + u(4 * k) + ';height:' + u(4 * k) + ';background:' + (i < Math.min(on, n) ? p[1] : hexA(p[1], 0.18)) + '"></i>';
      return '<span class="dw-dd-dots" style="gap:' + u(3 * k) + '">' + o + '</span>';
    }
    function bigDots() {
      var g = sp.grid, n = g[0] * g[1], on = Math.round(n * M.progress), dd = g[2] * k;
      var hg = g[0] > 1 ? (g[3] * k - g[0] * dd) / (g[0] - 1) : 0, vg = g[1] > 1 ? (g[4] * k - g[1] * dd) / (g[1] - 1) : 0, rows = '';
      for (var r = 0; r < g[1]; r++) {
        var row = '';
        for (var c = 0; c < g[0]; c++) row += '<i style="width:' + u(dd) + ';height:' + u(dd) + ';background:' + (r * g[0] + c < on ? p[1] : hexA(p[1], 0.18)) + '"></i>';
        rows += '<span style="gap:' + u(Math.max(1, hg)) + '">' + row + '</span>';
      }
      return '<span class="dw-dd-grid" style="gap:' + u(Math.max(1, vg)) + ';margin-top:' + u(12 * k) + '">' + rows + '</span>';
    }
    var ms = M.up ? '<span class="dw-dd-d" style="font-size:' + u((sp.date || 11) * k) + ';color:' + sub + '">' + M.milestone + '</span>' : '';
    var footer = '';
    if (showProgress && sp.big) {
      if (theme === 'bar') footer = '<span class="dw-dd-col" style="gap:' + u(8 * k) + '">' + (showDate ? dateLabel(sp.longDate) : '') + bar(0, 4 * k) + ms + '</span>';
      else footer = '<span class="dw-dd-row">' + (showDate ? dateLabel(sp.longDate) : '') + '<span class="dw-grow"></span>' + ms + '</span>';
    } else if (showProgress) {
      var mark = theme === 'grid' ? miniDots() : bar(sp.miniBar * k, 3 * k);
      if (sp.stacked) footer = '<span class="dw-dd-col" style="gap:' + u((theme === 'grid' ? 8 : 6) * k) + '">' + (theme === 'grid' ? mark : '') + (showDate ? dateLabel(false) : '') + (theme === 'bar' ? mark : '') + '</span>';
      else if (showDate) footer = '<span class="dw-dd-row">' + dateLabel(sp.longDate) + '<span class="dw-grow"></span>' + mark + '</span>';
      else footer = mark;
    } else if (showDate) footer = dateLabel(sp.longDate);
    var inner;
    if (theme === 'photo') {
      var tail = sp.wide ? '<span class="dw-dd-row" style="align-items:flex-end">' + head + '<span class="dw-grow"></span>' + (showDate ? dateLabel(false) : '') + '</span>'
        : head + (showDate ? '<span style="margin-top:' + u(4 * k) + '">' + dateLabel(sp.longDate) + '</span>' : '');
      inner = (photo ? imgTag('dw-cover', photo) + '<span class="dw-dd-scrim"></span>' : '') + '<div class="dw-dd2 dw-photo" style="padding:' + u(sp.pad * k) + ';color:' + ink + '">' + tail + '</div>';
    } else {
      inner = '<div class="dw-dd2" style="padding:' + u(sp.pad * k) + ';color:' + ink + '">' + head + (showProgress && sp.big && theme === 'grid' ? bigDots() : '') + '<span class="dw-grow"></span>' + footer + '</div>';
    }
    return { html: inner, bg: ddayBg(d) };
  };

  // ── To-do — Views/TodoWidget.swift TodoTile (2026-10-11). No N/M numbers: the record is colour badges only.
  var TODO_FILL = { pink: '#F0589F', blue: '#3D8BF2', green: '#2EB67D', cocoa: '#A2704C', purple: '#AA4AF4' };
  var TODO_TONAL = { pink: '#FFEAF3', blue: '#E8F1FF', green: '#E3F7EC', cocoa: '#F5EBE3', purple: '#F2E8FF' };
  var TODO_INK = { pink: '#C93A7E', blue: '#2465C4', green: '#18815A', cocoa: '#7E5235', purple: '#862FC6' };
  var TODO_KEYS = ['pink', 'blue', 'green', 'cocoa', 'purple'];
  var TODO_BOX = '#F3F0F7';   // TodoInk.box = Gray 100
  function tdKey(k) { return TODO_FILL[k] ? k : 'purple'; }
  R.todo = function (w, W, H, d) {
    if (!app()) return centred('✨', d.title || 'To-do', null, 6, 30, 13);   // platter.py has no To-do renderer (generic tile)
    var cats = (Array.isArray(d.cats) ? d.cats : []).map(function (c) { return { id: String(c.id), name: String(c.name || ''), color: tdKey(c.color) }; });
    var items = (Array.isArray(d.items) ? d.items : []).map(function (it) { return { text: String(it.text || ''), done: it.done === true, cat: isStr(it.cat) ? it.cat : null }; });
    var known = cats.map(function (c) { return c.id; });
    function sections(includeEmpty) {
      var loose = items.filter(function (it) { return !it.cat || known.indexOf(it.cat) < 0; }), out = [];
      if (loose.length || !cats.length) out.push({ name: '할 일', color: 'purple', items: loose });
      cats.forEach(function (c) {
        var its = items.filter(function (it) { return it.cat === c.id; });
        if (includeEmpty || its.length) out.push({ name: c.name, color: c.color, items: its });
      });
      return out;
    }
    function colorOf(cat) { for (var i = 0; i < cats.length; i++) if (cats[i].id === cat) return cats[i].color; return 'purple'; }
    var secs = sections(true), pad = 12, compact = H < 150;
    var ordered = [].concat.apply([], secs.map(function (s) { return s.items; }));
    var open = ordered.filter(function (it) { return !it.done; });
    function checkbox(done, key, size) {
      return '<i class="dw-td-cb" style="width:' + u(size) + ';height:' + u(size) + ';border-radius:' + u(size * 0.3) + ';background:' + (done ? TODO_FILL[key] : TODO_BOX) + '">' + (done ? CHECK : '') + '</i>';
    }
    function row(it) {
      return '<span class="dw-td-r" style="gap:' + u(6) + ';height:' + u(16) + '">' + checkbox(it.done, colorOf(it.cat), 13) + '<span style="font-size:' + u(11) + '">' + E(it.text) + '</span></span>';
    }
    var keys = secs.map(function (s) { return s.color; }).concat(TODO_KEYS).slice(0, 4), gd = 12 * 0.42, gg = 12 - gd * 2;
    var dots = '<span class="dw-td-g" style="width:' + u(12) + ';height:' + u(12) + ';gap:' + u(gg) + '">' + keys.map(function (k) { return '<i style="width:' + u(gd) + ';height:' + u(gd) + ';background:' + TODO_FILL[k] + '"></i>'; }).join('') + '</span>';
    var right = '';
    if (compact && W > 240 && open.length) right = E(open[0].text + (open.length > 1 ? ' 외 ' + (open.length - 1) : ''));
    else if (compact && open.length > (H >= 125 ? 2 : (H >= 110 ? 1 : 0))) right = '남은 ' + open.length;
    var header = '<span class="dw-td-h" style="gap:' + u(6) + ';height:' + u(16) + '">' + dots + '<b style="font-size:' + u(13) + '">' + E(d.title || 'To-do') + '</b>' +
      (right ? '<span class="dw-grow" style="min-width:' + u(4) + '"></span><em style="font-size:' + u(11) + '">' + right + '</em>' : '') + '</span>';
    function strip7() {
      var today = typeof d.today === 'number' ? Math.max(0, Math.min(6, Math.round(d.today))) : new Date().getDay();
      var week = Array.isArray(d.week) ? d.week : [], size = Math.min(17, (W - pad * 2) / 7 - 1), out = '';
      for (var i = 0; i < 7; i++) {
        var ks = (Array.isArray(week[i]) ? week[i] : []).map(tdKey).slice(0, 4), blob;
        if (!ks.length) blob = '<i class="dw-td-e" style="width:' + u(size * 0.8) + ';height:' + u(size * 0.8) + ';border-radius:' + u(size * 0.34) + (i > today ? ';opacity:.6' : '') + '"></i>';
        else {
          var bs = size * [0, 0.74, 0.62, 0.56, 0.52][ks.length];
          var off = [[[0, 0]], [[-0.17, -0.1], [0.17, 0.1]], [[0, -0.18], [-0.2, 0.14], [0.2, 0.14]], [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]][ks.length - 1];
          blob = ks.map(function (k, j) {
            return '<i class="dw-td-b" style="width:' + u(bs) + ';height:' + u(bs) + ';background:' + TODO_FILL[k] + ';box-shadow:0 0 0 ' + u(Math.max(1, size * 0.045)) + ' #fff;transform:translate(calc(-50% + ' + u(off[j][0] * size) + '),calc(-50% + ' + u(off[j][1] * size) + '))">' + CHECK + '</i>';
          }).join('');
        }
        var wc = i === today ? '#171719' : i === 0 ? '#922346' : i === 6 ? '#00539A' : '#989ba2';   // today · Sun = status danger · Sat = status info
        out += '<span class="dw-td-d' + (i === today ? ' dw-on' : '') + '" style="padding:' + u(2) + ' 0"><b style="font-size:' + u(9) + ';color:' + wc + (i === today ? ';font-weight:700' : '') + '">' + '일월화수목금토'[i] + '</b><span class="dw-td-bl" style="width:' + u(size) + ';height:' + u(size) + '">' + blob + '</span></span>';
      }
      return '<span class="dw-td-w" style="height:' + u(32) + '">' + out + '</span>';
    }
    var body = '';
    if (compact) {
      body = strip7();
      if (H >= 110) {
        if (!open.length) body += '<span class="dw-td-m" style="font-size:' + u(11) + ';line-height:1.3;color:#46474c">' + (items.length ? '오늘 할 일을 다 했어요' : '할 일을 적어 보세요') + '</span>';
        else body += '<span class="dw-td-l" style="gap:' + u(5) + '">' + open.slice(0, H >= 125 ? 2 : 1).map(row).join('') + '</span>';
      }
    } else {
      var showStrip = H >= 160, budget = H - pad * 2 - 16 - 8 - (showStrip ? 34 : 0), gap = 6, entries = [];
      sections(false).forEach(function (s) { entries.push({ chip: s, h: 20 }); s.items.forEach(function (it) { entries.push({ item: it, h: 16 }); }); });
      var fitE = function (bud) {
        var used = 0, o = [];
        for (var i = 0; i < entries.length; i++) { var need = entries[i].h + (o.length ? gap : 0); if (used + need > bud) break; used += need; o.push(entries[i]); }
        if (o.length && o[o.length - 1].chip) o.pop();
        return o;
      };
      var nItems = function (l) { return l.filter(function (e) { return e.item; }).length; };
      var total = nItems(entries), fitted = fitE(budget);
      if (nItems(fitted) < total) fitted = fitE(budget - 16 - gap);
      var hidden = total - nItems(fitted);
      if (!fitted.length) body = '<span class="dw-td-m" style="font-size:' + u(11) + ';line-height:1.3;color:#989ba2">할 일을 적어 보세요</span>';
      else {
        body = '<span class="dw-td-l" style="gap:' + u(gap) + '">' + fitted.map(function (e) {
          if (e.chip) return '<span class="dw-td-c" style="height:' + u(20) + '"><b style="font-size:' + u(10) + ';padding:0 ' + u(7) + ';height:' + u(18) + ';background:' + TODO_TONAL[e.chip.color] + ';color:' + TODO_INK[e.chip.color] + '">' + E(e.chip.name) + '</b></span>';
          return row(e.item);
        }).join('');
        if (hidden > 0) {
          var allDone = items.length && items.every(function (it) { return it.done; });
          body += '<span class="dw-td-m" style="font-size:' + u(11) + ';line-height:' + u(16) + ';color:' + (allDone ? '#46474c' : '#989ba2') + '">' + (allDone ? '모두 완료 · ' + items.length + '개' : '+' + hidden + '개 더') + '</span>';
        }
        body += '</span>';
      }
      body += '<span class="dw-grow"></span>' + (showStrip ? strip7() : '');
    }
    return '<div class="dw-td" style="padding:' + u(pad) + ';gap:' + u(8) + '">' + header + body + '</div>';
  };

  // ── 소셜 — WidgetContent.socialView: title 17 Bold (2 cols: 15) + InstagramBadge 20
  R.social = function (w, W, H, d) {
    var wide = w.w >= 3, fs = wide ? 17 : 15, label = trim(d.label);
    if (!wide) { var tw = textW(label, fs, 700), room = W - 24; if (tw > room) fs = Math.max(fs * 0.7, fs * room / tw); }   // minimumScaleFactor(0.7), one line
    var badge = Math.min(25, Math.max(16, Math.min(W, H) / 7));
    return (d.img ? imgTag('dw-cover', d.img) : '') + '<span class="dw-so-shade"></span>' +
      '<p class="dw-so-t" style="font-size:' + u(fs) + ';line-height:1.25;padding:' + u(wide ? 14 : 10) + ' ' + u(12) + ' 0;-webkit-line-clamp:' + (wide ? 2 : 1) + ';color:' + fg(d, '#fff') + (wide ? '' : ';white-space:nowrap') + '">' + E(label) + '</p>' +
      '<img class="dw-so-ig" src="/assets/cast/shared/instagram.svg" alt="" style="right:' + u(wide ? 14 : 8) + ';bottom:' + u(wide ? 12 : 7) + ';width:' + u(badge) + ';height:' + u(badge) + '">';
  };

  // ── 스티커 보드 — Views/StickerBoard.swift StickerBoardTile (Figma Splup/Widget/StickerBoard)
  R.sticker = function (w, W, H, d) {
    var st = styleOf(d), dots = Array.isArray(d.stickers) ? d.stickers : [];
    var custom = hexOk(st.bg);
    var out = '<span class="dw-sb' + (custom ? '' : ' dw-paper') + '"' + (custom ? ' style="background:' + st.bg + '"' : '') + '></span>';
    if (!dots.length) {
      var compact = w.w <= 2, ms = Math.min(58, Math.min(W, H) * 0.34);
      return out + '<div class="dw-sb-empty" style="gap:' + u(compact ? 6 : 8) + '">' +
        '<span class="dw-sb-mark" style="width:' + u(ms) + ';height:' + u(ms) + ';border-width:' + u(Math.max(1.5, ms * 0.054)) + '"><i>' + MARK + '</i></span>' +
        '<span class="dw-sb-txt" style="gap:' + u(4) + '"><b style="font-size:' + u(compact ? 10 : 12) + ';line-height:1.42">' + (compact ? '스티커 보드' : '친구가 채울 스티커 보드') + '</b>' +
        (w.h >= 4 && w.w >= 3 ? '<span style="font-size:' + u(10) + ';line-height:1.4">아직 붙여진 스티커가 없어요</span>' : '') + '</span></div>';
    }
    var k = Math.min(1.2, Math.max(0.3, Math.min(W, H * 1.6) / 370 * 1.9));
    dots.forEach(function (s) {
      if (!s || (!s.img && !s.e)) return;
      var size = (s.img ? (s.big ? 88 : 72) : 52) * (typeof s.s === 'number' ? s.s : 1) * k;
      var half = Math.min(size * 0.5, Math.min(W, H) * 0.5);
      var x = Math.min(Math.max(W * (+s.x || 0), half), W - half), y = Math.min(Math.max(H * (+s.y || 0), half), H - half);
      out += '<i class="dw-sb-s" style="left:' + (x / W * 100).toFixed(2) + '%;top:' + (y / H * 100).toFixed(2) + '%;width:' + u(size) + ';height:' + u(size) + ';--r:' + (+s.r || 0).toFixed(1) + 'deg' + (s.img ? '' : ';font-size:' + u(size * 0.82)) + '">' +
        (s.img ? imgTag('', s.img) : esc(s.e)) + '</i>';
    });
    return out;
  };

  // ── Together — Views/TogetherBooth.swift TogetherBoothTile · BoothStripView(compact)
  R.together = function (w, W, H, d) {
    var shots = Array.isArray(d.shots) ? d.shots.slice(0, 4) : [];
    if (!shots.length) {
      return '<div class="dw-tg-empty" style="gap:' + u(6) + '"><i style="width:' + u(28) + ';height:' + u(24) + '">' + BOOTH + '</i><b style="font-size:' + u(14) + '">Together</b><span style="font-size:' + u(11) + '">친구와 네컷 찍기</span></div>';
    }
    var row = d.layout ? d.layout === 'row' : w.w > w.h, frame = hexOk(d.frame) ? d.frame : '#FFFFFF';
    var pad = 4, gap = 3, cw, ch;
    var iw = W - 16 - pad * 2, ih = H - 16 - pad * 2;
    if (row) { cw = (iw - gap * 3) / 4; ch = Math.min(ih, cw * 4 / 3); cw = ch * 3 / 4; }    // four portrait cuts side by side
    else { ch = (ih - gap * 3) / 4; cw = Math.min(iw, ch * 4 / 3); ch = cw * 3 / 4; }        // four landscape cuts stacked
    var cells = '';
    for (var i = 0; i < 4; i++) cells += '<span class="dw-tg-cell" style="width:' + u(cw) + ';height:' + u(ch) + ';border-radius:' + u(2) + '">' + (shots[i] ? imgTag('', shots[i]) : '') + '</span>';
    var out = '<div class="dw-tg"><span class="dw-tg-strip' + (row ? ' dw-row' : '') + (frame.toUpperCase() === '#FFFFFF' ? ' dw-line' : '') + '" style="padding:' + u(pad) + ';gap:' + u(gap) + ';border-radius:' + u(6) + ';background:' + frame + '">' + cells + '</span></div>';
    var tagged = (Array.isArray(d.tagged) ? d.tagged : []).filter(isStr);
    if (tagged.length) out += '<span class="dw-tg-with" style="right:' + u(6) + ';bottom:' + u(6) + ';height:' + u(18) + ';padding:0 ' + u(6) + ';font-size:' + u(11) + '"><span>with ' + esc(tagged.join(', ')) + '</span></span>';
    return out;
  };

  // ── GIF — WidgetContent.gifView
  function memeImage(d) {
    return '<picture class="dw-meme' + (d.fit === 'cover' ? ' dw-meme-fill' : '') + '"><source media="(prefers-reduced-motion: reduce)" srcset="' + esc(d.still || d.img) + '">' + imgTag('', d.img) + '</picture>';
  }
  R.gif = function (w, W, H, d) {
    if (d.meme) return memeImage(d);
    if (d.img) return imgTag('dw-cover', d.img);
    return '<div class="dw-ss dw-gf" style="gap:' + u(5) + '"><span style="font-size:' + u(28) + '">' + esc(d.emoji) + '</span><span class="dw-sub" style="font-size:' + u(11) + '">GIF</span></div>';
  };

  // LP sleeves use the app's TasteShelf vinyl footprint: one square jacket plus the exposed disc.
  function recordLayout(width, height, count, gap) {
    var best = { side: 0, cols: 1 };
    for (var cols = 1; cols <= count; cols++) {
      var rows = Math.ceil(count / cols);
      var side = Math.min((width - gap * (cols - 1)) / (1.32 * cols), (height - gap * (rows - 1)) / rows);
      if (side > best.side) best = { side: side, cols: cols };
    }
    return best;
  }
  R.playlist = function (w, W, H, d) {
    var songs = (Array.isArray(d.songs) ? d.songs : String(d.text || '').split('\n'))
      .map(function (song) { return isStr(song) ? {title: song} : song; })
      .filter(function (song) { return song && trim(song.title); });
    var area = w.w * w.h, pad = area <= 4 ? 12 : area <= 12 ? 16 : area <= 24 ? 20 : 24;
    var showTitle = W >= 120 && H >= 120, gap = 4, width = W - 2 * pad, height = H - 2 * pad - (showTitle ? 24 : 0);
    var count = Math.min(songs.length, 10), grid = recordLayout(width, height, count, gap);
    while (count > 1 && grid.side < 30) grid = recordLayout(width, height, --count, gap);
    var title = trim(d.title) || '플레이리스트';
    var heading = showTitle ? '<b class="dw-lp-heading">' + esc(title) + '</b>' : '';
    var rows = songs.slice(0, count).map(function (song, i) {
      var sleeve = trim(song.art) ? imgTag('', song.art) : '<span class="dw-lp-type">' + esc(song.title) + '</span>';
      return '<li aria-label="' + esc(song.title) + '" title="' + esc(song.title) + '"><span class="dw-lp-jacket">' +
        sleeve + '</span><b class="dw-lp-rank" aria-hidden="true">' + (i + 1) + '</b></li>';
    }).join('');
    return '<div class="dw-lp" style="padding:' + u(pad) + ';--side:' + u(grid.side) + ';--cols:' + grid.cols + '">' + heading +
      (count ? '<ol aria-label="' + esc(title) + '">' + rows + '</ol>' : '<span class="dw-lp-empty">아직 담은 곡이 없어요</span>') + '</div>';
  };

  // ── kinds outside the launch set (ported from scripts/platter.py) ──
  R.mood = function (w, W, H, d) {
    var text = trim(d.text);
    return '<div class="dw-md" style="padding:0 ' + u(14) + ';gap:' + u(10) + '"><span class="dw-md-e" style="font-size:' + u(28) + '">' + esc(d.emoji || '😊') + '</span>' +
      '<span class="dw-md-col" style="gap:' + u(3) + '"><b style="font-size:' + u(14) + ';line-height:' + u(19) + '">' + E(text || '오늘 기분을 남겨보세요') + '</b><span style="font-size:' + u(11) + '">오늘의 기분</span></span></div>';
  };
  R.diary = function (w, W, H, d) {
    var text = trim(d.text), date = trim(d.date);
    return '<div class="dw-dy" style="padding:' + u(12) + ';gap:' + u(6) + '"><p class="dw-dy-k" style="font-size:' + u(11) + '"><span>한줄일기</span>' + (date ? '<span>' + esc(date) + '</span>' : '') + '</p>' +
      '<p class="dw-dy-t" style="font-size:' + u(14) + ';line-height:' + u(25) + ';-webkit-line-clamp:' + Math.max(1, Math.floor((H - 24 - 20) / 25)) + '">' + E(text || '오늘을 한 줄로 남겨보세요') + '</p></div>';
  };
  R.place = function (w, W, H, d) {
    return '<div class="dw-ss" style="gap:' + u(4) + ';color:' + fg(d, '#1f5c4d') + '"><span style="font-size:' + u(22) + '">📍</span><b style="font-size:' + u(13) + ';color:inherit">' + esc(d.label) + '</b><span class="dw-sub" style="font-size:' + u(11) + '">' + esc(d.title || '동네') + '</span></div>';
  };
  R.weather = function (w, W, H, d) { return centred(d.emoji || '☀️', d.title, d.label, 3, 28, 16, 'dw-wt'); };
  R.voice = function (w, W, H, d) {
    var bars = [6, 12, 18, 9, 15, 7, 13, 10].map(function (h) { return '<i style="height:' + u(h) + '"></i>'; }).join('');
    return '<div class="dw-vo" style="gap:' + u(8) + '"><span class="dw-vo-bars" style="gap:' + u(2.5) + '">' + bars + '</span><span class="dw-vo-t" style="font-size:' + u(11) + ';gap:' + u(5) + '"><i>▶</i>' + esc(d.label || '0:12') + '</span></div>';
  };
  R.nowplaying = function (w, W, H, d) {
    var bars = [9, 15, 6, 12].map(function (h) { return '<i style="height:' + u(h) + '"></i>'; }).join('');
    return '<div class="dw-np dw-live" style="padding:0 ' + u(14) + ';gap:' + u(11) + '"><span class="dw-np-bars" style="gap:' + u(2.5) + ';height:' + u(16) + '">' + bars + '</span>' +
      '<span class="dw-np-col" style="gap:' + u(3) + '"><b style="font-size:' + u(14) + ';line-height:' + u(19) + '">' + esc(d.title) + '</b><span style="font-size:' + u(11) + '">' + esc(d.artist) + ' · 지금 듣는 중</span></span></div>';
  };
  R.collection = function (w, W, H, d) {
    var titles = (Array.isArray(d.items) ? d.items : String(d.text || '').split('\n')).filter(function (t) { return trim(t); }).slice(0, 6);
    var emojis = ['🎬', '📀', '📚', '🍿', '🎞', '📖'];
    var cards = titles.map(function (t, i) { return '<span class="dw-cl-c" style="border-radius:' + u(7) + ';gap:' + u(2) + '"><i style="font-size:' + u(17) + '">' + emojis[i % 6] + '</i><b style="font-size:' + u(11) + '">' + esc(t) + '</b></span>'; }).join('');
    return '<div class="dw-cl" style="padding:' + u(12) + ';gap:' + u(7) + '"><p style="font-size:' + u(11) + '">' + esc(d.title || '취향 콜렉션') + '</p><div class="dw-cl-g" style="gap:' + u(5) + '">' + cards + '</div></div>';
  };
  function flipBox(frames, cls) {
    if (!frames.length) return '<div class="' + cls + ' dw-empty"><i style="width:' + u(20) + ';height:' + u(20) + '">' + CAMERA + '</i></div>';
    return '<div class="' + cls + '">' + imgTag('', frames[0]) + (frames.length > 1 ? '<span class="dw-fl-count">1/' + frames.length + '</span>' : '') + '</div>';
  }
  function framesOf(d) {
    var refs = (Array.isArray(d.frames) ? d.frames : []).filter(isStr);
    if (isStr(d.img) && d.img && refs.indexOf(d.img) < 0) refs.unshift(d.img);
    return refs;
  }
  R.vintageCamera = function (w, W, H, d) {
    return serviceTile(W, H, '빈티지 카메라', d.title || '느린 주말', '빈티지 앨범 보기', imgTag('dw-vintage-camera', '/assets/cast/objects/vintage-camera.webp'));
  };
  R.polaroid = function (w, W, H, d) {
    var frames = framesOf(d), cap = trim(d.caption);
    return serviceTile(W, H, '폴라로이드', frames.length ? '폴라로이드' : '첫 장을 남겨봐', cap || '한 장의 순간', '<div class="dw-pol">' + flipBox(frames, 'dw-pol-photo') + '<div class="dw-pol-chin"></div></div>');
  };
  R.paparazzi = function (w, W, H, d) {
    return serviceTile(W, H, '파파라치', d.title || '친구가 담은 나', d.by ? 'photo by. ' + d.by : '친구의 시선으로 남은 순간', '<div class="dw-pap">' + flipBox(framesOf(d), 'dw-pap-photo') + '</div>');
  };
  R.ask = function (w, W, H, d) {
    var title = d.text || '뭐든 물어봐', inset = Math.min(16, Math.max(8, W * 0.065));
    var art = '<img class="dw-ask-art" src="' + ASK_ART + '" alt="" draggable="false">';
    var preview = '<p class="dw-ask-q" style="font-size:' + u(11) + ';padding:' + u(6) + ' ' + u(7) + ';border-radius:' + u(8) + '">궁금한 걸 이름 없이 물어보세요</p>';
    if (W / Math.max(H, 1) >= 1.7) {
      return '<div class="dw-ask dw-ask-h" style="padding:' + u(inset) + ';gap:' + u(8) + '"><div style="width:' + u(Math.min(H * 0.9, W * 0.3)) + '">' + art + '</div><div class="dw-ask-col" style="gap:' + u(4) + '">' +
        '<p class="dw-ask-k" style="font-size:' + u(9) + '">ASK</p><p class="dw-ask-t" style="font-size:' + u(Math.min(18, Math.max(12, W * 0.055))) + '">' + esc(title) + '</p>' + preview + '</div></div>';
    }
    return '<div class="dw-ask" style="padding:' + u(inset) + ';gap:' + u(H >= 160 ? 5 : 3) + '">' + (H >= 160 ? '<p class="dw-ask-k" style="font-size:' + u(10) + '"><span>ASK</span>' + ARROW + '</p>' : '') +
      '<div class="dw-ask-artbox" style="height:' + u(Math.max(35, Math.min(H * 0.38, W * 0.64))) + '">' + art + '</div>' +
      '<p class="dw-ask-t" style="font-size:' + u(Math.min(23, Math.max(13, W * 0.115))) + ';-webkit-line-clamp:' + (W < 130 ? 2 : 1) + '">' + esc(title) + '</p><span class="dw-grow"></span>' + preview +
      (H >= 220 ? '<p class="dw-ask-a" style="font-size:' + u(10) + '">익명으로 질문하기</p>' : '') + '</div>';
  };

  // ── 디토 위젯 (가져온 사본) — Views/DittoWidgetTile.swift · DittoWidgetLayout.of
  function dittoLayout(ww, hh) {   // [source variant, badge side, edge inset]
    if (ww >= 6 && hh >= 6) return ['caption', 32, 12];
    if (ww >= 4 && hh >= 4 && Math.max(ww, hh) >= 6) return ['standard', 32, 12];
    if (ww >= 4 && hh >= 4) return ['standard', 24, 8];
    if (ww <= 2) return [hh >= 4 ? 'narrow' : 'none', 24, 8];
    if (hh <= 2) return [ww >= 6 ? 'compact' : 'text', 24, 8];
    return ['compact', 24, 8];
  }
  R.ditto = function (w, W, H, d) {
    var lay = dittoLayout(w.w, w.h), kind = lay[0], badge = lay[1], inset = lay[2];
    var srcH = { text: 24, compact: 28, standard: 32, narrow: 44 }[kind] || 0;
    var mediaH = kind === 'none' ? H : kind === 'caption' ? Math.max(H * 0.5, H - 96) : Math.max(H * 0.55, H - srcH - inset);
    var src = w.source && typeof w.source === 'object' ? w.source : null;
    var handle = src ? (trim(src.handle) ? '@' + trim(src.handle).replace(/^@+/, '') : trim(src.name)) : '';
    var photo = isStr(d.img) && d.img ? d.img : null, media;
    if (photo) media = imgTag('dw-cover', photo) + '<span class="dw-soft"></span>';
    else if (d.emoji) media = '<span class="dw-dt-emoji" style="height:' + u(mediaH) + ';font-size:' + u(Math.min(W, H) * 0.42) + '">' + esc(d.emoji) + '</span>';
    else media = '<span class="dw-dt-title" style="height:' + u(mediaH) + ';font-size:' + u(Math.min(W, H) >= 120 ? 17 : 14) + ';padding:0 ' + u(inset + 4) + '">' + esc(d.title || d.text || '디토 위젯') + '</span>';
    function avatar(av) {
      var st = 'width:' + u(av) + ';height:' + u(av) + ';border-radius:' + u(av / 3);
      return src && src.avatar ? imgTag('dw-dt-av', src.avatar, ' style="' + st + '"') : '<i class="dw-dt-av" style="' + st + '"></i>';
    }
    var chip = '';
    if (handle && kind === 'text') {
      chip = '<span class="dw-dt-src" style="left:' + u(inset) + ';bottom:' + u(inset) + ';width:' + u(Math.min(70, W - inset * 2)) + ';height:' + u(24) + ';padding:0 ' + u(6) + ';border-radius:' + u(8) + ';font-size:' + u(12) + ';line-height:' + u(16) + '"><b>' + esc(handle) + '</b></span>';
    } else if (handle && kind === 'narrow') {
      chip = '<span class="dw-dt-src dw-dt-src-n" style="left:' + u(inset) + ';right:' + u(inset) + ';bottom:' + u(inset) + ';height:' + u(44) + ';padding:0 ' + u(6) + ';gap:' + u(2) + ';border-radius:' + u(8) + ';font-size:' + u(12) + ';line-height:' + u(16) + '">' + avatar(20) + '<b>' + esc(handle) + '</b></span>';
    } else if (handle && (kind === 'compact' || kind === 'standard')) {
      var std = kind === 'standard';
      chip = '<span class="dw-dt-src" style="left:' + u(inset) + ';bottom:' + u(inset) + ';width:' + u(Math.min(std ? 132 : 108, W - inset * 2)) + ';height:' + u(std ? 32 : 28) + ';padding:0 ' + u(6) + ';gap:' + u(6) + ';border-radius:' + u(8) + ';font-size:' + u(std ? 14 : 12) + ';line-height:' + u(std ? 20 : 16) + '">' + avatar(std ? 24 : 20) + '<b>' + esc(handle) + '</b></span>';
    } else if (handle && kind === 'caption') {
      var cap = trim(d.caption) || trim(d.title);
      chip = '<span class="dw-dt-cap' + (photo ? ' dw-on' : '') + '" style="padding:' + u(24) + ' ' + u(16) + ' ' + u(12) + ';gap:' + u(8) + '">' + (cap ? '<b style="font-size:' + u(17) + ';line-height:' + u(24) + '">' + esc(cap) + '</b>' : '') +
        '<span style="gap:' + u(8) + ';font-size:' + u(14) + ';line-height:' + u(20) + '">' + avatar(24) + esc(handle) + '</span></span>';
    }
    var b = src ? '<img class="dw-dt-badge" src="' + BADGE_SRC + '" alt="" draggable="false" style="top:' + u(inset) + ';right:' + u(inset) + ';width:' + u(badge) + ';height:' + u(badge) + '">' : '';
    return media + chip + b;
  };

  var TYPE_NAMES = { steps: '걸음 수', qna: '오늘의 질문', ghost: '고스트', bucket: '버킷리스트', poke: '콕 찌르기', secret: '비밀', vintageCamera: '빈티지 카메라' };
  function generic(w, W, H, d) {
    if (d.img) return imgTag('dw-cover', d.img) + '<span class="dw-soft"></span>';
    return centred(d.emoji || '✨', d.title || d.text || d.label || TYPE_NAMES[w.kind] || '위젯', null, 6, 30, 13);
  }

  // ───────────────────────── box rules ─────────────────────────

  // AppState.widgetBg — style.bg wins when present
  var BG = { vintageCamera: '#fff', block: '#fff', todo: '#fff', video: '#1C1722', sticker: '#FAF9FC',
    polaroid: '#fff', paparazzi: '#fff', ask: '#fff', ditto: '#e9d8f5', image: '#e7e4ee', status: '#fff',
    mood: '#f1e3a7', text: '#f3eefb', guestbook: '#fff', qna: '#fff', diary: '#d7e39d', dday: '#F2E8FF',
    nowplaying: '#141317', place: '#b8e9df', weather: 'linear-gradient(#d7effe,#d1e2fd 33%,#bfcdf6 68%,#a0c6f1 84%,#d8e7f9)',
    voice: '#fdf1d7', gif: '#f1e3a7', collection: '#1d1e24', playlist: '#f5f3ef',
    social: 'radial-gradient(circle at 27% 108%,#ffdd55 0,#ffdd55 8.4cqw,#ff543e 41.9cqw,#c837ab 83.8cqw)',   // DGrad.instagram (radius 300)
    together: 'linear-gradient(to bottom right,#F1EAFF,#E4D8FB)' };
  // scripts/platter.py BG (look 'web')
  var BG_WEB = { block: 'rgba(112,115,124,.08)', todo: '#f1eaff', video: 'linear-gradient(225deg,#3a4a63,#24304a 50%,#161d2e)', dday: '#d9d4f9' };

  function kindOf(w) { return w && w.source ? 'ditto' : (w && isStr(w.kind) ? w.kind : ''); }
  function dataOf(w) { return w && w.data && typeof w.data === 'object' ? w.data : {}; }
  function dims(w) {
    var cw = Math.max(1, Math.round(+w.w || 1)), ch = Math.max(1, Math.round(+w.h || 1));
    return { w: cw, h: ch };
  }
  // 앱 Grid.radius (GridEngine.swift 37-39 · Atomic.swift 23-29): 12 + (짧은 변 − 2) × 2 를 20에서 멈추고 8·12·16·20·28 단계에 맞춘다. 음악은 28.
  function radius(w) {
    if (kindOf(w) === 'music') return 28;
    var s = dims(w), raw = Math.min(20, 12 + (Math.min(s.w, s.h) - 2) * 2), steps = [8, 12, 16, 20, 28], best = steps[0];
    for (var i = 0; i < steps.length; i++) if (Math.abs(steps[i] - raw) <= Math.abs(best - raw)) best = steps[i];
    return best;
  }
  function background(w) {
    var k = kindOf(w), d = dataOf(w);
    if (k === 'music') return musicBg(d);
    if (k === 'dday' && app()) return ddayBg(d);
    var st = styleOf(d);
    if (hexOk(st.bg) && k !== 'ditto') return st.bg;
    if (!app() && BG_WEB[k]) return BG_WEB[k];
    return BG[k] || '#f1eaff';
  }
  /** design px at 358. border = 1px line drawn over the content edge (not ditto-able); glow = halo behind (open for ditto). */
  function limitAvailable(widgets, used) {
    var count = used || 0;
    return widgets.map(function (w) {
      if (!w.ditto) return w;
      if (!w.priv && !w.source && DITTOABLE[w.kind] && count < 3) { count++; return w; }
      return Object.assign({}, w, {ditto:false});
    });
  }
  function boxStyle(w) {
    var k = kindOf(w);
    var open = !!(w && w.ditto === true && !w.source && DITTOABLE[k]);
    return {
      radius: radius(w),
      background: background(w),
      border: open || k === 'music' ? null : { width: 1, color: '#E7E1EE' },     // music draws its own 1px #C8C9CE inside
      glow: open ? { x: 0, y: 0, blur: 16, spread: 3, color: 'rgba(170,74,244,.30)' } : null
    };
  }

  // ───────────────────────── public ─────────────────────────

  function build(w) {
    var k = kindOf(w), d = dataOf(w), s = dims(w);
    var ww = { kind: k, w: s.w, h: s.h, source: w.source || null };
    var W = s.w * UNIT - GUT, H = s.h * UNIT - GUT, res;
    try { res = (R[k] || generic)(ww, W, H, d); } catch (e) { res = generic(ww, W, H, {}); }
    if (isStr(res)) res = { html: res };
    res.cls = 'dw-c dw-k-' + (/^[a-zA-Z]+$/.test(k) ? k : 'x') + (res.cls ? ' ' + res.cls : '');
    return res;
  }
  var seq = 0;
  function draw(el, w) {
    fontMiss = [];
    var look = config.look, res = build(w), miss = fontMiss, id = ++seq;
    fontMiss = null;
    el.className = res.cls;
    el.innerHTML = res.html;
    el.__dw = id;
    if (miss.length) {
      // A line count was measured before Pretendard arrived. Once it has, measure again and redraw only if the markup changes.
      Promise.all(miss.map(function (m) {
        return Promise.all([document.fonts.load(m[0] + ' "Pretendard Variable"', m[1]), document.fonts.load(m[0] + ' "Pretendard"', m[1])]);
      })).then(function () {
        if (el.__dw !== id) return;
        var prev = config.look; config.look = look;
        var again; try { again = build(w); } finally { config.look = prev; }
        if (again.html !== res.html) { el.className = again.cls; el.innerHTML = again.html; }
      }, function () { /* font failed to load: keep the fallback measure */ });
    }
    return el;
  }
  function render(w) { return draw(document.createElement('div'), w || {}); }
  function update(el, w) { if (el) draw(el, w || {}); }

  function applyBox(el, w) {
    var b = boxStyle(w), k = kindOf(w);
    el.className = el.className.split(/\s+/).filter(function (c) { return c && c !== 'dw' && c.indexOf('dw-') !== 0; })
      .concat(['dw', 'dw-' + (/^[a-zA-Z]+$/.test(k) ? k : 'x')], b.glow ? ['dw-glow'] : b.border ? ['dw-hl'] : []).join(' ');
    el.style.borderRadius = u(b.radius);
    el.style.background = b.background;
    return el;
  }
  function rect(w) {
    var s = dims(w);
    return { x: (+w.x || 0) * UNIT, y: (+w.y || 0) * UNIT, w: s.w * UNIT - GUT, h: s.h * UNIT - GUT };
  }
  function place(el, w) {
    var r = rect(w);
    el.style.left = u(r.x); el.style.top = u(r.y); el.style.width = u(r.w); el.style.height = u(r.h);
    return el;
  }
  var A11Y = { text: '글', image: '사진', status: '상태', music: '음악', video: '영상', guestbook: '방명록', block: '포스트', dday: 'D-Day',
    todo: 'To-do', social: '소셜', sticker: '스티커 보드', together: 'Together', gif: 'GIF', playlist: '플레이리스트', mood: '오늘의 기분',
    diary: '한줄일기', place: '동네', weather: '날씨', voice: '음성 메모', nowplaying: '지금 듣는 중', collection: '취향 콜렉션',
    polaroid: '폴라로이드', paparazzi: '파파라치', ask: 'Ask', ditto: '디토 위젯' };
  function label(w) {
    var k = kindOf(w), d = dataOf(w), extra = '';
    if (k === 'music') extra = [trim(d.title), trim(d.artist)].filter(function (x) { return x; }).join(' · ');
    else if (k === 'guestbook') { var e = Array.isArray(d.entries) && d.entries[0]; extra = e ? trim(e.name) + ': ' + trim(e.message) : ''; }
    else if (k === 'status') extra = trim(d.label) || trim(d.emoji);
    else if (k === 'ditto') extra = w.source ? 'from. ' + (trim(w.source.handle) ? '@' + trim(w.source.handle).replace(/^@+/, '') : trim(w.source.name)) : '';
    else extra = trim(d.title) || trim(d.text) || trim(d.label);
    return (A11Y[k] || '위젯') + (extra ? ', ' + extra : '') + (w.ditto && !w.source && DITTOABLE[k] ? ', 디토 가능' : '');
  }
  function box(w) {
    var el = document.createElement('div');
    applyBox(el, w); place(el, w);
    if (w && w.id !== undefined) el.setAttribute('data-id', String(w.id));
    el.setAttribute('role', 'img'); el.setAttribute('aria-label', label(w));
    el.appendChild(render(w));
    return el;
  }
  /** A whole platter. Height = the rows the widgets reach (opts.rows / persona.rows can ask for more, e.g. the app's 16).
   *  Boxes are placed in % of the root exactly like scripts/platter.py; place() re-places one in cqw (same spot). */
  function platter(p, opts) {
    var list = Array.isArray(p) ? p : (p && Array.isArray(p.widgets) ? p.widgets : []);
    var rows = (opts && opts.rows) || (p && !Array.isArray(p) && p.rows) || 0;
    list = limitAvailable(list);
    list.forEach(function (w) { if (!w.priv) rows = Math.max(rows, (+w.y || 0) + (+w.h || 0)); });
    var gridH = Math.max(1, rows) * UNIT - GUT;
    var root = document.createElement('div');
    root.className = 'dpl';
    root.style.aspectRatio = DW.toFixed(1) + ' / ' + gridH.toFixed(2);
    list.forEach(function (w) {
      if (w.priv) return;
      var el = box(w), r = rect(w);
      el.style.left = (r.x / DW * 100).toFixed(3) + '%'; el.style.top = (r.y / gridH * 100).toFixed(3) + '%';
      el.style.width = (r.w / DW * 100).toFixed(3) + '%'; el.style.height = (r.h / gridH * 100).toFixed(3) + '%';
      root.appendChild(el);
    });
    return root;
  }

  // ───────────────────────── catalogue: what an ordinary App Store user can add today ─────────────────────────
  // AddSheet.catalog filtered by WType.launchSet (mood is in the launch set but merged into 상태 in the sheet), in the
  // sheet's own order (AddSheet.mixed), under its two headings. sizes = WidgetFrameSpec.ratios(for:) in chip order.
  // Dragging the corner handle also reaches every 2–6 × 2–8 size (Together excepted): freeResize.
  var G_MINE = '내 플래터 위젯', G_GROUP = '그룹에서도 쓰는 위젯';
  function sz(list) { return list.map(function (p) { return { w: p[0], h: p[1] }; }); }
  var ALL12 = [[2, 2], [3, 3], [4, 4], [6, 6], [4, 2], [4, 3], [6, 2], [6, 4], [3, 4], [2, 6], [4, 6], [6, 8]];   // RatioOption.serviceSizes, ordered: square → wide → tall
  var DEMO = '/demo/';
  var catalog = [
    { kind: 'social', name: '소셜', group: G_MINE, section: '기본', desc: '여러 SNS 계정을 프로필에 연결해요', sizes: sz(ALL12), defaultSize: { w: 2, h: 2 }, freeResize: true,
      sample: {"label": "@halosw_", "img": "/assets/cast/shared/halosw-instagram.webp", "url": "https://www.instagram.com/halosw_/"} },
    { kind: 'todo', name: 'To-do', group: G_MINE, section: '기록', desc: '카테고리별 할 일과 이번 주 기록', sizes: sz([[4, 4], [4, 3], [6, 2], [3, 4]]), defaultSize: { w: 3, h: 4 }, freeResize: true,
      sample: {"title": "누리의 교환 책", "cats": [{"id": "read", "name": "책", "color": "purple"}], "items": [{"text": "마당을 나온 암탉 읽기", "cat": "read", "done": true}, {"text": "여울에게 책갈피 건네기", "cat": "read", "done": false}]} },
    { kind: 'guestbook', name: '방명록', group: G_MINE, section: '함께', desc: '친구가 남긴 안부에 답글을 달아요', sizes: sz(ALL12), defaultSize: { w: 4, h: 3 }, freeResize: true,
      sample: {"title": "방명록", "ownerAvatar": "/assets/cast/scenes/gallery-notebook-owner.webp"} },
    { kind: 'dday', name: 'D-Day', group: G_MINE, section: '기록', desc: '기다리는 날까지 함께 세요', sizes: sz(ALL12), defaultSize: { w: 4, h: 2 }, freeResize: true,
      sample: {"title": "다음 합주", "inDays": 4} },
    { kind: 'sticker', name: '스티커 보드', group: G_MINE, section: '함께', desc: '친구들이 스티커를 붙여 줘요', sizes: sz(ALL12), defaultSize: { w: 4, h: 4 }, freeResize: true,
      sample: {"stickers": [{"img": "/assets/cast/found/mp3-player.webp", "x": 0.23, "y": 0.34, "r": -12, "s": 1.3}, {"img": "/assets/cast/found/lp-record.webp", "x": 0.72, "y": 0.34, "r": 12, "s": 1.3}, {"img": "/assets/cast/found/ref-tape.webp", "x": 0.24, "y": 0.8, "r": -14, "s": 0.91}, {"img": "/assets/cast/found/jelly-bear.webp", "x": 0.66, "y": 0.77, "r": 8, "s": 1.05}, {"img": "/assets/cast/found/ref-heart.webp", "x": 0.46, "y": 0.58, "r": 9, "s": 0.54}]} },
    { kind: 'block', name: '포스트', group: G_MINE, section: '기록', desc: '블로그 글을 쓰고 플래터에 카드로 보여 줘요', sizes: sz(ALL12), defaultSize: { w: 4, h: 3 }, freeResize: true,
      sample: {"title": "나의 인터뷰 함", "text": "처음이라서 설레기도 어렵기도 무섭기도 하던 그 모든 감정이… 소중한 거라고 말해주고 싶어요. 그 안에서 좋아하는 걸 찾고소중한 것을 곁에 뒀던 것까지도. 그냥 참 잘했다, 잘하고 있다.", "collection": true, "count": "글 1개"} },
    { kind: 'gif', name: 'GIF', group: G_GROUP, section: '미디어', desc: '움직이는 짤을 걸어 둬요', sizes: sz(ALL12), defaultSize: { w: 2, h: 2 }, freeResize: true,
      sample: {"img": "/assets/cast/shared/usagi-chiikawa.gif", "still": "/assets/cast/shared/usagi-chiikawa-still.webp", "title": "치이카와 · 달려가는 우사기", "fit": "cover", "meme": true} },
    { kind: 'status', name: '상태', group: G_GROUP, section: '기본', desc: '이모지나 한 줄로 지금 기분·상태를 나눠요', sizes: sz([[2, 2], [3, 3], [4, 4], [6, 6], [4, 2], [6, 2]]), defaultSize: { w: 2, h: 2 }, freeResize: true,
      sample: {"emoji": "🎧", "label": "킥 소리 고르는 중", "style": {"bg": "#ECE8DF"}} },
    { kind: 'playlist', name: '플레이리스트', group: G_GROUP, section: '미디어', desc: '곡을 모아 들려줘요', sizes: sz(ALL12), defaultSize: { w: 3, h: 4 }, freeResize: true,
      sample: {"title": "합주 끝나고 집 가는 길", "songs": [{"title": "From The Start", "art": "/assets/cast/scenes/album-from-start.webp"}, {"title": "Glue Song", "art": "/assets/cast/scenes/album-glue-song.webp"}, {"title": "Snooze", "art": "/assets/cast/scenes/album-snooze.webp"}, {"title": "EVERYTHING", "art": "/assets/cast/scenes/album-everything.webp"}]} },
    { kind: 'text', name: '텍스트', group: G_GROUP, section: '기본', desc: '한 줄 메모를 가볍게 남겨요', sizes: sz(ALL12), defaultSize: { w: 4, h: 2 }, freeResize: true,
      sample: {"text": "장갑은 골대 뒤에", "note": true, "style": {"bg": "#FBF3CB", "fg": "#332C23"}} },
    { kind: 'together', name: 'Together', group: G_GROUP, section: '함께', desc: '친구를 태그하고 같이 찍은 네 컷을 올려요', sizes: sz([[6, 2], [2, 4], [3, 6], [4, 8]]), defaultSize: { w: 2, h: 4 }, freeResize: false,
      sample: {"shots": ["/assets/cast/scenes/strip-birthday.webp", "/assets/cast/scenes/strip-picnic.webp", "/assets/cast/scenes/strip-garden.webp", "/assets/cast/scenes/strip-steps.webp"], "frame": "#F6F2F0", "tagged": []} },
    { kind: 'image', name: '이미지', group: G_GROUP, section: '기본', desc: '어제 찍은 사진을 그대로 걸어요', sizes: sz(ALL12), defaultSize: { w: 4, h: 4 }, freeResize: true,
      sample: {"img": "/assets/cast/scenes/golden-leaves.webp", "title": "은행잎이 쌓인 날"} },
    { kind: 'music', name: '음악', group: G_GROUP, section: '기본', desc: '요즘 자주 듣는 노래를 담아요', sizes: sz(ALL12), defaultSize: { w: 4, h: 2 }, freeResize: true,
      sample: {"title": "Psycho", "artist": "Red Velvet", "album": "The ReVe Festival Finale", "url": "https://music.youtube.com/watch?v=uR8Mrt1IpXg", "img": "/assets/cast/bom/psycho-album.webp", "provider": "YouTube Music", "palette": ["#bed9d3", "#a3cac1", "#debab5"], "audio": "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/01/0d/cb/010dcb95-4d2e-c56d-66b6-aa32d244d604/mzaf_10666588273897692200.plus.aac.p.m4a", "poster": "/assets/cast/bom/psycho.webp", "ytId": "uR8Mrt1IpXg", "playback": "youtube", "format": "뮤직비디오"} },
    { kind: 'video', name: '영상', group: G_GROUP, section: '기본', desc: '짧은 영상으로 일상을 전해요', sizes: sz(ALL12), defaultSize: { w: 4, h: 3 }, freeResize: true,
      sample: {"ytId": "i6d3K6ln-d4", "url": "https://www.youtube.com/watch?v=i6d3K6ln-d4", "img": "/assets/cast/scenes/chiikawa-sphinx.webp", "title": "치이카와 2화 · 스핑크스", "channel": "めざましテレビチャンネル", "ip": "치이카와"} }
  ];
  catalog.forEach(function (c) { c.dittoable = !!DITTOABLE[c.kind]; });

  window.DittoWidgets = {
    render: render, update: update, boxStyle: boxStyle, catalog: catalog,
    kinds: Object.keys(R),
    applyBox: applyBox, place: place, box: box, platter: platter, rect: rect, radius: radius, label: label,
    limitAvailable: limitAvailable, label: label, cq: u, dittoable: function (kind) { return !!DITTOABLE[kind]; },
    metrics: { width: DW, unit: UNIT, gutter: GUT, cols: COLS, minW: 2, maxW: 6, minH: 2, maxH: 8 },
    config: config
  };
})();
