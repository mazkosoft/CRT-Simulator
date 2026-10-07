const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const { buildStandalone } = require('../scripts/build-standalone.cjs');
const html = buildStandalone();
assert.equal(html, buildStandalone(), 'Build must be deterministic');
assert.equal(html, fs.readFileSync(path.join(root, 'dist/crt-simulator-standalone.html'), 'utf8'), 'Regenerate dist after source changes');
assert.ok(!/<script[^>]+src=|<link[^>]+rel="stylesheet"/.test(html), 'No external runtime scripts or styles');
assert.ok(html.includes('data:image/png;base64,' + fs.readFileSync(path.join(root, 'assets/demo-desktop.png')).toString('base64')));
assert.ok(!html.includes('new URL("assets/demo-desktop.png"'), 'No demo file dependency');
assert.ok(html.includes(fs.readFileSync(path.join(root, 'vendor/mediabunny.min.cjs'), 'utf8')), 'Retain the unmodified vendor bundle');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]);
assert.equal(scripts.length, 7, 'Preserve vendor/AAC/config/preview/renderer/control/navigation order');
scripts.forEach((script, index) => new vm.Script(script, { filename: `standalone-${index}.js` }));
new vm.Script(scripts.join('\n'));
for (const name of ['LICENSE', 'THIRD_PARTY_NOTICES.md', 'vendor/MEDIABUNNY-LICENSE.txt', 'vendor/AAC-ENCODER-LICENSE.txt', 'vendor/FFMPEG-LGPL-2.1.txt', 'vendor/AAC-ENCODER-README.md']) {
  const escaped = fs.readFileSync(path.join(root, name), 'utf8').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  assert.ok(html.includes(escaped), `Full ${name} must be embedded`);
}
console.log('Standalone reproducibility, embedded image/licenses and JavaScript checks passed');
