// Fotografa as cenas do render.html (Chromium sem tela, WebGL por software).
// Uso: node shoot.cjs <url-da-pasta-tools/3d> <pasta-de-saída> <cena1> <cena2> ...
// Ex.: SCALE=1 node shoot.cjs http://127.0.0.1:8080/tools/3d ./png torre escritorio
const { chromium } = require('playwright');

(async () => {
  const [, , base, outDir, ...names] = process.argv;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const name of names) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const logs = [];
    page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text().slice(0, 300)); });
    page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
    const started = Date.now();
    await page.goto(`${base}/render.html?scene=${name}&scale=${process.env.SCALE || 1}`);
    await page.waitForFunction(() => window.done === true, null, { timeout: 180000 });
    await page.locator('canvas').screenshot({ path: `${outDir}/${name}.png` });
    console.log(name, `${Date.now() - started} ms`, logs.length ? `\n  ${logs.join('\n  ')}` : '');
    await page.close();
  }
  await browser.close();
})();
