const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  const viewports = [{ name: 'mobile', width: 390, height: 844 }, { name: 'desktop', width: 1365, height: 900 }];

  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      await page.addInitScript(() => localStorage.setItem('deflectCoins','250'));
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
      await page.waitForTimeout(500);
      const featureProbe = await page.evaluate(() => ({hud:!!document.getElementById('powerHud'), api:!!window.__DEFLECT_FEATURES__, scripts:[...document.scripts].map(s=>({type:s.type,src:s.src,len:s.textContent.length}))}));
      if (!featureProbe.hud || !featureProbe.api) throw new Error(`${viewport.name}: feature layer did not initialize; probe=${JSON.stringify(featureProbe)}; pageErrors=${failures.join(" | ")}`);
      await page.waitForSelector('#powerHud', { state: 'attached', timeout: 10000 });
      const powerState = await page.evaluate(() => ({ game: window.__DEFLECT_FEATURES__.getState(), display: getComputedStyle(document.querySelector('#powerHud')).display }));
      if (!powerState.game.alive || powerState.game.lobbyMode || powerState.game.roundOver || powerState.display === 'none') throw new Error(`${viewport.name}: power HUD hidden; state=${JSON.stringify(powerState)}`);
      if (!(await page.locator('#powerSelect option').count())) throw new Error(`${viewport.name}: no owned powers are selectable`);
      await page.locator('#powerBtn').click();
      await page.waitForFunction(() => document.querySelector('#powerStatus')?.textContent.includes('PULSE WINDOW ACTIVE'), { timeout: 3000 });
      await page.evaluate(() => { window.__DEFLECT_FEATURES__.openIslandHUD(); document.getElementById('islandHud').style.display='block'; document.getElementById('shopPanel').style.display='none'; document.getElementById('powerHud').style.display='none'; });
      await page.locator('#shopToggle').click();
      if (!(await page.locator('#featureShop').isVisible())) throw new Error(`${viewport.name}: feature vault did not open`);
      for (const item of ['shield','frost','blink','skin_cyan','skin_crimson','skin_void','trail_neon','trail_fire','effect_nova','effect_lightning','effect_stars','map_frost','map_ember','map_void']) {
        if (!(await page.locator('[data-feature-buy="'+item+'"]').count())) throw new Error(`${viewport.name}: missing shop item ${item}`);
      }
      await page.locator('[data-feature-buy="shield"]').click();
      await page.waitForFunction(() => localStorage.getItem('deflectOwned_shield') === '1');
      if (await page.evaluate(() => window.__DEFLECT_FEATURES__.getEquippedPower()) !== 'shield') throw new Error(`${viewport.name}: purchased shield did not equip`);
      await page.locator('[data-feature-buy="skin_crimson"]').click();
      await page.locator('[data-feature-buy="trail_fire"]').click();
      await page.locator('[data-feature-buy="effect_lightning"]').click();
      await page.locator('[data-feature-buy="map_frost"]').click();
      const cosmetics = await page.evaluate(() => ({skin:localStorage.getItem('deflectSkin'),trail:localStorage.getItem('deflectTrail'),effect:localStorage.getItem('deflectKillEffect'),map:localStorage.getItem('deflectMap'),tag:document.getElementById('arenaThemeTag')?.textContent}));
      if (cosmetics.skin !== 'skin_crimson' || cosmetics.trail !== 'trail_fire' || cosmetics.effect !== 'effect_lightning' || cosmetics.map !== 'map_frost' || cosmetics.tag !== 'FROSTFALL ARENA') throw new Error(`${viewport.name}: cosmetic or arena unlock failed: ${JSON.stringify(cosmetics)}`);
      await page.evaluate(() => window.__DEFLECT_FEATURES__.spawnKillEffectAtPlayer());
      await page.waitForTimeout(100);

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
