const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const viewports = [{ name: 'mobile', width: 390, height: 844 }, { name: 'desktop', width: 1365, height: 900 }];

  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      page.on('pageerror', error => failures.push(`${viewport.name}: ${error.message}`));
      const response = await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
      if (!response || !response.ok()) throw new Error(`${viewport.name}: HTTP page load failed`);
      await page.waitForFunction(() => document.title.includes('DEFLECT'), { timeout: 15000 });
      await page.waitForSelector('canvas', { timeout: 15000 });
      if (!(await page.locator('#menu').isVisible())) throw new Error(`${viewport.name}: start menu is not visible`);
      await page.locator('#startBtn').click();
      await page.waitForFunction(() => {
        const menu = document.querySelector('#menu');
        return menu && (getComputedStyle(menu).display === 'none' || getComputedStyle(menu).visibility === 'hidden' || Number(getComputedStyle(menu).opacity) === 0);
      }, { timeout: 10000 });
      await page.waitForTimeout(1500);
      if (failures.length) throw new Error(failures.join('\n'));
      console.log(`PASS ${viewport.name}: game loads, canvas renders, arena starts, no page errors`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
