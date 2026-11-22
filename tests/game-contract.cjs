const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const chunksDir = path.join(root, 'game', 'chunks');
const files = Array.from({ length: 25 }, (_, i) =>
  path.join(chunksDir, String(i).padStart(3, '0') + '.txt')
);
const encoded = files.map(file => {
  assert.ok(fs.existsSync(file), 'Missing game source chunk: ' + path.basename(file));
  return fs.readFileSync(file, 'utf8').trim();
}).join('');

const loader = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.ok(loader.includes('gameplayPatches'), 'Missing runtime gameplay patch layer');
assert.ok(loader.includes('position:core.getWorldPosition(new THREE.Vector3())'), 'Training target must use the visible core world position');
assert.ok(loader.includes("orb.position.distanceTo(target)<1.3"), 'Training target hit radius must account for the visible core');
assert.ok(loader.includes('trainingMode=false;powerShieldUntil=0;const h=document.getElementById'), 'Training miss must exit practice mode and bypass temporary shields');
assert.ok(loader.includes('eliminate(-1);'), 'Training miss must eliminate the player and return them to the lobby');
assert.ok(loader.includes('featureCatalog'), 'Missing powers and cosmetics catalog');
assert.ok(loader.includes('AEGIS SHIELD'), 'Missing shield power');
assert.ok(loader.includes('TIME WARP'), 'Missing orb slow power');
assert.ok(loader.includes('PULSE DEFLECT'), 'Missing pulse power');
assert.ok(loader.includes('PHASE BLINK'), 'Missing blink power');
assert.ok(loader.includes('spawnKillEffect'), 'Missing kill effect system');
assert.ok(loader.includes('FROSTFALL ARENA'), 'Missing arena theme system');
assert.ok(loader.includes('skin_crimson'), 'Missing unlockable player skins');
assert.ok(loader.includes('trail_fire'), 'Missing unlockable trails');
assert.ok(loader.includes('featureShop'), 'Missing in-game feature shop');
assert.ok(loader.includes('powerHud'), 'Missing in-game power HUD');
assert.ok(loader.includes('const featureLayer='), 'Feature layer must be embedded in the game shell');
assert.ok(loader.includes('featureVaultToggle'), 'Missing dedicated feature vault button');

assert.ok(loader.includes('powerPulseUntil > performance.now() ? 6.2'), 'Pulse power must extend deflect range');
assert.ok(loader.includes('targetId=-4'), 'Training target break must send the orb back to the player');
assert.ok(loader.includes('RETURN CAUGHT — NEXT TARGET'), 'Training return must be caught before the next target launch');
assert.ok(loader.includes('display:none!important'), 'Game should boot directly into the Sky Lobby');
assert.ok(loader.includes('trainingTargets.forEach(target=>{'), 'Cached training target positions must be refreshed after lobby rotation');
assert.ok(loader.includes('const lobbyTriggerStart=html.indexOf('), 'Lobby trigger patch must locate the original portal coordinates');
assert.ok(loader.includes('islandPortal.getWorldPosition(new THREE.Vector3())'), 'Portal prompt must use the rotated portal world position');
assert.ok(loader.includes('trainingDeck.getWorldPosition(new THREE.Vector3())'), 'Training interaction must use the rotated training deck world position');
assert.ok(loader.includes('shopWing.getWorldPosition(new THREE.Vector3())'), 'Shop interaction must use the rotated shop wing world position');
assert.ok(loader.includes('getLobbyPortalAnchorsForTest'), 'Rotated lobby anchors must be testable in browser diagnostics');
assert.ok(loader.includes('isLobbyPositionSupportedForTest'), 'Lobby movement boundary must use real walkable floor support');
assert.ok(loader.includes('getNormalMatrix(hit.object.matrixWorld)'), 'Lobby support checks must reject non-walkable vertical surfaces');
assert.ok(loader.includes('if(!object.isMesh||!object.geometry||!object.material)return;'), 'Lobby support must collect mesh surfaces only');
assert.ok(loader.includes('intersectObjects(floorMeshes,false)'), 'Lobby support must use cached floor meshes instead of traversing sprites');
assert.ok(loader.includes('intersectObjects(window.__DEFLECT_LOBBY_FLOOR_MESHES__||[],false)'), 'Lobby diagnostics must inspect the same cached floor meshes');
assert.ok(loader.includes('lobbyCenter.x,center.z-lobbyCenter.z)<27'), 'Outer lobby portal props must be included in the scene rotation');
assert.ok(!loader.includes('edgeRadius=19.25'), 'Lobby movement must not use the shop-blocking guessed circular boundary');


const html = zlib.gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8');
assert.ok(html.includes('<html') || html.includes('<!doctype html'), 'Packed game source did not decode to HTML');

const checks = [
  ['training start handler', /function\s+startTraining\s*\(/],
  ['training stop handler', /function\s+stopTraining\s*\(/],
  ['training speed progression', /trainingBallSpeed/],
  ['world-space target position', /getWorldPosition\s*\(/],
  ['lobby training interaction', /lobbyActionPrompt/],
];

for (const [label, pattern] of checks) {
  assert.match(html, pattern, 'Missing gameplay contract: ' + label);
  console.log('PASS gameplay contract: ' + label);
}

console.log('PASS packed game source decoded (' + html.length + ' characters)');

assert.ok(loader.includes('/multiplayer.js'), 'Multiplayer client must be loaded by the game shell');
assert.ok(loader.includes('/supabase-config.js'), 'Public Supabase config must be loaded by the game shell');
assert.ok(loader.includes('window.__DEFLECT_MP_BRIDGE__'), 'Game must expose its multiplayer bridge');
assert.ok(loader.includes('mpApplySnapshot'), 'Multiplayer bridge must apply host orb snapshots');
assert.ok(loader.includes('const networkGuest=mpOnline&&!mpHost'), 'Non-host clients must not simulate authoritative orb and bot state locally');
assert.ok(loader.includes('mpSetRemotePlayers'), 'Multiplayer bridge must render remote players');
assert.ok(loader.includes('setOrbStateForTest'), 'Multiplayer bridge must expose deterministic orb sync test support');
assert.ok(loader.includes('setPlayerStateForTest'), 'Multiplayer bridge must expose deterministic player movement test support');
assert.ok(loader.includes('getRemotePlayerPositionForTest'), 'Multiplayer bridge must expose remote avatar position to integration tests');
assert.ok(loader.includes('getRemoteNameForTest'), 'Multiplayer bridge must expose remote player name tags to integration tests');
assert.ok(loader.includes('startTrainingForTest') && loader.includes('stopTrainingForTest'), 'Training start/stop must be testable in a browser');
assert.ok(loader.includes('applyAdminEvent'), 'Game must support safe admin event effects');
assert.ok(loader.includes('getLocalNameForTest'), 'Game must expose local username tag for browser tests');
const adminSql = fs.readFileSync(path.join(root, 'supabase', 'migrations', '001_admin_roles.sql'), 'utf8');
assert.ok(adminSql.includes('deflect_assign_role'), 'Owner role assignment must be backed by a database function');
assert.ok(adminSql.includes('Only the owner can assign or revoke roles'), 'Only the owner may assign staff roles');
assert.ok(adminSql.includes('deflect_admin_action'), 'Moderation actions must be server-authorized');
assert.ok(adminSql.includes('deflect_admin_actions'), 'Admin actions must be auditable');
assert.ok(adminSql.includes('staff can read moderation audit log'), 'Staff audit log must be protected by RLS');
assert.ok(adminSql.includes("role_change"), 'Role changes must be included in the audit trail');
assert.ok(adminSql.includes('guests can read public admin notices'), 'Guests must receive authorized public admin events');
assert.ok(adminSql.includes('staff can read ban records'), 'Ban records must be staff-protected');
assert.ok(!adminSql.includes('\n$;'), 'Admin SQL functions must use valid dollar-quote terminators');
assert.ok((adminSql.match(/\$\$;/g)||[]).length >= 3, 'Admin SQL functions must have matching dollar-quote terminators');
assert.ok(loader.includes('deflect:host-eliminated'), 'Host elimination must notify the multiplayer client');
const multiplayerClient = fs.readFileSync(path.join(root, 'multiplayer.js'), 'utf8');
assert.ok(loader.includes('startOnlineRound:'), 'Multiplayer must be able to start a round directly from the Sky Lobby');
assert.ok(multiplayerClient.includes('const enoughPlayers=isPublicMatch?unique.length>=1:unique.length>=2;'), 'Public servers must start with one human while private rooms wait for two');
assert.ok(multiplayerClient.includes('deflect_public_server_state'), 'Public servers must refresh their live bot count');
assert.ok(multiplayerClient.includes('setPublicBotCount'), 'Matchmaking must pass bot population into the game engine');
assert.ok(loader.includes('__DEFLECT_PUBLIC_BOT_COUNT__'), 'Public server bot population must control round creation');
assert.ok(loader.includes('mpRemoteTargetCode'), 'Public bots must be able to target real players');
assert.ok(loader.includes('skill: 0.16 + Math.random() * 0.78'), 'Bots must spawn with varied skill levels');
assert.ok(multiplayerClient.includes('game.startOnlineRound()'), 'Multiplayer start must use the direct lobby-to-round bridge');
assert.ok(multiplayerClient.includes('send("host-eliminated"'), 'Host elimination must be broadcast to the room');
assert.ok(multiplayerClient.includes('event:"host-eliminated"'), 'Room clients must handle host elimination');
assert.ok(multiplayerClient.includes('runAdminCommand'), 'Admin command console must be wired');
assert.ok(multiplayerClient.includes('/unban'), 'Admin command help must include unban');
assert.ok(multiplayerClient.includes('deflect_assign_role'), 'Owner role command must use the secure database function');


console.log('PASS multiplayer client/config are wired into the game shell');

for (const term of ['lobbyActionPrompt','trainingDeck','shopWing']) {
  const snippets=[];
  let offset=0;
  while(snippets.length<18) {
    const index=html.indexOf(term,offset);
    if(index<0)break;
    snippets.push(html.slice(Math.max(0,index-160),Math.min(html.length,index+260)).replace(/\\s+/g,' '));
    offset=index+term.length;
  }
  console.log('ALL SOURCE '+term+': '+JSON.stringify(snippets));
}

for (const term of ['lobbyMode','player.position.x','player.position.z','collision','collider','movePlayer','updatePlayer','Math.hypot','Box3','Raycaster','OctahedronGeometry','SphereGeometry','shopWing','trainingDeck','portalPrompt','lobbyActionPrompt','trainingOrb','shopOrb','trainingDeck.getWorldPosition','shopWing.getWorldPosition']) {
  const snippets=[];
  let offset=0;
  while(snippets.length<5) {
    const index=html.indexOf(term,offset);
    if(index<0)break;
    snippets.push(html.slice(Math.max(0,index-180),Math.min(html.length,index+320)).replace(/\\s+/g,' '));
    offset=index+term.length;
  }
  if(snippets.length)console.log('SOURCE '+term+': '+JSON.stringify(snippets));
}
