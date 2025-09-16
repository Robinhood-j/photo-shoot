/* script.js — front-end behavior for Capture Moments
   - Navigation / SPA-like pages
   - Hamburger toggle
   - Hero carousel (auto + controls)
   - Testimonials slider
   - Portfolio filter chips
   - Lightbox & View button
   - Analyze (AI) button -> calls /api/analyze (Flask)
   - Contact form -> posts to /api/contact (Flask) with fallback to localStorage
   - Save draft to localStorage
   - Theme toggle
   - Animate-on-scroll
*/

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* ---------------- Navigation & Pages ---------------- */
function setupNavigation() {
  const hamburger = $('#hamburger');
  const navMenu = $('#nav-menu');
  const navLinks = $$('.nav-link');
  const pages = $$('.page');

  // toggle mobile menu
  hamburger?.addEventListener('click', () => {
    const open = navMenu.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // click on nav items -> SPA feel
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      if (!page) return;

      navLinks.forEach(n => n.classList.remove('active'));
      pages.forEach(p => p.classList.remove('active'));
      link.classList.add('active');
      const pageId = `#${page}-page`;
      document.querySelector(pageId)?.classList.add('active');

      navMenu.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');

      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // logo returns home
  document.querySelector('.logo')?.addEventListener('click', (e) => {
    e.preventDefault();
    navLinks.forEach(n => n.classList.remove('active'));
    pages.forEach(p => p.classList.remove('active'));
    const homeLink = document.querySelector('[data-page="home"]');
    homeLink?.classList.add('active');
    document.querySelector('#home-page')?.classList.add('active');
    navMenu.classList.remove('active');
  });
}

/* ---------------- Hero Carousel ---------------- */
function setupHeroCarousel() {
  const slides = $$('.slide');
  const prev = document.querySelector('.carousel-prev');
  const next = document.querySelector('.carousel-next');
  let idx = 0;
  let timer = null;
  const INTERVAL = 5000;

  function show(i) {
    slides.forEach((s, n) => s.classList.toggle('is-active', n === i));
    idx = i;
  }
  function nextSlide() { show((idx + 1) % slides.length); }
  function prevSlide() { show((idx - 1 + slides.length) % slides.length); }

  if (slides.length === 0) return;
  show(0);
  timer = setInterval(nextSlide, INTERVAL);

  next?.addEventListener('click', () => { nextSlide(); restart(); });
  prev?.addEventListener('click', () => { prevSlide(); restart(); });

  // touch support
  let startX = 0;
  const container = document.querySelector('.hero');
  container?.addEventListener('touchstart', (e) => startX = e.touches[0].clientX);
  container?.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (dx > 40) prevSlide();
    if (dx < -40) nextSlide();
    restart();
  });

  function restart() {
    clearInterval(timer);
    timer = setInterval(nextSlide, INTERVAL);
  }
}

/* ---------------- Testimonials ---------------- */
function setupTestimonials() {
  const root = document.querySelector('[data-testi]');
  if (!root) return;
  const items = Array.from(root.children);
  const prev = document.querySelector('.testi-prev');
  const next = document.querySelector('.testi-next');
  const dotsContainer = document.querySelector('.testi-dots');
  let idx = 0;
  let timer = null;

  // create dots
  items.forEach((it, i) => {
    const btn = document.createElement('button');
    btn.className = 'dot';
    btn.addEventListener('click', () => go(i));
    dotsContainer.appendChild(btn);
  });
  const dots = Array.from(dotsContainer.children);

  function render() {
    items.forEach((it, i) => it.classList.toggle('active', i === idx));
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }
  function go(i) { idx = i; render(); restart(); }
  function nextItem() { idx = (idx + 1) % items.length; render(); }
  function prevItem() { idx = (idx - 1 + items.length) % items.length; render(); }

  next?.addEventListener('click', () => { nextItem(); restart(); });
  prev?.addEventListener('click', () => { prevItem(); restart(); });

  function start() { timer = setInterval(nextItem, 6000); }
  function stop() { clearInterval(timer); }
  function restart() { stop(); start(); }

  render();
  start();
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
}

/* ---------------- Portfolio Filters ---------------- */
function setupFilters() {
  const chips = $$('.chip');
  const items = $$('#portfolioGrid .gallery-item, #portfolioGrid .card, #portfolioGrid .gallery-item');

  if (!chips.length) return;
  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const filter = chip.dataset.filter;
    const allItems = $$('#portfolioGrid .gallery-item, #portfolioGrid .card, #portfolioGrid .gallery-item');
    allItems.forEach(it => {
      const cat = (it.dataset.category || it.getAttribute('data-category') || 'all').toLowerCase();
      it.style.display = (filter === 'all' || cat === filter) ? '' : 'none';
    });
  }));
}

/* ---------------- Lightbox & Analyze ---------------- */
function setupLightboxAndAnalyze() {
  const lightbox = $('#lightbox');
  const lightboxImg = document.querySelector('.lightbox-img');
  const lightboxCaption = document.querySelector('.lightbox-caption');
  const lightboxTags = document.querySelector('.lightbox-tags');
  const lightboxDownload = document.querySelector('.lightbox-download');
  const closeBtn = document.querySelector('.lightbox-close');

  function openLightbox(src, caption = '') {
    lightboxImg.src = src;
    lightboxImg.alt = caption || 'Photo preview';
    lightboxCaption.textContent = caption || '';
    lightboxTags.innerHTML = '';
    lightboxDownload.href = src;
    lightbox.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    closeBtn.focus();
  }
  function closeLightbox() {
    lightbox.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    lightboxImg.src = '';
  }
  closeBtn?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lightbox.getAttribute('aria-hidden') === 'false') closeLightbox(); });

  // view buttons open lightbox
  document.addEventListener('click', (e) => {
    if (e.target.matches('.view-btn') || e.target.closest('.view-btn')) {
      const figure = e.target.closest('.card, .gallery-item, figure');
      const src = figure?.dataset.full || figure?.querySelector('img')?.src;
      const caption = figure?.querySelector('figcaption h3')?.textContent || figure?.querySelector('img')?.alt || '';
      if (src) openLightbox(src, caption);
    }
  });

  // analyze buttons call backend
  document.addEventListener('click', async (e) => {
    if (e.target.matches('.analyze-btn') || e.target.closest('.analyze-btn')) {
      const btn = e.target.closest('.analyze-btn') || e.target;
      const imageUrl = btn.dataset.full;
      if (!imageUrl) {
        alert('No image URL found to analyze.');
        return;
      }

      // show lightbox while analyzing
      openLightbox(imageUrl, 'Analyzing image with AI...');
      lightboxTags.innerHTML = '';

      // DEBUG: use absolute endpoint that matches your server
const ANALYZE_ENDPOINT = 'http://127.0.0.1:5000/api/analyze'; // or 'http://192.168.0.104:5000/api/analyze' if you use that IP

try {
  const resp = await fetch(ANALYZE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl })
  });

  console.log('DEBUG: analyze response status', resp.status);
  const text = await resp.text();
  console.log('DEBUG: analyze raw response text:', text);

  if (!resp.ok) {
    console.error('DEBUG: analyze returned error', resp.status, text);
    lightboxCaption.textContent = 'Analysis failed (server returned error). See console.';
    return;
  }

  const data = JSON.parse(text);
  lightboxCaption.textContent = data.caption || 'Analysis complete';
  lightboxTags.innerHTML = '';
  (data.tags || []).forEach(t => {
    const el = document.createElement('span');
    el.className = 'chip';
    el.textContent = t;
    lightboxTags.appendChild(el);
  });
} catch (err) {
  console.error('DEBUG: analyze fetch exception:', err);
  lightboxCaption.textContent = 'Analysis failed (see console).';
}

    }
  });
}

/* ---------------- Contact Form (POST to /api/contact) ---------------- */
function setupContactForm() {
  const form = $('#contactForm');
  const saveBtn = $('#saveDraft');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#c-name').value.trim();
    const email = $('#c-email').value.trim();
    const service = $('#c-service').value;
    const message = $('#c-message').value.trim();

    if (!name || !email || !message) { alert('Please complete the required fields.'); return; }

    const payload = { name, email, service, message };

    // attempt to POST to backend; fallback to localStorage
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      alert(data.message || 'Message sent (server). Thank you!');
      form.reset();
      localStorage.removeItem('cm_draft');
    } catch (err) {
      console.warn('Contact POST failed; saving locally', err);
      const list = JSON.parse(localStorage.getItem('cm_messages') || '[]');
      list.push({ id: Date.now(), ...payload });
      localStorage.setItem('cm_messages', JSON.stringify(list));
      alert('Server unavailable — message saved locally.');
    }
  });

  saveBtn?.addEventListener('click', () => {
    const draft = {
      name: $('#c-name').value,
      email: $('#c-email').value,
      service: $('#c-service').value,
      message: $('#c-message').value
    };
    localStorage.setItem('cm_draft', JSON.stringify(draft));
    alert('Draft saved locally.');
  });

  // load draft if exists
  const draft = JSON.parse(localStorage.getItem('cm_draft') || 'null');
  if (draft) {
    $('#c-name').value = draft.name || '';
    $('#c-email').value = draft.email || '';
    $('#c-service').value = draft.service || '';
    $('#c-message').value = draft.message || '';
  }
}

/* ---------------- Theme toggle ---------------- */
function setupThemeToggle() {
  const btn = $('#themeToggle');
  const stored = localStorage.getItem('cm_theme');
  if (stored === 'dark') document.documentElement.classList.add('dark');
  btn && btn.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    btn.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('cm_theme', isDark ? 'dark' : 'light');
  });
}

/* ---------------- Animate on scroll & header effects ---------------- */
function setupScrollEffects() {
  const animated = $$('.animate-on-scroll');
  function check() {
    animated.forEach(el => {
      const top = el.getBoundingClientRect().top;
      if (top < window.innerHeight * 0.85) el.classList.add('animated');
    });
  }
  window.addEventListener('scroll', check);
  check();

  // header scrolled class
  const header = $('#header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  });
}

/* ---------------- Initialize ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupHeroCarousel();
  setupTestimonials();
  setupFilters();
  setupLightboxAndAnalyze();
  setupContactForm();
  setupThemeToggle();
  setupScrollEffects();

  // keyboard accessibility: allow Enter on "view" and "analyze" buttons
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.activeElement.matches('.view-btn, .analyze-btn')) {
      document.activeElement.click();
    }
  });
});
