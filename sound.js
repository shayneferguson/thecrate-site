(() => {
  const audio = document.querySelector('#soundtrack');
  const label = document.querySelector('article');
  const control = document.querySelector('.label-control');
  const hint = document.querySelector('.sound-hint');
  const status = document.querySelector('.sound-status');
  if (!audio || !label || !control) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass || !window.AudioWorkletNode) {
    hint.textContent = 'Use the audio player below to listen.';
    return;
  }
  document.body.classList.add('sound-enabled');
  control.hidden = false;
  let context, node, filter, loading;
  let ready = false, wanted = true, playing = false, started = false;
  let position = 0, duration = 0, gesture = null, reveal = 0;
  let lastClock = null;

  function update() {
    const state = gesture && ready ? 'scratching' : playing ? 'playing' : ready ? 'paused' : 'loading';
    label.dataset.playback = state;
    label.dataset.position = position.toFixed(3);
    control.setAttribute('aria-label', playing ? 'Pause Out the Crate' : started ? 'Resume Out the Crate' : 'Start Out the Crate');
    control.setAttribute('aria-pressed', String(playing));
    document.body.classList.toggle('is-scratching', !!gesture && ready);
    hint.textContent = !started ? 'Touch the label to begin.' : playing
      ? 'Touch label to pause. Drag the black to scratch.' : 'Touch label to resume. Drag the black to scratch.';
  }
  function score() {
    label.dispatchEvent(new CustomEvent('label:score', {detail: {time: reveal}}));
  }
  function startReveal() {
    if (started) return;
    started = true;
    reveal = 0;
    label.dispatchEvent(new CustomEvent('label:start'));
    score();
  }
  function send(type, extra = {}) { node?.port.postMessage({type, ...extra}); }
  function playIfAllowed() {
    if (!ready || !wanted || playing || context.state !== 'running' || document.hidden) return;
    startReveal();
    send(gesture?.active ? 'grab' : 'play');
    playing = true;
    lastClock = context.currentTime;
    status.textContent = '';
    update();
  }
  function fail() {
    loading = null;
    ready = false;
    playing = false;
    node?.disconnect();
    filter?.disconnect();
    node = null;
    gesture = null;
    status.textContent = 'Sound couldn’t load. Touch the label to retry.';
    update();
  }
  function prepare() {
    if (loading) return loading;
    if (!context) {
      context = new AudioContextClass({latencyHint: 'interactive'});
      context.addEventListener('statechange', () => {
        if (context.state === 'running') playIfAllowed();
        else { playing = false; lastClock = null; update(); }
      });
    }
    status.textContent = 'Loading the record…';
    loading = (async () => {
      const [, bytes] = await Promise.all([
        context.audioWorklet.addModule('scratch-processor.js?v=1'),
        fetch(audio.getAttribute('src')).then(response => {
          if (!response.ok) throw new Error('Audio unavailable');
          return response.arrayBuffer();
        })
      ]);
      const decoded = await context.decodeAudioData(bytes);
      node = new AudioWorkletNode(context, 'crate-turntable', {
        numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2]
      });
      filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = Math.min(20000, context.sampleRate * .45);
      filter.Q.value = .5;
      node.connect(filter).connect(context.destination);
      node.onprocessorerror = fail;
      await new Promise(resolve => {
        node.port.onmessage = ({data}) => {
          if (data.type === 'ready') {
            duration = data.duration;
            ready = true;
            resolve();
            return;
          }
          if (data.type !== 'position') return;
          position = data.position;
          const now = context.currentTime;
          // Reveal advances only during playback and never unwinds while scratching.
          if (started && playing && !gesture && lastClock !== null && reveal < 10) {
            reveal = Math.min(10, reveal + Math.max(0, now - lastClock));
            score();
          }
          lastClock = now;
          if (playing && !data.playing && !gesture && position >= duration - .02) {
            playing = false;
            wanted = false;
          }
          update();
        };
        const channels = Array.from({length: decoded.numberOfChannels}, (_, i) => new Float32Array(decoded.getChannelData(i)));
        node.port.postMessage({type: 'load', channels}, channels.map(channel => channel.buffer));
      });
      status.textContent = '';
      playIfAllowed();
      update();
    })().catch(fail);
    return loading;
  }
  function unlock() {
    prepare();
    // Resume synchronously within the gesture; do not wait for network/decode.
    context?.resume().then(playIfAllowed).catch(() => { playing = false; update(); });
  }
  control.addEventListener('click', () => {
    if (gesture) return;
    if (playing || (wanted && context?.state === 'running' && !ready)) {
      wanted = false;
      playing = false;
      send('pause');
      lastClock = null;
      update();
    } else {
      wanted = true;
      unlock();
      playIfAllowed();
    }
  });
  function restoreTone() {
    if (filter) filter.frequency.setTargetAtTime(Math.min(20000, context.sampleRate * .45), context.currentTime, .025);
  }
  function finish(event) {
    if (!gesture || (event && event.pointerId !== gesture.id)) return;
    const wasReady = gesture.active;
    gesture = null;
    restoreTone();
    wanted = true;
    if (wasReady) {
      send('release');
      playing = true;
      lastClock = context.currentTime;
    } else playIfAllowed();
    update();
  }
  document.body.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || gesture || event.target.closest('.label-control, a, audio')) return;
    event.preventDefault();
    wanted = true;
    unlock();
    gesture = {id: event.pointerId, x: event.clientX, y: event.clientY, startY: event.clientY, active: ready};
    document.body.setPointerCapture(event.pointerId);
    if (ready) {
      startReveal();
      send('grab');
      playing = true;
    }
    update();
  });
  document.body.addEventListener('pointermove', event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    event.preventDefault();
    if (ready && !gesture.active) { startReveal(); send('grab'); gesture.active = true; playing = true; }
    if (gesture.active) {
      const delta = (event.clientX - gesture.x) * .012 - (event.clientY - gesture.y) * .006;
      send('drag', {delta});
      const vertical = (event.clientY - gesture.startY) / Math.max(200, innerHeight * .5);
      const frequency = Math.max(450, Math.min(20000, 12000 * Math.pow(2, -vertical * 4)));
      filter.frequency.setTargetAtTime(frequency, context.currentTime, .015);
    }
    gesture.x = event.clientX;
    gesture.y = event.clientY;
  }, {passive: false});
  document.body.addEventListener('pointerup', finish);
  document.body.addEventListener('pointercancel', finish);
  document.body.addEventListener('lostpointercapture', finish);
  function suspendInteraction() {
    gesture = null;
    wanted = false;
    playing = false;
    lastClock = null;
    send('pause');
    restoreTone();
    update();
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) suspendInteraction(); });
  window.addEventListener('pagehide', suspendInteraction);
  prepare();
  // Browsers that permit autoplay start the reveal with sound. Others wait for a touch.
  context?.resume().then(playIfAllowed).catch(() => update());
  update();
})();
