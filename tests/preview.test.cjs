const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const file = path.join(__dirname, '../js/preview.js');
assert.ok(fs.existsSync(file), 'Automatic preview scheduler must exist');
const { createEncodedPreviewScheduler } = vm.runInNewContext(fs.readFileSync(file, 'utf8') + '\n({ createEncodedPreviewScheduler });', { setTimeout, clearTimeout, AbortController });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  const results = [], states = [], jobs = [];
  const scheduler = createEncodedPreviewScheduler({ delay:5,
    generate: signal => new Promise((resolve, reject) => jobs.push({ signal, resolve, reject })),
    onResult: value => results.push(value), onState: value => states.push(value)
  });
  scheduler.request(); scheduler.request();
  await sleep(15); assert.equal(jobs.length, 1, 'Debounce coalesces requests');
  scheduler.request(); assert.ok(jobs[0].signal.aborted, 'New settings abort old job');
  await sleep(15); assert.equal(jobs.length, 1, 'Do not run concurrent jobs');
  jobs[0].resolve('old'); await sleep(15);
  assert.deepEqual(results, []); assert.equal(jobs.length, 2);
  jobs[1].resolve('latest'); await scheduler.idle();
  assert.deepEqual(results, ['latest']); assert.ok(states.includes('ready'));
  scheduler.refresh(); await sleep(5); jobs[2].reject(new Error('encoder failed'));
  await scheduler.idle(); assert.ok(states.includes('error'));
  scheduler.refresh(); await sleep(5); scheduler.cancel(); jobs[3].resolve('cancelled');
  await scheduler.idle(); assert.deepEqual(results, ['latest']);
  const renderer = fs.readFileSync(path.join(__dirname, '../js/crt.js'), 'utf8');
  assert.ok(renderer.includes('function withRenderSurface('), 'Preview uses its own render surface');
  assert.ok(renderer.includes('signal?.throwIfAborted()'), 'Rendering checks cancellation');
  assert.ok(renderer.includes('const settings = collectConfig()'), 'A job freezes its settings');
  const scope = renderer.slice(renderer.indexOf('function withRenderSurface('), renderer.indexOf('function preparePreviewSurface('));
  const context = vm.createContext({});
  vm.runInContext(`let canvas='visible',gl='live-gl',programs={},quad={},targets={},sourceTexture='live-texture',sourceWidth=640,sourceHeight=480,sourceAspect=4/3,exportDecodedCanvas=null,renderSettings=null,renderSurfaceSize=null,currentMediaType='image',exportMosaic=false;\n${scope}`, context);
  const isolated = vm.runInContext(`withRenderSurface({canvas:'detached',gl:'preview-gl',programs:{},quad:{},targets:{},sourceTexture:'preview-texture',sourceWidth:320,sourceHeight:240,sourceAspect:4/3,mediaType:'video'}, {exportPixelSize:'12'}, {width:160,height:120}, 'frame', () => [canvas,gl,currentMediaType,exportMosaic]);`, context);
  assert.deepEqual(Array.from(isolated), ['detached','preview-gl','video',true]);
  assert.equal(vm.runInContext('canvas', context), 'visible');
  assert.equal(vm.runInContext('sourceTexture', context), 'live-texture');
  assert.throws(() => vm.runInContext(`withRenderSurface({}, null, null, null, () => {throw new Error('draw failed');});`, context), /draw failed/);
  assert.equal(vm.runInContext('gl', context), 'live-gl', 'Restore the live renderer even after failure');
  console.log('Preview debounce, single-flight cancellation, stale-result rejection and retry checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
