// 웹사이트 자체 집계 (2026-11-09) — 페이지를 연 수와 App Store 버튼을 누른 수만 날짜별 숫자로 센다 (서버 public.web_track).
// 쿠키·저장소·기기 식별자를 쓰지 않고, 주소와 사람은 보내지 않는다. 페이지 이름은 <script data-page="…">, 위치는 링크의 ct 값.
(function () {
  var script = document.currentScript, page = script && script.getAttribute("data-page");
  if (!page || navigator.webdriver || /bot\b|crawl|spider|slurp|facebookexternalhit|kakaotalk-scrap|daumoa|yeti/i.test(navigator.userAgent)) return;
  var TRACK = "https://lisqekczixwzshmpewzq.supabase.co/rest/v1/rpc/web_track", KEY = "sb_publishable_wZhXPAWXra62J60VkWJlhQ_2OPv-Zpf";
  function send(event, place) {
    try {
      fetch(TRACK, {
        method: "POST", keepalive: true, credentials: "omit", referrerPolicy: "no-referrer",
        headers: { "Content-Type": "application/json", apikey: KEY },
        body: JSON.stringify({ p_event: event, p_page: page, p_place: place || "" })
      }).catch(function () {});
    } catch (e) {}
  }
  send("view");
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href*="apps.apple.com"]') : null;
    if (!a) return;
    var place = "";
    try { place = new URL(a.href).searchParams.get("ct") || ""; } catch (err) {}
    send("store", place);
  }, true);
})();
