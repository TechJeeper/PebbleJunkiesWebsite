const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return () => {};

  return () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? (window.scrollY / max) * 100 : 0;
    bar.style.transform = `scaleX(${clamp(p, 0, 100) / 100})`;
  };
}

function initHeader() {
  const header = document.getElementById('site-header');
  if (!header) return () => {};
  return () => {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  };
}

function initNav() {
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  toggle?.addEventListener('click', () => {
    const open = links?.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  links?.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      links.classList.remove('is-open');
      toggle?.setAttribute('aria-expanded', 'false');
    });
  });
}

function decorateMotionTargets() {
  document.querySelectorAll('.page-hero .container > *').forEach((el, i) => {
    el.classList.add('reveal', 'reveal-up');
    el.style.setProperty('--reveal-delay', `${i * 50}ms`);
  });

  document.querySelectorAll('.section-head').forEach((el) => {
    el.classList.add('reveal', 'reveal-up');
  });

  document.querySelectorAll('.lane').forEach((el, i) => {
    el.classList.add('reveal');
    el.classList.add(el.classList.contains('reverse') ? 'reveal-left' : 'reveal-right');
    el.style.setProperty('--reveal-delay', `${(i % 3) * 40}ms`);
  });

  for (const sel of ['.watch-grid', '.news-list', '.grid-2', '.grid-3']) {
    document.querySelectorAll(sel).forEach((group) => {
      group.classList.add('stagger');
      // Parent may already have .reveal from markup — reveal it too so children aren't trapped at opacity 0.
      if (group.classList.contains('reveal')) {
        group.classList.add('reveal-up');
      }
      [...group.children].forEach((child, i) => {
        child.classList.add('reveal', 'reveal-up');
        child.style.setProperty('--reveal-delay', `${Math.min(i, 8) * 40}ms`);
      });
    });
  }

  document.querySelectorAll('.panel').forEach((el, i) => {
    if (el.closest('.stagger')) return;
    el.classList.add('reveal', 'reveal-up');
    el.style.setProperty('--reveal-delay', `${(i % 4) * 35}ms`);
  });
}

function revealNow(el) {
  el.classList.add('is-in');
}

function initReveals() {
  const nodes = [...document.querySelectorAll('.reveal')];
  if (!nodes.length) return;

  if (reduceMotion) {
    nodes.forEach(revealNow);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          revealNow(entry.target);
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.02, rootMargin: '0px 0px 12% 0px' }
  );

  const vh = window.innerHeight;
  nodes.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < vh * 0.98 && rect.bottom > 0) {
      revealNow(el);
      return;
    }
    io.observe(el);
  });
}

function initHeroScroll() {
  if (reduceMotion) return () => {};

  const hero = document.querySelector('.hero');
  const heroBg = document.querySelector('.hero-bg');
  if (!hero || !heroBg) return () => {};

  return () => {
    const vh = window.innerHeight;
    const y = window.scrollY;
    // Parallax the wrapper only — img keeps its CSS drift animation (no transform fight).
    const shift = Math.min(y * 0.18, vh * 0.35);
    heroBg.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
    const start = vh * 0.35;
    hero.style.setProperty('--hero-veil', String(y <= start ? 0 : clamp((y - start) / (vh * 0.9), 0, 0.45)));
  };
}

function initFloatingOrbs() {
  if (reduceMotion) return () => {};
  const stage = document.getElementById('scroll-orbs');
  if (!stage) return () => {};

  return () => {
    const y = window.scrollY;
    stage.style.setProperty('--orb-y', `${(y * 0.03).toFixed(1)}px`);
    stage.style.setProperty('--orb-shift', `${Math.sin(y / 640) * 14}px`);
  };
}

function boot() {
  if ((location.pathname === '/' || location.pathname === '/index.html') && !location.hash) {
    window.scrollTo(0, 0);
  }

  initNav();
  decorateMotionTargets();
  initReveals();

  const updateProgress = initScrollProgress();
  const updateHeader = initHeader();
  const updateHero = initHeroScroll();
  const updateOrbs = initFloatingOrbs();

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateProgress();
      updateHeader();
      updateHero();
      updateOrbs();
      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
