// Mobile menu
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});

// Ripple from the click point on buttons
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('pointerdown', e => {
    const r = btn.getBoundingClientRect();
    const dot = document.createElement('span');
    dot.className = 'ripple';
    dot.style.left = `${e.clientX - r.left}px`;
    dot.style.top = `${e.clientY - r.top}px`;
    btn.appendChild(dot);
    setTimeout(() => dot.remove(), 650);
  });
});

// Page transitions: the page fades to cream and the logo's heartbeat draws before leaving;
// the next page opens with the line drawn and clears it (pt-arrive is set in each page's head)
const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (root.classList.contains('pt-arrive')) {
  try { sessionStorage.removeItem('pt'); } catch (e) {}
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('pt-reveal')));
  setTimeout(() => root.classList.remove('pt-arrive', 'pt-reveal'), 800);
}

document.addEventListener('click', e => {
  const link = e.target.closest('a[href]');
  if (!link || reduceMotion || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (link.target === '_blank' || link.hasAttribute('download')) return;
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin) return;
  // Same-page anchors just scroll
  if (url.pathname === location.pathname) return;
  e.preventDefault();
  try { sessionStorage.setItem('pt', '1'); } catch (e) {}
  root.classList.add('pt-leave');
  setTimeout(() => (location.href = url.href), 1150);
});

// Coming back with the browser's back button restores the page from cache, so reset it
window.addEventListener('pageshow', e => {
  if (e.persisted) root.classList.remove('pt-leave', 'pt-arrive', 'pt-reveal');
});

// Header gains a shadow once the page scrolls
const header = document.querySelector('.site-header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Reveal elements as they enter the viewport
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(el => io.observe(el));
} else {
  reveals.forEach(el => el.classList.add('in'));
}

// Count-up numbers
document.querySelectorAll('[data-count]').forEach(el => {
  const target = +el.dataset.count;
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    const start = performance.now();
    const tick = now => {
      const p = Math.min((now - start) / 1400, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  io.observe(el);
});

// Contact form composes an email (no server needed)
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(form);
    const subject = `Website enquiry: ${f.get('topic')} — ${f.get('name')}${f.get('company') ? ' (' + f.get('company') + ')' : ''}`;
    const body = `${f.get('message')}\n\nName: ${f.get('name')}\nCompany: ${f.get('company')}\nEmail: ${f.get('email')}\nPhone: ${f.get('phone')}`;
    location.href = `mailto:wellness@sinoluvoconsulting.co.za?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

document.querySelectorAll('.year').forEach(el => (el.textContent = new Date().getFullYear()));

// Gallery lightbox
const gallery = document.getElementById('gallery');
const lightbox = document.getElementById('lightbox');
if (gallery && lightbox) {
  const items = [...gallery.querySelectorAll('.gallery-item')];
  const lbImg = lightbox.querySelector('img');
  const lbCaption = lightbox.querySelector('figcaption');
  let index = 0;
  let opener = null;

  const show = i => {
    index = (i + items.length) % items.length;
    const thumb = items[index].querySelector('img');
    // Fade the old photo out, then fade the next one in once it has loaded
    lbImg.classList.add('swap');
    setTimeout(() => {
      lbImg.onload = () => lbImg.classList.remove('swap');
      lbImg.src = items[index].dataset.full;
      if (lbImg.complete) lbImg.classList.remove('swap');
    }, 150);
    lbImg.alt = thumb.alt;
    lbCaption.textContent = `${thumb.alt} (${index + 1} of ${items.length})`;
  };
  const open = i => {
    opener = items[i];
    show(i);
    lightbox.hidden = false;
    document.body.classList.add('lb-open');
    lightbox.querySelector('.lb-close').focus();
  };
  const close = () => {
    lightbox.hidden = true;
    document.body.classList.remove('lb-open');
    if (opener) opener.focus();
  };

  items.forEach((item, i) => item.addEventListener('click', () => open(i)));
  lightbox.querySelector('.lb-close').addEventListener('click', close);
  lightbox.querySelector('.lb-prev').addEventListener('click', () => show(index - 1));
  lightbox.querySelector('.lb-next').addEventListener('click', () => show(index + 1));
  lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
  document.addEventListener('keydown', e => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });

  // Swipe on touch screens
  let startX = null;
  lightbox.addEventListener('touchstart', e => (startX = e.touches[0].clientX), { passive: true });
  lightbox.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    startX = null;
  });
}
