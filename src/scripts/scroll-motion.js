const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return () => {};

  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? (window.scrollY / max) * 100 : 0;
    bar.style.transform = `scaleX(${clamp(p, 0, 100) / 100})`;
  };
  return update;
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
}

function decorateMotionTargets() {
  document.querySelectorAll('.page-hero .container > *').forEach((el, i) => {
    if (!el.classList.contains('reveal')) {
      el.classList.add('reveal', 'reveal-up');
      el.style.setProperty('--reveal-delay', `${i * 80}ms`);
    }
  });

  document.querySelectorAll('.section-head').forEach((el) => {
    el.classList.add('reveal', 'reveal-up');
  });

  document.querySelectorAll('.lane').forEach((el, i) => {
    el.classList.add('reveal');
    el.classList.add(el.classList.contains('reverse') ? 'reveal-left' : 'reveal-right');
    el.style.setProperty('--reveal-delay', `${(i % 3) * 60}ms`);
  });

  const staggerGroups = [
    '.watch-grid',
    '.news-list',
    '.grid-2',
    '.grid-3',
    '.footer-grid',
  ];

  for (const sel of staggerGroups) {
    document.querySelectorAll(sel).forEach((group) => {
      group.classList.add('stagger');
      [...group.children].forEach((child, i) => {
        child.classList.add('reveal', 'reveal-up');
        child.style.setProperty('--reveal-delay', `${i * 70}ms`);
      });
    });
  }

  document.querySelectorAll('.panel').forEach((el, i) => {
    if (el.closest('.stagger')) return;
    el.classList.add('reveal', 'reveal-scale');
    el.style.setProperty('--reveal-delay', `${(i % 4) * 50}ms`);
  });

  document.querySelectorAll('.hero-bg img, .lane-visual img, .watch-tile .media img').forEach((img) => {
    if (!img.closest('[data-parallax]')) {
      const wrap = img.parentElement;
      if (wrap) wrap.setAttribute('data-parallax', wrap.classList.contains('hero-bg') ? '0.35' : '0.18');
    }
  });
}

function initReveals() {
  const nodes = [...document.querySelectorAll('.reveal')];
  if (!nodes.length) return;

  if (reduceMotion) {
    nodes.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );

  nodes.forEach((el) => io.observe(el));
}

function initParallax() {
  if (reduceMotion) return () => {};

  const layers = [...document.querySelectorAll('[data-parallax]')];
  const hero = document.querySelector('.hero');
  const heroContent = document.querySelector('.hero-content');

  return () => {
    const vh = window.innerHeight;

    for (const layer of layers) {
      const speed = Number(layer.getAttribute('data-parallax') || '0.2');
      const rect = layer.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const offset = (mid - vh / 2) * speed * -1;
      const img = layer.matches('img') ? layer : layer.querySelector('img');
      if (img) {
        img.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(1.08)`;
      } else {
        layer.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      }
    }

    if (hero && heroContent) {
      const y = window.scrollY;
      const fade = clamp(1 - y / (vh * 0.75), 0, 1);
      heroContent.style.opacity = String(fade);
      heroContent.style.transform = `translate3d(0, ${(y * 0.22).toFixed(1)}px, 0)`;
      hero.style.setProperty('--hero-veil', String(clamp(y / (vh * 0.9), 0, 0.55)));
    }
  };
}

function initFloatingOrbs() {
  if (reduceMotion) return () => {};
  const stage = document.getElementById('scroll-orbs');
  if (!stage) return () => {};

  return () => {
    const y = window.scrollY;
    stage.style.setProperty('--orb-y', `${(y * 0.08).toFixed(1)}px`);
    stage.style.setProperty('--orb-shift', `${Math.sin(y / 420) * 40}px`);
  };
}

function initMagneticSections() {
  if (reduceMotion) return;

  document.querySelectorAll('.section').forEach((section) => {
    section.classList.add('section-motion');
  });

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        entry.target.classList.toggle('is-active-section', entry.isIntersecting);
      }
    },
    { threshold: 0.18 }
  );

  document.querySelectorAll('.section-motion').forEach((el) => io.observe(el));
}

function boot() {
  initNav();
  decorateMotionTargets();
  initReveals();
  initMagneticSections();

  const updateProgress = initScrollProgress();
  const updateHeader = initHeader();
  const updateParallax = initParallax();
  const updateOrbs = initFloatingOrbs();

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateProgress();
      updateHeader();
      updateParallax();
      updateOrbs();
      document.documentElement.style.setProperty('--scroll-y', `${window.scrollY}px`);
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
