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
      console.log(`TRACE ${viewport.name} shop=${JSON.stringify(geometry.shop)} supported=${shopSupport} shopPath=${JSON.stringify(geometry.shopPath)} trainingPath=${JSON.stringify(geometry.trainingPath)} bridge=${JSON.stringify(geometry.bridgeBounds)} specialObjects=${JSON.stringify(geometry.specialObjects)}`);
      if (shopSupport !== true) throw new Error(`${viewport.name}: shop entrance has no walkable floor: ${JSON.stringify(geometry.shopFloor)}`);
      if (geometry.shopPath?.some(sample => !sample.supported)) throw new Error(`${viewport.name}: gap remains on shop approach: ${JSON.stringify(geometry.shopPath)}`);
      if (geometry.trainingPath?.some(sample => !sample.supported)) throw new Error(`${viewport.name}: gap remains on training approach: ${JSON.stringify(geometry.trainingPath)}`);
      const beacons=(geometry.specialObjects||[]).filter(object=>object.geometry==='OctahedronGeometry');
      for(const [name,z] of [['shop',-20],['training',20]]){
        const beacon=beacons.find(object=>Math.abs(object.position[2]-z)<0.6);
        if(!beacon||Math.abs(beacon.position[0]-29.5)>0.6||Math.abs(beacon.position[1]-21.1)>0.6)throw new Error(`${viewport.name}: ${name} beacon is not centered over its portal: ${JSON.stringify(beacons)}`);
      }

      const trainingPosition = [geometry.training[0], 18.2, geometry.training[2]];
      const movedToTraining = await page.evaluate(position => window.__DEFLECT_MP_BRIDGE__.setPlayerStateForTest(position, 0), trainingPosition);
      if (!movedToTraining) throw new Error(`${viewport.name}: could not move test player to training entrance`);
      await page.waitForTimeout(250);
      const atTraining = await page.evaluate(() => window.__DEFLECT_MP_BRIDGE__.getLocalState().position);
      if (Math.hypot(atTraining[0] - trainingPosition[0], atTraining[2] - trainingPosition[2]) > 1.5) throw new Error(`${viewport.name}: training access was blocked; player=${JSON.stringify(atTraining)} training=${JSON.stringify(trainingPosition)}`);
      const trainingPrompt=await page.evaluate(()=>{const p=document.getElementById('lobbyActionPrompt');return {display:getComputedStyle(p).display,action:p.dataset.action,text:p.textContent};});
      if(trainingPrompt.action!=='training'||trainingPrompt.text!=='ENTER TRAINING ARENA')throw new Error(`${viewport.name}: training prompt is bound to the wrong area: ${JSON.stringify(trainingPrompt)}`);

      const shopPosition = [geometry.shop[0], 18.2, geometry.shop[2]];
      const movedToShop = await page.evaluate(position => window.__DEFLECT_MP_BRIDGE__.setPlayerStateForTest(position, 0), shopPosition);
      if (!movedToShop) throw new Error(`${viewport.name}: could not move test player to shop entrance`);
      await page.waitForTimeout(250);
      const atShop = await page.evaluate(() => window.__DEFLECT_MP_BRIDGE__.getLocalState().position);
      if (Math.hypot(atShop[0] - shopPosition[0], atShop[2] - shopPosition[2]) > 1.5) {
        throw new Error(`${viewport.name}: shop access was blocked; player=${JSON.stringify(atShop)} shop=${JSON.stringify(shopPosition)}`);
      }
      const shopPrompt=await page.evaluate(()=>{const p=document.getElementById('lobbyActionPrompt');return {display:getComputedStyle(p).display,action:p.dataset.action,text:p.textContent};});
      if(shopPrompt.action!=='shop'||shopPrompt.text!=='OPEN ISLAND SHOP')throw new Error(`${viewport.name}: shop prompt is bound to the wrong area: ${JSON.stringify(shopPrompt)}`);

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
