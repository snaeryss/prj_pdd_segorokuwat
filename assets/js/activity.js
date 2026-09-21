/**
 * activity.js — Detail Kegiatan & Lightbox
 * Segorokuwat Website — Phase 4
 *
 * Handles: slug parsing, activity data fetch, page header render,
 * subcat filter (pills), masonry gallery, custom lightbox.
 */

// ── State ───────────────────────────────────────────────────
let actState = {
  activity:       null,   // full activity object from Supabase
  allPhotos:      [],     // semua foto kegiatan (cache)
  activePhotos:   [],     // foto yang aktif ditampilkan (bisa difilter subcat)
  activeSubcatId: null,   // null = semua foto
};

// Lightbox state
let lb = {
  photos:  [],    // foto yang sedang aktif (sync dengan actState.activePhotos)
  index:   0,     // index foto yang terbuka
  open:    false,
};

// ── SVG Icons ───────────────────────────────────────────────
const AIcon = {
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  photos:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
  image:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  alert:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  back:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
};

// ── Navbar (standalone — same pattern as gallery.js) ────────
function initNavbar() {
  const navbar     = document.getElementById('main-navbar');
  const hamburger  = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('nav-mobile-menu');
  if (!navbar) return;

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

  // Mark no nav-link active here (activity page is under "Dokumentasi")
  document.querySelectorAll('.nav-link-pub').forEach(link => {
    const href = link.getAttribute('href');
    if (href === 'gallery.html') link.classList.add('active');
    else link.classList.remove('active');
  });
}

// ── Breadcrumb ───────────────────────────────────────────────
function renderBreadcrumb(activity) {
  const bc = document.getElementById('activity-breadcrumb-list');
  if (!bc || !activity) return;

  const year = activity.year?.year || '';
  const name = activity.name || 'Kegiatan';
  const yearLink = year ? `gallery.html?year=${year}` : 'gallery.html';

  bc.innerHTML = `
    <li><a href="index.html">Beranda</a></li>
    <li><span class="breadcrumb-sep" aria-hidden="true">—</span></li>
    <li><a href="gallery.html">Dokumentasi</a></li>
    ${year ? `
    <li><span class="breadcrumb-sep" aria-hidden="true">—</span></li>
    <li><a href="${yearLink}">${year}</a></li>` : ''}
    <li><span class="breadcrumb-sep" aria-hidden="true">—</span></li>
    <li><span aria-current="page">${name}</span></li>
  `;
}

// ── Page Header ──────────────────────────────────────────────
function renderPageHeader(activity, photoCount) {
  const year = activity.year?.year || '';
  const name = activity.name || 'Kegiatan';

  // Update <title>
  document.title = `${name}${year ? ' ' + year : ''} — Segorokuwat`;

  // Eyebrow
  const eyebrow = document.getElementById('activity-eyebrow');
  if (eyebrow) eyebrow.textContent = year ? `Dokumentasi ${year}` : 'Dokumentasi Kegiatan';

  // Title
  const title = document.getElementById('activity-title');
  if (title) title.textContent = name + (year ? ` ${year}` : '');

  // Description (only if non-empty)
  const descEl = document.getElementById('activity-desc');
  if (descEl) {
    if (activity.description && activity.description.trim()) {
      descEl.textContent = activity.description;
      descEl.style.display = '';
    } else {
      descEl.style.display = 'none';
    }
  }

  // Meta: year + photo count
  const metaEl = document.getElementById('activity-meta');
  if (metaEl) {
    const parts = [];
    if (year) parts.push(`${AIcon.calendar} ${year}`);
    parts.push(`${AIcon.photos} ${photoCount} foto`);
    metaEl.innerHTML = parts.map(p => `<span class="activity-page-meta-item">${p}</span>`).join('');
  }

  renderBreadcrumb(activity);
}

// ── Error State ──────────────────────────────────────────────
function renderError(message = 'Kegiatan tidak ditemukan.') {
  // Hide header, show error in main
  const header = document.getElementById('activity-page-header');
  if (header) header.style.display = 'none';

  const mainInner = document.getElementById('activity-main-inner');
  if (mainInner) {
    mainInner.innerHTML = `
      <div class="activity-error" role="alert">
        ${AIcon.alert}
        <h2>Oops, tidak ditemukan</h2>
        <p>${message}</p>
        <a href="gallery.html" class="btn-pub-primary">
          ${AIcon.back} Kembali ke Galeri
        </a>
      </div>`;
  }

  document.title = 'Tidak Ditemukan — Segorokuwat';
}

// ── Subkategori Filter ───────────────────────────────────────
function renderSubcatFilter(subcats) {
  const wrap = document.getElementById('subcat-filter-wrap');
  const container = document.getElementById('subcat-filter');
  if (!wrap || !container) return;

  if (!subcats || subcats.length === 0) {
    wrap.style.display = 'none';
    return;
  }

  wrap.style.display = '';

  let html = `<button class="year-pill active" data-subcat-id="" data-subcat-name="Semua">Semua Foto</button>`;
  subcats.forEach(sc => {
    html += `<button class="year-pill" data-subcat-id="${sc.id}" data-subcat-name="${sc.name}">${sc.name}</button>`;
  });

  container.innerHTML = html;

  container.querySelectorAll('.year-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const subcatId = pill.dataset.subcatId || null;

      // Update active pill
      container.querySelectorAll('.year-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      // Filter photos
      actState.activeSubcatId = subcatId;
      if (subcatId) {
        actState.activePhotos = actState.allPhotos.filter(
          p => p.subcategory_id === subcatId
        );
      } else {
        actState.activePhotos = [...actState.allPhotos];
      }

      // Sync lightbox photos
      lb.photos = actState.activePhotos;

      renderMasonryGrid(actState.activePhotos);
    });
  });
}

// ── Masonry Skeleton ─────────────────────────────────────────
function buildMasonrySkeletons() {
  const heights = [180, 240, 160, 220, 200, 190, 260, 170];
  return `<div class="masonry-skeleton-grid">
    ${heights.map(h =>
      `<div class="masonry-skeleton-item" style="height:${h}px;"></div>`
    ).join('')}
  </div>`;
}

// ── Masonry Empty State ──────────────────────────────────────
function buildMasonryEmpty(subcatName = null) {
  const msg = subcatName
    ? `Belum ada foto untuk subkategori <strong>${subcatName}</strong>.`
    : 'Belum ada foto di kegiatan ini.<br>Foto akan muncul setelah admin menambahkannya.';

  return `
    <div class="masonry-empty" role="status">
      ${AIcon.image}
      <h5>Belum ada foto tersedia</h5>
      <p>${msg}</p>
    </div>`;
}

// ── Masonry Grid ─────────────────────────────────────────────
function renderMasonryGrid(photos) {
  const grid = document.getElementById('masonry-grid');
  if (!grid) return;

  if (!photos || photos.length === 0) {
    const activeSubcatPill = document.querySelector('#subcat-filter .year-pill.active');
    const subcatName = activeSubcatPill?.dataset.subcatName !== 'Semua'
      ? activeSubcatPill?.dataset.subcatName
      : null;
    grid.innerHTML = buildMasonryEmpty(subcatName);
    return;
  }

  const html = photos.map((photo, idx) => {
    const thumbUrl = photo.image_url
      ? GDrive.getImageUrl(photo.image_url, 's')
      : null;

    const imgEl = thumbUrl
      ? `<img
           class="masonry-img"
           src="${thumbUrl}"
           alt="${photo.title || 'Foto dokumentasi'}"
           loading="lazy"
           onerror="this.onerror=null; GDrive.handleImageError(this)"
         />`
      : `<div class="masonry-img" style="min-height:160px; background:#f0f0f0; display:flex; align-items:center; justify-content:center;">
           <span style="opacity:0.3; font-size:0.75rem;">Gambar tidak tersedia</span>
         </div>`;

    const captionText = photo.caption || photo.title || '';
    const captionEl = captionText
      ? `<figcaption class="masonry-caption-overlay">${captionText}</figcaption>`
      : '';

    return `
      <figure
        class="masonry-item"
        role="button"
        tabindex="0"
        data-index="${idx}"
        aria-label="Lihat foto${photo.title ? ': ' + photo.title : ''} dalam tampilan besar"
      >
        ${imgEl}
        ${captionEl}
      </figure>`;
  }).join('');

  grid.innerHTML = html;

  // Attach click events
  grid.querySelectorAll('.masonry-item').forEach(item => {
    item.addEventListener('click', () => {
      openLightbox(parseInt(item.dataset.index, 10));
    });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(parseInt(item.dataset.index, 10));
      }
    });
  });
}

// ── Lightbox ─────────────────────────────────────────────────
function openLightbox(index) {
  lb.index = index;
  lb.open  = true;
  lb.photos = actState.activePhotos;

  const lbEl = document.getElementById('lightbox');
  if (lbEl) lbEl.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';

  loadLightboxPhoto(index);
}

function closeLightbox() {
  lb.open = false;
  const lbEl = document.getElementById('lightbox');
  if (lbEl) lbEl.setAttribute('hidden', '');
  document.body.style.overflow = '';

  // Reset img
  const img = document.getElementById('lb-img');
  if (img) { img.src = ''; img.classList.remove('loading'); }
}

function loadLightboxPhoto(index) {
  const photo = lb.photos[index];
  if (!photo) return;

  lb.index = index;

  // Update counter
  const counter = document.getElementById('lb-counter');
  if (counter) counter.textContent = `${index + 1} / ${lb.photos.length}`;

  // Update prev/next disabled state
  const prevBtn = document.getElementById('lb-prev');
  const nextBtn = document.getElementById('lb-next');
  if (prevBtn) prevBtn.disabled = index === 0;
  if (nextBtn) nextBtn.disabled = index === lb.photos.length - 1;

  // Show spinner, hide img
  const spinner = document.getElementById('lb-spinner');
  const img     = document.getElementById('lb-img');
  if (spinner) spinner.classList.add('active');
  if (img) img.classList.add('loading');

  // Load large image
  const largeUrl = photo.image_url
    ? GDrive.getImageUrl(photo.image_url, 'l')
    : null;

  if (img && largeUrl) {
    img.alt = photo.title || 'Foto dokumentasi';
    img.onload = () => {
      img.classList.remove('loading');
      if (spinner) spinner.classList.remove('active');
    };
    img.onerror = () => {
      GDrive.handleImageError(img);
      img.classList.remove('loading');
      if (spinner) spinner.classList.remove('active');
    };
    img.src = largeUrl;
  } else if (img) {
    img.src = '';
    img.classList.remove('loading');
    if (spinner) spinner.classList.remove('active');
  }

  // Update title + caption
  const titleEl   = document.getElementById('lb-title');
  const captionEl = document.getElementById('lb-caption');
  if (titleEl)   titleEl.textContent   = photo.title   || '';
  if (captionEl) captionEl.textContent = photo.caption || '';
}

function prevPhoto() {
  if (lb.index > 0) loadLightboxPhoto(lb.index - 1);
}

function nextPhoto() {
  if (lb.index < lb.photos.length - 1) loadLightboxPhoto(lb.index + 1);
}

// ── Lightbox Events ──────────────────────────────────────────
function initLightboxEvents() {
  // Close button
  document.getElementById('lb-close')?.addEventListener('click', closeLightbox);

  // Backdrop click to close
  document.getElementById('lb-backdrop')?.addEventListener('click', closeLightbox);

  // Prev / Next
  document.getElementById('lb-prev')?.addEventListener('click', prevPhoto);
  document.getElementById('lb-next')?.addEventListener('click', nextPhoto);

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (!lb.open) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   prevPhoto();
    if (e.key === 'ArrowRight')  nextPhoto();
  });

  // Touch swipe (mobile)
  let touchStartX = null;
  const lbEl = document.getElementById('lightbox');
  if (lbEl) {
    lbEl.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    lbEl.addEventListener('touchend', (e) => {
      if (touchStartX === null) return;
      const delta = e.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (delta < -50) nextPhoto();
      else if (delta > 50) prevPhoto();
    }, { passive: true });
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
  if (window.AOS) AOS.init({ duration: 600, easing: 'ease-out-cubic', once: true, offset: 40 });
}

// ── Main Init ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initAOS();
  initScrollToTop();
  initLightboxEvents();

  // Footer year
  const fyEl = document.getElementById('footer-year');
  if (fyEl) fyEl.textContent = new Date().getFullYear();

  // Read slug from URL
  const params = new URLSearchParams(window.location.search);
  const slug   = params.get('slug');

  if (!slug) {
    renderError('URL tidak valid. Tidak ada slug kegiatan yang ditemukan.');
    return;
  }

  // Show loading skeletons
  const grid = document.getElementById('masonry-grid');
  if (grid) grid.innerHTML = buildMasonrySkeletons();

  try {
    // Fetch activity (includes year, cover_photo, subcategories)
    const activity = await DB.getActivityBySlug(slug);

    if (!activity) {
      renderError(`Kegiatan "${slug}" tidak ditemukan.`);
      return;
    }

    actState.activity = activity;

    // Fetch photos
    const { data: photos } = await DB.getPhotos({
      activityId: activity.id,
      visibleOnly: true,
      limit: 200,
    });

    actState.allPhotos    = photos || [];
    actState.activePhotos = [...actState.allPhotos];
    lb.photos             = actState.activePhotos;

    // Render page header
    renderPageHeader(activity, actState.allPhotos.length);

    // Render subcat filter (if subcategories exist)
    renderSubcatFilter(activity.subcategories);

    // Render masonry grid
    renderMasonryGrid(actState.activePhotos);

    if (window.AOS) AOS.refresh();

  } catch (err) {
    console.error('[Activity] init error:', err);
    if (err.message?.includes('JSON') || err.message?.includes('not found') || err.code === 'PGRST116') {
      renderError(`Kegiatan tidak ditemukan. <br><small style="opacity:0.6">${err.message}</small>`);
    } else {
      renderError('Terjadi kesalahan saat memuat data. Coba refresh halaman.');
    }
  }
});
