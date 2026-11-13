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
      const response = await page.goto('http://127.0.0.1:4173/?deflectTest=1', { waitUntil: 'domcontentloaded' });
      if (!response || !response.ok()) throw new Error(`${viewport.name}: HTTP page load failed`);
      await page.waitForFunction(() => document.title.includes('DEFLECT'), { timeout: 15000 });
      await page.waitForSelector('canvas', { timeout: 15000 });
      await page.waitForSelector('#deflectMp', { timeout: 20000 });
      await page.waitForFunction(() => !!window.__DEFLECT_MP_BRIDGE__?.getLocalState, { timeout: 10000 });
      const multiplayerProbe = await page.evaluate(() => {
        const b = window.__DEFLECT_MP_BRIDGE__;
        const state = b.getLocalState();
        b.setNetworkState(true, true, 'test-self');
        b.setRemotePlayers([{ id: 'test-remote', state: { position: [2, 0, 3], rotation: 0.5, alive: true } }]);
        const remoteCount = b.getRemoteCount();
        b.setRemotePlayers([]);
        b.setNetworkState(false, false, null);
        return { bridge: !!b, hasPosition: Array.isArray(state.position), hasOrb: Array.isArray(state.orbPosition), remoteCount, panel: !!document.querySelector('#mpCreate') };
      });
      if (!multiplayerProbe.bridge || !multiplayerProbe.hasPosition || !multiplayerProbe.hasOrb || multiplayerProbe.remoteCount !== 1 || !multiplayerProbe.panel) {
        throw new Error(`${viewport.name}: multiplayer bridge smoke test failed: ${JSON.stringify(multiplayerProbe)}`);
      }
      await page.locator('#deflectMp summary').click();
      await page.locator('#mpCode').fill('ABC');
      await page.locator('#mpJoin').click();
      await page.waitForFunction(() => document.querySelector('#mpStatus')?.textContent.includes('6-character'));
      await page.locator('#deflectMp details').evaluate(el => { el.open = false; });
      if (await page.locator('#deflectMp details').evaluate(el => el.open)) throw new Error(`${viewport.name}: multiplayer panel did not close`);

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
      if (await page.locator('#dashBtn').isVisible()) await page.locator('#dashBtn').click();
      await page.waitForFunction(() => document.querySelector('#powerStatus')?.textContent.includes('PULSE WINDOW ACTIVE'), { timeout: 3000 });
      await page.evaluate(() => { window.__DEFLECT_FEATURES__.forceLobbyForTest(); });
      await page.locator('#featureVaultToggle').click();
      if (!(await page.locator('#featureShop').isVisible())) {
        const debug = await page.evaluate(() => {
          const ids=['islandHud','shopToggle','featureVaultToggle','powerHud'];
          const info={};
          for(const id of ids){const e=id==='shopPanel'?document.querySelector('#islandHud #shopPanel'):id==='featureShop'?document.querySelector('#featureShop'):document.getElementById(id);if(e){const r=e.getBoundingClientRect(),s=getComputedStyle(e);info[id]={display:s.display,z:s.zIndex,pointer:s.pointerEvents,rect:{x:r.x,y:r.y,w:r.width,h:r.height}};}}
          const b=document.getElementById('featureVaultToggle')?.getBoundingClientRect();
          info.hit=b?document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.id||'no-id':null;
          info.shopDisplay=document.getElementById('featureShop')?.style.display;
          info.vaultHandler=String(document.getElementById('featureVaultToggle')?.onclick);
          return info;
        });
        throw new Error(`${viewport.name}: feature vault did not open: ${JSON.stringify(debug)}`);
      }
      for (const item of ['shield','frost','blink','skin_cyan','skin_crimson','skin_void','trail_neon','trail_fire','effect_nova','effect_lightning','effect_stars','map_frost','map_ember','map_void']) {
        if (!(await page.locator('#featureShop [data-feature-buy="'+item+'"]').count())) throw new Error(`${viewport.name}: missing shop item ${item}`);
      }
      await page.locator('#featureShop [data-feature-buy="shield"]').click();
      await page.waitForFunction(() => localStorage.getItem('deflectOwned_shield') === '1');
      if (await page.evaluate(() => window.__DEFLECT_FEATURES__.getEquippedPower()) !== 'shield') throw new Error(`${viewport.name}: purchased shield did not equip`);
      await page.locator('#featureShop [data-feature-buy="skin_crimson"]').click();
      await page.locator('#featureShop [data-feature-buy="trail_fire"]').click();
      await page.locator('#featureShop [data-feature-buy="effect_lightning"]').click();
      await page.locator('#featureShop [data-feature-buy="map_frost"]').click();
      const cosmetics = await page.evaluate(() => ({skin:localStorage.getItem('deflectSkin'),trail:localStorage.getItem('deflectTrail'),effect:localStorage.getItem('deflectKillEffect'),map:localStorage.getItem('deflectMap'),tag:document.getElementById('arenaThemeTag')?.textContent}));
      if (cosmetics.skin !== 'skin_crimson' || cosmetics.trail !== 'trail_fire' || cosmetics.effect !== 'effect_lightning' || cosmetics.map !== 'map_frost' || cosmetics.tag !== 'FROSTFALL ARENA') throw new Error(`${viewport.name}: cosmetic or arena unlock failed: ${JSON.stringify(cosmetics)}`);
      await page.evaluate(() => window.__DEFLECT_FEATURES__.spawnKillEffectAtPlayer());
      await page.waitForTimeout(100);

      if (failures.length) throw new Error(failures.join('\n'));
      console.log(`PASS ${viewport.name}: game loads, canvas renders, arena starts, no page errors`);
      await page.close();
    }

    // Exercise two real browser clients against the configured Supabase Realtime project.
    const hostPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const guestPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    for (const peer of [hostPage, guestPage]) {
      await peer.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
      await peer.waitForSelector('#deflectMp', { timeout: 20000 });
      await peer.locator('#deflectMp summary').click();
    }
    await hostPage.locator('#mpCreate').click();
    await hostPage.waitForFunction(() => document.querySelector('#mpStatus')?.textContent.startsWith('Connected'), { timeout: 20000 });
    const roomCode = await hostPage.locator('#mpCode').inputValue();
    await guestPage.locator('#mpCode').fill(roomCode);
    await guestPage.locator('#mpJoin').click();
    await guestPage.waitForFunction(() => document.querySelector('#mpStatus')?.textContent.startsWith('Connected'), { timeout: 20000 });
    await Promise.all([hostPage, guestPage].map(peer => peer.waitForFunction(() => document.querySelectorAll('#mpPlayers li').length === 2, { timeout: 15000 })));
    await Promise.all([hostPage, guestPage].map(peer => peer.waitForFunction(() => window.__DEFLECT_MP_BRIDGE__?.getRemoteCount() > 0, { timeout: 15000 })));
    await guestPage.locator('#mpLeave').click();
    await hostPage.waitForFunction(() => document.querySelectorAll('#mpPlayers li').length === 1, { timeout: 15000 });
    console.log('PASS multiplayer integration: two clients join, see each other, and leave cleanly');
    await hostPage.close();
    await guestPage.close();
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
