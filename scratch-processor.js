/* A bidirectional playhead: release continues from the sample being heard. */
class CrateTurntable extends AudioWorkletProcessor {
  constructor() {
    super();
    this.channels = [];
    this.length = 0;
    this.position = 0;
    this.target = 0;
    this.rate = 1;
    this.gain = 0;
    this.playing = false;
    this.scratching = false;
    this.report = 0;
    this.port.onmessage = ({data}) => {
      switch (data.type) {
        case 'load':
          this.channels = data.channels;
          this.length = this.channels[0]?.length || 0;
          this.port.postMessage({type: 'ready', duration: this.length / sampleRate});
          break;
        case 'play':
          if (this.position >= this.length - 1) this.position = 0;
          this.playing = true;
          this.scratching = false;
          this.rate = 1;
          break;
        case 'pause':
          this.playing = false;
          this.scratching = false;
          break;
        case 'grab':
          this.target = this.position;
          this.scratching = true;
          this.playing = true;
          break;
        case 'drag':
          if (this.scratching && Number.isFinite(data.delta))
            this.target = Math.max(0, Math.min(this.length - 1, this.target + data.delta * sampleRate));
          break;
        case 'release':
          this.scratching = false;
          this.playing = true;
          // Do not seek to the pointer's target: resume at the actual playhead.
          this.target = this.position;
          break;
      }
    };
  }
  process(inputs, outputs) {
    const output = outputs[0];
    if (!output?.length || !this.length) return true;
    for (let i = 0; i < output[0].length; i++) {
      const desiredRate = !this.playing ? 0 : this.scratching
        ? Math.max(-5, Math.min(5, (this.target - this.position) / (sampleRate * .018))) : 1;
      this.rate += (desiredRate - this.rate) * .006;
      const desiredGain = this.playing ? (this.scratching ? Math.min(1, Math.abs(this.rate) * 12) : 1) : 0;
      this.gain += (desiredGain - this.gain) * .006;
      const base = Math.floor(this.position);
      const fraction = this.position - base;
      for (let channel = 0; channel < output.length; channel++) {
        const pcm = this.channels[Math.min(channel, this.channels.length - 1)];
        const a = pcm[base] || 0;
        const b = pcm[Math.min(base + 1, this.length - 1)] || 0;
        output[channel][i] = (a + (b - a) * fraction) * this.gain;
      }
      if (this.playing) {
        this.position = Math.max(0, Math.min(this.length - 1, this.position + this.rate));
        if (!this.scratching && this.position >= this.length - 1) this.playing = false;
      }
    }
    this.report += output[0].length;
    if (this.report >= sampleRate / 30) {
      this.report = 0;
      this.port.postMessage({type: 'position', position: this.position / sampleRate,
        playing: this.playing, scratching: this.scratching});
    }
    return true;
  }
}
registerProcessor('crate-turntable', CrateTurntable);
