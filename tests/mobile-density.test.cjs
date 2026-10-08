const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const nav=fs.readFileSync(path.join(__dirname,'../js/navigation.js'),'utf8');
assert.ok(!nav.includes('mobile.matches&&entry.key!==selected'),'mobile must show multiple parameters, not a single selected control');
assert.ok(!nav.includes('if(mobile.matches||filtered)detail.open=true'),'advanced parameters stay collapsible on mobile');
console.log('Mobile multi-parameter list and collapsible advanced settings passed');
