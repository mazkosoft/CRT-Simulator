const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname,'..');
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'js/config.js'),'utf8')+'\nthis.defaults=DEFAULT_CONFIG;this.presets=PRESET_LIBRARY;',ctx);
assert.equal(ctx.defaults.effectBoundary,'source');
const suppliedPresets = JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/supplied-presets.json'),'utf8'));
for (const [key,supplied] of Object.entries(suppliedPresets)) {
  for (const [field,value] of Object.entries(supplied)) {
    if (field === 'exportDuration') continue;
    assert.deepEqual(JSON.parse(JSON.stringify(ctx.presets[key]?.[field])), value, `${key}.${field}`);
  }
}
const { matchesParameterSearch, parameterChanged } = require('../js/navigation.js');
assert.equal(parameterChanged('1.00',1),false);
assert.equal(parameterChanged('0.9',1),true);
assert.equal(parameterChanged('source','media'),true);
assert.ok(matchesParameterSearch('Glow 辉光',' 辉光 '));
assert.ok(matchesParameterSearch('RGB period 像素周期','rgb PERIOD'));
assert.ok(!matchesParameterSearch('Volume 音量','辉光'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const page of ['presets','adjust','export'])assert.ok(html.includes(`data-page="${page}"`));
for(const id of ['basicModeButton','advancedModeButton','returnToParameters'])assert.ok(!html.includes(`id="${id}"`));
for(const id of ['parameterSearch','compareOriginalButton','languageToggleButton'])assert.ok(html.includes(`id="${id}"`));
console.log('Navigation search, supplied presets and source-ratio default passed');
