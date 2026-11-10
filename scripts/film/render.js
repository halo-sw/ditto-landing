// render frames of the scene deterministically: node vshot.js scene.html outDir fps [onlyTimes]
const { chromium } = require('playwright');
(async () => {
  const [,, scene, out, fps = '30', only] = process.argv;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file://' + scene); await p.waitForLoadState('networkidle'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  const times = only ? only.split(',').map(Number) : Array.from({ length: 12 * +fps }, (_, i) => i / +fps);
  for (let i = 0; i < times.length; i++) {
    await p.evaluate(t => window.render(t), times[i]);
    await p.screenshot({ path: `${out}/${only ? 'k' : 'f'}${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: only ? 80 : 95 });
  }
  console.log('frames', times.length); await b.close();
})();
