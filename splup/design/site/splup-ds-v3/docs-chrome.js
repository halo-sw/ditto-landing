/* Docs chrome v4 — builds the section sidebar, cover cards and plain crumbs
   on top of the existing hash router. Routing itself stays in index.html. */
(function () {
  var shell = document.querySelector(".shell");
  var topbar = document.querySelector(".topbar");
  if (!shell || !topbar) return;

  /* ── Header actions: docs-bar.js builds the shared bar (theme toggle); search joins its actions. ── */
  var actions = topbar.querySelector(".docs-actions");
  if (!actions) { actions = document.createElement("div"); actions.className = "docs-actions"; topbar.appendChild(actions); }
  var search = topbar.querySelector(".top-search");
  if (search) actions.appendChild(search);

  /* ── Sidebar: one list per header section ── */
  var SECTIONS = [
    { group: "foundations", home: "foundations" },
    { group: "components", home: "components" },
    { group: "widgets", home: "widgets" },
    { group: "writing", home: "patterns" },
    { group: "brand", home: "brand" },
    { group: "reference", home: "resources" }
  ];
  /* Pages that render inside another page's article (aliases in the router). */
  var ALIAS = { "multi-palette": "brand-graphics" };
  function pageTitle(id) {
    var h = document.querySelector("#page-" + id + " h1");
    return h ? h.textContent.trim() : id;
  }
  var side = document.createElement("nav");
  side.className = "docs-side";
  side.setAttribute("aria-label", "섹션 문서");
  var pageToGroup = {};
  SECTIONS.forEach(function (s) {
    var box = document.createElement("div");
    box.className = "docs-side-group";
    box.dataset.group = s.group;
    box.hidden = true;
    var ids = [s.home];
    document.querySelectorAll("#page-" + s.home + " .docs-index-list > a").forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      if (ids.indexOf(id) === -1) ids.push(id);
    });
    (s.extra || []).forEach(function (id) { if (ids.indexOf(id) === -1 && document.getElementById("page-" + id)) ids.push(id); });
    ids.forEach(function (id, i) {
      var a = document.createElement("a");
      a.href = "#" + id;
      a.dataset.page = ALIAS[id] || id;
      a.dataset.anchor = id;
      a.textContent = i === 0 ? "개요" : (document.querySelector('#page-' + s.home + ' .docs-index-list > a[href="#' + id + '"] strong') || {}).textContent || pageTitle(id);
      box.appendChild(a);
      pageToGroup[ALIAS[id] || id] = pageToGroup[ALIAS[id] || id] || s.group;
    });
    side.appendChild(box);
  });
  shell.insertBefore(side, shell.firstChild);

  function syncSide() {
    var page = shell.dataset.page || "overview";
    var hash = location.hash.slice(1);
    var group = pageToGroup[page];
    side.querySelectorAll(".docs-side-group").forEach(function (box) { box.hidden = box.dataset.group !== group; });
    var links = side.querySelectorAll("a"), exact = null;
    links.forEach(function (a) { if (a.dataset.anchor === hash) exact = a; });
    links.forEach(function (a) {
      var on = exact ? a === exact : (a.dataset.page === page && a.dataset.anchor === page);
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    tidyCrumbs();
  }
  new MutationObserver(syncSide).observe(shell, { attributes: true, attributeFilter: ["data-page"] });
  window.addEventListener("hashchange", syncSide);

  /* ── Crumbs: plain section name, no arrow ── */
  function tidyCrumbs() {
    document.querySelectorAll(".page .docs-back").forEach(function (a) {
      a.textContent = a.textContent.replace(/^←\s*/, "");
    });
  }

  /* ── Cover cards: each cover shows a real sample of what the page documents ──
     Component pages use their Figma component capture, widget pages use the app's widget tile,
     foundation and reference pages draw a small specimen from the same values the page describes.
     No metaphor objects: if a reader can't tell the page from its cover, the cover is wrong. */
  var C = { brand: "#AA4AF4", deep: "#6655D2", pink: "#FA97E2", night: "#8C2BD6", rose: "#FF5488", coral: "#FF925D" };
  function img(src, cls) { return '<img class="cv-img ' + (cls || "") + '" src="' + src + '" alt="" loading="lazy" decoding="async">'; }
  var shot = function (n, cls) { return img((/^cmp-/.test(n) ? "cover-assets/real/" + n + ".webp" : "component-assets/" + n + ".png"), cls || "cv-shot"); };
  var tile = function (n) { return img("cover-assets/real/" + n + ".webp", "cv-tile"); };
  var tiles = function (ns) { return '<span class="cv-row">' + ns.map(tile).join("") + "</span>"; };
  var sw = function (list) { return '<span class="cv-row">' + list.map(function (c) { return '<span class="cv-sw" style="background:' + c + '"></span>'; }).join("") + "</span>"; };
  var btn = function (label, st) { return '<span class="cv-btn ' + (st || "") + '">' + label + "</span>"; };
  var row = function (a, b) { return '<span class="cv-line"><span class="k">' + a + '</span><span class="v">' + b + "</span></span>"; };
  var COVER = {
    /* 파운데이션 */
    foundations: '<span class="cv-stack">' + sw([C.brand, C.deep, C.pink, C.rose, C.coral]) + '<span class="cv-type">가 Aa</span></span>',
    color: '<span class="cv-stack">' + sw([C.brand, C.deep, C.pink, C.night]) + '<span class="cv-cap">#AA4AF4 · #6655D2 · #FA97E2 · #8C2BD6</span></span>',
    "color-application": '<span class="cv-stack">' + btn("추가하기") + '<span class="cv-chip">선택됨</span></span>',
    typography: '<span class="cv-stack cv-left"><span style="font-size:30px;font-weight:700;letter-spacing:-.02em">통하면 디토해</span><span style="font-size:18px;font-weight:600">통하면 디토해</span><span style="font-size:13px">통하면 디토해 · 24 / 18 / 13</span></span>',
    spacing: '<span class="cv-gaps">' + [4, 8, 16, 24].map(function (g) { return '<span><i style="width:' + g * 2 + 'px"></i><em>' + g + "</em></span>"; }).join("") + "</span>",
    radius: '<span class="cv-row">' + [8, 14, 20].map(function (r) { return '<span class="cv-rad" style="border-radius:' + r + 'px"><em>' + r + "</em></span>"; }).join("") + "</span>",
    motion: '<svg class="cv-svg" viewBox="0 0 160 90" aria-hidden="true"><path d="M8 82 C 70 82, 70 8, 152 8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><circle cx="8" cy="82" r="4" fill="' + C.brand + '"/><circle cx="152" cy="8" r="4" fill="' + C.brand + '"/></svg>',
    interaction: '<span class="cv-row">' + btn("기본") + btn("눌림", "is-press") + btn("비활성", "is-off") + "</span>",
    zindex: '<span class="cv-layers"><span>화면</span><span>시트</span><span>토스트</span></span>',
    darkmode: '<span class="cv-split"><span>Aa</span><span>Aa</span></span>',
    /* 컴포넌트: Figma 컴포넌트 캡처 그대로 */
    components: '<span class="cv-stack">' + shot("button-primary") + shot("cmp-chip-filter", "cv-shot cv-small") + "</span>",
    buttons: shot("button-primary"), "ditto-action": shot("cmp-ditto-hold"), chips: shot("cmp-chip-filter", "cv-shot cv-small"),
    menu: shot("menu-row-toggle"), inputs: shot("cmp-editor-field"), "photo-picker": shot("cmp-sheet"),
    feedback: shot("cmp-toast"), dialog: shot("cmp-dialog"), navigation: shot("cmp-top-bar"),
    comments: shot("cmp-comment-row"), chat: shot("cmp-chat-bubble"),
    "profile-handles": '<span class="cv-handles">' + ["rep", "life"].map(function (k) { return '<span class="cv-handle ' + k + '"><span class="cv-av">' + img("cover-assets/real/person-fallback.svg") + '</span><span class="cv-hn"><span>하은</span><span>@haeunzip</span></span></span>'; }).join("") + "</span>",
    "profile-avatars": '<span class="cv-avs">' + img("cover-assets/real/avatar-photo.webp") + '<span class="cv-av-fb">' + img("cover-assets/real/person-fallback.svg") + "</span>" + img("cover-assets/real/av-flare-1.webp") + "</span>",
    /* 위젯: 앱 위젯 타일 */
    widgets: tiles(["wg-image", "wg-music", "wg-todo"]),
    "widget-system": '<span class="cv-grid"><span style="grid-column:span 2;grid-row:span 2"></span><span style="grid-column:span 4;grid-row:span 2"></span><span style="grid-column:span 4;grid-row:span 4"></span><span style="grid-column:span 2;grid-row:span 4"></span></span>',
    grid: '<span class="cv-grid cv-dots"><span style="grid-column:1/5;grid-row:1/3"></span><span style="grid-column:5/7;grid-row:1/5"></span><span style="grid-column:1/3;grid-row:3/5"></span></span>',
    "widget-catalog": tiles(["wg-text", "wg-music", "wg-dday"]),
    "widget-ditto": '<span class="cv-stack">' + tile("wg-image") + '<span class="cv-chip">디토 허용 3개</span></span>',
    "widget-todo": tiles(["wg-todo"]), "widget-guestbook": tiles(["wg-guestbook"]),
    "music-search": shot("cmp-music-search-row"), "widget-manage": shot("manage-ditto-allow"),
    "post-widget": shot("cmp-post-card"), "sticker-board": tiles(["wg-sticker"]),
    /* 글쓰기: 문서에 실린 예시 문장 */
    patterns: '<span class="cv-bubbles"><span>내 플래터에 담았어요.</span><span class="me">변경 내용을 저장했어요.</span></span>',
    voice: '<span class="cv-bubbles"><span>디토 · 주파수 · 플래터</span><span class="me">내 플래터에 담았어요.</span></span>',
    writing: '<span class="cv-bubbles"><span class="me">변경 내용을 저장했어요.</span></span>',
    /* 브랜드 */
    brand: '<span class="cv-wm"></span>',
    "brand-graphics": img("cover-assets/appicon-purple.webp", "cv-icon"),
    assets: '<span class="cv-files"><span>wordmark-black.svg</span><span>wordmark-white.svg</span><span>appicon.png</span></span>',
    "og-images": img("cover-assets/real/og-guide-splup.webp", "cv-og"),
    /* 자료 */
    resources: '<span class="cv-list">' + row("color.brand.splup", "#AA4AF4") + row("t7", "20 / 27") + row("10.25", "다크 지면 무채색") + "</span>",
    "app-flow": '<span class="cv-flow"><span>가입</span><i></i><span>플래터</span><i></i><span>디토</span></span>',
    tokens: '<span class="cv-list">' + row("color.brand.splup", "#AA4AF4") + row("color.brand.deep", "#6655D2") + row("color.brand.platterPink", "#FA97E2") + "</span>",
    mapping: '<span class="cv-map"><s>19</s><span class="ar">→</span><span class="to">20</span><em>기존 제목 크기 → t7</em></span>',
    roadmap: '<span class="cv-list">' + row("10.25", "다크 지면 무채색") + row("10.19", "정보 구조 6묶음") + row("10.13", "컬러 3.3.3") + "</span>",
    audit: '<span class="cv-list">' + row("2026-08", "코드 전수 검토") + "</span>",
    backlog: '<span class="cv-list cv-checks">' + row("☐", "추가할 문서") + row("☐", "보강할 규격") + "</span>"
  };
  var KIND = { foundations: "spec", components: "shot", widgets: "tile", writing: "spec", brand: "art", reference: "spec" };
  function coverFor(href) {
    var key = href.replace(/^.*[#/]/, "").replace(/\.html$/, "");
    var span = document.createElement("span");
    span.className = "docs-cover cv-" + (KIND[pageToGroup[key]] || "spec") + (key === "brand" ? " cv-brand" : "");
    span.setAttribute("aria-hidden", "true");
    span.innerHTML = COVER[key] || "";
    var wm = span.querySelector(".cv-wm"), logo = document.querySelector(".topbar .logo .wm");
    if (wm && logo) wm.appendChild(logo.cloneNode(true));
    return span;
  }
  document.querySelectorAll(".docs-index-list > a, .docs-topic-list > a").forEach(function (a) {
    if (a.querySelector(".docs-cover")) return;
    a.insertBefore(coverFor(a.getAttribute("href")), a.firstChild);
  });

  var tocTitle = document.querySelector(".toc-t");
  if (tocTitle) tocTitle.textContent = "목차";

  syncSide();
})();
