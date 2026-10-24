/* 공개 프로필 대표 플래터 렌더러 — scripts/platter.py 의 render()·r_*를 브라우저용으로 옮긴 것.
 *
 *   같은 위젯 입력이면 platter.py와 같은 마크업·클래스·인라인 스타일을 만든다 (404.html의 위젯 CSS를 그대로 쓴다).
 *   파이썬 동작(참/거짓 판정 · str() · round() · 소수 서식 · 잘못된 값이면 r_generic으로 대체)까지 맞춘다.
 *   platter.py를 고치면 이 파일도 같이 고친다.
 *
 *   window.DittoPlatter = {
 *     render(widgets, media)  → HTML 문자열 (위젯이 없으면 "")
 *     handleStyle(값)         → .handle 인라인 스타일 (profiles.handle_color)
 *     handleTone(값)          → [top, bottom, ink]
 *     musicPalette(pixels)    → [top, mid, bottom] (pixels = 64×64 [r,g,b] 배열 또는 null)
 *     paintMusic(root)        → 그린 뒤 음악 커버 색을 읽어 바탕을 다시 칠한다 (가능할 때만, 렌더를 막지 않음)
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

  function r_block(w, W, H, m) {
    var tiny = w.w <= 2 && w.h <= 2, large = w.w >= 6 && w.h >= 4;
    var horizontal = w.h <= 2 && !tiny, compact = w.h <= 3;
    var pad = tiny ? 8 : large ? 16 : 12;
    var emoji_h = (tiny || compact || horizontal) ? 24 : 32;
    var emoji_size = emoji_h === 24 ? 20 : 24;
    var big_src = w.w >= 4 && w.h >= 4;
    var body_fs = large ? 17 : 14, body_lh = large ? 26 : 20;
    var src_fs = big_src ? 14 : 12, src_lh = big_src ? 20 : 16;
    var emoji = strip(or(get(w, "emoji"), ""));
    var source = get(w, "title") != null ? strip(or(get(w, "title"), "")) : "나의 아카이브 함";
    var avail = H - 2 * pad - (T(source) ? (!tiny ? 8 : 4) + src_lh : 0);
    var lines = Math.max(1, floordiv(horizontal || !T(emoji) ? avail : avail - emoji_h - 4, body_lh));
    var e = T(emoji) ? '<span class="bl-emoji" style="font-size:' + u(emoji_size) + ";height:" + u(emoji_h) + '">' + esc(emoji) + "</span>" : "";
    var body = '<p class="bl-text" style="font-size:' + u(body_fs) + ";line-height:" + u(body_lh) + ";-webkit-line-clamp:" + lines + '">' + esc(get(w, "text")) + "</p>";
    var src = T(source) ? '<p class="bl-src" style="font-size:' + u(src_fs) + ";line-height:" + u(src_lh) + '"><span>' + esc(source) + "</span>›</p>" : "";
    return ["", '<div class="bl' + (horizontal ? " bl-h" : "") + '" style="padding:' + u(pad) + ";gap:" + u(tiny ? 4 : 8) + '"><div class="bl-main">' + e + body + "</div>" + src + "</div>", "글", get(w, "text")];
  }

  function r_video(w, W, H, m) {
    var poster = img(m, or(get(w, "img"), get(w, "poster")));
    var src = m.exists(get(w, "videoPath")) || null;
    var title = or(get(w, "title"), "");
    var padx = w.w >= 3 ? 16 : 12, pady = w.w >= 3 ? 14 : 10;
    var im = poster ? '<img class="cover" src="' + esc(poster) + '" alt="" loading="lazy">' : "";
    var vid = src ? '<video class="cover vd" src="' + esc(src) + '" playsinline muted preload="none"' + (poster ? ' poster="' + esc(poster) + '"' : "") + "></video>" : "";
    var inner = im + vid + '<div class="vd-shade"></div>' +
      '<p class="vd-title" style="font-size:' + u(17) + ";line-height:" + u(24) + ";padding:" + u(pady) + " " + u(padx) + ' 0">' + esc(title) + "</p>" +
      '<span class="vd-yt" style="width:' + u(20) + ";height:" + u(14.4) + ";right:" + u(14) + ";bottom:" + u(12) + '">' + YT + "</span>";
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

  // MusicCDPLayout — 디자인 좌표 [dw, dh, disc, info, ts, as]
  function musicLayout(ww, hh) {
    if (ww <= 2 && hh <= 2) return [86.5, 86.5, [18.5, 8, 49.5], [8, 65.5, 70.5], [10, 13], null];
    if (ww <= 2) return [86.5, 275.5, [12, 16, 62.5], [12, 102, 62.5], [14, 18], [11, 16]];
    if (hh <= 2) return ww >= 6 ? [275.5, 86.5, [205, 16, 54.5], [16, 12, 177], [17, 20], [12, 17]]
                                : [181, 86.5, [106.5, 12, 62.5], [12, 16.75, 82.5], [14, 18], [10, 14]];
    if (ww >= 6 && hh >= 6) return [275.5, 275.5, [159.5, 16, 100], [16, 128, 243.5], [22, 26], [13, 18]];
    if (ww >= 6) return [275.5, 181, [159.5, 16, 100], [16, 20, 131.5], [20, 24], [12, 17]];
    if (hh >= 6) return [181, 275.5, [26.5, 16, 128], [16, 160, 149], [18, 22], [12, 17]];
    if (ww <= 3 && hh <= 3) return [133.75, 133.75, [33, 12, 67.75], [12, 87.75, 109.75], [12, 18], [10, 14]];
    if (hh <= 3) return [181, 133.75, [56.63, 12, 67.75], [12, 87.75, 157], [14, 18], [10, 14]];
    if (ww <= 3) return [133.75, 181, [18.88, 12, 96], [12, 116, 109.75], [12, 18], [10, 14]];
    return [181, 181, [42.5, 12, 96], [28.5, 125, 124], [14, 18], [10, 14]];
  }

  function r_music(w, W, H, m) {
    var cover = img(m, get(w, "img"));
    var pal = musicPalette(null);   // 커버 픽셀은 그린 뒤 paintMusic이 읽는다
    var ww = w.w, hh = w.h, L = musicLayout(ww, hh);
    var dw = L[0], dh = L[1], disc = L[2], info = L[3], ts = L[4], as_ = L[5];
    var sx = W / dw, sy = H / dh;
    var centered = !(hh <= 2 && ww >= 4) && !(ww >= 6 && hh < 6);
    var d = disc[2] * Math.min(sx, sy);
    var dx = disc[0] * sx + (disc[2] * sx - d) / 2, dy = disc[1] * sy;
    var art = cover ? '<img src="' + esc(cover) + '" alt="" loading="lazy">' : "";
    var disc_html = '<span class="cd" style="left:' + u(dx) + ";top:" + u(dy) + ";width:" + u(d) + ";height:" + u(d) + '">' +
      '<span class="cd-rot">' + art + '<span class="cd-grooves"></span></span><span class="cd-sheen"></span>' +
      '<span class="cd-hub"></span><span class="cd-hole"></span></span>';
    var title = esc(get(w, "title")), artist = esc(get(w, "artist"));
    var info_html = '<span class="mu-info' + (centered ? " c" : "") + '" style="left:' + u(info[0] * sx) + ";top:" + u(info[1] * sy) + ";width:" + u(info[2] * sx) + '">' +
      '<b style="font-size:' + u(ts[0]) + ";line-height:" + u(ts[1]) + '">' + title + "</b>" +
      (as_ && artist ? '<span style="font-size:' + u(as_[0]) + ";line-height:" + u(as_[1]) + '">' + artist + "</span>" : "") + "</span>";
    var audio = startsWith(S(or(get(w, "mediaURL"), "")), "https://") ? get(w, "mediaURL") : "";
    var extra = "", attrs = " data-dl";
    if (T(audio)) {
      extra = '<audio preload="none" src="' + esc(audio) + '"></audio>' +
        '<span class="mu-bar" style="left:' + u(14) + ";right:" + u(14) + ";bottom:" + u(9) + ";height:" + u(3) + '"><i></i></span>';
      attrs = ' data-act="music"';
    }
    var style = "background:linear-gradient(135deg," + pal[0] + " 0%," + pal[1] + " 48%," + pal[2] + " 100%)";
    return [attrs, disc_html + info_html + extra, "음악", S(or(get(w, "title"), "")) + " · " + S(or(get(w, "artist"), "")), style];
  }

  function r_image(w, W, H, m) {
    var path = img(m, get(w, "img"));
    var title = strip(or(get(w, "title"), ""));
    var inner = path ? '<img class="cover" src="' + esc(path) + '" alt="" loading="lazy"><span class="soft"></span>' : '<span class="ph">' + CAMERA + "</span>";
    if (title) {
      var fs = w.w <= 2 ? 12 : (w.w <= 3 || w.h <= 2) ? 14 : 17;
      var pad = w.w <= 2 ? 8 : w.w <= 4 ? 12 : 16;
      inner += '<p class="im-title" style="font-size:' + u(fs) + ";padding:" + u(pad) + " " + u(pad) + " " + u(20) + '">' + esc(title) + "</p>";
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

  /** WidgetContent.textView */
  function r_text(w, W, H, m) {
    var st = styleOf(w);
    var deco = [["underline", "underline"], ["line-through", "strike"]].filter(function (p) { return T(get(st, p[1])); }).map(function (p) { return p[0]; }).join(" ");
    var pos = lookup(TEXT_POS, get(st, "pos"), ["flex-start", "flex-start"]);
    var align = lookup({ center: "center", right: "right" }, get(st, "align"), "left");
    var css = "padding:" + u(12) + ";font-size:" + u(13) + ";line-height:" + u(20) + ";color:" + fg(w, "rgba(18,18,18,.72)") + ";" +
      "justify-content:" + pos[0] + ";align-items:" + pos[1] + ";text-align:" + align + ";" +
      "font-weight:" + (T(get(st, "bold")) ? 700 : 500) + ";" + (T(get(st, "italic")) ? "font-style:italic;" : "") +
      (deco ? "text-decoration:" + deco + ";" : "");
    return ["", '<div class="tx" style="' + css + '"><p>' + esc(get(w, "text")) + "</p></div>", "글", get(w, "text")];
  }

  function r_status(w, W, H, m) {
    var e = esc(get(w, "emoji")), label = esc(or(get(w, "label"), get(w, "text")));
    var color = fg(w, "#171719"), inner;
    if (w.w > w.h) {
      inner = '<div class="ss ss-h" style="padding:0 ' + u(14) + ";gap:" + u(9) + '"><span style="font-size:' + u(22) + '">' + e + "</span>" +
        '<b style="font-size:' + u(16) + ";color:" + color + '">' + label + "</b></div>";
    } else {
      inner = '<div class="ss" style="gap:' + u(6) + '"><span style="font-size:' + u(28) + '">' + e + "</span>" +
        '<b style="font-size:' + u(13) + ";color:" + color + '">' + label + "</b></div>";
    }
    return ["", inner, "상태", or(get(w, "label"), get(w, "text"))];
  }

  function r_mood(w, W, H, m) {
    var text = strip(or(get(w, "text"), ""));
    var inner = '<div class="md" style="padding:0 ' + u(14) + ";gap:" + u(10) + '"><span class="md-e" style="font-size:' + u(28) + '">' + esc(or(get(w, "emoji"), "😊")) + "</span>" +
      '<span class="md-col" style="gap:' + u(3) + '"><b style="font-size:' + u(14) + ";line-height:" + u(19) + '">' + esc(or(text, "오늘 기분을 남겨보세요")) + "</b>" +
      '<span style="font-size:' + u(11) + '">오늘의 기분</span></span></div>';
    return ["", inner, "오늘의 기분", text];
  }

  function r_diary(w, W, H, m) {
    var text = strip(or(get(w, "text"), "")), date = strip(or(get(w, "title"), ""));
    var head = '<p class="dy-k" style="font-size:' + u(11) + '"><span>한줄일기</span>' + (date ? "<span>" + esc(date) + "</span>" : "") + "</p>";
    var lines = Math.max(1, floordiv(H - 24 - 20, 25));
    var inner = '<div class="dy" style="padding:' + u(12) + ";gap:" + u(6) + '">' + head +
      '<p class="dy-t" style="font-size:' + u(14) + ";line-height:" + u(25) + ";-webkit-line-clamp:" + lines + '">' + esc(or(text, "오늘을 한 줄로 남겨보세요")) + "</p></div>";
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
  function r_dday(w, W, H, m) {
    var ms = appleDate(get(w, "date"));
    var label = "D-DAY";
    if (ms !== null) {
      var t = ms + KST;
      if (t < -62135596800000 || t >= 253402300800000) throw new RangeError("date");   // 1~9999년 밖
      var n = Math.floor(t / 864e5) - Math.floor((Date.now() + KST) / 864e5);
      label = n > 0 ? "D-" + n : n === 0 ? "D-DAY" : (n < -365 ? "1년+" : "D+" + (-n));
    }
    var fs = label.length <= 4 ? 26 : 21;   // 'D-DAY'·'D+123'은 2칸 폭에 한 줄로
    var attr = ms !== null ? ' data-dday="' + ms + '" data-fs="' + fx(26 * 100 / DESIGN_W, 3) + '"' : "";
    var inner = '<div class="dd" style="gap:' + u(4) + '"><b' + attr + ' style="font-size:' + u(fs) + '">' + label + "</b>" +
      '<span style="font-size:' + u(11) + '">' + esc(get(w, "title")) + "</span></div>";
    return ["", inner, "D-Day", S(or(get(w, "title"), "")) + " " + label];
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
    nowplaying: r_nowplaying, guestbook: r_guestbook, collection: r_collection, playlist: r_playlist };
  // 기본 바탕 (AppState.widgetBg) — style.bg가 있으면 그것이 먼저
  var BG = { block: "rgba(112,115,124,.08)", video: "linear-gradient(225deg,#3a4a63,#24304a 50%,#161d2e)", sticker: "#fef4f7",
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
      try { res = fn(w, W, H, m); } catch (e) { res = r_generic(w, W, H, m); }
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
    paintMusic: paintMusic, appAssets: APP_ASSETS, assetURL: assetURL, gbEntries: gbEntries, dittoLayout: dittoLayout };
  root.DittoPlatter = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
