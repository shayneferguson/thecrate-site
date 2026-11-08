const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const sampleRate = 48000;
function deck(seconds = 3) {
  let Processor;
  const messages = [];
  class AudioWorkletProcessor { constructor() { this.port = {postMessage: data => messages.push(data)}; } }
  vm.runInNewContext(fs.readFileSync(require.resolve('../scratch-processor.js'), 'utf8'), {
    AudioWorkletProcessor, sampleRate, registerProcessor: (_, cls) => Processor = cls
  });
  const processor = new Processor();
  const channel = Float32Array.from({length: sampleRate * seconds}, (_, i) => Math.sin(i * 2 * Math.PI * 440 / sampleRate) * .5);
  const send = (type, extra = {}) => processor.port.onmessage({data: {type, ...extra}});
  const render = frames => {
    let maximum = 0;
    for (let n = 0; n < frames; n += 128) {
      const output = [new Float32Array(Math.min(128, frames - n)), new Float32Array(Math.min(128, frames - n))];
      processor.process([], [output]);
      for (const value of output[0]) { assert.ok(Number.isFinite(value)); maximum = Math.max(maximum, Math.abs(value)); }
      assert.deepEqual(output[0], output[1]);
    }
    return maximum;
  };
  send('load', {channels: [channel, channel.slice()]});
  return {processor, send, render, messages};
}
test('plays at original speed and pauses without moving the playhead', () => {
  const {processor: p, send, render} = deck();
  send('play'); assert.ok(render(48000) > .4); assert.equal(p.position, 48000);
  send('pause'); render(24000); assert.equal(p.position, 48000);
  assert.ok(render(4800) < .00001);
  send('play'); render(4800); assert.equal(p.position, 52800);
});
test('backward and forward drags are audible and release resumes at the heard position', () => {
  const {processor: p, send, render} = deck();
  send('play'); render(48000); send('grab'); send('drag', {delta: -.5});
  assert.ok(render(6000) > .1); assert.ok(p.position < 48000);
  const reversed = p.position;
  send('drag', {delta: 1}); render(2000); assert.ok(p.position > reversed);
  const released = p.position;
  send('release'); assert.equal(p.position, released);
  render(12000); assert.ok(p.position > released); assert.ok(Math.abs(p.rate - 1) < .001);
});
test('holding the black stops the sound without a sustained frozen sample', () => {
  const {processor: p, send, render} = deck();
  send('play'); render(48000); send('grab'); render(24000);
  assert.ok(Math.abs(p.rate) < .0001); assert.ok(render(4800) < .0001);
});
test('start/end clamps, cancellation pause and replay stay finite', () => {
  const {processor: p, send, render} = deck(1);
  send('grab'); send('drag', {delta: -100}); render(48000); assert.ok(Math.abs(p.position) < .001);
  send('drag', {delta: Infinity}); render(128); assert.ok(Math.abs(p.position) < .001);
  send('drag', {delta: 100}); render(48000); assert.ok(p.position <= 47999);
  send('pause'); const at = p.position; render(4800); assert.equal(p.position, at);
  send('release'); render(48000); assert.equal(p.playing, false);
  send('play'); render(4800); assert.ok(p.position < 5000);
});
