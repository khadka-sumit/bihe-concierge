/**
 * animations.js — Animation Controller
 *
 * IntersectionObserver for .reveal elements, SVG thread animation,
 * staggered form field reveals, and parallax utility.
 * No external libraries — pure CSS + rAF + IO.
 */

(function () {

  // ── IntersectionObserver for .reveal elements ──────────

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        // Once revealed, no need to observe further
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  });

  function observeRevealEls(root) {
    const root$ = root || document;
    root$.querySelectorAll('.reveal, .reveal-left, .headline-reveal').forEach(el => {
      revealObserver.observe(el);
    });
  }

  // ── SVG Thread animation ───────────────────────────────

  const threadObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        threadObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  function observeThreadEls() {
    document.querySelectorAll('.journey-thread').forEach(el => {
      threadObserver.observe(el);
    });
  }

  // ── Staggered form field reveals ──────────────────────

  function staggerFormFields(containerEl, baseDelay) {
    const delay = baseDelay ?? 0;
    const fields = containerEl.querySelectorAll('.field, .upload-card, .review-item');
    fields.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(12px)';
      el.style.transition = `opacity 0.55s var(--ease-luxury) ${delay + i * 55}ms, transform 0.55s var(--ease-luxury) ${delay + i * 55}ms`;

      // Trigger after a short paint delay
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        });
      });
    });
  }

  // ── Progress sidebar connecting line ──────────────────

  function animateSidebarLine(currentStage) {
    const line = document.getElementById('sidebarConnector');
    if (!line) return;
    const percent = ((currentStage - 1) / 5) * 100;
    line.style.height = `${percent}%`;
  }

  // ── Active stage pulse ─────────────────────────────────

  function animateActiveStage(stageNum) {
    document.querySelectorAll('.sidebar-step').forEach((el, i) => {
      const num = i + 1;
      el.classList.remove('is-active', 'is-complete');
      if (num === stageNum) el.classList.add('is-active');
      if (num < stageNum)  el.classList.add('is-complete');
    });
  }

  // ── Subtle parallax on editorial images ───────────────

  let parallaxEls = [];
  let ticking = false;

  function initParallax() {
    // Only on desktop and if not prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.innerWidth < 1024) return;

    parallaxEls = Array.from(document.querySelectorAll('[data-parallax]'));
    if (!parallaxEls.length) return;

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  function updateParallax() {
    const scrollY = window.scrollY;
    parallaxEls.forEach(el => {
      const rect   = el.getBoundingClientRect();
      const speed  = parseFloat(el.dataset.parallax) || 0.08;
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed;
      // Clamp to ±20px
      const clamped = Math.max(-20, Math.min(20, offset));
      const img = el.querySelector('img');
      if (img) img.style.transform = `translateY(${clamped}px)`;
    });
    ticking = false;
  }

  // ── Check circle animate on enter ─────────────────────

  function observeCheckCircles() {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('.check-circle').forEach(el => obs.observe(el));
  }

  // ── Public API ─────────────────────────────────────────

  window.AnimationController = {
    observeRevealEls,
    staggerFormFields,
    animateSidebarLine,
    animateActiveStage,
    initParallax,
    observeCheckCircles,
    observeThreadEls,
  };

  // Auto-init on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    observeRevealEls();
    observeThreadEls();
    initParallax();
    observeCheckCircles();
  });

})();
