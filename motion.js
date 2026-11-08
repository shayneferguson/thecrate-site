(() => {
  const label = document.querySelector('article');
  const stage = document.querySelector('.record-stage');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!label || !stage || preference.matches) {
    document.documentElement.classList.remove('motion-pending');
    return;
  }

  // Keep the complete static design visible if assets or scripts cannot load.
  // The sequence is installed atomically only after paper and fonts are ready.
  const paper = new Image();
  paper.src = 'assets/worn-label-paper.png';
  const paperReady = paper.decode();
  const fontsReady = document.fonts.ready;
  let cancelled = false;
  const timeout = setTimeout(() => { cancelled = true; }, 6000);
  preference.addEventListener('change', () => {
    if (preference.matches) {
      cancelled = true;
      label.classList.remove('motion-ready');
      stage.classList.remove('opening-ready');
      document.documentElement.classList.remove('motion-pending');
    }
  });

  function revealText(element, delay, duration, words = false, stagger = 0) {
    const text = element.textContent;
    const pieces = words ? text.split(' ') : element.innerHTML.split(/<br\s*\/?\s*>/i);
    const fragment = document.createDocumentFragment();
    pieces.forEach((piece, index) => {
      const window = document.createElement('span');
      const ink = document.createElement('span');
      window.className = words ? 'word-window' : 'line-window';
      ink.className = words ? 'word-ink' : 'line-ink';
      // Existing label copy is plain text; decode entities without interpreting markup.
      const decode = document.createElement('textarea');
      decode.innerHTML = piece;
      ink.textContent = decode.value;
      ink.style.setProperty('--delay', `${1.5 + delay + index * stagger}s`);
      ink.style.setProperty('--duration', `${duration}s`);
      window.append(ink);
      fragment.append(window);
      if (words && index < pieces.length - 1) fragment.append(' ');
    });
    element.replaceChildren(fragment);
  }

  Promise.all([paperReady, fontsReady]).then(() => {
    clearTimeout(timeout);
    document.documentElement.classList.remove('motion-pending');
    if (cancelled || preference.matches) return;
    const type = [...label.querySelectorAll('.type')];
    const rules = [...label.querySelectorAll('.rule')];
    if (type.length !== 9 || rules.length !== 7) return;

    type[0].classList.add('wordmark');
    type[5].classList.add('headline');
    // Paper reaches its final opacity at 1.5s; type then reveals over exactly 2s.
    revealText(type[0], 0, .35, true, .04);
    revealText(type[1], .25, .3);
    revealText(type[2], .4, .3);
    revealText(type[3], .55, .3);
    revealText(type[4], .7, .3);
    revealText(type[5], .9, .45, true, .06);
    revealText(type[6], 1.25, .3, false, .06);
    revealText(type[7], 1.55, .3);
    revealText(type[8], 1.72, .28);

    [.1, .2, .35, .5, .65, 1.1, 1.5].forEach((delay, index) => {
      rules[index].style.setProperty('--delay', `${1.5 + delay}s`);
      rules[index].style.setProperty('--duration', '.25s');
      rules[index].style.setProperty('--origin', index % 2 ? 'right' : 'left');
    });
    // Release completed animation layers so the label stays crisp during audio taps.
    type[8].querySelector('.line-ink').addEventListener('animationend', () => {
      label.classList.remove('motion-ready');
      stage.classList.remove('opening-ready');
    }, { once: true });
    stage.classList.add('opening-ready');
    label.classList.add('motion-ready');
  }).catch(() => {
    clearTimeout(timeout);
    document.documentElement.classList.remove('motion-pending');
    // Static HTML remains fully readable if the background fails to decode.
  });
})();
