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
assert.ok(loader.includes('trainingMode=false;const h=document.getElementById'), 'Training miss must exit practice mode');
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
assert.ok(loader.includes('deflect:host-eliminated'), 'Host elimination must notify the multiplayer client');
const multiplayerClient = fs.readFileSync(path.join(root, 'multiplayer.js'), 'utf8');
assert.ok(multiplayerClient.includes('send("host-eliminated"'), 'Host elimination must be broadcast to the room');
assert.ok(multiplayerClient.includes('event:"host-eliminated"'), 'Room clients must handle host elimination');


console.log('PASS multiplayer client/config are wired into the game shell');
