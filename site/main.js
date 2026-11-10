(function () {
  'use strict';

  var root = document.documentElement;
  var header = document.getElementById('site-header');
  var menuButton = document.getElementById('menu-toggle');
  var nav = document.getElementById('site-nav');
  var themeButton = document.getElementById('theme-toggle');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function storedTheme() {
    try {
      var value = localStorage.getItem('studyontv-theme');
      return value === 'light' || value === 'dark' ? value : '';
    } catch (error) {
      return '';
    }
  }

  function syncTheme() {
    var dark = root.getAttribute('data-theme') === 'dark';
    if (themeButton) {
      themeButton.setAttribute('aria-label', dark ? '切换到浅色模式' : '切换到深色模式');
      themeButton.setAttribute('title', dark ? '切换到浅色模式' : '切换到深色模式');
    }
    var lightMeta = document.getElementById('theme-color-light');
    var darkMeta = document.getElementById('theme-color-dark');
    if (lightMeta) lightMeta.setAttribute('content', dark ? '#101511' : '#f4f1e8');
    if (darkMeta) darkMeta.setAttribute('content', dark ? '#101511' : '#f4f1e8');
  }

  if (themeButton) {
    themeButton.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      root.style.colorScheme = next;
      try { localStorage.setItem('studyontv-theme', next); } catch (error) {}
      syncTheme();
    });
  }

  if (!storedTheme() && window.matchMedia) {
    var scheme = window.matchMedia('(prefers-color-scheme: dark)');
    var onScheme = function (event) {
      if (storedTheme()) return;
      var next = event.matches ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      root.style.colorScheme = next;
      syncTheme();
    };
    if (scheme.addEventListener) scheme.addEventListener('change', onScheme);
    else if (scheme.addListener) scheme.addListener(onScheme);
  }

  syncTheme();

  function closeMenu() {
    if (!menuButton) return;
    menuButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
    if (header) header.classList.remove('nav-open');
  }

  if (menuButton && nav) {
    menuButton.addEventListener('click', function () {
      var open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('nav-open', open);
      if (header) header.classList.toggle('nav-open', open);
      if (open) {
        var first = nav.querySelector('a');
        if (first) first.focus({ preventScroll: true });
      }
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeMenu();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        menuButton.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  function updateHeader() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
  }

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  if (!reduceMotion && 'IntersectionObserver' in window) {
    var targets = document.querySelectorAll([
      '.hero-copy',
      '.hero-products',
      '.about-inner',
      '.section-head',
      '.demo-card',
      '.facts-head',
      '.fact',
      '.install-panel',
      '.faq-head',
      '.faq-list',
      '.footer-cta'
    ].join(','));

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-inview');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    targets.forEach(function (element, index) {
      element.classList.add('reveal');
      if (element.classList.contains('fact')) {
        element.style.setProperty('--reveal-delay', ((index % 2) * 0.07) + 's');
      }
      observer.observe(element);
    });
  }
}());
