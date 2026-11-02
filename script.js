(() => {
  'use strict';

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let lenis = null;
  let lenisFrame = 0;

  const startSmoothScroll = () => {
    if (motionPreference.matches || !window.Lenis || lenis) return;
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true, anchors: true });
    const raf = (time) => {
      if (!lenis) return;
      lenis.raf(time);
      lenisFrame = window.requestAnimationFrame(raf);
    };
    lenisFrame = window.requestAnimationFrame(raf);
  };
  const stopSmoothScroll = () => {
    if (!lenis) return;
    window.cancelAnimationFrame(lenisFrame);
    lenis.destroy();
    lenis = null;
  };
  startSmoothScroll();

  // Reveal the biography and contact copy as their sections enter and leave view.
  const revealSections = [...document.querySelectorAll('.about, .contact')];
  if ('IntersectionObserver' in window && !motionPreference.matches) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('is-visible', entry.isIntersecting));
    }, { threshold: window.innerWidth <= 700 ? 0.05 : 0.2 });
    revealSections.forEach((section) => sectionObserver.observe(section));
  } else {
    revealSections.forEach((section) => section.classList.add('is-visible'));
  }

  // Scroll-driven card stacking. The next card's approach compresses the card beneath it.
  const cardList = document.querySelector('.practice-list');
  const cards = cardList ? [...cardList.querySelectorAll('.practice-card')] : [];
  let scrollFrame = 0;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const updateCards = () => {
    scrollFrame = 0;
    if (motionPreference.matches || !cardList || window.innerWidth <= 767) {
      cards.forEach((card) => { card.style.transform = ''; card.style.opacity = ''; });
      return;
    }
    const stickyTop = window.innerWidth <= 991 ? 80 : 100;
    const listTop = cardList.getBoundingClientRect().top;
    cards.forEach((card, index) => {
      const next = cards[index + 1];
      if (!next) {
        card.style.transform = '';
        card.style.opacity = '';
        return;
      }
      const nextTop = listTop + next.offsetTop;
      const distance = Math.max(1, card.offsetHeight * 0.72);
      const raw = clamp((stickyTop + distance - nextTop) / distance, 0, 1);
      const eased = 1 - Math.pow(1 - raw, 2.5);
      const rotate = -3.5 * eased;
      const lift = -28 * eased;
      const scale = 1 - 0.045 * eased;
      card.style.transform = `perspective(100vw) rotateX(${rotate}deg) translate3d(0, ${lift}px, 0) scale(${scale})`;
      card.style.opacity = String(1 - 0.14 * eased);
    });
  };
  const requestCardUpdate = () => {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateCards);
  };
  window.addEventListener('scroll', requestCardUpdate, { passive: true });
  window.addEventListener('resize', requestCardUpdate, { passive: true });
  requestCardUpdate();

  // Fine, restrained gold flecks add depth to the photographic hero.
  const canvas = document.querySelector('.hero-canvas');
  const context = canvas?.getContext('2d');
  if (canvas && context) {
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let particles = [];
    let canvasFrame = 0;
    const makeParticles = () => Array.from({ length: Math.max(24, Math.round(width / 48)) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.45 + Math.random() * 1.05,
      phase: Math.random() * Math.PI * 2,
      speed: 0.15 + Math.random() * 0.5
    }));
    const resizeCanvas = () => {
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      particles = makeParticles();
      if (motionPreference.matches) drawParticles(0);
    };
    const drawParticles = (time) => {
      context.clearRect(0, 0, width, height);
      particles.forEach((particle) => {
        const blink = motionPreference.matches ? 0.3 : 0.2 + (Math.sin(time * 0.0005 * particle.speed + particle.phase) + 1) * 0.22;
        context.beginPath();
        context.fillStyle = `rgba(214,182,109,${blink})`;
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      });
    };
    const animateParticles = (time) => {
      drawParticles(time);
      if (!motionPreference.matches) canvasFrame = window.requestAnimationFrame(animateParticles);
    };
    resizeCanvas();
    if (!motionPreference.matches) canvasFrame = window.requestAnimationFrame(animateParticles);
    window.addEventListener('resize', resizeCanvas, { passive: true });
    motionPreference.addEventListener?.('change', (event) => {
      if (event.matches) {
        window.cancelAnimationFrame(canvasFrame);
        drawParticles(0);
      } else {
        canvasFrame = window.requestAnimationFrame(animateParticles);
      }
    });
  }

  const year = document.querySelector('#current-year');
  if (year) year.textContent = String(new Date().getFullYear());

  motionPreference.addEventListener?.('change', (event) => {
    if (event.matches) {
      stopSmoothScroll();
      revealSections.forEach((section) => section.classList.add('is-visible'));
      requestCardUpdate();
    } else {
      startSmoothScroll();
    }
  });
})();
