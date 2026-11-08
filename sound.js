(() => {
  const audio = document.querySelector('#soundtrack');
  const button = document.querySelector('.sound-toggle');
  const action = document.querySelector('.sound-action');
  const status = document.querySelector('.sound-status');
  const label = document.querySelector('article');
  if (!audio || !button || !label) return;

  audio.controls = false;
  button.hidden = false;
  let frame = 0;
  let requested = false;
  let started = false;
  let request = 0;

  function score() {
    label.dispatchEvent(new CustomEvent('label:score', {detail: {time: audio.currentTime}}));
  }
  function followAudio() {
    score();
    if (!audio.paused && !audio.ended && audio.currentTime < 10)
      frame = requestAnimationFrame(followAudio);
  }
  function update() {
    button.classList.toggle('is-playing', requested);
    action.textContent = requested ? 'Pause sound' : started && !audio.ended ? 'Resume sound' : 'Play with sound';
  }
  button.addEventListener('click', () => {
    status.textContent = '';
    const token = ++request;
    if (requested) {
      requested = false;
      audio.pause();
      update();
      return;
    }
    if (audio.ended) audio.currentTime = 0;
    if (audio.error) audio.load();
    requested = true;
    update();
    // Call play directly from the tap so iPhone browsers can allow sound.
    audio.play().catch(() => {
      if (token !== request) return;
      requested = false;
      update();
      status.textContent = 'Sound could not start. Tap to try again.';
    });
  });
  audio.addEventListener('playing', () => {
    requested = true;
    started = true;
    status.textContent = '';
    update();
    cancelAnimationFrame(frame);
    followAudio();
  });
  audio.addEventListener('waiting', () => {
    if (requested) status.textContent = 'Loading sound…';
  });
  audio.addEventListener('pause', () => {
    cancelAnimationFrame(frame);
    requested = false;
    update();
  });
  audio.addEventListener('ended', () => {
    cancelAnimationFrame(frame);
    requested = false;
    update();
  });
  audio.addEventListener('error', () => {
    cancelAnimationFrame(frame);
    requested = false;
    update();
    status.textContent = 'Sound is unavailable. Tap to try again.';
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && started && !audio.paused) {
      cancelAnimationFrame(frame);
      followAudio();
    }
  });
})();
