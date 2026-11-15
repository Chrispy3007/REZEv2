/* REZE Liquid Glass interaction layer — no dependencies */
(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const orbA = document.createElement('div'); orbA.className = 'glass-orb one';
  const orbB = document.createElement('div'); orbB.className = 'glass-orb two';
  const glow = document.createElement('div'); glow.className = 'pointer-glow';
  document.body.append(orbA, orbB, glow);

  // Soft pointer-following light gives the translucent surfaces a liquid-glass feel.
  if (!reduceMotion && matchMedia('(pointer:fine)').matches) {
    let raf = 0, x = innerWidth / 2, y = innerHeight / 2;
    document.addEventListener('pointermove', e => {
      x = e.clientX; y = e.clientY;
      if (!raf) raf = requestAnimationFrame(() => {
        glow.style.left = `${x}px`; glow.style.top = `${y}px`; glow.style.opacity = '.9'; raf = 0;
      });
    }, { passive: true });
    document.addEventListener('pointerleave', () => glow.style.opacity = '0');
  }

  // Add a restrained glass tilt to large cards; disabled for touch and reduced motion.
  if (!reduceMotion && matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.form-card,.preview-card,.page-card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5;
        const py = (e.clientY - r.top) / r.height - .5;
        card.style.setProperty('--shine-x', `${(px + .5) * 100}%`);
        card.style.setProperty('--shine-y', `${(py + .5) * 100}%`);
      });
    });
  }

  // Theme state is managed centrally by app.js. Keeping this visual layer
  // free of theme listeners prevents a single click from toggling twice.

  // Logo gives a subtle visual response without making the app feel busy.
  const logo = document.querySelector('.brand-mark');
  logo?.addEventListener('pointerenter', () => { if (!reduceMotion) logo.style.transform = 'translateY(-2px) rotate(-2deg)'; });
  logo?.addEventListener('pointerleave', () => { logo.style.transform = ''; });

  // Small status feedback when keyboard shortcuts are used.
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const firstField = document.querySelector('[data-field="name"]');
      document.querySelector('[data-view="editor"]')?.click();
      firstField?.focus({ preventScroll: false });
    }
  });
})();
