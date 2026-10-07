const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
assert.ok(read('index.html').includes('id="mediaImportHint"'),'show drag import instructions');
assert.ok(read('js/navigation.js').includes("parameterPicker.className = 'parameter-picker'"),'compact parameter selector');
assert.ok(read('js/navigation.js').includes("media:['mediaGroup']"),'separate media tab');
assert.match(read('css/ui.css'),/\.cabinet-controls \.volume-scale \{ width:64px; height:64px; left:50%; top:50%; transform:translate\(-50%,-50%\);/,'center volume scale on the dial');
assert.ok(read('css/ui.css').includes('.workspace-modes [role=tab]'),'compact tabs rather than hardware buttons');
console.log('Mobile tabs, parameter selector, drag hint and dial alignment passed');
