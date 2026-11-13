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
        b.setRemotePlayers([{ id: 'test-remote', state: { position: [2, 0, 3], rotation: 0.5, alive: true, name:'RemotePilot' } }]);
        const remoteCount = b.getRemoteCount();
        const remoteName = b.getRemoteNameForTest('test-remote');
        b.setRemotePlayers([]);
        b.setNetworkState(false, false, null);
        return { bridge: !!b, hasPosition: Array.isArray(state.position), hasOrb: Array.isArray(state.orbPosition), remoteCount, remoteName, panel: !!document.querySelector('#mpCreate') };
      });
      if (!multiplayerProbe.bridge || !multiplayerProbe.hasPosition || !multiplayerProbe.hasOrb || multiplayerProbe.remoteCount !== 1 || multiplayerProbe.remoteName !== 'RemotePilot' || !multiplayerProbe.panel) {
        throw new Error(`${viewport.name}: multiplayer bridge smoke test failed: ${JSON.stringify(multiplayerProbe)}`);
      }
      await page.locator('#deflectMp summary').click();
      await page.locator('#mpName').fill('TestPilot');
      await page.locator('#mpSaveName').click();
      const savedName = await page.evaluate(() => ({stored:localStorage.getItem('deflectPlayerName'),active:window.__DEFLECT_MP_NAME__}));
      if (savedName.stored !== 'TestPilot' || savedName.active !== 'TestPilot') throw new Error(`${viewport.name}: username did not save: ${JSON.stringify(savedName)}`);
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
      await page.waitForFunction(() => window.__DEFLECT_MP_BRIDGE__?.getLocalNameForTest?.() === 'TestPilot', { timeout: 5000 });
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
      const trainingStarted = await page.evaluate(() => window.__DEFLECT_FEATURES__.startTrainingForTest());
      const trainingDuring = await page.evaluate(() => window.__DEFLECT_FEATURES__.getTrainingStateForTest());
      if (!trainingStarted || !trainingDuring.trainingMode) throw new Error(`${viewport.name}: training area did not start: ${JSON.stringify(trainingDuring)}`);
      const trainingStopped = await page.evaluate(() => window.__DEFLECT_FEATURES__.stopTrainingForTest());
      if (!trainingStopped) throw new Error(`${viewport.name}: training area did not stop cleanly`);
      await page.evaluate(() => window.__DEFLECT_FEATURES__.forceLobbyForTest());
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
      await peer.goto('http://127.0.0.1:4173/?deflectTest=1', { waitUntil: 'domcontentloaded' });
      await peer.waitForSelector('#deflectMp', { timeout: 20000 });
      await peer.locator('#deflectMp summary').click();
      // The game creates the local fighter only after the player starts a round.
      await peer.locator('#startBtn').click();
      await peer.waitForFunction(() => window.__DEFLECT_MP_BRIDGE__?.getLocalState?.().alive === true, { timeout: 10000 });
    }
    await hostPage.locator('#mpName').fill('HostPilot');
    await hostPage.locator('#mpSaveName').click();
    await guestPage.locator('#mpName').fill('GuestPilot');
    await guestPage.locator('#mpSaveName').click();
    await hostPage.locator('#mpCreate').click();
    await hostPage.waitForFunction(() => document.querySelector('#mpStatus')?.textContent.startsWith('Connected'), { timeout: 20000 });
    const roomCode = await hostPage.locator('#mpCode').inputValue();
    await guestPage.locator('#mpCode').fill(roomCode);
    await guestPage.locator('#mpJoin').click();
    await guestPage.waitForFunction(() => document.querySelector('#mpStatus')?.textContent.startsWith('Connected'), { timeout: 20000 });
    await Promise.all([hostPage, guestPage].map(peer => peer.waitForFunction(() => document.querySelectorAll('#mpPlayers li').length === 2, { timeout: 15000 })));
    await Promise.all([hostPage, guestPage].map(peer => peer.waitForFunction(() => window.__DEFLECT_MP_BRIDGE__?.getRemoteCount() > 0, { timeout: 15000 })));
    const hostIdForNames = await hostPage.evaluate(() => window.__DEFLECT_MP_SELF_ID__);
    const guestIdForNames = await guestPage.evaluate(() => window.__DEFLECT_MP_SELF_ID__);
    await guestPage.waitForFunction(id => window.__DEFLECT_MP_BRIDGE__?.getRemoteNameForTest?.(id)==='HostPilot', hostIdForNames, { timeout: 10000 });
    await hostPage.waitForFunction(id => window.__DEFLECT_MP_BRIDGE__?.getRemoteNameForTest?.(id)==='GuestPilot', guestIdForNames, { timeout: 10000 });
    const movementProbe = await hostPage.evaluate(() => window.__DEFLECT_MP_BRIDGE__.setPlayerStateForTest([1.25, 0, 4.5], 0.75));
    if (!movementProbe) throw new Error('Multiplayer integration: could not set deterministic host player position');
    const hostId = await hostPage.evaluate(() => window.__DEFLECT_MP_SELF_ID__);
    await guestPage.waitForFunction(id => {
      const p = window.__DEFLECT_MP_BRIDGE__?.getRemotePlayerPositionForTest(id);
      return Array.isArray(p) && Math.abs(p[0] - 1.25) < 0.01 && Math.abs(p[2] - 4.5) < 0.01;
    }, hostId, { timeout: 10000 });
    const orbProbe = await hostPage.evaluate(() => window.__DEFLECT_MP_BRIDGE__.setOrbStateForTest([3, 2, 5], [0, 0, 0]));
    if (!orbProbe) throw new Error('Multiplayer integration: could not set deterministic host orb state');
    await guestPage.waitForFunction(() => {
      const p = window.__DEFLECT_MP_BRIDGE__?.getLocalState?.().orbPosition;
      return Array.isArray(p) && p[0] === 3 && p[1] === 2 && p[2] === 5;
    }, { timeout: 10000 });
    await guestPage.waitForTimeout(650);
    const stableGuestOrb = await guestPage.evaluate(() => window.__DEFLECT_MP_BRIDGE__.getLocalState().orbPosition);
    if (Math.abs(stableGuestOrb[0] - 3) > 0.01 || Math.abs(stableGuestOrb[1] - 2) > 0.01 || Math.abs(stableGuestOrb[2] - 5) > 0.01) {
      throw new Error('Multiplayer integration: guest client overrode the host-authoritative orb snapshot: ' + JSON.stringify(stableGuestOrb));
    }

    // Verify the guest's real deflect wrapper sends a request that reaches the host.
    await hostPage.evaluate(() => {
      const bridge = window.__DEFLECT_MP_BRIDGE__;
      const original = bridge.tryRemoteDeflect;
      window.__deflectRemoteDeflectCalls = 0;
      bridge.tryRemoteDeflect = position => {
        window.__deflectRemoteDeflectCalls++;
        return original(position);
      };
    });
    const requested = await guestPage.evaluate(() => window.__DEFLECT_MP_BRIDGE__.requestDeflectForTest());
    if (!requested) throw new Error('Multiplayer integration: guest deflect request helper was rejected');
    await hostPage.waitForFunction(() => window.__deflectRemoteDeflectCalls > 0, { timeout: 10000 });

    // Exercise host-side directional/range hit validation without relying on frame timing.
    const hitProbe = await hostPage.evaluate(() => {
      const b = window.__DEFLECT_MP_BRIDGE__;
      b.setOrbStateForTest([0, 0, 0], [1, 0, 0]);
      const valid = b.checkRemoteHits([{ id: 'contract-hit', state: { position: [1.5, 0, 0], alive: true } }]);
      const wrongDirection = b.checkRemoteHits([{ id: 'contract-wrong-way', state: { position: [-1.5, 0, 0], alive: true } }]);
      const outOfRange = b.checkRemoteHits([{ id: 'contract-far', state: { position: [8, 0, 0], alive: true } }]);
      return { valid, wrongDirection, outOfRange };
    });
    if (!hitProbe.valid.includes('contract-hit') || hitProbe.wrongDirection.includes('contract-wrong-way') || hitProbe.outOfRange.includes('contract-far')) {
      throw new Error('Multiplayer integration: remote hit validation failed: ' + JSON.stringify(hitProbe));
    }

    // Verify a host elimination is broadcast and applied by the guest.
    const hostEliminated = await hostPage.evaluate(() => window.__DEFLECT_MP_BRIDGE__.triggerHostEliminationForTest());
    if (!hostEliminated) throw new Error('Multiplayer integration: host elimination helper was rejected');
    await guestPage.waitForFunction(() => window.__DEFLECT_MP_BRIDGE__?.getLocalState?.().alive === false, { timeout: 10000 });
    await guestPage.waitForFunction(() => document.querySelector('#mpStatus')?.textContent.includes('HOST ELIMINATED'), { timeout: 10000 });

    // When the host leaves, the remaining peer must be elected host.
    await hostPage.locator('#mpLeave').click();
    await guestPage.waitForFunction(() => window.__DEFLECT_MP_BRIDGE__?.isNetworkHost?.() === true, { timeout: 15000 });
    await guestPage.waitForFunction(() => document.querySelector('#mpHost')?.textContent.includes('HOST'), { timeout: 10000 });
    console.log('PASS multiplayer integration: join/sync, deflect request, hit validation, host elimination and host failover');
    await hostPage.close();
    await guestPage.close();
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
