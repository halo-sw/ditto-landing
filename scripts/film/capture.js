// Films the three coded app scenes in index.html (platter being arranged, hold-to-ditto, frequency)
// frame by frame under virtual time, so the result is smooth regardless of machine speed.
//
//   python3 -m http.server 8765            (in the repo root)
//   node scripts/film/capture.js <outDir> [scene]     scene = platter | ditto | freq (default: all)
//
// Each scene lands in <outDir>/<scene>/f0000.jpg … at 30 fps. Encode with scripts/film/encode.sh.
const { chromium } = require('playwright');

const FPS = 30;
const SCENES = {
  // from/to: the part of the scene to keep, in seconds after it starts. cam: [time, scale, focusY(0..1)] keyframes.
  platter: { i: 0, from: 0, to: 5.4, bg: 'radial-gradient(70% 80% at 50% 55%,#6A45B8 0%,#2E1C58 60%,#170F2C 100%)', cam: [[0, 1.5, .36], [2.4, 1.5, .44], [5.4, 1.4, .6]] },
  ditto:   { i: 1, from: 0.2, to: 9.0, bg: 'radial-gradient(70% 80% at 50% 55%,#9A3F8C 0%,#451A4C 60%,#1D0F26 100%)', cam: [[0, 1.5, .4], [2.3, 1.5, .44], [3.3, 1.6, .7], [4.1, 1.85, .82], [6.9, 1.95, .84], [7.7, 1.42, .46], [9.0, 1.48, .46]] },
  freq:    { i: 2, from: 1.0, to: 6.2, bg: 'radial-gradient(70% 80% at 50% 55%,#4E50C8 0%,#22235E 60%,#100F2A 100%)', cam: [[0, 1.85, .22], [2.6, 1.95, .24], [4.4, 1.6, .3], [6.2, 1.5, .4]] },
};
const CSS = `
html,body{overflow:hidden!important;background:#110C1A!important}
#gnb,.v6cur{display:none!important}
#concept{display:block!important;position:fixed!important;inset:0!important;z-index:2147483000!important;margin:0!important;padding:0!important;background:var(--cap-bg)!important}
#concept .wrap{max-width:none!important;padding:0!important;height:100%!important}
#concept .open,#concept .cx-side,#concept .cx-pause{display:none!important}
#cxPanel{display:block!important;height:100%!important;margin:0!important;padding:0!important;background:none!important;border:0!important;box-shadow:none!important}
#cxStage{position:absolute!important;inset:0!important;min-height:0!important;border-radius:0!important;background:none!important;display:grid!important;place-items:center!important;transform-origin:50% 50%;will-change:transform}
#cxStage .cx-fig{transition:none!important}
#cxStage .phone{--pw:292px!important;position:relative!important;inset:auto!important;transform:none!important}
#capVig{position:fixed;inset:0;z-index:2147483600;pointer-events:none;background:radial-gradient(120% 90% at 50% 45%,rgba(0,0,0,0) 55%,rgba(0,0,0,.5) 100%)}
`;
const lerp = (a, b, k) => a + (b - a) * k, ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
function camAt(keys, t) {
  let a = keys[0], b = keys[keys.length - 1];
  for (let k = 0; k < keys.length - 1; k++) if (t >= keys[k][0] && t <= keys[k + 1][0]) { a = keys[k]; b = keys[k + 1]; break; }
  const u = b[0] === a[0] ? 1 : ease(Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0]))));
  return [lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
}

(async () => {
  const [,, out, only] = process.argv;
  const fs = require('fs');
  const browser = await chromium.launch();
  for (const name of Object.keys(SCENES)) {
    if (only && only !== name) continue;
    const sc = SCENES[name], dir = `${out}/${name}`; fs.mkdirSync(dir, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => console.log('PAGEERR', e.message));
    // performance.now() ignores virtual time, so scenes that time themselves with it (the 3-second hold) get a clock we advance per frame
    await page.addInitScript(() => {
      let vt = 0; window.__tick = ms => { vt += ms; }; performance.now = () => vt;
      // the scenes stop when their stage leaves the viewport; the zoomed camera would trip that, so everything counts as on screen
      window.IntersectionObserver = class { constructor(cb) { this.cb = cb; } observe(el) { setTimeout(() => this.cb([{ isIntersecting: true, intersectionRatio: 1, target: el }], this), 0); } unobserve() {} disconnect() {} };
    });
    await page.goto('http://localhost:8765/index.html', { waitUntil: 'load' });
    await page.addStyleTag({ content: CSS });
    await page.evaluate(bg => {
      const c = document.getElementById('concept'); c.removeAttribute('hidden'); c.style.setProperty('--cap-bg', bg);
      const v = document.createElement('div'); v.id = 'capVig'; document.body.appendChild(v);
      document.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; });
    }, sc.bg);
    await page.waitForTimeout(1500);
    await page.evaluate(() => Promise.all([...document.querySelectorAll('#cxStage img')].map(i => i.decode ? i.decode().catch(() => {}) : 0)));
    const cdp = await page.context().newCDPSession(page);
    const advance = ms => new Promise(res => { cdp.once('Emulation.virtualTimeBudgetExpired', res); cdp.send('Emulation.setVirtualTimePolicy', { policy: 'advance', budget: ms }); });
    await cdp.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
    await page.evaluate(i => window.__cxQA(i), sc.i);
    if (sc.from > 0) { await page.evaluate(ms => window.__tick(ms), sc.from * 1000); await advance(sc.from * 1000); }
    const n = Math.round((sc.to - sc.from) * FPS); let last = '';
    for (let f = 0; f < n; f++) {
      const t = sc.from + f / FPS, [s, fy] = camAt(sc.cam, t);
      await page.evaluate(([s, fy]) => { const st = document.getElementById('cxStage'), h = st.querySelector('.cx-fig.is-on .phone').getBoundingClientRect().height / (st._s || 1); st._s = s; st.style.transform = `translateY(${(-(fy - .5) * h * s).toFixed(1)}px) scale(${s.toFixed(4)})`; }, [s, fy]);
      await page.screenshot({ path: `${dir}/f${String(f).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 95 });
      await page.evaluate(ms => window.__tick(ms), 1000 / FPS);
      await advance(1000 / FPS);
      const cls = await page.evaluate(() => document.querySelector('#cxStage .cx-fig.is-on .ma').className);
      if (cls !== last) { console.log(name, t.toFixed(2), cls); last = cls; }
    }
    console.log(name, 'frames', n);
    await page.close();
  }
  await browser.close();
})();
