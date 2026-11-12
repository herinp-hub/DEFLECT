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

// Emit complete relevant function bodies to make gameplay behavior inspectable in CI logs.
for (const term of ['startTraining', 'stopTraining', 'attemptPlayerDeflect', 'deflect', 'eliminate', 'update']) {
  let from = 0;
  let count = 0;
  while (count < 3) {
    const at = html.indexOf(term, from);
    if (at < 0) break;
    console.log('SOURCE ' + term + ' #' + (count + 1) + ': ' + html.slice(Math.max(0, at - 180), Math.min(html.length, at + 520)).replace(/\s+/g, ' '));
    from = at + term.length;
    count++;
  }
}

console.log('PASS packed game source decoded (' + html.length + ' characters)');
