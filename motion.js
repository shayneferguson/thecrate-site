(() => {
  const label = document.querySelector('article');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!label || preference.matches) return;

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
      ink.style.setProperty('--delay', `${delay + index * stagger}s`);
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
    revealText(type[0], .15, .55, true, .08);
    revealText(type[1], .65, .45);
    revealText(type[2], .9, .45);
    revealText(type[3], 1.15, .5);
    revealText(type[4], 1.45, .5);
    revealText(type[5], 1.9, .7, true, .12);
    revealText(type[6], 2.65, .45, false, .1);
    revealText(type[7], 3.25, .5);
    revealText(type[8], 3.45, .5);

    [.35, .55, .8, 1.1, 1.4, 2.45, 3.1].forEach((delay, index) => {
      rules[index].style.setProperty('--delay', `${delay}s`);
      rules[index].style.setProperty('--duration', index < 2 ? '.4s' : '.5s');
      rules[index].style.setProperty('--origin', index % 2 ? 'right' : 'left');
    });
    label.classList.add('motion-ready');
  }).catch(() => {
    clearTimeout(timeout);
    document.documentElement.classList.remove('motion-pending');
    // Static HTML remains fully readable if the background fails to decode.
  });
})();
