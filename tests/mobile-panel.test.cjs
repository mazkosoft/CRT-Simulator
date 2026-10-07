const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
assert.ok(read('js/navigation.js').includes("help.className='parameter-help'"),'parameter help expands on demand');
assert.match(read('css/ui.css'),/\.terminal-workspace \.group-body \{ padding:0; margin:0; border:0;/,'one panel, not nested frames');
assert.match(read('css/ui.css'),/\.preview-console > button \{[^}]*border-radius:3px;/,'preview controls form a narrow tool strip');
console.log('Unified mobile panel and contextual help passed');
const mobile=read('css/ui.css').slice(read('css/ui.css').lastIndexOf('@media(max-width:900px) {'));
assert.match(mobile,/--panel-control-height:32px/,'mobile controls share category-tab proportions');
assert.match(mobile,/\.parameter-stepper input \{ height:var\(--panel-control-height\); font-size:15px/,'mobile numeric input is compact');
