/* 공개 프로필 대표 플래터 렌더러 — scripts/platter.py 의 render()·r_*를 브라우저용으로 옮긴 것.
 *
 *   ditto.place/{아이디}(404.html)가 쓴다. 위젯 CSS는 404.html · scripts/profile.html에 있다.
 *   2026-10-25: 앱의 최신 위젯 모양을 따라 새로 그렸다 — 포스트(block) · D-Day(4테마) · To-do · 상태 이모지 무늬 ·
 *   영상(재생 버튼·썸네일 띠 자르기) · 사진 제목 규격 · 음악(서비스 표기·진행 막대·흐르는 제목) · 이모지 흐림 수정.
 *   이 부분은 platter.py(미리 만드는 페이지용)보다 앞서 있다. 파이썬 쪽을 맞출 때는 이 파일을 기준으로 한다.
 *   잘못된 값이면 r_generic으로 대체하는 동작은 그대로다 (window.DITTO_DEBUG = true 면 콘솔에 원인을 남긴다).
 *
 *   window.DittoPlatter = {
 *     render(widgets, media)  → HTML 문자열 (위젯이 없으면 "")
 *     handleStyle(값)         → .handle 인라인 스타일 (profiles.handle_color)
 *     handleTone(값)          → [top, bottom, ink]
 *     musicPalette(pixels)    → [top, mid, bottom] (pixels = 64×64 [r,g,b] 배열 또는 null)
 *     paintMusic(root)        → 그린 뒤 음악 커버 색을 읽어 바탕을 다시 칠한다 (가능할 때만, 렌더를 막지 않음)
 *     finish(root)            → 그린 뒤 다듬기: 본문 줄 수 맞추기 · 흐르는 제목 · 유튜브 썸네일 띠 자르기 (폭이 바뀌면 다시)
 *     appAssets               → 앱 에셋 이름 → 확장자 (assets/app/)
 *     assetURL(이름)          → /assets/app/{이름}.{확장자} 또는 null
 *   }
 *
 *   media 계약 (platter.py Media 대신):
 *     image(ref, maxSide) → URL 또는 null  ·  exists(ref) → URL 또는 null (영상)
 *     sources = {위젯 id: {handle, avatar}}  ·  people = {아이디(소문자): 프로필 사진 URL}
 */
(function (root) {
  "use strict";

  var DESIGN_W = 358.0, UNIT = 45.75, GUT = 8.0;

  // ───────────────────────── 파이썬 흉내 ─────────────────────────

  function isStr(x) { return typeof x === "string"; }
  function isNum(x) { return typeof x === "number"; }
  function isObj(x) { return x !== null && typeof x === "object" && !Array.isArray(x); }
  function has(o, k) { return o != null && typeof o === "object" && Object.prototype.hasOwnProperty.call(o, k); }
  /** dict.get(k) — 없으면 undefined(None) */
  function get(o, k) { return has(o, k) ? o[k] : undefined; }
  /** 파이썬 참/거짓 */
  function T(x) {
    if (x === undefined || x === null || x === false || x === 0 || x === "") return false;
    if (Array.isArray(x)) return x.length > 0;
    if (typeof x === "object") return Object.keys(x).length > 0;
    if (typeof x === "number" && x !== x) return true;   // nan은 참
    return true;
  }
  /** a or b */
  function or() { for (var i = 0; i < arguments.length - 1; i++) if (T(arguments[i])) return arguments[i]; return arguments[arguments.length - 1]; }

  function pyFloatRepr(n) {
    if (n !== n) return "nan";
    if (n === Infinity) return "inf";
    if (n === -Infinity) return "-inf";
    if (Number.isInteger(n) && Math.abs(n) < 1e16) return (Object.is(n, -0) ? "-0" : String(n)) + ".0";
    var s = String(n), a = Math.abs(n);
    if (a >= 1e16 && s.indexOf("e") < 0) s = n.toExponential();
    var m = s.match(/^(-?[\d.]+)e([+-])(\d+)$/);
    if (m) s = m[1] + "e" + m[2] + (m[3].length < 2 ? "0" : "") + m[3];
    return s;
  }
  /** JSON 숫자는 정수·실수 구분이 없다 — 정수 값은 정수로 본다 (파이썬 json도 소수점 없는 수는 int) */
  function pyNum(n) { return Number.isInteger(n) && Math.abs(n) < 1e16 ? String(n) : pyFloatRepr(n); }
  function pyRepr(x) {
    if (x === undefined || x === null) return "None";
    if (x === true) return "True";
    if (x === false) return "False";
    if (isNum(x)) return pyNum(x);
    if (isStr(x)) {
      var q = x.indexOf("'") >= 0 && x.indexOf('"') < 0 ? '"' : "'";
      var body = x.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
      if (q === "'") body = body.replace(/'/g, "\\'");
      return q + body + q;
    }
    if (Array.isArray(x)) return "[" + x.map(pyRepr).join(", ") + "]";
    return "{" + Object.keys(x).map(function (k) { return pyRepr(k) + ": " + pyRepr(x[k]); }).join(", ") + "}";
  }
  /** str(x) */
  function S(x) {
    if (isStr(x)) return x;
    if (isNum(x)) return pyNum(x);
    return pyRepr(x);
  }
  var PY_WS = "\t\n\x0b\x0c\r\x1c\x1d\x1e\x1f \x85\xa0                　";
  /** str.strip() — 문자열이 아니면 파이썬처럼 실패 */
  function strip(s) {
    if (!isStr(s)) throw new TypeError("strip");
    var a = 0, b = s.length;
    while (a < b && PY_WS.indexOf(s[a]) >= 0) a++;
    while (b > a && PY_WS.indexOf(s[b - 1]) >= 0) b--;
    return s.slice(a, b);
  }
  function lstripAt(s) { var i = 0; while (i < s.length && s[i] === "@") i++; return s.slice(i); }
  function pyLen(s) { return Array.from(s).length; }
  function startsWith(s, p) { if (!isStr(s)) throw new TypeError("startswith"); return s.slice(0, p.length) === p; }
  /** 반올림 짝수 (파이썬 round) */
  function pyRound(x) {
    var f = Math.floor(x), d = x - f;
    if (d > 0.5) return f + 1;
    if (d < 0.5) return f;
    return f % 2 === 0 ? f : f + 1;
  }
  /** f"{x:.nf}" — 정확히 반인 값은 짝수 쪽 (toFixed는 큰 쪽) */
  function fx(x, n) {
    if (x !== x) return "nan";
    if (x === Infinity) return "inf";
    if (x === -Infinity) return "-inf";
    var p2 = Math.pow(2, n + 1), a = Math.abs(x);
    var s;
    if (Number.isInteger(a * p2) && !Number.isInteger(a * p2 / 2) && a * Math.pow(10, n) < 9e15) {
      var lo = Math.floor(a * Math.pow(10, n)), k = lo % 2 === 0 ? lo : lo + 1;
      var ds = String(k);
      if (n > 0) { while (ds.length <= n) ds = "0" + ds; ds = ds.slice(0, ds.length - n) + "." + ds.slice(ds.length - n); }
      s = (x < 0 || Object.is(x, -0) ? "-" : "") + ds;
    } else {
      s = x.toFixed(n);
      if (Object.is(x, -0) || (x < 0 && /^0\.?0*$/.test(s.replace("-", "")) && s[0] !== "-")) s = "-" + s;
    }
    return s;
  }
  /** a // b (CPython float_floor_div) */
  function floordiv(a, b) {
    var mod = a % b, div = (a - mod) / b;
    if (mod && ((b < 0) !== (mod < 0))) div -= 1;
    var fl = Math.floor(div);
    if (div - fl > 0.5) fl += 1;
    return fl;
  }
  /** float(x) */
  function pyFloat(x) {
    if (isNum(x)) return x;
    if (x === true) return 1;
    if (x === false) return 0;
    if (isStr(x)) {
      var t = strip(x).replace(/(\d)_(?=\d)/g, "$1").toLowerCase();
      if (/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/.test(t)) return parseFloat(t);
      if (/^[+-]?(inf|infinity)$/.test(t)) return t[0] === "-" ? -Infinity : Infinity;
      if (/^[+-]?nan$/.test(t)) return NaN;
      throw new RangeError("float");   // ValueError
    }
    throw new TypeError("float");
  }
  /** for x in v (v or [] 다음) — 리스트·문자열·dict 키, 그 밖은 실패 */
  function iter(v) {
    if (!T(v)) return [];
    if (Array.isArray(v)) return v;
    if (isStr(v)) return Array.from(v);
    if (isObj(v)) return Object.keys(v);
    throw new TypeError("iter");
  }
  /** {상수 dict}.get(k, d) — 리스트·dict 키는 unhashable */
  function lookup(map, k, d) {
    if (k !== null && typeof k === "object") throw new TypeError("unhashable");
    return isStr(k) && has(map, k) ? map[k] : d;
  }
  function splitLines(s) { if (!isStr(s)) throw new TypeError("split"); return s.split("\n"); }

  function u(n) { return fx(n * 100 / DESIGN_W, 3) + "cqw"; }
  function esc(s) {
    return S(T(s) ? s : "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
  }
  function radius(w) { return w.type === "music" ? 24 : Math.min(20, 12 + (Math.min(w.w, w.h) - 2) * 2); }
  function sizePx(w) { return [w.w * UNIT - GUT, w.h * UNIT - GUT]; }
  function img(m, ref, side) { var r = m.image(ref, side === undefined ? 600 : side); return T(r) ? r : null; }

  // 이모지 — 글자색에 투명도가 있으면(rgba) 브라우저가 컬러 이모지까지 흐리게 그린다. 앱은 이모지를 원래 색으로 그린다.
  // 이스케이프한 글 안의 이모지를 .emo로 감싸 불투명하게 되돌린다.
  var EMO_RE = null;
  try { EMO_RE = new RegExp("(?:\\p{Extended_Pictographic}|\\p{Regional_Indicator}{2})(?:\\uFE0F|\\u20E3|[\\u{1F3FB}-\\u{1F3FF}]|\\u200D\\p{Extended_Pictographic}\\uFE0F?)*", "gu"); } catch (e) { EMO_RE = null; }
  function emo(h) { return EMO_RE ? String(h).replace(EMO_RE, '<span class="emo">$&</span>') : h; }
  function escE(s) { return emo(esc(s)); }
  /** 글자 단위(그래핌) 나누기 — 이모지 무늬용 */
  function graphemes(s) {
    s = isStr(s) ? s : "";
    try {
      if (typeof Intl !== "undefined" && Intl.Segmenter) {
        return Array.from(new Intl.Segmenter("ko", { granularity: "grapheme" }).segment(s), function (x) { return x.segment; });
      }
    } catch (e) { /* 아래로 */ }
    var out = [];
    Array.from(s).forEach(function (c) {
      var cp = c.codePointAt(0);
      if (out.length && (cp === 0xFE0F || cp === 0x200D || (cp >= 0x1F3FB && cp <= 0x1F3FF) || out[out.length - 1].slice(-1) === "‍")) out[out.length - 1] += c;
      else out.push(c);
    });
    return out;
  }
  /** 앱 Date(2001-01-01 기준 초) → Date. 숫자가 아니면 null */
  function appDate(v) {
    if (!isNum(v) || !isFinite(v)) return null;
    return new Date((v + 978307200) * 1000);
  }

  // ───────────────────────── 색 ─────────────────────────

  function lum(c) {
    function lin(v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function mix(c, t) { return c.map(function (v) { return pyRound(v * (1 - t) + 255 * t); }); }
  function mixf(c, t) { return c.map(function (v) { return pyRound((v / 255 + (1 - v / 255) * t) * 255); }); }
  function hex2(v) { return (v < 16 ? "0" : "") + v.toString(16); }
  function HEX(c) { return "#" + c.map(hex2).join("").toUpperCase(); }
  function rgb(h) { h = h.replace(/^#+/, ""); return [0, 2, 4].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }

  // 프로필 핸들 색 (Profile handle v2 · iOS DGrad.profileHandlePalettes · profiles.handle_color)
  var HANDLE_INK = [0x17, 0x17, 0x19];
  var HANDLE_PALETTES = {
    lavender: ["#CAB7F2", "#B092ED", "#C8B3F2"], slate: ["#A8B3BF", "#79899B", "#A1ADB9"],
    lime: ["#C5D593", "#A5BE57", "#C0D289"], teal: ["#8FB2BD", "#5C8F9F", "#8DB0BC"],
    gold: ["#D5C194", "#BF9F5B", "#D2BC8C"], coral: ["#EDAE91", "#E07B4C", "#E9A382"],
    pink: ["#EEAFC7", "#E37CA2", "#EBA3BE"], sage: ["#B3BDA6", "#85946F", "#AAB49A"],
    mauve: ["#B5ADBA", "#908498", "#B2A9B7"], sky: ["#ADD5E5", "#79BBD4", "#A1CFE1"]
  };

  function handleTone(value) {
    var v = isStr(value) ? strip(value) : "";
    if (v[0] === "#" && v.length === 7 && /^[0-9a-fA-F]{6}$/.test(v.slice(1))) {
      var base = rgb(v), white = [255, 255, 255], dark = true;
      if (contrast(HANDLE_INK, base) < 4.5) {
        if (contrast(white, mixf(base, 0.18)) >= 4.5) dark = false;
        else {
          var t = 0.0;
          while (contrast(HANDLE_INK, mixf(rgb(v), t)) < 4.5 && t < 1) t += 0.02;
          base = mixf(rgb(v), t);
        }
      }
      return [HEX(mixf(base, dark ? 0.35 : 0.18)), HEX(base), dark ? "#171719" : "#FFFFFF"];
    }
    var p = has(HANDLE_PALETTES, v) ? HANDLE_PALETTES[v] : HANDLE_PALETTES.lavender;
    return [p[0], p[1], "#171719"];
  }

  function handleStyle(value) {
    var t = handleTone(value);
    var sub = t[2] === "#171719" ? "rgba(23,23,25,.85)" : "rgba(255,255,255,.85)";
    return "--h-top:" + t[0] + ";--h-bottom:" + t[1] + ";--h-ink:" + t[2] + ";--h-sub:" + sub;
  }

  /** MusicArtworkPalette — pixels: 64×64 [r,g,b] (PIL resize BILINEAR 대신 캔버스 축소). 없으면 회색 */
  function musicPalette(px) {
    var keys = [[160, 160, 160], [160, 160, 160]];
    if (px) {
      var buckets = new Map(), ncount = 0, nsum = [0, 0, 0], total = 0, chrom = 0;
      px.forEach(function (c) {
        var hi = Math.max(c[0], c[1], c[2]), lo = Math.min(c[0], c[1], c[2]), delta = hi - lo;
        total += 1;
        if (hi < 24 || lo > 244) return;
        var sat = hi ? delta / hi : 0;
        if (sat < 0.16 || delta < 16) { ncount += 1; nsum = [nsum[0] + c[0], nsum[1] + c[1], nsum[2] + c[2]]; return; }
        var r = c[0], g = c[1], b = c[2];
        var hue = hi === r ? (g - b) / delta : hi === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
        hue = (hue * 60 + 360) % 360;
        var k = floordiv(hue, 20);
        if (!buckets.has(k)) buckets.set(k, { n: 0, sum: [0, 0, 0], sat: 0, br: 0, hue: k * 20 + 10 });
        var bk = buckets.get(k);
        bk.n += 1; bk.sum = [bk.sum[0] + r, bk.sum[1] + g, bk.sum[2] + b]; bk.sat += sat; bk.br += hi / 255;
        chrom += 1;
      });
      var cands = [];
      buckets.forEach(function (b) {
        if (b.n >= Math.max(2, total * 0.015)) cands.push([
          b.sum.map(function (s) { return pyRound(s / b.n); }),
          Math.pow(b.n / Math.max(1, total), 0.5) * (0.2 + Math.pow(b.sat / b.n, 1.5)) * (0.25 + 0.75 * b.br / b.n),
          b.hue]);
      });
      cands.sort(function (a, b) { return (b[1] - a[1]) || (a[2] - b[2]); });
      if (chrom < Math.max(2, total * 0.04) || !cands.length) {
        var n = ncount ? nsum.map(function (s) { return s / ncount; }) : [160, 160, 160];
        var gg = pyRound((n[0] + n[1] + n[2]) / 3);
        keys = [[gg, gg, gg], [gg, gg, gg]];
      } else {
        var first = cands[0], second = null;
        for (var i = 0; i < cands.length; i++) {
          var dh = Math.abs(cands[i][2] - first[2]);
          if (Math.min(dh, 360 - dh) >= 40) { second = cands[i]; break; }
        }
        keys = [first[0], second ? second[0] : mix(first[0], 0.22)];
      }
    }
    var ink = [0x49, 0x40, 0x4B];
    function readable(k, t) {
      var c = mix(k, t);
      while (contrast(c, ink) < 4.8 && t < 1) { t = Math.min(1, t + 0.02); c = mix(k, t); }
      return c;
    }
    function hexc(c) { return "#" + c.map(hex2).join(""); }
    return [hexc(readable(keys[0], 0.70)), hexc(readable(keys[0], 0.58)), hexc(readable(keys[1], 0.62))];
  }

  // ───────────────────────── 위젯별 렌더러 ─────────────────────────

  var ARROW = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M3 7l4-4M4 3h3v3" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CAMERA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.4-2h6.2l1.4 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  var YT = '<svg viewBox="0 0 20 14.4" aria-hidden="true"><rect width="20" height="14.4" rx="5.6" fill="#f00"/><path d="M8.4 4.4v5.6l4.6-2.8z" fill="#fff"/></svg>';
  var PENCIL = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.6 2.3a1.6 1.6 0 0 1 2.3 0l.8.8a1.6 1.6 0 0 1 0 2.3l-7.6 7.6-3.4.9.9-3.4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9.4 3.6l3 3" stroke="currentColor" stroke-width="1.6"/></svg>';
  var CHECK = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.6 6.3 5 8.6l4.4-5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var NOTE = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4.6 9.2V3l5-1.2v6.1" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><circle cx="3.5" cy="9.3" r="1.4" fill="currentColor"/><circle cx="8.5" cy="8.1" r="1.4" fill="currentColor"/></svg>';
  var PLAY = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3.6 1.9v8.2L10 6z" fill="#fff"/></svg>';
  function BADGE(st) { return '<img class="dt-badge" src="/assets/dittobadge-32.svg" alt="" style="' + st + '">'; }

  /** StandardServiceTiles.ServiceTile — 라벨 · 콘텐츠 · 제목 · 부제 */
  function serviceTile(W, H, label, title, subtitle, content) {
    var small = W < 110 && H < 120;
    var inset = small ? 7 : W < 110 ? 8 : 12;
    var ts = small ? 10 : W < 150 ? 13 : 17;
    if (W / Math.max(H, 1) >= 1.7) {
      return '<div class="st st-w" style="padding:' + u(inset) + ";gap:" + u(10) + '">' +
        '<div class="st-body" style="flex:none;width:' + u(Math.min(H - inset * 2, W * 0.35)) + '">' + content + "</div>" +
        '<div class="st-col" style="gap:' + u(4) + '"><p class="st-label" style="font-size:' + u(9) + '">' + esc(label) + "</p>" +
        '<p class="st-title" style="font-size:' + u(13) + ';-webkit-line-clamp:1">' + esc(title) + "</p>" +
        '<p class="st-sub" style="font-size:' + u(10) + '">' + esc(subtitle) + "</p></div></div>";
    }
    var parts = ['<div class="st" style="padding:' + u(inset) + ";gap:" + u(small ? 3 : 6) + '">'];
    if (H >= 160) parts.push('<div class="st-label" style="font-size:' + u(10) + '">' + esc(label) + ARROW + "</div>");
    parts.push('<div class="st-body">' + content + "</div>");
    parts.push('<div class="st-title" style="font-size:' + u(ts) + ";-webkit-line-clamp:" + (W < 110 && !small ? 2 : 1) + '">' + esc(small ? label : title) + "</div>");
    if (!small && H >= 160) parts.push('<div class="st-sub" style="font-size:' + u(10) + '">' + esc(subtitle) + "</div>");
    parts.push("</div>");
    return parts.join("");
  }

  // ── 포스트 위젯 (데이터 타입은 block) — 앱 Views/PostWidget.swift (2026-10-12 재설계) ──
  // 사진이 있으면 사진이 주인공. 작은 카드는 사진 위 제목(커버), 큰 카드는 사진 + 글. 본문은 남는 높이를 채운다(data-fit).
  function r_block(w, W, H, m) {
    var title = strip(S(or(get(w, "title"), "")));
    var excerpt = strip(S(or(get(w, "text"), "")).replace(/\n+/g, " "));
    var photo = isStr(get(w, "img")) && w.img ? img(m, w.img) : null;
    var label = isStr(get(w, "label")) ? strip(w.label) : "";
    var head = title || excerpt, body = title ? excerpt : "";
    var pad = Math.min(W, H) < 100 ? 12 : 16;
    var name = ["포스트", head];
    function eyebrow(onPhoto, count) {
      var c = count !== false && label && W >= 140;
      return '<span class="po-eb' + (onPhoto ? " on" : "") + '" style="font-size:' + u(11) + ";gap:" + u(4) + '">' +
        '<i style="width:' + u(11) + ";height:" + u(11) + '">' + PENCIL + "</i><b>포스트</b>" +
        (c ? '<em>·</em><span>' + esc(label) + "</span>" : "") + "</span>";
    }
    function t(fs, lh, wt, lines, color, extra) {
      return '<p class="po-t" style="font-size:' + u(fs) + ";line-height:" + u(lh) + ";font-weight:" + wt + ";-webkit-line-clamp:" + lines + ";color:" + color + (extra || "") + '">' + escE(head) + "</p>";
    }
    function bodyP(fs, lh, color, fit) {
      if (!body) return '<span class="grow"></span>';
      return '<p class="po-b"' + (fit ? " data-fit" : "") + ' style="font-size:' + u(fs) + ";line-height:" + u(lh) + ";color:" + color + (fit ? "" : ";-webkit-line-clamp:1") + '">' + escE(body) + "</p>";
    }
    function ph(wd, ht) { return '<span class="po-ph" style="width:' + (wd === "100%" ? "100%" : u(wd)) + ";height:" + u(ht) + '"><img src="' + esc(photo) + '" alt="" loading="lazy"></span>'; }
    function cover(fs, lh, lines, exLines) {
      return '<img class="cover" src="' + esc(photo) + '" alt="" loading="lazy"><span class="po-shade"></span>' +
        '<div class="po-cov" style="padding:' + u(pad) + ";gap:" + u(5) + '">' + (W >= 120 ? eyebrow(true) : "") +
        t(fs, lh, 600, lines, "#fff") +
        (exLines && body ? '<p class="po-b" style="font-size:' + u(12) + ";line-height:" + u(17) + ';color:rgba(255,255,255,.85);-webkit-line-clamp:1">' + escE(body) + "</p>" : "") + "</div>";
    }
    var inner;
    if (!head) {
      var centered = w.h >= 3;
      inner = '<div class="po-empty' + (centered ? " c" : "") + '" style="padding:' + u(pad) + ";gap:" + u(8) + '">' +
        '<span class="po-ico" style="width:' + u(32) + ";height:" + u(32) + '"><i style="width:' + u(15) + ";height:" + u(15) + '">' + PENCIL + "</i></span>" +
        '<b style="font-size:' + u(13) + '">' + (w.h <= 2 && w.w <= 2 ? "첫 포스트" : "첫 포스트를 써보세요") + "</b></div>";
    } else if (w.h <= 2 && w.w <= 2) {
      inner = photo ? cover(14, 18, 3, 0)
        : '<div class="po-col" style="padding:' + u(pad) + '"><i class="po-pen" style="width:' + u(14) + ";height:" + u(14) + '">' + PENCIL + '</i><span class="grow" style="min-height:' + u(6) + '"></span>' + t(16, 20, 600, 3, "#171719") + "</div>";
    } else if (w.h <= 2) {
      inner = '<div class="po-row">' + (photo ? ph(H, H) : "") +
        '<div class="po-col mid" style="padding:0 ' + u(pad) + ";gap:" + u(6) + '">' + eyebrow(false, !photo) +
        t(16, 20, 600, !title && w.w >= 6 ? 2 : 1, "#171719") +
        (body ? '<p class="po-b" style="font-size:' + u(12) + ";line-height:" + u(17) + ";color:#70737c;-webkit-line-clamp:" + (w.w >= 6 ? 2 : 1) + '">' + escE(body) + "</p>" : "") + "</div></div>";
    } else if (w.w <= 2) {
      var e = !photo && isStr(get(w, "emoji")) && strip(w.emoji) ? '<span style="font-size:' + u(28) + ';line-height:1.2">' + esc(strip(w.emoji)) + "</span>" : "";
      inner = '<div class="po-col">' + (photo ? ph("100%", W) : "") +
        '<div class="po-col" style="flex:1 1 auto;min-height:0;padding:' + u(pad) + ";gap:" + u(8) + '">' + e + eyebrow(false) +
        t(16, 20, 600, photo ? 4 : 6, "#171719") + '<span class="grow"></span>' +
        (label ? '<p style="font-size:' + u(11) + ';font-weight:500;color:#70737c;white-space:nowrap">' + esc(label) + " ›</p>" : "") + "</div></div>";
    } else if (w.w >= 6 && w.h <= 4) {
      inner = '<div class="po-row">' + (photo ? ph(W * 0.45, H) : "") +
        '<div class="po-col" style="flex:1 1 auto;min-width:0;padding:' + u(pad) + ";gap:" + u(8) + '">' + eyebrow(false) +
        t(19, 26.6, 700, title ? 2 : 4, "#171719", ";flex:none") + bodyP(14, 21, "#46474c", true) + "</div></div>";
    } else if (photo && w.h <= 3) {
      inner = cover(17, 23.8, 2, 1);
    } else {
      var big = w.h >= 6 || (!photo && w.h >= 4);
      inner = '<div class="po-col">' + (photo ? ph("100%", Math.round(H * (w.h >= 6 ? 0.52 : 0.40))) : "") +
        '<div class="po-col" style="flex:1 1 auto;min-height:0;padding:' + u(pad) + ";gap:" + u(big ? 10 : 7) + '">' + eyebrow(false) +
        (big ? t(22, title ? 29.7 : 33.7, 700, title ? 2 : 8, "#171719", ";flex:none") : t(17, title ? 23.8 : 27.8, 600, title ? 2 : 8, "#171719", ";flex:none")) +
        (big ? bodyP(16, 24.8, "#46474c", true) : bodyP(12, 16.8, "#46474c", true)) + "</div></div>";
    }
    return [" data-dl", inner, name[0], name[1]];
  }

  // ── 영상 — 앱 WidgetContent.videoView · videoSpec (Figma Splup/Widget/video) ──
  // 포스터 전체 + 위 음영 위 제목 · 가운데 재생 버튼 · YouTube일 때만 오른쪽 아래 작은 아이콘
  function videoSpec(cw, ch) {
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
  function r_video(w, W, H, m) {
    var poster = img(m, or(get(w, "img"), get(w, "poster")));
    var src = m.exists(get(w, "videoPath")) || null;
    var title = strip(S(or(get(w, "title"), "")));
    var s = videoSpec(w.w, w.h);
    var yt = T(get(w, "ytId")) || !T(get(w, "videoPath"));
    var fgc = fg(w, "#fff");
    // 유튜브 기본 썸네일(4:3)은 위아래에 검은 띠가 박혀 있다 — 띠를 잘라 16:9 화면만 채운다 (finish가 비율을 보고 판단)
    var im = poster ? '<img class="cover vd-poster"' + (T(get(w, "ytId")) ? " data-yt" : "") + ' src="' + esc(poster) + '" alt="" loading="lazy">' : "";
    var vid = src ? '<video class="cover vd" src="' + esc(src) + '" playsinline muted preload="none"' + (poster ? ' poster="' + esc(poster) + '"' : "") + "></video>" : "";
    var inner = im + vid;
    if (title && s[1] > 0) {
      inner += '<span class="vd-shade" style="height:' + u(s[3]) + '"></span>' +
        '<p class="vd-title" style="font-size:' + u(s[0]) + ";line-height:" + u(s[0] * 1.3) + ";padding:" + u(s[2]) + " " + u(s[2]) + " 0;-webkit-line-clamp:" + s[1] + ";color:" + fgc + '">' + escE(title) + "</p>";
    }
    inner += '<span class="vd-play" style="width:' + u(s[4]) + ";height:" + u(s[4]) + '"><i style="width:' + u(s[4] * 0.42) + ";height:" + u(s[4] * 0.42) + '">' + PLAY + "</i></span>";
    if (yt) inner += '<span class="vd-yt" style="width:' + u(16) + ";height:" + u(11.5) + ";right:" + u(s[2]) + ";bottom:" + u(s[2]) + '">' + YT + "</span>";
    return [src ? ' data-act="video"' : ' data-dl data-msg="video"', inner, "영상", title];
  }

  var STK_POS = [[0.25, 0.25], [0.7, 0.2], [0.45, 0.55], [0.8, 0.6], [0.2, 0.75], [0.6, 0.85]];

  function r_sticker(w, W, H, m) {
    var dots = or(get(w, "stickers"), []);
    var out = [];
    if (T(dots)) {
      var list = iter(dots);
      for (var i = 0; i < list.length; i++) {
        var d = list[i];
        if (!isObj(d)) throw new TypeError("sticker");   // AttributeError
        var x, y;
        try {
          x = pyFloat(has(d, "x") ? d.x : 0.5);
          y = pyFloat(has(d, "y") ? d.y : 0.5);
        } catch (err) { continue; }
        var s = pyFloat(or(get(d, "s"), 1));
        var r = get(d, "r") != null ? pyFloat(d.r) : (i * 47) % 36 - 18;
        var body;
        if (T(get(d, "img"))) {
          var path = img(m, d.img, 160);
          if (!path) continue;   // 그린 스티커 파일이 버킷에 없으면 건너뛴다
          var side = (startsWith(S(d.img), "file:") ? 48 : 34) * s;
          var flat = /\.jpg$/.test(S(path).split("?")[0]) ? ' class="flat"' : "";   // 흰 바탕 에셋은 카드 색에 녹인다
          body = "<img" + flat + ' src="' + esc(path) + '" alt="" style="width:' + u(side) + ";height:" + u(side) + '">';
        } else if (T(get(d, "e"))) {
          body = '<span style="font-size:' + u((24 + (i % 3) * 5) * s) + '">' + esc(d.e) + "</span>";
        } else continue;
        out.push('<i class="sk" style="left:' + fx(x * 100, 2) + "%;top:" + fx(y * 100, 2) + "%;--r:" + fx(r, 1) + "deg;--d:" + fx((i * 0.37) % 2.4, 2) + 's">' + body + "</i>");
      }
    } else {
      var em = iter(or(get(w, "emoji"), "✨💖🌟")).slice(0, 6);
      for (var j = 0; j < em.length; j++) {
        var p = STK_POS[j % 6];
        out.push('<i class="sk" style="left:' + pyFloatRepr(p[0] * 100) + "%;top:" + pyFloatRepr(p[1] * 100) + "%;--r:" + ((j * 47) % 40 - 20) + "deg;--d:" + fx((j * 0.37) % 2.4, 2) + 's">' +
          '<span style="font-size:' + u(24 + (j % 3) * 6) + '">' + esc(em[j]) + "</span></i>");
      }
    }
    if (T(get(w, "text"))) out.push('<p class="sk-text" style="font-size:' + u(13) + '">' + esc(w.text) + "</p>");
    return ["", out.join(""), "스티커", ""];
  }

  function framesOf(w, m) {
    var refs = iter(or(get(w, "frames"), [])).filter(isStr);
    ["polImg", "img"].forEach(function (k) {
      if (isStr(get(w, k)) && refs.indexOf(w[k]) < 0) refs.unshift(w[k]);
    });
    return refs.map(function (r) { return img(m, r); }).filter(function (p) { return p; });
  }

  function flipBox(frames, cls) {
    if (!frames.length) return '<div class="' + cls + ' empty"><i style="width:' + u(20) + ";height:" + u(20) + '">' + CAMERA + "</i></div>";
    var imgs = frames.map(function (p, i) { return '<img src="' + esc(p) + '" alt=""' + (i === 0 ? "" : " hidden") + ' loading="lazy">'; }).join("");
    var dots = frames.length > 1 ? '<span class="fl-count">1/' + frames.length + "</span>" : "";
    return '<div class="' + cls + '">' + imgs + dots + "</div>";
  }

  function r_polaroid(w, W, H, m) {
    var frames = framesOf(w, m);
    var cap = strip(or(get(w, "polCaption"), ""));
    var title = frames.length ? "폴라로이드" : "첫 장을 남겨봐";
    var content = '<div class="pol">' + flipBox(frames, "pol-photo") + '<div class="pol-chin"></div></div>';
    return [frames.length > 1 ? ' data-act="flip"' : " data-dl", serviceTile(W, H, "폴라로이드", title, or(cap, "한 장의 순간"), content), "폴라로이드", cap];
  }

  function r_paparazzi(w, W, H, m) {
    var frames = framesOf(w, m);
    var by = get(w, "by");
    var content = '<div class="pap">' + flipBox(frames, "pap-photo") + "</div>";
    return [frames.length > 1 ? ' data-act="flip"' : " data-dl",
      serviceTile(W, H, "파파라치", or(get(w, "title"), "친구가 담은 나"), T(by) ? "photo by. " + S(by) : "친구의 시선으로 남은 순간", content), "파파라치", get(w, "title")];
  }

  function r_ask(w, W, H, m) {
    var title = or(get(w, "text"), "무엇이든 물어봐");
    var inset = Math.min(16, Math.max(8, W * 0.065));
    var art = '<img class="ask-art" src="/assets/platter/ask-mailbox.png" alt="">';
    var preview = '<p class="ask-q" style="font-size:' + u(11) + ";padding:" + u(6) + " " + u(7) + ";border-radius:" + u(8) + '">첫 질문을 남겨봐</p>';
    var inner;
    if (W / Math.max(H, 1) >= 1.7) {
      inner = '<div class="ask ask-h" style="padding:' + u(inset) + ";gap:" + u(8) + '">' +
        '<div style="width:' + u(Math.min(H * 0.9, W * 0.3)) + '">' + art + '</div><div class="ask-col" style="gap:' + u(4) + '">' +
        '<p class="ask-k" style="font-size:' + u(9) + '">ASK</p><p class="ask-t" style="font-size:' + u(Math.min(18, Math.max(12, W * 0.055))) + '">' + esc(title) + "</p>" + preview + "</div></div>";
    } else {
      var head = H >= 160 ? '<p class="ask-k" style="font-size:' + u(10) + '"><span>ASK</span>' + ARROW + "</p>" : "";
      inner = '<div class="ask" style="padding:' + u(inset) + ";gap:" + u(H >= 160 ? 5 : 3) + '">' + head +
        '<div class="ask-artbox" style="height:' + u(Math.max(35, Math.min(H * 0.38, W * 0.64))) + '">' + art + "</div>" +
        '<p class="ask-t" style="font-size:' + u(Math.min(23, Math.max(13, W * 0.115))) + ";-webkit-line-clamp:" + (W < 130 ? 2 : 1) + '">' + esc(title) + "</p>" +
        '<span class="grow"></span>' + preview +
        (H >= 220 ? '<p class="ask-a" style="font-size:' + u(10) + '">익명으로 질문하기</p>' : "") + "</div>";
    }
    return [' data-dl data-msg="ask"', inner, "Ask", title];
  }

  /** DittoWidgetLayout.of — [출처 변형, 배지 한 변, 가장자리 여백] */
  function dittoLayout(ww, hh) {
    if (ww >= 6 && hh >= 6) return ["caption", 32, 12];
    if (ww >= 4 && hh >= 4 && Math.max(ww, hh) >= 6) return ["standard", 32, 12];
    if (ww >= 4 && hh >= 4) return ["standard", 24, 8];
    if (ww <= 2) return [hh >= 4 ? "narrow" : "none", 24, 8];
    if (hh <= 2) return [ww >= 6 ? "compact" : "text", 24, 8];
    return ["compact", 24, 8];
  }

  function r_ditto(w, W, H, m) {
    var lay = dittoLayout(w.w, w.h), kind = lay[0], badge = lay[1], inset = lay[2];
    var src_h = { text: 24, compact: 28, standard: 32, narrow: 44 }[kind] || 0;
    var media_h = kind === "none" ? H : kind === "caption" ? Math.max(H * 0.5, H - 96) : Math.max(H * 0.55, H - src_h - inset);
    var photo = img(m, or(get(w, "img"), get(w, "polImg")));
    var frm = strip(or(get(w, "from"), ""));
    var media;
    if (photo) media = '<img class="cover" src="' + esc(photo) + '" alt="" loading="lazy"><span class="soft"></span>';
    else if (T(get(w, "emoji"))) media = '<span class="dt-emoji" style="height:' + u(media_h) + ";font-size:" + u(Math.min(W, H) * 0.42) + '">' + esc(w.emoji) + "</span>";
    else {
      var fs = Math.min(W, H) >= 120 ? 17 : 14;
      media = '<span class="dt-title" style="height:' + u(media_h) + ";font-size:" + u(fs) + ";padding:0 " + u(inset + 4) + '">' + esc(or(get(w, "title"), "디토 위젯")) + "</span>";
    }
    var id = get(w, "id");
    var src = (isStr(id) || isNum(id)) && has(m.sources || {}, String(id)) ? or(m.sources[String(id)], {}) : {};
    if (!isObj(src)) throw new TypeError("source");   // src.get → AttributeError
    var handle;
    if (T(get(src, "handle"))) { if (!isStr(src.handle)) throw new TypeError("handle"); handle = "@" + src.handle; }
    else handle = frm;
    var av_path = T(get(src, "avatar")) ? img(m, src.avatar, 96) : null;
    function avatarHtml(av) {
      var st = "width:" + u(av) + ";height:" + u(av) + ";border-radius:" + u(av / 3);
      return av_path ? '<img class="dt-av" src="' + esc(av_path) + '" alt="" style="' + st + '">' : '<i class="dt-av" style="' + st + '"></i>';
    }
    var chip = "";
    if (handle && ["text", "compact", "standard", "narrow"].indexOf(kind) >= 0) {
      var std = kind === "standard", avatar = avatarHtml(std ? 24 : 20);
      if (kind === "text") {
        chip = '<span class="dt-src" style="left:' + u(inset) + ";bottom:" + u(inset) + ";width:" + u(Math.min(70, W - inset * 2)) + ";height:" + u(24) + ";" +
          "padding:0 " + u(6) + ";border-radius:" + u(8) + ";font-size:" + u(12) + ";line-height:" + u(16) + '"><b>' + esc(handle) + "</b></span>";
      } else if (kind === "narrow") {
        chip = '<span class="dt-src dt-src-n" style="left:' + u(inset) + ";right:" + u(inset) + ";bottom:" + u(inset) + ";height:" + u(44) + ";" +
          "padding:0 " + u(6) + ";gap:" + u(2) + ";border-radius:" + u(8) + ";font-size:" + u(12) + ";line-height:" + u(16) + '">' + avatar + "<b>" + esc(handle) + "</b></span>";
      } else {
        chip = '<span class="dt-src" style="left:' + u(inset) + ";bottom:" + u(inset) + ";width:" + u(Math.min(std ? 132 : 108, W - inset * 2)) + ";" +
          "height:" + u(std ? 32 : 28) + ";padding:0 " + u(6) + ";gap:" + u(6) + ";border-radius:" + u(8) + ";" +
          "font-size:" + u(std ? 14 : 12) + ";line-height:" + u(std ? 20 : 16) + '">' + avatar + "<b>" + esc(handle) + "</b></span>";
      }
    } else if (handle && kind === "caption") {
      var cap = strip(or(get(w, "polCaption"), get(w, "title"), ""));
      chip = '<span class="dt-cap' + (photo ? " on" : "") + '" style="padding:' + u(24) + " " + u(16) + " " + u(12) + ";gap:" + u(8) + '">' +
        (cap ? '<b style="font-size:' + u(17) + ";line-height:" + u(24) + '">' + esc(cap) + "</b>" : "") +
        '<span style="gap:' + u(8) + ";font-size:" + u(14) + ";line-height:" + u(20) + '">' + avatarHtml(24) + esc(handle) + "</span></span>";
    }
    var b = frm ? BADGE("top:" + u(inset) + ";right:" + u(inset) + ";width:" + u(badge) + ";height:" + u(badge)) : "";
    return [' data-dl data-msg="ditto"', media + chip + b, "디토 위젯", handle ? "from. " + handle : ""];
  }

  // MusicCDPLayout.of — 앱 Views/MusicCDPTile.swift (Figma Splup/Widget/music 2142:145642 최종 좌표)
  // d = 디자인 크기 · disc/info = [x, y, w] · t/a = [글자, 줄 높이] · src = 서비스 표기 · prog = 진행 막대 [x, y, w] · vh = 영상 높이
  function musicLayout(ww, hh) {
    if (ww >= 6 && hh >= 8) return { d: [275.5, 370], disc: [171.5, 200, 88], info: [16, 260, 147.5], t: [24, 29], a: [14, 19], gap: 4, prog: [16, 333, 243.5], vh: 244, vl: [16, 215] };
    if (ww >= 6 && hh >= 6) return { d: [275.5, 275.5], disc: [187.5, 119, 72], info: [16, 171, 163.5], t: [22, 26], a: [13, 18], gap: 4, prog: [16, 238.5, 243.5], vh: 155, vl: [16, 126] };
    if (ww <= 2 && hh >= 4) return { d: [86.5, 275.5], disc: [12, 16, 62.5], info: [12, 102, 62.5], t: [14, 18], lines: 2, a: [11, 16], gap: 4, c: true, src: ["icon", 240.5] };
    if (hh <= 2) {
      if (ww >= 6) return { d: [275.5, 86.5], disc: [205, 16, 54.5], info: [16, 12, 177], t: [17, 20], a: [12, 17], gap: 4, src: ["y19", 16, 55] };
      if (ww >= 4) return { d: [181, 86.5], disc: [106.5, 12, 62.5], info: [12, 16.75, 82.5], t: [14, 18], a: [10, 14], gap: 2, src: ["inline"] };
      return { d: [86.5, 86.5], disc: [18.5, 8, 49.5], info: [8, 65.5, 70.5], t: [10, 13] };
    }
    if (ww >= 6) return { d: [275.5, 181], disc: [159.5, 16, 100], info: [16, 20, 131.5], t: [20, 24], lines: 2, a: [12, 17], gap: 4, src: ["y19", 16, 105], prog: [16, 144, 243.5] };
    if (hh >= 6) return { d: [181, 275.5], disc: [26.5, 16, 128], info: [16, 160, 149], t: [18, 22], a: [12, 17], gap: 4, c: true, src: ["y19", 52.5, 212], prog: [16, 238.5, 149] };
    if (ww <= 3 && hh <= 3) return { d: [133.75, 133.75], disc: [33, 12, 67.75], info: [12, 87.75, 109.75], t: [12, 18], a: [10, 14], gap: 2, c: true };
    if (hh <= 3) return { d: [181, 133.75], disc: [56.63, 12, 67.75], info: [12, 87.75, 157], t: [14, 18], a: [10, 14], gap: 2, c: true };
    if (ww <= 3) return { d: [133.75, 181], disc: [18.88, 12, 96], info: [12, 116, 109.75], t: [12, 18], a: [10, 14], gap: 2, c: true };
    return { d: [181, 181], disc: [42.5, 12, 96], info: [28.5, 125, 124], t: [14, 18], a: [10, 14], gap: 2, c: true };
  }

  function r_music(w, W, H, m) {
    var cover = img(m, get(w, "img"));
    var pal = musicPalette(null);   // 커버 픽셀은 그린 뒤 paintMusic이 읽는다
    var L = musicLayout(w.w, w.h);
    var sx = W / L.d[0], sy = H / L.d[1];
    var title = strip(S(or(get(w, "title"), "음악"))), artist = strip(S(or(get(w, "artist"), "")));
    var mediaURL = S(or(get(w, "mediaURL"), ""));
    var provider = T(get(w, "ytId")) ? "YouTube" : /apple|itunes|mzstatic/.test(mediaURL) ? "Apple Music" : "미리듣기";
    function mark(s) {
      if (provider === "YouTube") return '<i class="mu-mk" style="width:' + u(s) + ";height:" + u(s * 0.72) + '">' + YT + "</i>";
      if (provider === "Apple Music") return '<i class="mu-mk am" style="width:' + u(s) + ";height:" + u(s) + ";border-radius:" + u(s * 0.24) + '"><b style="width:' + u(s * 0.6) + ";height:" + u(s * 0.6) + '">' + NOTE + "</b></i>";
      return '<i class="mu-mk pv" style="width:' + u(s) + ";height:" + u(s) + '">' + NOTE + "</i>";
    }
    var out = "";
    // 6×6·6×8 영상형 — 포스터(없으면 커버) + 아래쪽 음영 + 좌하단 서비스명, CD는 경계에 걸친다
    if (L.vh) {
      var poster = img(m, or(get(w, "poster"), get(w, "img")));
      out += '<span class="mu-vid" style="height:' + u(L.vh * sy) + ";border-radius:0 0 " + u(14) + " " + u(14) + '">' +
        (poster ? '<img src="' + esc(poster) + '" alt="" loading="lazy">' : "") + "<i></i>" +
        '<em style="left:' + u(L.vl[0] * sx) + ";top:" + u(L.vl[1] * sy) + ";font-size:" + u(9) + '">' + provider + "</em></span>";
    }
    var d = L.disc[2] * Math.min(sx, sy);
    var dx = L.disc[0] * sx + (L.disc[2] * sx - d) / 2, dy = L.disc[1] * sy + (L.disc[2] * sy - d) / 2;
    var art = cover ? '<img src="' + esc(cover) + '" alt="" loading="lazy">' : "";
    out += '<span class="cd" style="left:' + u(dx) + ";top:" + u(dy) + ";width:" + u(d) + ";height:" + u(d) + '">' +
      '<span class="cd-rot">' + art + '<span class="cd-grooves"></span></span><span class="cd-sheen"></span>' +
      '<span class="cd-hub"></span><span class="cd-hole"></span></span>';
    var t = L.lines > 1
      ? '<b class="ml" style="font-size:' + u(L.t[0]) + ";line-height:" + u(L.t[1]) + ";-webkit-line-clamp:" + L.lines + '">' + esc(title) + "</b>"
      : '<b class="mq" style="font-size:' + u(L.t[0]) + ";line-height:" + u(L.t[1]) + '"><span>' + esc(title) + "</span></b>";
    var a = L.a && artist ? '<span class="mq" style="font-size:' + u(L.a[0]) + ";line-height:" + u(L.a[1]) + '"><span>' + esc(artist) + "</span></span>" : "";
    var inl = L.src && L.src[0] === "inline" ? '<span class="mu-src" style="gap:' + u(5) + ";font-size:" + u(10) + ";height:" + u(17) + ";margin-top:" + u(1) + '">' + mark(16) + "<span>" + provider + "</span></span>" : "";
    out += '<span class="mu-info' + (L.c ? " c" : "") + '" style="left:' + u(L.info[0] * sx) + ";top:" + u(L.info[1] * sy) + ";width:" + u(L.info[2] * sx) + ";gap:" + u(L.gap || 2) + '">' + t + a + inl + "</span>";
    if (L.src && L.src[0] === "y19") {
      var cx = L.c ? L.info[0] : L.src[1];
      out += '<span class="mu-src' + (L.c ? " c" : "") + '" style="left:' + u(cx * sx) + ";top:" + u(L.src[2] * sy) + ";height:" + u(19) + ";gap:" + u(5) + ";font-size:" + u(10) + (L.c ? ";width:" + u(L.info[2] * sx) : "") + '">' + mark(19) + "<b>" + provider + "</b></span>";
    } else if (L.src && L.src[0] === "icon") {
      out += '<span class="mu-src c" style="left:0;right:0;top:' + u(L.src[1] * sy) + ";height:" + u(19) + '">' + mark(19) + "</span>";
    }
    var audio = startsWith(mediaURL, "https://") ? mediaURL : "";
    var attrs = " data-dl";
    if (L.prog) {
      // 진행 막대 — 3pt 트랙 #B8ACB4 · 경과 #6B5579 · 아래 시간 (미리듣기 30초)
      out += '<span class="mu-prog" style="left:' + u(L.prog[0] * sx) + ";top:" + u(L.prog[1] * sy) + ";width:" + u(L.prog[2] * sx) + ";gap:" + u(6) + '">' +
        '<span class="mu-track" style="height:' + u(3) + '"><i></i></span><span class="mu-time" style="font-size:' + u(9) + ";height:" + u(12) + '"><span class="mu-el">0:00</span><span>' + (audio ? "0:30" : "--:--") + "</span></span></span>";
    } else if (audio) {
      out += '<span class="mu-bar" style="left:' + u(14) + ";right:" + u(14) + ";bottom:" + u(9) + ";height:" + u(3) + '"><i></i></span>';
    }
    if (audio) { out += '<audio preload="none" src="' + esc(audio) + '"></audio>'; attrs = ' data-act="music"'; }
    var style = "background:linear-gradient(135deg," + pal[0] + " 0%," + pal[1] + " 48%," + pal[2] + " 100%)";
    return [attrs, out, "음악", title + (artist ? " · " + artist : "") + ", " + provider, style];
  }

  // ── 사진 — 앱 imageView · imageCaption · imageTitleSpec (Figma Splup/Widget/image) ──
  // 제목 크기·줄 수·여백은 크기별 규격, 위치(위·가운데·아래)·정렬·굵게/기울임·글자색은 컴포저 스타일을 따른다.
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
  function r_image(w, W, H, m) {
    var path = img(m, get(w, "img"));
    var title = strip(S(or(get(w, "title"), "")));
    var inner = path ? '<img class="cover" src="' + esc(path) + '" alt="" loading="lazy"><span class="soft"></span>' : '<span class="ph">' + CAMERA + "</span>";
    if (title) {
      var sp = imageTitleSpec(w.w, w.h), st = styleOf(w);
      var row = isStr(get(st, "pos")) ? st.pos[0] : "t";
      var align = lookup({ center: "center", right: "right" }, get(st, "align"), "left");
      var deco = [["underline", "underline"], ["line-through", "strike"]].filter(function (p) { return T(get(st, p[1])); }).map(function (p) { return p[0]; }).join(" ");
      var css = "font-size:" + u(sp[0]) + ";line-height:" + u(sp[1]) + ";-webkit-line-clamp:" + sp[2] + ";color:" + fg(w, "#fff") + ";text-align:" + align +
        ";font-weight:" + (T(get(st, "bold")) ? 700 : 600) + (T(get(st, "italic")) ? ";font-style:italic" : "") + (deco ? ";text-decoration:" + deco : "");
      var pad = sp[3], box;
      if (row === "b") box = 'im-cap b" style="padding:' + u(20) + " " + u(pad) + " " + u(pad);
      else if (row === "m") box = 'im-cap m" style="padding:' + u(pad);
      else box = 'im-cap" style="padding:' + u(pad) + " " + u(pad) + " " + u(20);
      inner += '<div class="' + box + '"><p style="' + css + '">' + escE(title) + "</p></div>";
    }
    return ["", inner, "사진", title];
  }

  function styleOf(w) { return isObj(get(w, "style")) ? w.style : {}; }
  function fg(w, dflt) {
    var c = get(styleOf(w), "fg");
    return isStr(c) && c[0] === "#" && (pyLen(c) === 4 || pyLen(c) === 7) ? c : dflt;
  }

  var TEXT_POS = { tl: ["flex-start", "flex-start"], tc: ["flex-start", "center"], tr: ["flex-start", "flex-end"],
    ml: ["center", "flex-start"], mc: ["center", "center"], mr: ["center", "flex-end"],
    bl: ["flex-end", "flex-start"], bc: ["flex-end", "center"], br: ["flex-end", "flex-end"] };

  /** WidgetContent.textView — 13pt Medium · 줄 간격 0.55em (앱 lineSpacing 13×0.55) */
  function r_text(w, W, H, m) {
    var st = styleOf(w);
    var deco = [["underline", "underline"], ["line-through", "strike"]].filter(function (p) { return T(get(st, p[1])); }).map(function (p) { return p[0]; }).join(" ");
    var pos = lookup(TEXT_POS, get(st, "pos"), ["flex-start", "flex-start"]);
    var align = lookup({ center: "center", right: "right" }, get(st, "align"), "left");
    var css = "padding:" + u(12) + ";font-size:" + u(13) + ";line-height:" + u(22.6) + ";color:" + fg(w, "rgba(18,18,18,.72)") + ";" +
      "justify-content:" + pos[0] + ";align-items:" + pos[1] + ";text-align:" + align + ";" +
      "font-weight:" + (T(get(st, "bold")) ? 700 : 500) + ";" + (T(get(st, "italic")) ? "font-style:italic;" : "") +
      (deco ? "text-decoration:" + deco + ";" : "");
    return ["", '<div class="tx" style="' + css + '"><p>' + escE(get(w, "text")) + "</p></div>", "글", get(w, "text")];
  }

  /** 상태 — 넓으면 이모지 + 한 줄 상태, 정사각이면 이모지 1·3·6개 무늬 (앱 StatusEmojiPattern) */
  function emojiPattern(e, size) {
    var cs = graphemes(e);
    if (cs.length <= 1) return '<span class="ep" style="font-size:' + u(size) + '">' + esc(e) + "</span>";
    var rows = [];
    for (var i = 0; i < cs.length; i += 3) rows.push(cs.slice(i, i + 3));
    var s = size * (rows.length > 1 ? 0.5 : 0.56);
    return '<span class="ep" style="gap:' + u(s * 0.12) + '">' + rows.map(function (r) {
      return '<span style="gap:' + u(s * 0.08) + '">' + r.map(function (c) { return '<i style="font-size:' + u(s) + '">' + esc(c) + "</i>"; }).join("") + "</span>";
    }).join("") + "</span>";
  }
  function r_status(w, W, H, m) {
    var emoji = isStr(get(w, "emoji")) ? w.emoji : "";
    var labelRaw = or(get(w, "label"), get(w, "text"));
    var label = T(labelRaw) ? escE(labelRaw) : "";
    var color = fg(w, "#171719"), inner;
    if (w.w > w.h) {
      inner = '<div class="ss ss-h" style="padding:0 ' + u(14) + ";gap:" + u(9) + '"><span style="font-size:' + u(22) + '">' + esc(emoji) + "</span>" +
        '<b style="font-size:' + u(16) + ";line-height:" + u(21) + ";color:" + color + ';-webkit-line-clamp:2">' + label + "</b></div>";
    } else {
      inner = '<div class="ss" style="gap:' + u(6) + '">' + emojiPattern(emoji, Math.min(W, H) * 0.36) +
        (label ? '<b style="font-size:' + u(13) + ";color:" + color + '">' + label + "</b>" : "") + "</div>";
    }
    return ["", inner, "상태", or(labelRaw, emoji)];
  }

  function r_mood(w, W, H, m) {
    var text = strip(or(get(w, "text"), ""));
    var inner = '<div class="md" style="padding:0 ' + u(14) + ";gap:" + u(10) + '"><span class="md-e" style="font-size:' + u(28) + '">' + esc(or(get(w, "emoji"), "😊")) + "</span>" +
      '<span class="md-col" style="gap:' + u(3) + '"><b style="font-size:' + u(14) + ";line-height:" + u(19) + '">' + escE(or(text, "오늘 기분을 남겨보세요")) + "</b>" +
      '<span style="font-size:' + u(11) + '">오늘의 기분</span></span></div>';
    return ["", inner, "오늘의 기분", text];
  }

  function r_diary(w, W, H, m) {
    var text = strip(or(get(w, "text"), "")), date = strip(or(get(w, "title"), ""));
    var head = '<p class="dy-k" style="font-size:' + u(11) + '"><span>한줄일기</span>' + (date ? "<span>" + esc(date) + "</span>" : "") + "</p>";
    var lines = Math.max(1, floordiv(H - 24 - 20, 25));
    var inner = '<div class="dy" style="padding:' + u(12) + ";gap:" + u(6) + '">' + head +
      '<p class="dy-t" style="font-size:' + u(14) + ";line-height:" + u(25) + ";-webkit-line-clamp:" + lines + '">' + escE(or(text, "오늘을 한 줄로 남겨보세요")) + "</p></div>";
    return ["", inner, "한줄일기", text];
  }

  /** 앱 Date(기준 2001-01-01 UTC 초) → unix ms. 숫자가 아니면 null */
  function appleDate(v) {
    var f;
    try { f = pyFloat(v); } catch (e) { return null; }
    var x = (f + 978307200) * 1000;
    if (x !== x) return null;                              // int(nan) → ValueError
    if (!isFinite(x)) throw new RangeError("overflow");    // int(inf) → OverflowError
    return Math.trunc(x);
  }

  var KST = 9 * 3600e3;
  // ── D-Day — 앱 Views/DDayWidget.swift (2026-10-15 재디자인: 그리드 · 포토 · 그라디언트 · 미니멀 바) ──
  // 숫자가 주인공, 제목·날짜는 보조. 색 = SplupDDayPalette 8모드 [배경, 액센트, 글자, 보조]
  var DD_PAL = {
    purple: ["#F2E8FF", "#AA4AF4", "#582082", "#862FC6"], midnight: ["#421763", "#D6AEFF", "#F2E8FF", "#E5CEFF"],
    cyan: ["#D8F8FB", "#27E5F2", "#153E4B", "#153E4B"], pink: ["#FCE6F6", "#FA97E2", "#541E48", "#A83688"],
    apricot: ["#FFE7D9", "#FF925D", "#582C1B", "#582C1B"], coral: ["#FFE3EB", "#FF5488", "#5A1831", "#B92E5B"],
    yellow: ["#FFF9CE", "#F9F871", "#403E1B", "#403E1B"], lime: ["#EAF5CE", "#B0DE33", "#303F1C", "#303F1C"]
  };
  /** DDaySpec.of — [pad, title, number, date|null, longDate, big, stacked, wide, grid[cols,rows,d,w,h]|null, miniDots, miniBar] */
  function ddSpec(cw, ch) {
    function S_(pad, title, number, date, o) {
      o = o || {};
      return { pad: pad, title: title, number: number, date: date, longDate: !!o.l, big: !!o.b, stacked: !!o.s, wide: !!o.w, grid: o.g || null, miniDots: o.n || 7, miniBar: o.mb || 40 };
    }
    if (cw === 2 && ch === 2) return S_(8, 10, 24, null, { n: 5, mb: 28 });
    if (cw === 4 && ch === 2) return S_(12, 12, 30, 10, { w: 1, n: 8 });
    if (cw === 6 && ch === 2) return S_(12, 13, 34, 11, { w: 1, n: 10 });
    if (cw === 2) return S_(8, 10, 24, 10, { s: 1, n: 6, mb: 32 });
    if (cw === 3 && ch === 3) return S_(12, 12, 34, 10, { n: 7 });
    if (cw === 4 && ch === 3) return S_(12, 13, 38, 11, { l: 1, n: 8 });
    if (cw === 3) return S_(12, 12, 36, 10, { n: 7 });
    if (cw === 4 && ch === 4) return S_(16, 14, 44, 11, { l: 1, b: 1, g: [8, 4, 10.2, 117, 48] });
    if (cw === 6 && ch === 4) return S_(16, 15, 52, 12, { l: 1, b: 1, g: [10, 3, 8.3, 236, 31] });
    if (cw === 4) return S_(16, 14, 48, 12, { l: 1, b: 1, g: [8, 8, 14.3, 133, 139] });
    if (cw === 6 && ch >= 8) return S_(16, 18, 72, 13, { l: 1, b: 1, g: [10, 10, 17.7, 216, 202] });
    if (cw === 6) return S_(16, 16, 64, 12, { l: 1, b: 1, g: [10, 7, 14.1, 217, 116] });
    var nc = Math.floor(Math.min(Math.max(cw, 2), 6) / 2) * 2, nh = Math.min(Math.max(ch, 2), 8);
    if (nc === cw && nh === ch) return S_(12, 12, 34, 10, {});
    return ddSpec(nc, nh);
  }
  function kstDay(ms) { return Math.floor((ms + KST) / 864e5); }
  function ddDays(a, b) { return kstDay(b) - kstDay(a); }
  function r_dday(w, W, H, m) {
    var ms = appleDate(get(w, "date"));
    var now = Date.now(), up = get(w, "ddayUp") === true;
    var sign = "D-Day", value = "";
    if (ms !== null) {
      if (up) { var nu = ddDays(ms, now); if (nu >= 0) { sign = "D+"; value = String(nu); } else { sign = "D−"; value = String(-nu); } }
      else { var n = ddDays(now, ms); if (n !== 0) { sign = n > 0 ? "D−" : "D+"; value = String(Math.abs(n)); } }
    }
    var theme = get(w, "ddayTheme") === "aqua" ? "gradient" : lookup({ grid: "grid", photo: "photo", gradient: "gradient", bar: "bar" }, get(w, "ddayTheme"), "bar");
    var p = DD_PAL[isStr(get(w, "ddayPalette")) && has(DD_PAL, w.ddayPalette) ? w.ddayPalette : "purple"];
    var sp = ddSpec(w.w, w.h), k = Math.max(0.4, W / (47.25 * w.w - 8));
    var photo = theme === "photo" && T(get(w, "img")) ? img(m, w.img) : null;
    var ink = photo ? "#fff" : fg(w, p[2]);
    var sub = photo ? "#fff" : fg(w, theme === "grid" || theme === "bar" ? p[3] : p[2]);
    var showProgress = (theme === "grid" || theme === "bar") && get(w, "ddayProgress") !== false;
    var showDate = sp.date !== null && (!sp.wide || theme === "photo") && ms !== null;
    // 진행률 — 카운트다운 = 시작점→목표일 · 카운트업 = 지난 기념일→다음 기념일
    var progress = 1, milestone = "";
    if (ms !== null) {
      if (up) {
        var d0 = Math.max(0, ddDays(ms, now));
        var nx = Math.min((Math.floor(d0 / 100) + 1) * 100, (Math.floor(d0 / 365) + 1) * 365);
        var pv = Math.max(Math.floor(d0 / 100) * 100, Math.floor(d0 / 365) * 365);
        progress = (d0 - pv) / Math.max(1, nx - pv);
        milestone = nx + "일까지 " + (nx - d0) + "일";
      } else {
        var st = appleDate(get(w, "ddayStart"));
        var start = st !== null ? st : ms - 30 * 864e5;
        progress = Math.min(1, Math.max(0, ddDays(start, now) / Math.max(1, ddDays(start, ms))));
      }
    }
    function dateText(long) {
      if (ms === null) return "";
      var d = new Date(ms + KST), y = d.getUTCFullYear(), mo = ("0" + (d.getUTCMonth() + 1)).slice(-2), da = ("0" + d.getUTCDate()).slice(-2);
      return long ? y + "." + mo + "." + da : mo + "." + da;
    }
    var fsN = sp.number * k, tr = "letter-spacing:" + fx(-0.03 * fsN, 2) + "px;";
    var count = sign === "D-Day" ? '<b class="dd-n" style="font-size:' + u(fsN) + '">D-Day</b>'
      : sp.stacked ? '<b class="dd-n st" style="font-size:' + u(fsN) + '"><span>' + sign + "</span><span>" + value + "</span></b>"
      : '<b class="dd-n" style="font-size:' + u(fsN) + ";gap:" + u(k) + '"><span>' + sign + "</span><span>" + value + "</span></b>";
    var title = strip(S(or(get(w, "title"), "")));
    var head = '<span class="dd-h" style="gap:' + u((sp.big ? 6 : 3) * k) + '">' +
      (title ? '<span class="dd-t" style="font-size:' + u(sp.title * k) + ";line-height:" + u(sp.title * k * 1.3) + '">' + escE(title) + "</span>" : "") + count + "</span>";
    function dateLabel(long) { return '<span class="dd-d" style="font-size:' + u((sp.date || 10) * k) + ";color:" + sub + '">' + dateText(long) + "</span>"; }
    function bar(width, h) {
      return '<span class="dd-bar" style="' + (width ? "width:" + u(width) + ";flex:none;" : "") + "height:" + u(h) + ";background:" + hexA(p[1], 0.18) + '"><i style="width:max(' + u(h) + "," + fx(progress * 100, 2) + "%);background:" + p[1] + '"></i></span>';
    }
    function miniDots() {
      var n = sp.miniDots, on = Math.floor(n * progress) + (progress > 0 ? 1 : 0), out = "";
      for (var i = 0; i < n; i++) out += '<i style="width:' + u(4 * k) + ";height:" + u(4 * k) + ";background:" + (i < Math.min(on, n) ? p[1] : hexA(p[1], 0.18)) + '"></i>';
      return '<span class="dd-dots" style="gap:' + u(3 * k) + '">' + out + "</span>";
    }
    function bigDots() {
      var g = sp.grid, n = g[0] * g[1], on = Math.round(n * progress), d = g[2] * k;
      var hg = g[0] > 1 ? (g[3] * k - g[0] * d) / (g[0] - 1) : 0, vg = g[1] > 1 ? (g[4] * k - g[1] * d) / (g[1] - 1) : 0;
      var rows = "";
      for (var r = 0; r < g[1]; r++) {
        var row = "";
        for (var c = 0; c < g[0]; c++) row += '<i style="width:' + u(d) + ";height:" + u(d) + ";background:" + (r * g[0] + c < on ? p[1] : hexA(p[1], 0.18)) + '"></i>';
        rows += '<span style="gap:' + u(Math.max(1, hg)) + '">' + row + "</span>";
      }
      return '<span class="dd-grid" style="gap:' + u(Math.max(1, vg)) + ";margin-top:" + u(12 * k) + '">' + rows + "</span>";
    }
    var ms_ = up ? '<span class="dd-d" style="font-size:' + u((sp.date || 11) * k) + ";color:" + sub + '">' + milestone + "</span>" : "";
    var footer = "";
    if (showProgress && sp.big) {
      if (theme === "bar") footer = '<span class="dd-col" style="gap:' + u(8 * k) + '">' + (showDate ? dateLabel(sp.longDate) : "") + bar(0, 4 * k) + ms_ + "</span>";
      else footer = '<span class="dd-row">' + (showDate ? dateLabel(sp.longDate) : "") + '<span class="grow"></span>' + ms_ + "</span>";
    } else if (showProgress) {
      var mark = theme === "grid" ? miniDots() : bar(sp.miniBar * k, 3 * k);
      if (sp.stacked) footer = '<span class="dd-col" style="gap:' + u((theme === "grid" ? 8 : 6) * k) + '">' + (theme === "grid" ? mark : "") + (showDate ? dateLabel(false) : "") + (theme === "bar" ? mark : "") + "</span>";
      else if (showDate) footer = '<span class="dd-row">' + dateLabel(sp.longDate) + '<span class="grow"></span>' + mark + "</span>";
      else footer = mark;
    } else if (showDate) footer = dateLabel(sp.longDate);
    var inner, bg = "";
    if (theme === "photo") {
      var tail = sp.wide ? '<span class="dd-row" style="align-items:flex-end">' + head + '<span class="grow"></span>' + (showDate ? dateLabel(false) : "") + "</span>"
        : head + (showDate ? '<span style="margin-top:' + u(4 * k) + '">' + dateLabel(sp.longDate) + "</span>" : "");
      inner = (photo ? '<img class="cover" src="' + esc(photo) + '" alt="" loading="lazy"><span class="dd-scrim"></span>' : "") +
        '<div class="dd2 ph" style="padding:' + u(sp.pad * k) + ";color:" + ink + '">' + tail + "</div>";
      if (!photo) bg = "background:linear-gradient(to bottom right," + p[0] + "," + p[1] + ")";
    } else {
      inner = '<div class="dd2" style="padding:' + u(sp.pad * k) + ";color:" + ink + '">' + head + (showProgress && sp.big && theme === "grid" ? bigDots() : "") +
        '<span class="grow"></span>' + footer + "</div>";
      bg = theme === "gradient" ? "background:linear-gradient(to bottom right," + p[0] + "," + p[1] + ")" : "background:" + p[0];
    }
    var spoken = sign === "D-Day" ? "오늘이 그날" : (sign === "D−" ? "D 마이너스 " : "D 플러스 ") + value + "일";
    return ["", inner, "D-Day", [title, spoken, ms !== null ? dateText(true) : ""].filter(function (x) { return x; }).join(", "), bg || null];
  }
  function hexA(h, a) {
    var c = rgb(h.length === 4 ? "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3] : h);
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  }

  // ── To-do — 앱 Views/TodoWidget.swift TodoTile (2026-10-11 재설계) ──
  // 머리줄(색 점 + 제목) · 작은 타일 = 이번 주 7칸 완료 배지 + 다음 할 일 · 큰 타일 = 섹션 칩 + 할 일
  var TODO_FILL = { pink: "#F0589F", blue: "#3D8BF2", green: "#2EB67D", cocoa: "#A2704C", purple: "#AA4AF4" };
  var TODO_TONAL = { pink: "#FFEAF3", blue: "#E8F1FF", green: "#E3F7EC", cocoa: "#F5EBE3", purple: "#F2E8FF" };
  var TODO_INK = { pink: "#C93A7E", blue: "#2465C4", green: "#18815A", cocoa: "#7E5235", purple: "#862FC6" };
  var TODO_KEYS = ["pink", "blue", "green", "cocoa", "purple"];
  function tdKey(k) { return isStr(k) && has(TODO_FILL, k) ? k : "purple"; }
  function todoBoard(w) {
    var t = get(w, "todo");
    if (isObj(t)) {
      return {
        cats: iter(get(t, "cats")).filter(isObj).map(function (c) { return { id: S(or(get(c, "id"), "")), name: S(or(get(c, "name"), "")), color: tdKey(get(c, "color")) }; }),
        items: iter(get(t, "items")).filter(isObj).map(function (it) { return { id: S(or(get(it, "id"), "")), text: S(or(get(it, "text"), "")), done: get(it, "done") === true, category: isStr(get(it, "category")) ? it.category : null }; }),
        log: iter(get(t, "log")).filter(isObj).map(function (d) { return { category: isStr(get(d, "category")) ? d.category : null, at: appDate(get(d, "at")) }; }).filter(function (d) { return d.at; })
      };
    }
    var items = S(or(get(w, "text"), "")).split("\n").map(function (l) { return l.trim(); }).filter(function (l) { return l; }).map(function (l, i) {
      var c = l[0] === "☑" || l[0] === "☐";
      return { id: "l" + i, text: c ? l.slice(1).trim() : l, done: l[0] === "☑", category: null };
    });
    return { cats: [], items: items, log: [] };
  }
  function todoSections(b, includeEmpty) {
    var known = b.cats.map(function (c) { return c.id; });
    var loose = b.items.filter(function (it) { return !it.category || known.indexOf(it.category) < 0; });
    var out = [];
    if (loose.length || !b.cats.length) out.push({ id: "", name: "할 일", color: "purple", items: loose });
    b.cats.forEach(function (c) {
      var its = b.items.filter(function (it) { return it.category === c.id; });
      if (includeEmpty !== false || its.length) out.push({ id: c.id, name: c.name, color: c.color, items: its });
    });
    return out;
  }
  function dayKey(d) { return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function r_todo(w, W, H, m) {
    var b = todoBoard(w), secs = todoSections(b), pad = 12, compact = H < 150;
    var ordered = [].concat.apply([], secs.map(function (s) { return s.items; }));
    var open = ordered.filter(function (it) { return !it.done; });
    function colorOf(cat) { for (var i = 0; i < b.cats.length; i++) if (b.cats[i].id === cat) return b.cats[i].color; return "purple"; }
    function checkbox(done, key, size) {
      return '<i class="td-cb" style="width:' + u(size) + ";height:" + u(size) + ";border-radius:" + u(size * 0.3) + ";background:" + (done ? TODO_FILL[key] : "#EEEDF2") + '">' + (done ? CHECK : "") + "</i>";
    }
    function row(it) {
      return '<span class="td-r" style="gap:' + u(6) + ";height:" + u(16) + '">' + checkbox(it.done, colorOf(it.category), 13) +
        '<span style="font-size:' + u(11) + '">' + escE(it.text) + "</span></span>";
    }
    var keys = secs.map(function (s) { return s.color; }).concat(TODO_KEYS).slice(0, 4), gd = 12 * 0.42, gg = 12 - gd * 2;
    var dots = '<span class="td-g" style="width:' + u(12) + ";height:" + u(12) + ";gap:" + u(gg) + '">' + keys.map(function (k) { return '<i style="width:' + u(gd) + ";height:" + u(gd) + ";background:" + TODO_FILL[k] + '"></i>'; }).join("") + "</span>";
    var right = "";
    if (compact && W > 240 && open.length) right = escE(open[0].text + (open.length > 1 ? " 외 " + (open.length - 1) : ""));
    else if (compact && open.length > (H >= 125 ? 2 : (H >= 110 ? 1 : 0))) right = "남은 " + open.length;
    var header = '<span class="td-h" style="gap:' + u(6) + ";height:" + u(16) + '">' + dots + '<b style="font-size:' + u(13) + '">' + escE(or(get(w, "title"), "To-do")) + "</b>" +
      (right ? '<span class="grow"></span><em style="font-size:' + u(11) + '">' + right + "</em>" : "") + "</span>";
    function strip7() {
      var now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate()), ws = new Date(today); ws.setDate(today.getDate() - today.getDay());
      var size = Math.min(17, (W - pad * 2) / 7 - 1), order = secs.map(function (s) { return s.id; }), known = b.cats.map(function (c) { return c.id; });
      var out = "";
      for (var i = 0; i < 7; i++) {
        var d = new Date(ws); d.setDate(ws.getDate() + i);
        var isToday = i === today.getDay(), future = d > today;
        var seen = [];
        b.log.forEach(function (x) { if (dayKey(x.at) === dayKey(d)) { var sec = x.category && known.indexOf(x.category) >= 0 ? x.category : ""; if (seen.indexOf(sec) < 0) seen.push(sec); } });
        seen.sort(function (a, c) { return (order.indexOf(a) + 100) % 100 - (order.indexOf(c) + 100) % 100; });
        var ks = seen.map(function (s) { return s ? colorOf(s) : "purple"; }).slice(0, 4), blob;
        if (!ks.length) blob = '<i class="td-e" style="width:' + u(size * 0.8) + ";height:" + u(size * 0.8) + ";border-radius:" + u(size * 0.34) + (future ? ";opacity:.55" : "") + '"></i>';
        else {
          var bs = size * [0, 0.74, 0.62, 0.56, 0.52][ks.length];
          var off = [[[0, 0]], [[-0.17, -0.1], [0.17, 0.1]], [[0, -0.18], [-0.2, 0.14], [0.2, 0.14]], [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]][ks.length - 1];
          blob = ks.map(function (k, j) {
            return '<i class="td-b" style="width:' + u(bs) + ";height:" + u(bs) + ";background:" + TODO_FILL[k] + ";box-shadow:0 0 0 " + u(Math.max(1, size * 0.045)) + " #fff;transform:translate(calc(-50% + " + u(off[j][0] * size) + "),calc(-50% + " + u(off[j][1] * size) + '))">' + CHECK + "</i>";
          }).join("");
        }
        var wc = isToday ? "#171719" : i === 0 ? "#E5484D" : i === 6 ? "#3D7BEA" : "#989ba2";
        out += '<span class="td-d' + (isToday ? " on" : "") + '"><b style="font-size:' + u(9) + ";color:" + wc + (isToday ? ";font-weight:700" : "") + '">' + "일월화수목금토"[i] + '</b><span class="td-bl" style="width:' + u(size) + ";height:" + u(size) + '">' + blob + "</span></span>";
      }
      return '<span class="td-w" style="height:' + u(32) + '">' + out + "</span>";
    }
    var body = "";
    if (compact) {
      body = strip7();
      if (H >= 110) {
        if (!open.length) body += '<span style="font-size:' + u(11) + ';color:#46474c;font-weight:500">' + (b.items.length ? "오늘 할 일을 다 했어요 ✨" : "할 일을 적어보세요") + "</span>";
        else body += '<span class="td-l" style="gap:' + u(5) + '">' + open.slice(0, H >= 125 ? 2 : 1).map(row).join("") + "</span>";
      }
    } else {
      var showStrip = H >= 160, budget = H - pad * 2 - 16 - 8 - (showStrip ? 34 : 0), gap = 6;
      var entries = [];
      todoSections(b, false).forEach(function (s) { entries.push({ chip: s, h: 20 }); s.items.forEach(function (it) { entries.push({ item: it, h: 16 }); }); });
      var fit = function (bud) {
        var used = 0, out = [];
        for (var i = 0; i < entries.length; i++) { var need = entries[i].h + (out.length ? gap : 0); if (used + need > bud) break; used += need; out.push(entries[i]); }
        if (out.length && out[out.length - 1].chip) out.pop();
        return out;
      };
      var total = entries.filter(function (e) { return e.item; }).length, fitted = fit(budget);
      if (fitted.filter(function (e) { return e.item; }).length < total) fitted = fit(budget - 16 - gap);
      var hidden = total - fitted.filter(function (e) { return e.item; }).length;
      if (!fitted.length) body = '<span style="font-size:' + u(11) + ';color:#989ba2">할 일을 적어보세요</span>';
      else {
        body = '<span class="td-l" style="gap:' + u(gap) + '">' + fitted.map(function (e) {
          if (e.chip) return '<span class="td-c" style="height:' + u(20) + '"><b style="font-size:' + u(10) + ";padding:0 " + u(7) + ";height:" + u(18) + ";background:" + TODO_TONAL[e.chip.color] + ";color:" + TODO_INK[e.chip.color] + '">' + escE(e.chip.name) + "</b></span>";
          return row(e.item);
        }).join("");
        if (hidden > 0) {
          var allDone = b.items.length && b.items.every(function (it) { return it.done; });
          body += '<span style="font-size:' + u(11) + ";line-height:" + u(16) + ";font-weight:500;color:" + (allDone ? "#46474c" : "#989ba2") + '">' + (allDone ? "모두 완료 · " + b.items.length + "개" : "+" + hidden + "개 더") + "</span>";
        }
        body += "</span>";
      }
      body += '<span class="grow"></span>' + (showStrip ? strip7() : "");
    }
    var inner = '<div class="td" style="padding:' + u(pad) + ";gap:" + u(8) + '">' + header + body + "</div>";
    return [" data-dl", inner, "To-do", S(or(get(w, "title"), "To-do")) + ", 남은 할 일 " + open.length + "개"];
  }

  function r_place(w, W, H, m) {
    var color = fg(w, "#1f5c4d");
    var inner = '<div class="ss" style="gap:' + u(4) + ";color:" + color + '"><span style="font-size:' + u(22) + '">📍</span>' +
      '<b style="font-size:' + u(13) + ';color:inherit">' + esc(get(w, "label")) + "</b>" +
      '<span class="sub" style="font-size:' + u(11) + '">' + esc(or(get(w, "title"), "동네")) + "</span></div>";
    return ["", inner, "동네", get(w, "label")];
  }

  function r_weather(w, W, H, m) {
    var inner = '<div class="ss wt" style="gap:' + u(3) + '"><span style="font-size:' + u(28) + '">' + esc(or(get(w, "emoji"), "☀️")) + "</span>" +
      '<b style="font-size:' + u(16) + '">' + esc(get(w, "title")) + "</b>" +
      '<span class="sub" style="font-size:' + u(11) + '">' + esc(get(w, "label")) + "</span></div>";
    return ["", inner, "날씨", S(or(get(w, "title"), "")) + " " + S(or(get(w, "label"), ""))];
  }

  function r_voice(w, W, H, m) {
    var bars = [6, 12, 18, 9, 15, 7, 13, 10].map(function (h) { return '<i style="height:' + u(h) + '"></i>'; }).join("");
    var inner = '<div class="vo" style="gap:' + u(8) + '"><span class="vo-bars" style="gap:' + u(2.5) + '">' + bars + "</span>" +
      '<span class="vo-t" style="font-size:' + u(11) + ";gap:" + u(5) + '"><i>▶</i>' + esc(or(get(w, "label"), "0:12")) + "</span></div>";
    return [' data-dl data-msg="voice"', inner, "음성 메모", get(w, "label")];
  }

  function r_gif(w, W, H, m) {
    var path = img(m, get(w, "img"));
    if (path) return ["", '<img class="cover" src="' + esc(path) + '" alt="" loading="lazy">', "GIF", get(w, "title")];
    var inner = '<div class="ss gf" style="gap:' + u(5) + '"><span style="font-size:' + u(28) + '">' + esc(get(w, "emoji")) + "</span>" +
      '<span class="sub" style="font-size:' + u(11) + '">GIF</span></div>';
    return ["", inner, "GIF", get(w, "title")];
  }

  function r_nowplaying(w, W, H, m) {
    var bars = [9, 15, 6, 12].map(function (h) { return '<i style="height:' + u(h) + '"></i>'; }).join("");
    var inner = '<div class="np" style="padding:0 ' + u(14) + ";gap:" + u(11) + '"><span class="np-bars" style="gap:' + u(2.5) + ";height:" + u(16) + '">' + bars + "</span>" +
      '<span class="np-col" style="gap:' + u(3) + '"><b style="font-size:' + u(14) + ";line-height:" + u(19) + '">' + esc(get(w, "title")) + "</b>" +
      '<span style="font-size:' + u(11) + '">' + esc(get(w, "artist")) + " · 지금 듣는 중</span></span></div>";
    return ["", inner, "지금 듣는 중", S(or(get(w, "title"), "")) + " · " + S(or(get(w, "artist"), ""))];
  }

  /** 방명록 글 [{name, handle, message}] — 앞이 최신 */
  function gbEntries(w) {
    var out = [];
    iter(or(get(w, "entries"), [])).forEach(function (e) {
      if (isObj(e) && strip(S(or(get(e, "message"), "")))) {
        out.push({ name: strip(S(or(get(e, "name"), get(e, "handle"), ""))), handle: lstripAt(strip(S(or(get(e, "handle"), "")))).toLowerCase(),
          message: strip(S(e.message)) });
      }
    });
    return out;
  }

  function r_guestbook(w, W, H, m) {
    var entries = gbEntries(w);
    var small = W < 110, fs = small ? 9 : 12, pad = small ? 6 : 10;
    var title = or(get(w, "title"), "다녀간 마음");
    var content;
    if (!entries.length) {
      content = '<p class="gb" style="font-size:' + u(fs) + ";line-height:" + u(fs * 1.45) + ";padding:" + u(pad) + ";border-radius:" + u(10) + '">' +
        "첫 안부를 기다려요.<br>짧은 한 줄을 남겨봐.</p>";
      return [' data-dl data-msg="guestbook"', serviceTile(W, H, "방명록", title, "첫 안부를 남겨봐", content), "방명록", title];
    }
    var e = entries[0];
    var lines = H < 150 ? 2 : small ? 6 : 3;
    var people = m.people || {};
    var pic = e.handle && T(get(people, e.handle)) ? img(m, people[e.handle], 96) : null;
    var av = pic && !small && H >= 160 ? '<img class="gb-av" src="' + esc(pic) + '" alt="" style="width:' + u(16) + ";height:" + u(16) + ";border-radius:" + u(5) + '">' : "";
    var who = H >= 150 ? '<span class="gb-from" style="font-size:' + u(small ? 10 : 11) + ";gap:" + u(4) + '">' + av + "from. " + esc(e.name) + "</span>" : "";
    content = '<div class="gb gb-on" style="padding:' + u(pad) + ";border-radius:" + u(10) + ";gap:" + u(4) + '">' +
      '<p style="font-size:' + u(fs) + ";line-height:" + u(fs * 1.45) + ";-webkit-line-clamp:" + lines + '">' + esc(e.message) + "</p>" + who + "</div>";
    return [' data-dl data-msg="guestbook"', serviceTile(W, H, "방명록", title, "from. " + e.name + " · 안부 남기기", content), "방명록",
      S(title) + ", " + e.name + ": " + e.message];
  }

  function r_collection(w, W, H, m) {
    var titles = splitLines(or(get(w, "text"), "")).filter(function (t) { return strip(t); }).slice(0, 6);
    var emojis = ["🎬", "📀", "📚", "🍿", "🎞", "📖"];
    var cards = titles.map(function (t, i) {
      return '<span class="cl-c" style="border-radius:' + u(7) + ";gap:" + u(2) + '"><i style="font-size:' + u(17) + '">' + emojis[i % 6] + "</i>" +
        '<b style="font-size:' + u(11) + '">' + esc(t) + "</b></span>";
    }).join("");
    var inner = '<div class="cl" style="padding:' + u(12) + ";gap:" + u(7) + '"><p style="font-size:' + u(11) + '">' + esc(or(get(w, "title"), "취향 콜렉션")) + "</p>" +
      '<div class="cl-g" style="gap:' + u(5) + '">' + cards + "</div></div>";
    return ["", inner, "취향 콜렉션", get(w, "title")];
  }

  function r_playlist(w, W, H, m) {
    var songs = splitLines(or(get(w, "text"), "")).filter(function (t) { return strip(t); }).slice(0, 3);
    var bars = [8, 13, 6].map(function (h) { return '<i style="height:' + u(h) + '"></i>'; }).join("");
    var rows = songs.map(function (t, i) { return '<p class="pls-r" style="font-size:' + u(11) + ";gap:" + u(7) + '"><span>' + (i + 1) + "</span><b>" + esc(t) + "</b></p>"; }).join("");
    var inner = '<div class="pls" style="padding:' + u(12) + ";gap:" + u(8) + '"><p class="pls-h" style="gap:' + u(5) + ";font-size:" + u(13) + '">' +
      '<span class="np-bars" style="gap:' + u(2) + ";height:" + u(13) + '">' + bars + "</span><b>" + esc(or(get(w, "title"), "플레이리스트")) + "</b></p>" +
      rows + '<span class="grow"></span><p class="pls-f" style="font-size:' + u(11) + '">탭해서 듣기</p></div>';
    return [" data-dl", inner, "플레이리스트", get(w, "title")];
  }

  var TYPE_NAMES = { gif: "GIF", social: "소셜", guestbook: "방명록", diary: "일기", dday: "디데이", nowplaying: "지금 듣는 곡",
    place: "장소", weather: "날씨", steps: "걸음 수", qna: "오늘의 질문", ghost: "고스트", voice: "음성",
    bucket: "버킷리스트", todo: "To-do", collection: "컬렉션", playlist: "플레이리스트", poke: "콕 찌르기",
    secret: "비밀", together: "같이 있었어", vintageCamera: "빈티지 카메라" };

  function r_generic(w, W, H, m) {
    var path = img(m, get(w, "img"));
    var name = lookup(TYPE_NAMES, w.type, "위젯");
    if (path) return [" data-dl", '<img class="cover" src="' + esc(path) + '" alt="" loading="lazy"><span class="soft"></span>', name, get(w, "title")];
    var e = esc(or(get(w, "emoji"), "✨"));
    var t = esc(or(get(w, "title"), get(w, "text"), get(w, "label"), name));
    return [" data-dl", '<div class="ss" style="gap:' + u(6) + '"><span style="font-size:' + u(30) + '">' + e + '</span><b style="font-size:' + u(13) + '">' + t + "</b></div>", name, get(w, "title")];
  }

  var RENDER = { block: r_block, video: r_video, sticker: r_sticker, polaroid: r_polaroid, paparazzi: r_paparazzi,
    ask: r_ask, ditto: r_ditto, music: r_music, image: r_image, status: r_status, mood: r_mood, text: r_text,
    diary: r_diary, dday: r_dday, place: r_place, weather: r_weather, voice: r_voice, gif: r_gif,
    nowplaying: r_nowplaying, guestbook: r_guestbook, collection: r_collection, playlist: r_playlist, todo: r_todo };
  // 기본 바탕 (AppState.widgetBg) — style.bg가 있으면 그것이 먼저
  var BG = { block: "#fff", todo: "#fff", video: "linear-gradient(225deg,#3a4a63,#24304a 50%,#161d2e)", sticker: "#fef4f7",
    polaroid: "#fff", paparazzi: "#fff", ask: "#fff", ditto: "#e9d8f5", image: "#e7e4ee", status: "#fff",
    mood: "#f1e3a7", text: "#f3eefb", guestbook: "#fff", qna: "#fff", diary: "#d7e39d", dday: "#d9d4f9",
    nowplaying: "#141317", place: "#b8e9df", weather: "linear-gradient(#d7effe,#d1e2fd 33%,#bfcdf6 68%,#a0c6f1 84%,#d8e7f9)",
    voice: "#fdf1d7", gif: "#f1e3a7", collection: "#1d1e24", playlist: "#17181d" };

  /** 대표 플래터 → HTML. 위젯이 없으면 빈 문자열 */
  function render(widgets, media) {
    if (!widgets || !widgets.length) return "";
    var m = media || {};
    if (!m.image) m.image = function () { return null; };
    if (!m.exists) m.exists = function () { return null; };
    var rows = Math.max.apply(null, widgets.map(function (w) { return w.row + w.h; }));
    var grid_h = rows * UNIT - GUT;
    var tiles = widgets.map(function (w) {
      var sz = sizePx(w), W = sz[0], H = sz[1], res;
      var fn = isStr(w.type) && has(RENDER, w.type) ? RENDER[w.type] : r_generic;
      try { res = fn(w, W, H, m); } catch (e) { if (root.DITTO_DEBUG) console.error(w.type, e); res = r_generic(w, W, H, m); }
      var attrs = res[0], inner = res[1], kind = res[2], label = res[3];
      var style = res.length > 4 ? res[4] : null;
      var st = styleOf(w), bgv = get(st, "bg");
      var custom = isStr(bgv) && bgv[0] === "#" && (pyLen(bgv) === 4 || pyLen(bgv) === 7) ? bgv : null;
      var bg = style || "background:" + (custom || lookup(BG, w.type, "#f1eaff"));
      // 디토 가능 상태 (DittoAvailability.of — allow이고 디토 위젯 자체가 아닐 것)
      var available = get(w, "allow") === true && w.type !== "ditto";
      if (available && attrs.indexOf(" data-act") < 0) attrs = ' data-dl data-msg="ditto"';
      // 가능 = 뒤 후광만 · 불가 = 1px 테두리 (음악은 자체 테두리)
      var state = available ? " glow" : (w.type !== "music" ? " hl" : "");
      var name = kind + (T(label) ? ", " + S(label) : "");
      var role = attrs ? ' role="button" tabindex="0" aria-label="' + esc(name) + '"' : ' role="img" aria-label="' + esc(name) + '"';
      var pos = "left:" + fx(w.col * UNIT / DESIGN_W * 100, 3) + "%;top:" + fx(w.row * UNIT / grid_h * 100, 3) + "%;" +
        "width:" + fx(W / DESIGN_W * 100, 3) + "%;height:" + fx(H / grid_h * 100, 3) + "%;border-radius:" + u(radius(w)) + ";" + bg;
      var live = w.type === "nowplaying" ? " np-live" : "";
      return '<div class="w w-' + esc(w.type) + state + live + '" style="' + pos + '"' + role + attrs + ">" + inner + "</div>";
    });
    // 앱 친구 플래터처럼 바탕 위에 바로 놓는다 — 별도 컨테이너·제목 없음
    return '<section class="platter" id="platter" aria-label="대표 플래터">' +
      '<div class="pl" style="aspect-ratio:' + pyFloatRepr(DESIGN_W) + " / " + fx(grid_h, 2) + '">' + tiles.join("") + "</div></section>" +
      '<div id="platterEnd" aria-hidden="true"></div>';
  }

  /** 그린 뒤 음악 커버 색으로 바탕을 다시 칠한다 (빌드 때 PIL로 읽던 것). CORS로 못 읽으면 회색 그대로 */
  function paintMusic(rootEl) {
    if (typeof document === "undefined") return;
    [].forEach.call((rootEl || document).querySelectorAll(".w-music .cd-rot img"), function (el) {
      var tile = el.closest(".w-music"), src = el.getAttribute("src");
      if (!tile || !src) return;
      var im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = function () {
        try {
          var c = document.createElement("canvas");
          c.width = c.height = 64;
          var g = c.getContext("2d", { willReadFrequently: true });
          g.imageSmoothingEnabled = true;
          g.drawImage(im, 0, 0, 64, 64);
          var d = g.getImageData(0, 0, 64, 64).data, px = [];
          for (var i = 0; i < d.length; i += 4) {
            px.push([d[i], d[i + 1], d[i + 2]]);   // 알파는 버린다 (PIL convert("RGB")와 같게)
          }
          var p = musicPalette(px);
          tile.style.background = "linear-gradient(135deg," + p[0] + " 0%," + p[1] + " 48%," + p[2] + " 100%)";
        } catch (e) { /* 캔버스를 못 읽으면 기본 색 */ }
      };
      im.src = src;
    });
  }

  /** 그린 뒤 다듬기 — 글자 크기·이미지 비율을 알아야 하는 것들. 화면 폭이 바뀌면 다시 부른다.
   *  · 유튜브 4:3 썸네일의 검은 띠 자르기 (가운데 16:9만 타일을 채운다)
   *  · 남는 높이를 채우는 본문(data-fit) — 들어가는 줄 수만큼 보여 주고 마지막 줄에서 말줄임 (앱 포스트 위젯)
   *  · 한 줄 제목이 넘치면 흘려서 전부 보여 준다 (앱 MarqueeText) */
  function finish(rootEl) {
    if (typeof document === "undefined") return;
    var r = rootEl || document;
    [].forEach.call(r.querySelectorAll("img.vd-poster[data-yt]"), function (el) {
      function crop() {
        var nw = el.naturalWidth, nh = el.naturalHeight, tile = el.parentNode;
        if (!nw || !nh || Math.abs(nw / nh - 4 / 3) > 0.02 || !tile) return;
        var W = tile.clientWidth, H = tile.clientHeight, a = 16 / 9, iw, ih;
        if (!W || !H) return;
        if (W / H >= a) { iw = W; ih = W / a * 4 / 3; } else { iw = H * a; ih = H * a * 3 / 4; }
        el.style.objectFit = "fill"; el.style.inset = "auto";
        el.style.width = (iw / W * 100) + "%"; el.style.height = (ih / H * 100) + "%";
        el.style.left = ((W - iw) / 2 / W * 100) + "%"; el.style.top = ((H - ih) / 2 / H * 100) + "%";
      }
      if (el.complete) crop(); else el.addEventListener("load", crop, { once: true });
    });
    [].forEach.call(r.querySelectorAll("[data-fit]"), function (el) {
      el.style.webkitLineClamp = "none"; el.style.lineClamp = "none"; el.style.maxHeight = "";
      var lh = parseFloat(getComputedStyle(el).lineHeight) || 20;
      var n = Math.max(1, Math.floor((el.clientHeight + 1) / lh));
      // 줄 수 제한만 걸면 상자가 더 클 때 다음 줄이 반쯤 보인다 — 높이도 그 줄 수에 맞춘다
      el.style.webkitLineClamp = String(n); el.style.lineClamp = String(n); el.style.maxHeight = (n * lh) + "px";
    });
    [].forEach.call(r.querySelectorAll(".mq"), function (el) {
      var s = el.firstElementChild;
      el.classList.remove("run");
      if (!s) return;
      var over = s.scrollWidth - el.clientWidth;
      if (over > 2) {
        el.classList.add("run");
        el.style.setProperty("--mq", (-over - 12) + "px");
        el.style.setProperty("--mqd", Math.max(4, (over + 12) / 18 + 3).toFixed(1) + "s");
      }
    });
  }

  // 앱 에셋 (assets/app/) — 이름 → 확장자. platter.Media가 Assets.xcassets에서 찾던 것
  var APP_ASSETS = {
    "av-flare-1": "jpg", "av-flare-10": "jpg", "av-flare-11": "jpg", "av-flare-12": "jpg", "av-flare-13": "jpg",
    "av-flare-14": "jpg", "av-flare-15": "jpg", "av-flare-16": "jpg", "av-flare-17": "jpg", "av-flare-18": "jpg",
    "av-flare-19": "jpg", "av-flare-2": "jpg", "av-flare-20": "jpg", "av-flare-21": "jpg", "av-flare-22": "jpg",
    "av-flare-23": "jpg", "av-flare-24": "jpg", "av-flare-25": "jpg", "av-flare-26": "jpg", "av-flare-27": "jpg",
    "av-flare-28": "jpg", "av-flare-29": "jpg", "av-flare-3": "jpg", "av-flare-30": "jpg", "av-flare-31": "jpg",
    "av-flare-32": "jpg", "av-flare-33": "jpg", "av-flare-34": "jpg", "av-flare-35": "jpg", "av-flare-36": "jpg",
    "av-flare-37": "jpg", "av-flare-38": "jpg", "av-flare-39": "jpg", "av-flare-4": "jpg", "av-flare-40": "jpg",
    "av-flare-5": "jpg", "av-flare-6": "jpg", "av-flare-7": "jpg", "av-flare-8": "jpg", "av-flare-9": "jpg",
    "av-palette-coral-red": "jpg", "av-palette-cyan-blue": "jpg", "av-palette-deep-purple": "jpg", "av-palette-gold-yellow": "jpg", "av-palette-lime-green": "jpg",
    "av-palette-mint-lime": "jpg", "av-palette-neutral-gray": "jpg", "av-palette-peach-yellow": "jpg", "av-palette-pink-coral": "jpg", "av-palette-purple-pink": "jpg",
    "img-avatar-1": "jpg", "img-avatar-2": "jpg", "img-avatar-3": "jpg", "img-avatar-4": "jpg", "img-mock-bed": "jpg",
    "img-mock-dog": "jpg", "img-mock-statue": "jpg", "img-mock-woman": "jpg", "img-profile-1": "png", "img-widget-1": "jpg",
    "sticker-d-keyring-blue": "png", "sticker-d-keyring-purple": "png", "sticker-d-logo-mint": "png", "sticker-d-logo-pink": "png", "sticker-d-logo-purple": "png",
    "sticker-ditto-appicon": "png", "sticker-seed-camera": "png", "sticker-seed-dog": "png", "sticker-seed-statue": "png", "sw-mock-friends": "jpg",
    "sw-mock-portrait": "jpg", "sw-mock-sunset": "jpg"
  };
  function assetURL(name) { return isStr(name) && has(APP_ASSETS, name) ? "/assets/app/" + name + "." + APP_ASSETS[name] : null; }

  var api = { render: render, handleStyle: handleStyle, handleTone: handleTone, musicPalette: musicPalette,
    paintMusic: paintMusic, finish: finish, appAssets: APP_ASSETS, assetURL: assetURL, gbEntries: gbEntries, dittoLayout: dittoLayout };
  root.DittoPlatter = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
