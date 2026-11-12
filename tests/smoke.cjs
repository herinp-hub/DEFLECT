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
      console.log('INSPECT DOM IDS ' + JSON.stringify(await page.locator('[id]').evaluateAll(nodes => nodes.map(n => ({id:n.id,tag:n.tagName,text:(n.innerText||'').slice(0,100),display:getComputedStyle(n).display})))));
      console.log('INSPECT BUTTONS ' + JSON.stringify(await page.locator('button').evaluateAll(nodes => nodes.map(n => ({id:n.id,text:n.innerText,display:getComputedStyle(n).display})))));
      console.log('INSPECT GLOBALS ' + JSON.stringify(await page.evaluate(() => Object.keys(window).filter(k => /power|ability|coin|skin|trail|map|deflect|ball|player|scene|round|kill|effect/i.test(k)).map(k => [k,typeof window[k]]))));
console.log('INSPECT SCRIPT FUNCS ' + JSON.stringify(await page.evaluate(() => { const s=[...document.scripts].map(x=>x.textContent).join('\\n'); return [...s.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m=>m[1]); })));
      console.log('INSPECT FEATURE SOURCE ' + JSON.stringify(await page.evaluate(() => { const s=[...document.scripts].map(x=>x.textContent).join('\\n'); return ['dashBtn','coinHud','shopPanel','Azure trail','trainingMode','eliminate','wins','coins'].map(k=>{const i=s.indexOf(k);return [k,i>=0?s.slice(Math.max(0,i-500),i+1800):'MISSING'];}); })));
console.log('INSPECT HANDLERS ' + JSON.stringify(await page.evaluate(() => { const s=[...document.scripts].map(x=>x.textContent).join('\\n'); return ['useDash','startRound','endRound','attemptPlayerDeflect','deflect','eliminate','makeFighter','launchOrb','animate'].map(name=>{const at=s.indexOf('function '+name+'(');if(at<0)return [name,'MISSING'];const b=s.indexOf('{',at);let d=0,e=b;for(;e<s.length;e++){if(s[e]==='{')d++;else if(s[e]==='}'&&--d===0)break;}return [name,s.slice(at,e+1)];}); })));

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
