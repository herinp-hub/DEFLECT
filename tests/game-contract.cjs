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

// Print exact gameplay handlers, including their complete bodies, for review.
for (const signature of ['function startTraining()', 'function stopTraining()', 'function attemptPlayerDeflect()', 'function deflect(who)', 'function eliminate(who)', 'function update(dt)']) {
  const at = html.indexOf(signature);
  if (at < 0) { console.log('MISSING FUNCTION: ' + signature); continue; }
  const brace = html.indexOf('{', at);
  let depth = 0, end = brace;
  for (; end < html.length; end++) {
    if (html[end] === '{') depth++;
    else if (html[end] === '}') { depth--; if (depth === 0) break; }
  }
  console.log('FUNCTION ' + signature + ': ' + html.slice(at, end + 1).replace(/\\s+/g, ' '));
}

console.log('PASS packed game source decoded (' + html.length + ' characters)');
