const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crt = fs.readFileSync(require('node:path').join(__dirname,'../js/crt.js'),'utf8');
const body = crt.slice(crt.indexOf('function uploadVideoFrame()'),crt.indexOf('const controls = {}'));
let allocated = 0, uploaded = 0;
const context = { currentMediaType:'video', exportDecodedCanvas:null, sourceVideo:{readyState:2,videoWidth:320,videoHeight:240}, sourceTexture:null, sourceWidth:0,sourceHeight:0,sourceAspect:0,
  createTexture:()=>{allocated++;return {};}, gl:{bindTexture:(_,texture)=>assert.ok(texture,'video upload needs a texture'),pixelStorei(){},texImage2D(){uploaded++;}} };
vm.runInNewContext(body+'\nuploadVideoFrame();',context);
assert.equal(allocated,1); assert.equal(uploaded,1);
const nav=fs.readFileSync(require('node:path').join(__dirname,'../js/navigation.js'),'utf8');
assert.ok(!nav.includes('||!sourceDrawable||'),'video thumbnails must not require an image');
assert.ok(nav.includes('parameterPicker.value=selected'),'parameter selection is preserved without a scrolling button strip');
console.log('Video texture and preview navigation regression passed');
