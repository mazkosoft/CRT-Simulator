const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../js/crt.js'), 'utf8');
for (const file of ['js/crt.js', 'js/config.js', 'index.html']) {
  assert.ok(!fs.readFileSync(path.join(__dirname, '..', file), 'utf8').includes('audioChannels'), `${file}: removed channel mode must not remain`);
}
const helper = source.slice(source.indexOf('async function selectAudioEncoding('), source.indexOf('async function processRetroAudio('));
const select = vm.runInNewContext(helper + '; selectAudioEncoding');
(async () => {
  const calls = [];
  const config = await select({ canEncodeAudio: async (codec, c) => {
    calls.push([codec, c]);
    return c.sampleRate === 48000 && c.bitrate === 96000;
  } }, 'aac', 44100, 1);
  assert.equal(config.sampleRate, 48000);
  assert.equal(config.bitrate, 96000);
  assert.ok(calls.every(([codec, c]) => codec === 'aac' && c.numberOfChannels === 1));
  assert.equal(await select({ canEncodeAudio: async () => false }, 'aac', 44100, 1), null);
  const opus = await select({ canEncodeAudio: async () => true }, 'opus', 48000, 2);
  assert.equal(opus.sampleRate, 48000);
  assert.equal(opus.numberOfChannels, 2);
  const prepare = vm.runInNewContext(helper + '; prepareAudioEncoding');
  let registered = false;
  const software = await prepare({ canEncodeAudio: async () => registered }, 'aac', 44100, 1,
    { registerAacEncoder() { registered = true; } });
  assert.ok(registered);
  assert.equal(software.sampleRate, 44100);
  assert.ok(source.indexOf('await prepareAudioEncoding(mb') < source.indexOf('const totalFrames = Math.max(1, Math.ceil(duration * fps))', source.indexOf('async function downloadHighQualityVideo')));
  assert.ok(source.includes('input.dispose()'));
  assert.ok(source.includes('samples(startTime, startTime + duration)'));
  assert.ok(source.includes('canvasesAtTimestamps(timestamps)'));
  assert.ok(source.includes('poolSize: 2'));
  assert.ok(source.includes('currentMediaType === "video" && !exportDecodedCanvas'));
  assert.ok(source.includes('decodedFrames.return()'));
  console.log('Audio capability fallback, channel preservation and early preflight checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
