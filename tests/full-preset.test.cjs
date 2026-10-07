const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.match(html, /<option value="encoded" selected\b/);
const elements = {
  previewMode: {value:'effect'}, previewQuality: {value:'smooth'},
  autoEncodedPreview: {type:'checkbox',checked:false}, audioAuditionInput: {value:'processed'}
};
const ctx = vm.createContext({controls:{scale:{value:'42'}}, document:{getElementById:id=>elements[id]}, sourceVideo:{volume:0.4}, updateLabels(){}, setPlaybackVolume(value){ctx.sourceVideo.volume=value;}, enableAudioAudition(){}});
vm.runInContext(fs.readFileSync(path.join(root,'js/config.js'),'utf8'),ctx);
const preset = ctx.collectConfig();
assert.equal(preset.previewSettings.previewMode, 'effect');
assert.equal(preset.previewSettings.playbackVolume, 0.4);
elements.previewMode.value='encoded';
ctx.sourceVideo.volume=1;
ctx.applyConfig(preset);
assert.equal(elements.previewMode.value,'effect');
assert.equal(ctx.sourceVideo.volume,0.4);
assert.throws(()=>ctx.applyConfig(null));
ctx.applyConfig({scale:'38'});
assert.equal(ctx.controls.scale.value,'38');
assert.equal(ctx.sanitizePresetConfig(preset).previewSettings.previewMode,'effect');
console.log('Full preset round-trip and encoded default checks passed');
