/**
 * gallery.js — Galeri & Struktur Arsip
 * Segorokuwat Website — Phase 3
 *
 * Handles: year filter, activity card fetch/render,
 * load-more pagination, breadcrumb, AOS, navbar, scroll-to-top.
 */

// ── Constants ───────────────────────────────────────────────
const PAGE_SIZE = 12;

// ── State ───────────────────────────────────────────────────
let state = {
  currentYearId:   null,   // null = semua tahun
  currentYearNum:  null,   // angka tahun untuk tampilan (mis. 2024)
  currentOffset:   0,
  totalLoaded:     0,
  isLoading:       false,
  hasMore:         true,
  allYears:        [],     // cache [{id, year}, ...]
};

// ── Icon helpers (inline SVG) ────────────────────────────────
const Icons = {
  arrowRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  arrowDown:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`,
  image:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  calendar:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  photos:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
};

// ── Navbar (shared dengan app.js, standalone copy) ─────────
function initNavbar() {
  const navbar     = document.getElementById('main-navbar');
  const hamburger  = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('nav-mobile-menu');
  if (!navbar) return;

  // Gallery page selalu on-light (tidak ada hero gelap)
  navbar.classList.add('on-light');

  function updateNavbarState() {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
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

  // Mark "Dokumentasi" active
  document.querySelectorAll('.nav-link-pub').forEach(link => {
    const href = link.getAttribute('href');
    if (href === 'gallery.html') link.classList.add('active');
    else link.classList.remove('active');
  });
}

// ── Breadcrumb ───────────────────────────────────────────────
function updateBreadcrumb(yearNum = null) {
  const bc = document.getElementById('gallery-breadcrumb-list');
  if (!bc) return;

  let items = `
    <li><a href="index.html">Beranda</a></li>
    <li><span class="breadcrumb-sep" aria-hidden="true">—</span></li>
  `;

  if (yearNum) {
    items += `
      <li><a href="gallery.html">Dokumentasi</a></li>
      <li><span class="breadcrumb-sep" aria-hidden="true">—</span></li>
      <li><span aria-current="page">${yearNum}</span></li>
    `;
  } else {
    items += `<li><span aria-current="page">Dokumentasi</span></li>`;
  }

  bc.innerHTML = items;
}

// ── Year Filter ──────────────────────────────────────────────
async function loadYears() {
  const container = document.getElementById('year-filter');
  if (!container) return;

  try {
    const years = await DB.getYears();
    state.allYears = years || [];
    renderYearFilter(years);
  } catch (err) {
    console.warn('[Gallery] Could not load years:', err.message);
    const container = document.getElementById('year-filter-wrap');
    if (container) container.style.display = 'none';
  }
}

function renderYearFilter(years) {
  const container = document.getElementById('year-filter');
  if (!container) return;

  // "Semua" pill
  let html = `<button class="year-pill ${!state.currentYearId ? 'active' : ''}" data-year-id="" data-year-num="">Semua</button>`;

  years.forEach(y => {
    const isActive = y.id === state.currentYearId;
    html += `<button class="year-pill ${isActive ? 'active' : ''}" data-year-id="${y.id}" data-year-num="${y.year}">${y.year}</button>`;
  });

  container.innerHTML = html;

  // Event listeners
  container.querySelectorAll('.year-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const yearId  = pill.dataset.yearId  || null;
      const yearNum = pill.dataset.yearNum || null;
      setYear(yearId || null, yearNum ? parseInt(yearNum) : null);
    });
  });
}

function setYear(yearId, yearNum) {
  state.currentYearId  = yearId;
  state.currentYearNum = yearNum;
  state.currentOffset  = 0;
  state.totalLoaded    = 0;
  state.hasMore        = true;

  // Update URL (preserves browser history)
  const url = new URL(window.location);
  if (yearNum) url.searchParams.set('year', yearNum);
  else url.searchParams.delete('year');
  history.pushState({ yearId, yearNum }, '', url);

  // Update pill UI
  document.querySelectorAll('.year-pill').forEach(p => {
    const pNum = p.dataset.yearNum ? parseInt(p.dataset.yearNum) : null;
    p.classList.toggle('active', pNum === yearNum);
  });

  // Update breadcrumb
  updateBreadcrumb(yearNum);

  // Clear grid & re-fetch
  const grid = document.getElementById('gallery-grid');
  if (grid) grid.innerHTML = buildSkeletons(PAGE_SIZE);
  resetLoadMore();
  fetchActivities();
}

// ── Skeleton ─────────────────────────────────────────────────
function buildSkeletons(count = 6) {
  return Array(Math.min(count, 6)).fill(0).map(() => `
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

// ── Activity Card Builder ────────────────────────────────────
function buildActivityCard(activity, delay = 0) {
  const coverUrl   = activity.cover_photo?.image_url
    ? GDrive.getImageUrl(activity.cover_photo.image_url, 'm')
    : null;
  const year       = activity.year?.year || '';
  const name       = activity.name || 'Kegiatan';
  const slug       = activity.slug || activity.id;
  const photoCount = Array.isArray(activity.photos) ? (activity.photos[0]?.count ?? 0) : 0;

  const thumbContent = coverUrl
    ? `<img src="${coverUrl}" alt="${name}" loading="lazy"
           onerror="this.onerror=null; GDrive.handleImageError(this)" />`
    : `<div class="activity-card-thumb-placeholder">${Icons.image}
         <span style="font-size:0.75rem;font-weight:500;">Belum ada foto</span>
       </div>`;

  const meta = [];
  if (year) meta.push(`<span class="activity-card-meta-item">${Icons.calendar} ${year}</span>`);
  if (photoCount > 0) meta.push(`<span class="activity-card-meta-item">${Icons.photos} ${photoCount} foto</span>`);

  return `
    <a class="activity-card"
       href="activity.html?slug=${encodeURIComponent(slug)}"
       id="gcard-${slug}"
       data-aos="fade-up"
       data-aos-delay="${delay}">
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

// ── Fetch & Render Activities ────────────────────────────────
async function fetchActivities(append = false) {
  if (state.isLoading) return;
  state.isLoading = true;

  const grid       = document.getElementById('gallery-grid');
  const loadMoreBtn = document.getElementById('btn-load-more');
  const summary    = document.getElementById('gallery-summary');

  if (loadMoreBtn) {
    loadMoreBtn.disabled = true;
    loadMoreBtn.classList.add('loading');
  }

  try {
    // Fetch all activities (filter by yearId if set)
    const all = await DB.getActivities(state.currentYearId || null);

    // Client-side pagination slice
    const page = all.slice(state.currentOffset, state.currentOffset + PAGE_SIZE);

    if (!append && grid) {
      grid.innerHTML = page.length ? '' : buildEmptyState();
    }

    if (page.length > 0 && grid) {
      const startDelay = append ? 0 : 0;
      const html = page.map((a, i) => buildActivityCard(a, startDelay + i * 60)).join('');

      if (append) {
        grid.insertAdjacentHTML('beforeend', html);
      } else {
        grid.innerHTML = html;
      }
    }

    state.currentOffset += page.length;
    state.totalLoaded   += page.length;
    state.hasMore        = state.currentOffset < all.length;

    // Update summary text
    if (summary) {
      const label = state.currentYearNum ? `tahun ${state.currentYearNum}` : 'semua tahun';
      summary.innerHTML = `Menampilkan <strong>${state.totalLoaded}</strong> dari <strong>${all.length}</strong> kegiatan (${label})`;
    }

    // Show/hide load more
    updateLoadMore(state.hasMore, all.length);

    if (window.AOS) AOS.refresh();

  } catch (err) {
    console.warn('[Gallery] fetchActivities error:', err.message);
    if (grid && !append) grid.innerHTML = buildEmptyState();
    if (summary) summary.textContent = '';
    updateLoadMore(false, 0);
  } finally {
    state.isLoading = false;
    if (loadMoreBtn) {
      loadMoreBtn.disabled = false;
      loadMoreBtn.classList.remove('loading');
    }
  }
}

function buildEmptyState() {
  return `
    <div class="gallery-empty" role="status">
      ${Icons.image}
      <h5>Belum ada dokumentasi</h5>
      <p>${state.currentYearNum
        ? `Belum ada kegiatan terdokumentasi untuk tahun ${state.currentYearNum}.`
        : 'Dokumentasi kegiatan akan ditampilkan di sini setelah admin menambahkannya.'
      }</p>
    </div>`;
}

// ── Load More ────────────────────────────────────────────────
function resetLoadMore() {
  const wrap = document.getElementById('load-more-section');
  const btn  = document.getElementById('btn-load-more');
  const all  = document.getElementById('all-shown-text');
  if (wrap) wrap.classList.remove('hidden');
  if (btn) { btn.style.display = ''; btn.disabled = false; }
  if (all) all.style.display = 'none';
}

function updateLoadMore(hasMore, total) {
  const wrap = document.getElementById('load-more-section');
  const btn  = document.getElementById('btn-load-more');
  const all  = document.getElementById('all-shown-text');

  if (!wrap) return;

  if (total === 0) {
    // Empty state — hide load more entirely
    wrap.classList.add('hidden');
    return;
  }

  wrap.classList.remove('hidden');

  if (hasMore) {
    if (btn) btn.style.display = '';
    if (all) all.style.display = 'none';
  } else {
    if (btn) btn.style.display = 'none';
    if (all) all.style.display = '';
  }
}

// ── Scroll To Top ────────────────────────────────────────────
function initScrollToTop() {
  const btn = document.getElementById('scroll-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ── AOS ──────────────────────────────────────────────────────
function initAOS() {
  if (window.AOS) {
    AOS.init({ duration: 600, easing: 'ease-out-cubic', once: true, offset: 50 });
  }
}

// ── Browser Back/Forward support ─────────────────────────────
window.addEventListener('popstate', (e) => {
  const s = e.state || {};
  state.currentYearId  = s.yearId  || null;
  state.currentYearNum = s.yearNum || null;
  state.currentOffset  = 0;
  state.totalLoaded    = 0;
  state.hasMore        = true;

  renderYearFilter(state.allYears);
  updateBreadcrumb(state.currentYearNum);
  const grid = document.getElementById('gallery-grid');
  if (grid) grid.innerHTML = buildSkeletons(PAGE_SIZE);
  resetLoadMore();
  fetchActivities();
});

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initAOS();
  initScrollToTop();

  // Footer year
  const fyEl = document.getElementById('footer-year');
  if (fyEl) fyEl.textContent = new Date().getFullYear();

  // Read URL params
  const params     = new URLSearchParams(window.location.search);
  const yearParam  = params.get('year');

  // Show skeleton immediately
  const grid = document.getElementById('gallery-grid');
  if (grid) grid.innerHTML = buildSkeletons(PAGE_SIZE);

  // Load years for filter (then cross-ref yearParam to get yearId)
  await loadYears();

  if (yearParam) {
    const matched = state.allYears.find(y => String(y.year) === String(yearParam));
    if (matched) {
      state.currentYearId  = matched.id;
      state.currentYearNum = matched.year;
      // Mark pill active
      renderYearFilter(state.allYears);
    }
  }

  updateBreadcrumb(state.currentYearNum);

  // Load More button
  const loadMoreBtn = document.getElementById('btn-load-more');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      fetchActivities(true);
    });
  }

  // Initial fetch
  fetchActivities();
});
