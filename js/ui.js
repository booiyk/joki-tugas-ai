/* ======================
   UI tanpa dependensi Three.js — jalan meski CDN mati
   (dipisah dari js/main.js supaya reveal/menu/scroll tetap
   berfungsi saat modul Three.js gagal dimuat)
   ====================== */
(function initUI() {
  // Scroll reveal
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal--visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  // Mobile menu
  const burger = document.getElementById('navBurger');
  const navLinks = document.getElementById('navLinks');
  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      burger.setAttribute('aria-expanded', isOpen);
    });

    navLinks.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Smooth anchor scroll
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Active nav link on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinksAll = document.querySelectorAll('.nav__links a[href^="#"]');
  if (sections.length && navLinksAll.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinksAll.forEach((link) => {
            link.toggleAttribute('aria-current', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, { threshold: 0.5, rootMargin: '-50px 0px -50% 0px' });
    sections.forEach((s) => observer.observe(s));
  }
})();
