/* ╔══════════════════════════════════════════════════════╗
   ║  Tu Sitio Web 3.0 — "Código y Oficio"               ║
   ║  Interactive Terminal & Lightweight Scripts          ║
   ╚══════════════════════════════════════════════════════╝ */

document.addEventListener('DOMContentLoaded', () => {
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let prefersReducedMotion = motionQuery.matches;

  motionQuery.addEventListener('change', (e) => {
    prefersReducedMotion = e.matches;
  });

  /* ═══ Dynamic Year ═══ */
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ═══ Mobile Navigation ═══ */
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = navMenu?.querySelectorAll('a');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen);
      navToggle.innerHTML = isOpen
        ? '<i class="fas fa-times" aria-hidden="true"></i>'
        : '<i class="fas fa-bars" aria-hidden="true"></i>';
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    navLinks?.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
        document.body.style.overflow = '';
      });
    });
  }

  /* ═══ Consolidated Scroll Handler (rAF Throttled) ═══ */
  const siteNav = document.getElementById('site-nav');
  const scrollProgress = document.getElementById('scroll-progress');
  const sections = document.querySelectorAll('section[id]');
  const anchors = document.querySelectorAll('.nav-links a[href^="#"]');

  let ticking = false;

  const onScroll = () => {
    const scrollY = window.scrollY;

    // Navbar Scrolled State
    if (siteNav) {
      siteNav.classList.toggle('scrolled', scrollY > 40);
    }

    // Scroll Progress Line
    if (scrollProgress) {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (scrollY / totalHeight) * 100;
        scrollProgress.style.width = `${Math.min(progress, 100)}%`;
      }
    }

    // Active Nav Link Highlight
    const scrollPos = scrollY + 120;
    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      const id = sec.getAttribute('id');
      if (scrollPos >= top && scrollPos < top + height) {
        anchors.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
        });
      }
    });

    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });

  // Initial trigger
  onScroll();

  /* ═══ Scroll Reveal (IntersectionObserver) ═══ */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(el => observer.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('revealed'));
  }

  /* ═══ Signature Element: Animated Craft Terminal ═══ */
  const terminalBody = document.getElementById('terminal-body');

  if (terminalBody && !prefersReducedMotion) {
    const sequence = [
      { text: '// Iniciando nuevo proyecto a medida...', type: 'comment', delay: 400 },
      { text: '$ git init mi-sitio-web', type: 'cmd', delay: 800 },
      { text: '✔ Repositorio inicializado en /tu-empresa', type: 'success', delay: 600 },
      { text: '$ config --stack=fullstack --seo=100', type: 'cmd', delay: 1000 },
      { text: '[+] 15 años de experiencia integrados', type: 'path', delay: 600 },
      { text: '[+] Diseño responsivo y adaptable', type: 'path', delay: 400 },
      { text: '[+] 0% plantillas genéricas', type: 'accent', delay: 500 },
      { text: '✔ Sitio listo para lanzamiento.', type: 'success', delay: 800 }
    ];

    let stepIndex = 0;
    let activeCharInterval = null;
    let activeStepTimeout = null;

    const typeLine = (lineData, onComplete) => {
      const lineEl = document.createElement('div');
      lineEl.className = 'terminal-line';
      
      const contentSpan = document.createElement('span');
      contentSpan.className = lineData.type;
      
      const cursor = document.createElement('span');
      cursor.className = 'terminal-cursor';
      
      lineEl.appendChild(contentSpan);
      lineEl.appendChild(cursor);
      
      const oldCursor = terminalBody.querySelector('.terminal-cursor');
      if (oldCursor) oldCursor.remove();

      terminalBody.appendChild(lineEl);

      const text = lineData.text;
      let charIdx = 0;

      activeCharInterval = setInterval(() => {
        if (charIdx < text.length) {
          contentSpan.textContent += text[charIdx];
          charIdx++;
        } else {
          clearInterval(activeCharInterval);
          activeCharInterval = null;
          activeStepTimeout = setTimeout(onComplete, lineData.delay);
        }
      }, 35);
    };

    const runSequence = () => {
      if (stepIndex < sequence.length) {
        typeLine(sequence[stepIndex], () => {
          stepIndex++;
          runSequence();
        });
      }
    };

    if ('IntersectionObserver' in window) {
      const termObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Remove noscript element if JS runs
            const noscriptEl = terminalBody.querySelector('noscript');
            if (noscriptEl) noscriptEl.remove();
            terminalBody.innerHTML = '';

            setTimeout(runSequence, 300);
            termObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });

      termObserver.observe(terminalBody);
    } else {
      setTimeout(runSequence, 500);
    }

    // Clean up timers on page unload/hide
    window.addEventListener('pagehide', () => {
      if (activeCharInterval) clearInterval(activeCharInterval);
      if (activeStepTimeout) clearTimeout(activeStepTimeout);
    });
  }
});
