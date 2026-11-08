(() => {
  const audio = document.querySelector('#soundtrack');
  const label = document.querySelector('article');
  const record = document.querySelector('.record-stage');
  const control = document.querySelector('.label-control');
  const hint = document.querySelector('.sound-hint');
  const status = document.querySelector('.sound-status');
  if (!audio || !label || !control || !hint || !status) return;

  document.body.classList.add('sound-enabled');
  audio.controls = false;
  control.hidden = false;
  let requested = false, started = false, groovesPaused = false;
  let request = 0, fadeFrame = 0, fadeVersion = 0;
  let context, gain;
  let prepared = false;
  let envelope = {from: 0, to: 0, start: 0, duration: 0};
  const now = () => context ? context.currentTime : performance.now() / 1000;
  const smooth = x => x * x * (3 - 2 * x);
  function levelAt(time) {
    if (!envelope.duration) return envelope.to;
    const progress = Math.max(0, Math.min(1, (time - envelope.start) / envelope.duration));
    return envelope.from + (envelope.to - envelope.from) * smooth(progress);
  }
  function prepareAudio() {
    if (prepared) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      context = new AudioContextClass();
      gain = context.createGain();
      gain.gain.value = 0;
      context.createMediaElementSource(audio).connect(gain).connect(context.destination);
    } else audio.volume = 0;
    prepared = true;
  }
  function update() {
    label.dataset.playback = requested ? 'playing' : 'paused';
    if (record) record.dataset.grooves = groovesPaused ? 'paused' : 'running';
    control.setAttribute('aria-label', requested ? 'Pause Out the Crate' : started && !audio.ended ? 'Resume Out the Crate' : 'Start Out the Crate');
    control.setAttribute('aria-pressed', String(requested));
    hint.textContent = requested ? 'Touch the label to pause.' : started && !audio.ended ? 'Touch the label to resume.' : 'Touch the label to play.';
  }
  function fadeTo(target, duration, complete = () => {}) {
    cancelAnimationFrame(fadeFrame);
    const version = ++fadeVersion;
    const start = now();
    const from = levelAt(start);
    envelope = {from, to: target, start, duration};
    if (gain) {
      gain.gain.cancelScheduledValues(start);
      gain.gain.setValueAtTime(from, start);
      if (!duration) gain.gain.setValueAtTime(target, start);
      else {
        // Short linear segments form a smooth curve; new taps reverse from the current gain.
        for (let step = 1; step <= 48; step++) {
          const fraction = step / 48;
          gain.gain.linearRampToValueAtTime(from + (target - from) * smooth(fraction), start + duration * fraction);
        }
      }
    }
    label.dataset.fade = duration ? (target ? 'in' : 'out') : 'silent';
    function monitor() {
      if (version !== fadeVersion) return;
      const elapsed = now() - start;
      const level = levelAt(now());
      if (!gain) audio.volume = level;
      label.dataset.gain = (gain ? gain.gain.value : audio.volume).toFixed(3);
      if (elapsed >= duration) {
        label.dataset.fade = target ? 'steady' : 'silent';
        complete();
      } else fadeFrame = requestAnimationFrame(monitor);
    }
    monitor();
  }
  function play(userGesture = false) {
    const token = ++request;
    prepareAudio();
    const resumed = context ? context.resume() : Promise.resolve();
    if (context && context.state !== 'running' && !userGesture) {
      requested = false;
      update();
      resumed.then(() => { if (token === request && !document.hidden) play(); }).catch(() => {});
      return;
    }
    if (audio.ended) audio.currentTime = 0;
    if (audio.error) audio.load();
    requested = true;
    groovesPaused = false;
    status.textContent = '';
    update();
    // Both calls originate in the tap, before waiting for media or context readiness.
    Promise.all([resumed, audio.play()]).then(() => {
      if (token !== request || !requested) return;
      started = true;
      fadeTo(1, 1.2);
      update();
    }).catch(error => {
      if (token !== request) return;
      requested = false;
      audio.pause();
      fadeTo(0, 0);
      update();
      if (error.name !== 'NotAllowedError' && error.name !== 'AbortError')
        status.textContent = 'Sound couldn’t start. Touch the label to retry.';
    });
  }
  function pause(immediate = false) {
    const token = ++request;
    requested = false;
    groovesPaused = true;
    status.textContent = '';
    update();
    const duration = immediate || audio.paused || (context && context.state !== 'running') ? 0 : .9;
    fadeTo(0, duration, () => {
      if (token === request && !requested) audio.pause();
    });
  }
  control.addEventListener('click', () => requested ? pause() : play(true));
  audio.addEventListener('playing', () => {
    if (!requested) return;
    started = true;
    status.textContent = '';
    update();
  });
  audio.addEventListener('waiting', () => {
    if (requested) status.textContent = 'Loading sound…';
  });
  audio.addEventListener('pause', () => {
    if (requested) { ++request; requested = false; }
    groovesPaused = true;
    fadeTo(0, 0);
    update();
  });
  audio.addEventListener('ended', () => {
    ++request;
    requested = false;
    groovesPaused = true;
    fadeTo(0, 0);
    status.textContent = '';
    update();
  });
  audio.addEventListener('error', () => {
    ++request;
    requested = false;
    fadeTo(0, 0);
    status.textContent = 'Sound is unavailable. Touch the label to retry.';
    update();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(true); });
  window.addEventListener('pagehide', () => pause(true));

  // Audio remains independent of the one-time page-load typography reveal.
  play();
})();
