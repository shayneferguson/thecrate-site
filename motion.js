(() => {
  const hero = document.querySelector('.hero');
  const image = document.querySelector('.vinyl-plate');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const show = () => document.documentElement.classList.remove('motion-pending');
  if (!hero || !image || preference.matches) { show(); return; }
  let cancelled = false;
  const timeout = setTimeout(() => { cancelled = true; show(); }, 6000);
  preference.addEventListener('change', () => { if (preference.matches) { cancelled = true; hero.classList.remove('entering'); show(); } });
  Promise.all([image.decode(), document.fonts.ready]).then(() => {
    clearTimeout(timeout);
    if (cancelled || preference.matches) { show(); return; }
    hero.classList.add('entering');
    show();
    hero.querySelector('.site-address').addEventListener('animationend', () => hero.classList.remove('entering'), {once:true});
  }).catch(() => { clearTimeout(timeout); show(); });
})();
