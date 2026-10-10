/* Docs chrome v4 — builds the section sidebar, theme toggle, cover cards and plain crumbs
   on top of the existing hash router. Routing itself stays in index.html. */
(function () {
  var shell = document.querySelector(".shell");
  var topbar = document.querySelector(".topbar");
  if (!shell || !topbar) return;

  /* ── Theme toggle (per-viewer convenience only) ── */
  var root = document.documentElement;
  try { var saved = localStorage.getItem("splup-theme"); if (saved === "light" || saved === "dark") root.dataset.theme = saved; } catch (e) {}
  var actions = document.createElement("div");
  actions.className = "docs-actions";
  var themeBtn = document.createElement("button");
  themeBtn.type = "button";
  themeBtn.className = "docs-icon-btn";
  themeBtn.setAttribute("aria-label", "밝은 화면과 어두운 화면 전환");
  themeBtn.innerHTML = '<svg class="i-moon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1Z"/></svg>' +
    '<svg class="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg>';
  function isDark() { return root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; }
  themeBtn.addEventListener("click", function () {
    var next = isDark() ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("splup-theme", next); } catch (e) {}
  });
  var search = topbar.querySelector(".top-search");
  actions.appendChild(themeBtn);
  if (search) actions.appendChild(search);
  topbar.appendChild(actions);

  /* ── Sidebar: one list per header section ── */
  var SECTIONS = [
    { group: "colorgraphy", home: "colorgraphy", extra: ["profile-avatars"] },
    { group: "foundations", home: "foundations" },
    { group: "components", home: "components" },
    { group: "brand", home: "patterns" },
    { group: "reference", home: "resources" },
    { group: "migration", home: "roadmap", extra: ["audit", "backlog"] }
  ];
  /* Pages that render inside another page's article (aliases in the router). */
  var ALIAS = { "ditto-action": "color-application", "multi-palette": "brand-graphics" };
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

  /* ── Cover cards ── */
  var TONES = {
    purple: ["#AA4AF4", "#F3E6FF", "#6D01B9"], deep: ["#6655D2", "#E4E0FF", "#2D0080"], pink: ["#FA97E2", "#FFF0FB", "#920CB3"],
    night: ["#2D313D", "#C99DF8", "#FA97E2"], lemon: ["#F9F871", "#6D01B9", "#AA4AF4"], mint: ["#07E7B4", "#0B4F3F", "#F4F9FF"],
    sky: ["#48B5F4", "#F4F9FF", "#2D0080"], coral: ["#FF925D", "#FFF1E8", "#920CB3"], peri: ["#6A99F6", "#F4F9FF", "#2D0080"]
  };
  function svg(inner, bg) { return '<svg viewBox="0 0 320 180" aria-hidden="true" focusable="false"><rect width="320" height="180" fill="' + bg + '"/>' + inner + "</svg>"; }
  var MOTIF = {
    swatches: function (c) { return '<rect x="96" y="40" width="58" height="58" rx="18" fill="' + c[1] + '"/><circle cx="125" cy="128" r="29" fill="' + c[2] + '"/><rect x="164" y="40" width="60" height="118" rx="30" fill="' + c[1] + '" opacity=".75"/>'; },
    type: function (c) { return '<text x="160" y="122" text-anchor="middle" font-family="LINE Seed Sans App,Pretendard,sans-serif" font-weight="700" font-size="92" fill="' + c[1] + '">가A</text><path d="M30 60H290M30 128H290" stroke="' + c[1] + '" stroke-opacity=".45"/>'; },
    bars: function (c) { return [16, 32, 52, 76, 104].map(function (w, i) { return '<rect x="86" y="' + (34 + i * 24) + '" width="' + (w * 1.4) + '" height="14" rx="4" fill="' + c[1] + '" opacity="' + (0.5 + i * 0.12) + '"/>'; }).join(""); },
    stack: function (c) { return '<rect x="150" y="36" width="80" height="80" rx="20" fill="' + c[1] + '"/><rect x="122" y="60" width="80" height="80" rx="20" fill="' + c[1] + '" opacity=".72" stroke="' + c[0] + '" stroke-width="3"/><rect x="94" y="84" width="64" height="64" rx="16" fill="' + c[1] + '" stroke="' + c[0] + '" stroke-width="3"/>'; },
    motion: function (c) { return [0, 1, 2, 3].map(function (i) { return '<circle cx="' + (92 + i * 46) + '" cy="90" r="' + (16 + i * 6) + '" fill="' + c[1] + '" opacity="' + (0.25 + i * 0.25) + '"/>'; }).join(""); },
    press: function (c) { return '<rect x="80" y="62" width="160" height="56" rx="28" fill="' + c[1] + '"/><rect x="128" y="86" width="64" height="8" rx="4" fill="' + c[0] + '" opacity=".55"/><circle cx="236" cy="124" r="10" fill="' + c[2] + '"/>'; },
    ditto: function (c) { return '<rect x="80" y="62" width="160" height="56" rx="28" fill="' + c[1] + '"/><text x="160" y="98" text-anchor="middle" font-family="Pretendard,sans-serif" font-weight="700" font-size="22" fill="' + c[0] + '">디토하기</text><circle cx="236" cy="124" r="10" fill="' + c[2] + '"/>'; },
    halves: function (c) { return '<circle cx="160" cy="90" r="58" fill="' + c[1] + '"/><path d="M160 32a58 58 0 0 1 0 116Z" fill="' + c[2] + '"/>'; },
    grid: function (c) { return '<rect x="92" y="28" width="60" height="60" rx="14" fill="' + c[1] + '"/><rect x="160" y="28" width="68" height="60" rx="14" fill="' + c[1] + '" opacity=".7"/><rect x="92" y="96" width="136" height="56" rx="14" fill="' + c[1] + '" opacity=".85"/>'; },
    bubble: function (c) { return '<rect x="70" y="42" width="128" height="62" rx="31" fill="' + c[1] + '"/><path d="M96 98l-8 22 26-16Z" fill="' + c[1] + '"/><rect x="146" y="92" width="104" height="48" rx="24" fill="' + c[2] + '"/>'; },
    token: function (c) { return '<text x="34" y="74" font-family="ui-monospace,Menlo,monospace" font-weight="700" font-size="26" fill="' + c[1] + '">$color.splup</text><text x="34" y="114" font-family="ui-monospace,Menlo,monospace" font-weight="700" font-size="26" fill="' + c[1] + '" opacity=".75">$spacing.x4</text><text x="34" y="154" font-family="ui-monospace,Menlo,monospace" font-weight="700" font-size="26" fill="' + c[1] + '" opacity=".5">$radius.r16</text>'; },
    blob: function (c) { return '<path d="M118 52c30-26 92-20 104 18 12 36-12 74-52 80-44 6-86-14-86-46 0-20 14-36 34-52Z" fill="' + c[1] + '"/><circle cx="214" cy="56" r="14" fill="' + c[2] + '"/>'; },
    arrows: function (c) { return '<rect x="58" y="62" width="70" height="56" rx="14" fill="' + c[1] + '" opacity=".55"/><path d="M144 90h34m-12-12 12 12-12 12" stroke="' + c[1] + '" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="194" y="62" width="70" height="56" rx="14" fill="' + c[1] + '"/>'; },
    avatar: function (c) { return '<circle cx="160" cy="90" r="54" fill="' + c[1] + '"/><circle cx="160" cy="76" r="18" fill="' + c[0] + '"/><path d="M128 124c6-18 58-18 64 0" fill="' + c[0] + '"/><circle cx="204" cy="128" r="14" fill="' + c[2] + '" stroke="' + c[0] + '" stroke-width="4"/>'; },
    list: function (c) { return [0, 1, 2].map(function (i) { return '<circle cx="96" cy="' + (52 + i * 38) + '" r="9" fill="' + c[1] + '"/><rect x="116" y="' + (45 + i * 38) + '" width="' + (110 - i * 20) + '" height="14" rx="7" fill="' + c[1] + '" opacity=".7"/>'; }).join(""); }
  };
  var COVER = {
    color: ["purple", "swatches"], "color-application": ["night", "ditto"], "brand-graphics": ["pink", "blob"], "profile-avatars": ["peri", "avatar"],
    typography: ["deep", "type"], spacing: ["lemon", "bars"], radius: ["pink", "stack"], motion: ["sky", "motion"], interaction: ["purple", "press"],
    zindex: ["coral", "stack"], darkmode: ["night", "halves"],
    "profile-handles": ["peri", "avatar"], buttons: ["mint", "press"], "ditto-action": ["purple", "ditto"], "widget-system": ["pink", "grid"],
    grid: ["lemon", "grid"], voice: ["coral", "bubble"], writing: ["sky", "bubble"],
    tokens: ["night", "token"], assets: ["purple", "blob"], mapping: ["mint", "arrows"],
    colorgraphy: ["purple", "swatches"], foundations: ["deep", "type"], components: ["pink", "grid"], patterns: ["lemon", "bubble"],
    resources: ["night", "token"], roadmap: ["mint", "list"], "navigation-sheets": ["sky", "stack"]
  };
  function coverFor(href) {
    var key = href.replace(/^.*[#/]/, "").replace(/\.html$/, "");
    var spec = COVER[key] || ["purple", "blob"], tone = TONES[spec[0]];
    var span = document.createElement("span");
    span.className = "docs-cover";
    span.style.setProperty("--cv-bg", tone[0]);
    span.innerHTML = svg(MOTIF[spec[1]](tone), tone[0]);
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
