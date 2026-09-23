/**
 * app.js — Landing Page Logic
 * Segorokuwat Website
 *
 * Handles: navbar behavior, activity cards render,
 * Supabase data fetch, AOS animations, scroll-to-top.
 */

// ── Constants ──────────────────────────────────────────────
const RECENT_LIMIT = 6;

// ── Icon helpers (inline SVG, no external dep) ─────────────
const Icons = {
  arrowRight:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  image:        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  calendar:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  photos:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
};

// ── Navbar ──────────────────────────────────────────────────
function initNavbar() {
  const navbar     = document.getElementById('main-navbar');
  const hamburger  = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('nav-mobile-menu');
  const hero       = document.getElementById('hero');
  if (!navbar) return;

  function updateNavbarState() {
    const scrollY     = window.scrollY;
    const heroBottom  = hero ? hero.offsetTop + hero.offsetHeight : 0;
    navbar.classList.toggle('scrolled', scrollY > 60);
    navbar.classList.toggle('on-light', heroBottom > 0 && scrollY > heroBottom - 80);
  }

  window.addEventListener('scroll', updateNavbarState, { passive: true });
  updateNavbarState();

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
    document.addEventListener('click', (e) => {
      if (!navbar.contains(e.target) && !mobileMenu.contains(e.target)) {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  // Mark active link
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link-pub').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (path.endsWith(href) || (href === 'index.html' && (path === '/' || path.endsWith('/'))))) {
      link.classList.add('active');
    }
  });
}

// ── Skeleton ────────────────────────────────────────────────
function buildSkeletons(count = 6) {
  return Array(count).fill(0).map(() => `
    <div class="activity-card-skeleton" aria-hidden="true">
      <div class="skeleton skeleton-thumb"></div>
      <div class="skeleton-body">
        <div class="skeleton" style="height:15px; width:75%; border-radius:4px;"></div>
        <div class="skeleton" style="height:13px; width:50%; border-radius:4px; margin-top:6px;"></div>
        <div class="skeleton" style="height:1px; width:100%; margin-top:12px;"></div>
        <div class="skeleton" style="height:13px; width:40%; border-radius:4px; margin-top:10px;"></div>
      </div>
    </div>
  `).join('');
}

// ── Activity Card ───────────────────────────────────────────
// Menerima coverUrl yang sudah diresolved (termasuk rotating cover)
function buildActivityCardHtml(activity, coverUrl, delay = 0) {
  const year       = activity.year?.year || '';
  const name       = activity.name || 'Kegiatan';
  const slug       = activity.slug || activity.id;
  const photoCount = Array.isArray(activity.photos) ? (activity.photos[0]?.count ?? 0) : 0;

  const thumbContent = coverUrl
    ? `<img src="${coverUrl}" alt="${name}" loading="lazy"
           onerror="this.onerror=null; this.src='${GDrive.FALLBACK_IMAGE}'" />`
    : `<div class="activity-card-thumb-placeholder">${Icons.image}
         <span style="font-size:0.75rem;font-weight:500;">Belum ada foto</span>
       </div>`;

  const meta = [];
  if (year) meta.push(`<span class="activity-card-meta-item">${Icons.calendar} ${year}</span>`);
  if (photoCount > 0) meta.push(`<span class="activity-card-meta-item">${Icons.photos} ${photoCount} foto</span>`);

  return `
    <a class="activity-card" href="activity.html?slug=${encodeURIComponent(slug)}"
       id="card-${slug}" data-aos="fade-up" data-aos-delay="${delay}">
      <div class="activity-card-thumb">
        ${thumbContent}
        ${year ? `<span class="activity-card-year">${year}</span>` : ''}
      </div>
      <div class="activity-card-body">
        <h3 class="activity-card-name">${name}</h3>
        ${meta.length ? `<div class="activity-card-meta">${meta.join('')}</div>` : ''}
        <div class="activity-card-footer">
          <span>Lihat dokumentasi</span>
          ${Icons.arrowRight}
        </div>
      </div>
    </a>
  `;
}

function buildEmptyState() {
  return `
    <div style="grid-column:1/-1; text-align:center; padding:4rem 1rem; color:#aaa;">
      <div style="margin-bottom:1rem; opacity:0.3;">${Icons.image}</div>
      <h5 style="color:#888; font-size:1rem; margin-bottom:0.5rem;">Belum ada dokumentasi</h5>
      <p style="font-size:0.875rem; max-width:320px; margin:0 auto;">
        Dokumentasi kegiatan akan ditampilkan di sini setelah admin menambahkannya.
      </p>
    </div>`;
}

// ── Load Activities ─────────────────────────────────────────
async function loadRecentActivities() {
  const grid        = document.getElementById('recent-activities-grid');
  const statYears   = document.getElementById('stat-years');
  const statActs    = document.getElementById('stat-activities');
  const statPhotos  = document.getElementById('stat-photos');
  if (!grid) return;

  grid.innerHTML = buildSkeletons(RECENT_LIMIT);

  try {
    const all        = await DB.getActivities();
    const activities = all.slice(0, RECENT_LIMIT);

    if (!activities.length) {
      grid.innerHTML = buildEmptyState();
    } else {
      // Resolve cover per kegiatan secara paralel (rotating session cover)
      const covers = await Promise.all(
        activities.map(a => GDrive.getSessionCover(a).catch(() => null))
      );
      grid.innerHTML = activities
        .map((a, i) => buildActivityCardHtml(a, covers[i], i * 80))
        .join('');
    }

    if (window.AOS) AOS.refresh();
  } catch (err) {
    console.warn('[Segorokuwat] DB fetch skipped:', err.message);
    grid.innerHTML = buildEmptyState();
  }

  // Stats (non-blocking)
  try {
    const stats = await DB.getStats();
    animateCounter(statYears,  stats.totalYears);
    animateCounter(statActs,   stats.totalActivities);
    animateCounter(statPhotos, stats.totalPhotos);
  } catch { /* fail silently */ }
}

function animateCounter(el, target) {
  if (!el || !target) return;
  const dur   = 1200;
  const start = performance.now();
  const tick  = (now) => {
    const p = Math.min((now - start) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * e);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ── Scroll To Top ───────────────────────────────────────────
function initScrollToTop() {
  const btn = document.getElementById('scroll-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ── AOS ─────────────────────────────────────────────────────
function initAOS() {
  if (window.AOS) {
    AOS.init({ duration: 650, easing: 'ease-out-cubic', once: true, offset: 60 });
  }
}

// ── Main ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initAOS();
  initScrollToTop();
  loadRecentActivities();
});
