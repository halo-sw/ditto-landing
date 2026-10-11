#!/usr/bin/env node
// ditto.at 링크 미리보기(OG) — 고정 이미지 세트를 HTML로 그려 assets/og/ 에 저장한다.
//   브랜드:  /assets/og-landing.png (히어로, 손대지 않음) · brand-download.png · brand-404.png
//   가이드:  guide-splup.png · guide-nav-sheets.png · guide-ditto-ds.png · guide-motion.png
//   시안:    demo-index.jpg (assets/rooms/ 방 캡처 10장)
// 프로필 미리보기(/og/{아이디}.jpg · /demo/{아이디}/og.jpg)는 scripts/build_site.py 의 og_image()가 그린다.
//
// 규격 (Splup 가이드 › 자료 › 링크 미리보기): 1200×630 · 핵심 내용은 가운데 1080×560 안전 영역 ·
// 파일 300KB 이하 · 그래픽은 PNG, 사진이 많으면 JPEG.
//
//   node scripts/og_static.mjs            # 전부
//   node scripts/og_static.mjs guide-motion brand-404
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.DITTO_PLAYWRIGHT || '/Users/halo.axz-pc/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets/og');
const W = 1200, H = 630;

const wmPaths = fs.readFileSync(path.join(ROOT, 'assets/wordmark.svg'), 'utf8')
  .match(/<path [^>]*?\/?>/g).map(p => p.replace(/\/?>$/, '/>')).join('').replace(/fill="[^"]*"/g, 'fill="currentColor"');
const wm = (h, color) => `<svg viewBox="0 0 370 134" style="height:${h}px;width:${Math.round(h * 370 / 134)}px;color:${color};display:block" aria-hidden="true">${wmPaths}</svg>`;
const dataUrl = (file, type) => `data:${type};base64,${fs.readFileSync(path.join(ROOT, file)).toString('base64')}`;

const BASE = `
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");
@import url("https://fonts.googleapis.com/css2?family=Nunito:ital,wght@1,800;1,900&display=block");
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{position:relative;font-family:Pretendard,sans-serif;-webkit-font-smoothing:antialiased;letter-spacing:-.02em;word-break:keep-all}
h1{text-wrap:balance}
.en{font-family:Nunito,sans-serif;font-style:italic;font-weight:900;letter-spacing:.02em}
/* 안전 영역 1080×560 */
.safe{position:absolute;left:60px;top:35px;width:1080px;height:560px}
`;

// ── 브랜드: og-landing 과 같은 대각 그라디언트 · 화이트 워드마크 · 하트 ──
const BRAND_BG = `background:linear-gradient(118deg,#9C6CDA 0%,#B97ED9 36%,#D995D0 70%,#F4CFE4 100%)`;
const heart = (x, y, s, o) => `<svg style="position:absolute;left:${x}px;top:${y}px;width:${s}px;height:${s}px;opacity:${o};filter:blur(${s / 30}px)" viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.2 0 3.7 1.2 5.3 3 1.6-1.8 3.1-3 5.3-3 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21Z" fill="#fff"/></svg>`;
const brandLeft = (eyebrow, title, sub) => `
<div style="position:absolute;left:96px;top:0;bottom:0;width:560px;display:flex;flex-direction:column;justify-content:center;gap:0">
  ${wm(104, '#fff')}
  <p class="en" style="margin-top:34px;font-size:24px;color:rgba(255,255,255,.82);text-transform:uppercase">${eyebrow}</p>
  <h1 style="margin-top:8px;font-size:70px;line-height:1.12;font-weight:800;color:#fff;text-shadow:0 6px 24px rgba(80,20,120,.18)">${title}</h1>
  <p style="margin-top:22px;font-size:30px;line-height:1.45;font-weight:600;color:rgba(255,255,255,.92)">${sub}</p>
</div>`;

const ICON = dataUrl('apple-touch-icon.png', 'image/png');
const pages = {
  'brand-download': () => `<body style="${BRAND_BG}">
  ${heart(600, 40, 110, .32)}${heart(1080, 470, 70, .25)}
  ${brandLeft('ditto.at/download', '출시 알림 받기', '디토가 나오면 가장 먼저<br>알려 드릴게요')}
  <div style="position:absolute;left:676px;top:150px;width:440px;display:flex;flex-direction:column;gap:16px">
    ${[['지금', '디토가 나왔어요! 💌', '친구들과 서로의 하루를 주고받아 보세요'], ['내일', '친구 15명 모으기', '먼저 온 친구에게 링크를 보내요']].map(([t, a, b], i) => `
    <div style="display:flex;gap:16px;align-items:center;padding:20px 22px;border-radius:30px;background:rgba(255,255,255,${i ? .5 : .82});box-shadow:0 18px 40px -16px rgba(70,20,110,.35);backdrop-filter:blur(20px);transform:scale(${i ? .94 : 1});transform-origin:top center;opacity:${i ? .9 : 1}">
      <img src="${ICON}" style="width:64px;height:64px;border-radius:15px;flex:none" alt="">
      <div style="flex:1;min-width:0">
        <div style="display:flex;justify-content:space-between;font-size:19px;font-weight:600;color:#6E6578"><span>Ditto!</span><span>${t}</span></div>
        <p style="margin-top:3px;font-size:24px;font-weight:700;color:#16121B">${a}</p>
        <p style="margin-top:2px;font-size:20px;font-weight:500;color:#4A4352;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${b}</p>
      </div>
    </div>`).join('')}
    <div style="align-self:flex-start;margin-top:14px;display:flex;align-items:center;gap:10px;height:72px;padding:0 34px;border-radius:999px;background:#16121B;color:#fff;font-size:27px;font-weight:700">출시알림 받기 <span class="en" style="font-size:26px">→</span></div>
  </div>
</body>`,

  'brand-404': () => `<body style="${BRAND_BG}">
  ${heart(560, 30, 120, .3)}${heart(1090, 480, 64, .22)}
  ${brandLeft('ditto.at', '친구가 보낸<br>디토 링크예요', '열어서 친구의 플래터를 구경해요')}
  <div style="position:absolute;left:676px;top:120px;width:440px;height:390px">
    <div style="position:absolute;inset:70px 0 0 30px;display:grid;grid-template-columns:1fr 1fr;gap:14px;transform:rotate(3deg);opacity:.9">
      ${['#F6E7FF', '#FFE3F1', '#EDE4FF', '#FFF0F7'].map((c, i) => `<div style="border-radius:26px;background:${c};box-shadow:0 14px 30px -14px rgba(70,20,110,.35);height:${i % 3 ? 140 : 160}px"></div>`).join('')}
    </div>
    <div style="position:absolute;left:0;top:0;width:440px;height:160px;display:flex;align-items:center;gap:20px;padding:20px;border-radius:40px;background:linear-gradient(180deg,#CAB7F2,#B092ED);box-shadow:0 18px 40px -14px rgba(60,20,110,.45);color:#171719">
      <div style="width:120px;height:120px;border-radius:30px;background:#F1F2F4;display:grid;place-items:center;flex:none"><svg viewBox="0 0 24 24" width="60" height="60"><path d="M12 1.5a6 6 0 0 1 2.07 11.63c2.05.27 3.6.94 4.77 1.82 1.53 1.15 2.32 2.6 2.72 3.77.3.88.08 1.74-.45 2.35-.52.6-1.3.93-2.12.93H5.01c-.82 0-1.6-.34-2.12-.93-.53-.61-.75-1.47-.45-2.35.4-1.17 1.19-2.62 2.72-3.77 1.17-.88 2.72-1.55 4.77-1.82A6 6 0 0 1 12 1.5Z" fill="#8B9099"/></svg></div>
      <div style="flex:1"><p style="font-size:40px;font-weight:500;line-height:1.35">친구</p><p style="font-size:30px;color:rgba(23,23,25,.85)">@아이디</p></div>
    </div>
  </div>
</body>`,
};

// ── 가이드: Splup 문서 스킨 (흰 바탕 · 떠 있는 상단 바 · 표지 카드) ──
const TONES = { purple: ['#AA4AF4', '#F3E6FF', '#6D01B9'], deep: ['#6655D2', '#E4E0FF', '#2D0080'], pink: ['#FA97E2', '#FFF0FB', '#920CB3'], sky: ['#48B5F4', '#F4F9FF', '#2D0080'], night: ['#2D313D', '#C99DF8', '#FA97E2'] };
const MOTIF = { // docs-chrome.js 표지 모티프와 같은 도형 (320×180)
  swatches: c => `<rect x="96" y="40" width="58" height="58" rx="18" fill="${c[1]}"/><circle cx="125" cy="128" r="29" fill="${c[2]}"/><rect x="164" y="40" width="60" height="118" rx="30" fill="${c[1]}" opacity=".75"/>`,
  sheets: c => `<rect x="104" y="14" width="112" height="190" rx="22" fill="${c[1]}" opacity=".55"/><rect x="114" y="26" width="92" height="18" rx="9" fill="${c[1]}"/><rect x="104" y="104" width="112" height="100" rx="22" fill="${c[1]}"/><rect x="146" y="112" width="28" height="5" rx="2.5" fill="${c[0]}" opacity=".5"/><rect x="118" y="130" width="84" height="12" rx="6" fill="${c[2]}" opacity=".7"/><rect x="118" y="150" width="60" height="12" rx="6" fill="${c[2]}" opacity=".45"/>`,
  grid: c => `<rect x="92" y="28" width="60" height="60" rx="14" fill="${c[1]}"/><rect x="160" y="28" width="68" height="60" rx="14" fill="${c[1]}" opacity=".7"/><rect x="92" y="96" width="136" height="56" rx="14" fill="${c[1]}" opacity=".85"/><circle cx="214" cy="138" r="9" fill="${c[2]}"/>`,
  press: c => `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F9F871"/><stop offset=".5" stop-color="#FA97E2"/><stop offset="1" stop-color="#6A99F6"/></linearGradient></defs><rect x="70" y="50" width="180" height="80" rx="40" fill="url(#g)"/><rect x="88" y="62" width="144" height="18" rx="9" fill="#fff" opacity=".35"/><ellipse cx="160" cy="146" rx="70" ry="7" fill="${c[2]}" opacity=".18"/>`,
};
const GUIDE = {
  'guide-splup': ['Splup 디자인 시스템', '색과 글자부터 버튼과 위젯까지,<br>디토 화면을 만드는 기준', 'ditto.at/splup', 'purple', 'swatches'],
  'guide-nav-sheets': ['상단 바와 바텀시트', '56pt 상단 바, 44pt 터치 영역,<br>시트가 올라오는 규칙', 'ditto.at/splup › 상단 바와 바텀시트', 'sky', 'sheets'],
  'guide-ditto-ds': ['Ditto 디자인 시스템', '버튼, 그래픽, 플래터와<br>위젯 반응형 규격', 'ditto.at/splup/ditto', 'pink', 'grid'],
  'guide-motion': ['그라디언트와 젤리 눌림', '선명한 그라디언트 위에서<br>말랑하게 눌리는 버튼', 'ditto.at/splup › 그라디언트와 젤리 눌림', 'deep', 'press'],
};
for (const [id, [title, sub, where, tone, motif]] of Object.entries(GUIDE)) {
  const c = TONES[tone];
  pages[id] = () => `<body style="background:#F3F4F5">
  <div style="position:absolute;inset:0;background:radial-gradient(900px 500px at 100% 0%,${c[1]} 0%,rgba(243,244,245,0) 70%)"></div>
  <div class="safe">
    <div style="position:absolute;left:0;top:0;height:76px;width:470px;display:flex;align-items:center;gap:16px;padding:0 26px;border-radius:999px;background:rgba(255,255,255,.86);box-shadow:0 1px 0 rgba(255,255,255,.6) inset,0 14px 36px -14px rgba(40,10,60,.28),0 0 0 1px rgba(22,18,27,.06)">
      ${wm(36, '#1A1C20')}<span style="font-size:26px;font-weight:600;color:#1A1C20">Splup <span style="color:#555D6D;font-weight:500">디자인 가이드</span></span>
    </div>
    <div style="position:absolute;left:8px;top:150px;width:560px">
      <p class="en" style="font-size:24px;color:${c[0] === '#2D313D' ? '#6D01B9' : c[2]};text-transform:uppercase">Splup guide</p>
      <h1 style="margin-top:10px;font-size:68px;line-height:1.14;font-weight:700;color:#1A1C20">${title}</h1>
      <p style="margin-top:22px;font-size:29px;line-height:1.45;font-weight:500;color:#555D6D">${sub}</p>
    </div>
    <p class="en" style="position:absolute;left:8px;bottom:6px;font-size:24px;font-weight:800;color:#868B94;letter-spacing:.01em">${where}</p>
    <div style="position:absolute;right:0;top:110px;width:450px;height:450px;border-radius:48px;background:${c[0]};overflow:hidden;box-shadow:0 30px 60px -30px rgba(40,10,60,.45)">
      <svg viewBox="40 0 240 216" style="position:absolute;inset:0;width:100%;height:100%">${MOTIF[motif](c)}</svg>
    </div>
  </div>
</body>`;
}

// ── 시안 모아 보기: /demo/ 10명의 방 캡처 ──
pages['demo-index'] = () => {
  const rooms = fs.readdirSync(path.join(ROOT, 'assets/rooms')).filter(f => /^room-\d+/.test(f)).sort();
  const col = (i) => rooms.slice(i * 2, i * 2 + 2).map(f => `<div style="width:130px;height:252px;border-radius:18px;overflow:hidden;background:#fff center top/100% auto no-repeat url(${dataUrl('assets/rooms/' + f, 'image/webp')});box-shadow:0 14px 30px -14px rgba(50,20,80,.4),0 0 0 1px rgba(22,18,27,.05)"></div>`).join('');
  return `<body style="background:linear-gradient(180deg,#F6F2FB,#ECE5F5)">
  <div style="position:absolute;left:84px;top:0;bottom:0;width:330px;display:flex;flex-direction:column;justify-content:center">
    <p class="en" style="font-size:24px;color:#8A3FB8">ditto.at/demo</p>
    <h1 style="margin-top:10px;font-size:76px;line-height:1.1;font-weight:800;color:#16121B">10명의<br>플래터</h1>
    <p style="margin-top:22px;font-size:28px;line-height:1.45;font-weight:600;color:#6D5F7D">실제 서버 데이터로 그린<br>프로필 시안 모음</p>
    <div style="margin-top:44px">${wm(60, '#16121B')}</div>
  </div>
  <div style="position:absolute;left:420px;top:0;display:flex;gap:12px">
    ${[0, 1, 2, 3, 4].map(i => `<div style="display:flex;flex-direction:column;gap:12px;margin-top:${[62, 34, 70, 42, 58][i]}px">${col(i)}</div>`).join('')}
  </div>
</body>`;
};

const want = process.argv.slice(2);
const ids = want.length ? want : Object.keys(pages);
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
try {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  for (const id of ids) {
    if (!pages[id]) throw Error(`unknown og: ${id}`);
    await page.setContent(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${BASE}</style></head>${pages[id]()}</html>`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const ok = await page.evaluate(() => document.fonts.check('900 italic 20px Nunito') && document.fonts.check('700 20px Pretendard'));
    if (!ok) throw Error(`${id}: fonts not loaded`);
    const jpg = id === 'demo-index';
    const file = path.join(OUT, `${id}.${jpg ? 'jpg' : 'png'}`);
    await page.screenshot({ path: file, type: jpg ? 'jpeg' : 'png', ...(jpg ? { quality: 90 } : {}) });
    console.log(`${path.relative(ROOT, file)}  ${(fs.statSync(file).size / 1024).toFixed(0)}KB`);
  }
} finally { await browser.close(); }
