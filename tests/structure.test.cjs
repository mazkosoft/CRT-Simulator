const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const html = read('index.html');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(match => match[1]);
assert.deepEqual(scripts, ['vendor/mediabunny.min.cjs', 'vendor/mediabunny-aac-encoder.min.js', 'js/config.js', 'js/crt.js', 'js/controls.js']);
assert.ok(!/<script>/.test(html), 'Application code should be external');
for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (/^(https?:|data:)/.test(match[1])) continue;
  assert.ok(fs.existsSync(path.join(root, match[1].split('?')[0])), `Missing path: ${match[1]}`);
}
const sources = ['js/config.js', 'js/crt.js', 'js/controls.js'].map(read);
sources.forEach((source, i) => new vm.Script(source, { filename:scripts[i + 1] }));
new vm.Script(sources.join('\n'), { filename:'combined-application.js' });
const context = vm.createContext({});
vm.runInContext(sources[0] + '\nthis.defaults = DEFAULT_CONFIG; this.presets = PRESET_LIBRARY;', context);
const keys = [...html.matchAll(/data-config="([^"]+)"/g)].map(match => match[1]);
assert.deepEqual(new Set(Object.keys(context.defaults)), new Set(keys), 'Config keys must match controls');
assert.ok(context.presets['soft-crt']);
assert.equal(context.defaults.effectBoundary, 'media');
assert.equal(context.defaults.scale, '38');
for (const preset of Object.values(context.presets)) assert.equal(preset.scale, '38');
assert.ok(html.includes('id="scaleValue">38</span>'));
assert.ok(/id="scaleInput"[^>]*value="38"/.test(html));
assert.equal(context.readUiLanguage(), 'zh', 'Startup must tolerate unavailable browser storage');
assert.equal(context.defaults.exportScale, '1');
vm.runInContext('this.exportPresets = EXPORT_QUALITY_PRESETS; this.progress = exportProgressPercent;', context);
assert.equal(context.exportPresets.mosaic.exportPixelSize, '12');
assert.ok(Number(context.exportPresets.network.exportBitrate) < 1);
assert.equal(context.progress(3, 10), 30);
assert.equal(context.progress(15, 10), 100);
assert.equal(context.progress(0, 0), 0);
assert.ok(html.includes('id="exportProgress"'));
assert.ok(sources[1].includes('output.addVideoTrack(videoSource, { frameRate: fps })'), 'WebM needs track frame-rate metadata for the last frame duration');
for (const [name, cases] of [
  ['formatPlaybackTime', [[65,'1:05'],[NaN,'0:00'],[-2,'0:00']]],
  ['normalizePlaybackVolume', [[-1,0],[2,1],[0.5,0.5]]]
]) {
  const match = sources[2].match(new RegExp(`function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}`));
  assert.ok(match, `Missing helper ${name}`);
  vm.runInContext(match[0], context);
  for (const [input, expected] of cases) assert.equal(context[name](input), expected);
}
const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(match => match[1]));
for (const source of sources) {
  for (const match of source.matchAll(/getElementById\("([^"]+)"\)/g)) {
    assert.ok(ids.has(match[1]), `Missing DOM binding: ${match[1]}`);
  }
}
assert.ok(ids.has('aboutGroup'));
assert.ok(read('README.md').includes('https://mazkosoft.github.io/CRT-Simulator/'));
for (const target of ['assets/readme-preview.jpg', 'dist/crt-simulator-standalone.html']) {
  assert.ok(read('README.md').includes(target));
  assert.ok(fs.existsSync(path.join(root, target)), `README artifact missing: ${target}`);
}
assert.ok(read('THIRD_PARTY_NOTICES.md').includes('Copyright (c) 2022, Chafalleiro'));
assert.ok(read('vendor/MEDIABUNNY-LICENSE.txt').includes('Mozilla Public License'));
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'vendor/mediabunny.min.cjs'))).digest('hex'),
  'd17c404d9e1742f7c5f2cd5c3786c6b185741714f78e120153dd6f8b0992e1b3', 'Document dependency updates and refresh checksum together');
console.log('Syntax, script order, paths, defaults, DOM bindings and helper checks passed');
