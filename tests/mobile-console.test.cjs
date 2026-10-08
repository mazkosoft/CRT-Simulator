const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
assert.ok(!read('js/controls.js').includes('while (group.children.length > 1)'),'wrapping must not assume the summary is the first child');
assert.ok(read('js/navigation.js').includes("more:['userGuideGroup','aboutGroup','interfaceGroup']"),'More has its own peer workspace');
assert.ok(read('js/navigation.js').includes("preview:['previewGroup']"),'preview options use shared editor');
console.log('Summary-safe groups and shared More/preview workspaces passed');
