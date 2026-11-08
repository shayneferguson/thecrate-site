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
  let requested = false;
  let started = false;
  let request = 0;
  let groovesPaused = false;

  function update() {
    label.dataset.playback = requested ? 'playing' : 'paused';
    if (record) record.dataset.grooves = groovesPaused ? 'paused' : 'running';
    control.setAttribute('aria-label', requested ? 'Pause Out the Crate' : started && !audio.ended ? 'Resume Out the Crate' : 'Start Out the Crate');
    control.setAttribute('aria-pressed', String(requested));
    hint.textContent = requested ? 'Touch the label to pause.' : started && !audio.ended ? 'Touch the label to resume.' : 'Touch the label to play.';
  }
  function play() {
    const token = ++request;
    if (audio.ended) audio.currentTime = 0;
    if (audio.error) audio.load();
    requested = true;
    groovesPaused = false;
    status.textContent = '';
    update();
    // Direct user-gesture playback works on phones; autoplay may be declined.
    audio.play().catch(error => {
      if (token !== request) return;
      requested = false;
      update();
      if (error.name !== 'NotAllowedError' && error.name !== 'AbortError')
        status.textContent = 'Sound couldn’t start. Touch the label to retry.';
    });
  }
  function pause() {
    ++request;
    requested = false;
    groovesPaused = true;
    audio.pause();
    status.textContent = '';
    update();
  }
  control.addEventListener('click', () => requested ? pause() : play());
  audio.addEventListener('playing', () => {
    requested = true;
    started = true;
    groovesPaused = false;
    status.textContent = '';
    update();
  });
  audio.addEventListener('waiting', () => {
    if (requested) status.textContent = 'Loading sound…';
  });
  audio.addEventListener('pause', () => { requested = false; groovesPaused = true; update(); });
  audio.addEventListener('ended', () => { requested = false; groovesPaused = true; status.textContent = ''; update(); });
  audio.addEventListener('error', () => {
    requested = false;
    status.textContent = 'Sound is unavailable. Touch the label to retry.';
    update();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', pause);

  // Audio is independent of the single page-load typography reveal.
  play();
})();
