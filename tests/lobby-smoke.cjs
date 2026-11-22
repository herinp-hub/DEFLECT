const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const viewports = [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'desktop', width: 1365, height: 900 }
  ];

  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      page.on('pageerror', error => failures.push(`${viewport.name}: ${error.stack || error.message}`));
      const response = await page.goto('http://127.0.0.1:4173/?deflectTest=1', { waitUntil: 'domcontentloaded' });
      if (!response?.ok()) throw new Error(`${viewport.name}: page load failed`);
      await page.waitForSelector('canvas', { timeout: 20000 });
      await page.waitForSelector('#deflectMp', { timeout: 20000 });
      await page.waitForFunction(() => !!window.__DEFLECT_MP_BRIDGE__?.getLobbyPortalAnchorsForTest, undefined, { timeout: 10000 });

      const geometry = await page.evaluate(() => window.__DEFLECT_MP_BRIDGE__.getLobbyPortalAnchorsForTest());
      if (!geometry?.shop || !geometry?.training) throw new Error(`${viewport.name}: portal anchors unavailable`);
      const shopSupport = await page.evaluate(({x,z}) => window.__DEFLECT_MP_BRIDGE__.isLobbyPositionSupportedForTest(x,z), {
        x: geometry.shop[0],
        z: geometry.shop[2]
      });
      console.log(`TRACE ${viewport.name} shop=${JSON.stringify(geometry.shop)} supported=${shopSupport} specialObjects=${JSON.stringify(geometry.specialObjects)}`);
      if (shopSupport !== true) throw new Error(`${viewport.name}: shop entrance has no walkable floor: ${JSON.stringify(geometry.shopFloor)}`);

      const shopPosition = [geometry.shop[0], 18.2, geometry.shop[2]];
      const movedToShop = await page.evaluate(position => window.__DEFLECT_MP_BRIDGE__.setPlayerStateForTest(position, 0), shopPosition);
      if (!movedToShop) throw new Error(`${viewport.name}: could not move test player to shop entrance`);
      await page.waitForTimeout(250);
      const atShop = await page.evaluate(() => window.__DEFLECT_MP_BRIDGE__.getLocalState().position);
      if (Math.hypot(atShop[0] - shopPosition[0], atShop[2] - shopPosition[2]) > 1.5) {
        throw new Error(`${viewport.name}: shop access was blocked; player=${JSON.stringify(atShop)} shop=${JSON.stringify(shopPosition)}`);
      }

      const behindLobby = [29.5, 18.2, -40];
      const movedBehind = await page.evaluate(position => window.__DEFLECT_MP_BRIDGE__.setPlayerStateForTest(position, 0), behindLobby);
      if (!movedBehind) throw new Error(`${viewport.name}: could not run off-island boundary test`);
      await page.waitForTimeout(250);
      const afterBoundary = await page.evaluate(() => window.__DEFLECT_MP_BRIDGE__.getLocalState().position);
      if (Math.hypot(afterBoundary[0] - shopPosition[0], afterBoundary[2] - shopPosition[2]) > 1.5) {
        throw new Error(`${viewport.name}: player escaped the island; player=${JSON.stringify(afterBoundary)} expectedSafe=${JSON.stringify(shopPosition)}`);
      }

      if (failures.length) throw new Error(failures.join('\n'));
      console.log(`PASS ${viewport.name}: shop is reachable and walking off the island is blocked`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
