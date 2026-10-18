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

  /* ── Cover cards: a Ditto object on the section's Fluid surface ── */
  // Section → Fluid palette (base + three colours, design/tokens/color-system.json brand.fluidPalettes).
  var FLUID = {
    foundations: ["#d5eefc", "#48B5F4", "#27E5F2", "#398FE8"],
    components: ["#dcd8f5", "#6655D2", "#7841C4", "#AA4AF4"],
    widgets: ["#fee7f8", "#FA97E2", "#FF2CBF", "#FF5488"],
    writing: ["#ffe6da", "#FF925D", "#F9F871", "#FA97E2"],
    brand: ["#ebd5fc", "#AA4AF4", "#6655D2", "#FA97E2"],
    reference: ["#c6f9ee", "#07E7B4", "#F9F871", "#39B9CC"]
  };
  // Page → object (cover-assets/*.webp, from the App Graphics and widget picker objects).
  var COVER = {
    foundations: "appicon-purple", color: "sticker-pack", "color-application": "cds", typography: "newspaper", spacing: "diary",
    radius: "smiley", motion: "frequency", interaction: "camera", zindex: "memo-board", darkmode: "dday",
    components: "card-printer", buttons: "bell", "ditto-action": "logo-charm", chips: "todo", menu: "diary", inputs: "letter",
    "photo-picker": "vintage-camera", feedback: "computer", dialog: "mailbox", navigation: "magnifier", comments: "rolling-paper",
    chat: "radios", "profile-handles": "keyring", "profile-avatars": "mascot",
    widgets: "house", "widget-system": "house-silver", grid: "memo-board", "widget-catalog": "keyring", "widget-ditto": "logo-charm",
    "widget-todo": "todo", "widget-guestbook": "rolling-paper", "music-search": "cds", "widget-manage": "card-box",
    "post-widget": "news-roll", "sticker-board": "sticker-pack",
    patterns: "letter", voice: "radios", writing: "diary",
    brand: "logo-charm", "brand-graphics": "appicon-pink", assets: "card-box", "og-images": "card-printer",
    resources: "card-box", tokens: "diary", mapping: "magnifier", roadmap: "news-roll", audit: "computer", backlog: "todo"
  };
  function seed(key) { var h = 0; for (var i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0; return h; }
  function fluidFor(group, key) {
    var f = FLUID[group] || FLUID.brand, h = seed(key);
    var x1 = 12 + h % 26, y1 = 8 + (h >> 5) % 24, x2 = 70 + (h >> 9) % 22, y2 = 18 + (h >> 13) % 30, x3 = 35 + (h >> 17) % 40;
    return "radial-gradient(62% 78% at " + x1 + "% " + y1 + "%, " + f[1] + "8c, transparent 70%)," +
      "radial-gradient(58% 72% at " + x2 + "% " + y2 + "%, " + f[3] + "80, transparent 70%)," +
      "radial-gradient(80% 70% at " + x3 + "% 104%, " + f[2] + "73, transparent 72%)," + f[0];
  }
  function coverFor(href) {
    var key = href.replace(/^.*[#/]/, "").replace(/\.html$/, "");
    var span = document.createElement("span");
    span.className = "docs-cover";
    span.style.background = fluidFor(pageToGroup[key], key);
    var img = document.createElement("img");
    img.src = "cover-assets/" + (COVER[key] || "logo-charm") + ".webp";
    if (/^appicon/.test(COVER[key] || "")) img.className = "is-icon";
    img.alt = ""; img.loading = "lazy"; img.decoding = "async";
    span.appendChild(img);
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
