const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const groups = [...html.matchAll(/<details\b([^>]*)>([\s\S]*?)<\/details>/g)].filter(m => m[1].includes('control-group'));
const order = ['mediaGroup','presetsGroup','phosphorGroup','displayGroup','colorGroup','tapeGroup','audioGroup','videoSettingsGroup','exportGroup','userGuideGroup','aboutGroup'];
assert.deepEqual(groups.map(m => m[1].match(/id="([^"]+)"/)?.[1]), order);
assert.deepEqual(groups.filter(m => /\bopen\b/.test(m[1])).map(m => m[1].match(/id="([^"]+)"/)[1]), ['mediaGroup']);
for (const [id, control] of [['mediaGroup','imageUpload'],['colorGroup','finalSaturationInput'],['colorGroup','brightnessInput'],['displayGroup','scaleInput'],['displayGroup','glowOpacityInput'],['phosphorGroup','pixelateInput'],['phosphorGroup','rgbPeriodInput'],['videoSettingsGroup','exportPixelSizeInput'],['exportGroup','exportProgressPanel'],['exportGroup','downloadVideoButton']]) {
  assert.ok(groups.find(m => m[1].includes(`id="${id}"`))[2].includes(`id="${control}"`), `${control} belongs in ${id}`);
}
assert.deepEqual(groups.map(m => m[2].match(/data-i18n-zh="([^"]+)"/)[1]), ['媒体导入','效果预设','像素分辨率','CRT屏幕','色彩设置','VHS设置','音频设置','视频设置','媒体导出','使用说明','关于鸣谢']);
for (const id of ['previewMode','previewQuality','autoEncodedPreview','previewExportButton','encodedPreviewStatus','exportPreviewInfo']) {
  assert.ok(html.indexOf(`id="${id}"`) < html.indexOf('<details id="mediaGroup"'), `${id} must be above every accordion`);
}
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const cabinet = html.slice(html.indexOf('<div class="cabinet-controls">'), html.indexOf('<aside class="control-panel">'));
for (const id of ['playPauseButton','restartVideoButton']) assert.ok(cabinet.includes(`id="${id}"`), `${id} belongs below the screen`);
assert.ok(/id="rgbPeriodInput"[^>]*min="1"[^>]*max="48"[^>]*step="0.1"[^>]*value="6"/.test(html), 'RGB period supports 1px and fractional adjustment without changing the default');
assert.equal(ids.length, new Set(ids).size, 'No duplicate IDs after regrouping');
assert.ok(html.includes('translate(38 40) scale(0.9) translate(-38 -40)'));
assert.ok(html.includes('class="cabinet-copyright">© 2026 Mazko'));
assert.ok(/<\/div>\s*<small class="cabinet-copyright">© 2026 Mazko<\/small>\s*<\/div>\s*<div class="playback-transport">/.test(html), 'Copyright belongs in the bezel rather than a separate flex row');
console.log('Grouping, pixel separation, reflection anchor and copyright checks passed');
