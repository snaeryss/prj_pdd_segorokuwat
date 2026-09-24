/**
 * dashboard.js — Admin Dashboard
 * Segorokuwat — Phase 6
 */

// ── Icons (inline SVG) ──────────────────────────────────────
const DIcon = {
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  activity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
  photo:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  inbox:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`,
  plus:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  logout:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  external: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
};

// ── Format date ─────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Overview cards ──────────────────────────────────────────
function setCardNum(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value;
  el.classList.remove('loading');
}

// ── Recent activities table ─────────────────────────────────
function buildTableRows(activities) {
  if (!activities || activities.length === 0) {
    return `<tr>
      <td colspan="5">
        <div class="adm-table-empty">
          ${DIcon.inbox}
          <p>Belum ada kegiatan yang terdaftar.</p>
        </div>
      </td>
    </tr>`;
  }

  return activities.map(a => {
    const year  = a.year?.year || '—';
    const slug  = a.slug || a.id;
    const date  = formatDate(a.created_at);
    const name  = a.name || 'Tanpa Nama';
    const count = Array.isArray(a.photos) ? a.photos[0]?.count ?? '—' : '—';

    return `<tr>
      <td><span class="adm-link">${name}</span></td>
      <td><span class="adm-badge">${year}</span></td>
      <td>${count} foto</td>
      <td>${date}</td>
      <td>
        <a href="../activity.html?slug=${encodeURIComponent(slug)}"
           class="btn-adm-outline" style="font-size:0.72rem; padding:0.3rem 0.6rem;"
           target="_blank" rel="noopener" title="Lihat halaman publik kegiatan ini">
          ${DIcon.external} Lihat
        </a>
      </td>
    </tr>`;
  }).join('');
}

function buildSkeletonRows(n = 5) {
  const row = () => `<tr class="adm-table-skeleton">
    <td><div class="adm-skel" style="width:${60 + Math.random() * 80 | 0}px"></div></td>
    <td><div class="adm-skel" style="width:36px"></div></td>
    <td><div class="adm-skel" style="width:48px"></div></td>
    <td><div class="adm-skel" style="width:80px"></div></td>
    <td><div class="adm-skel" style="width:52px"></div></td>
  </tr>`;
  return Array.from({ length: n }, row).join('');
}

// ── Sidebar toggle (desktop + mobile) ──────────────────────
function initSidebar() {
  const sidebar    = document.getElementById('adm-sidebar');
  const overlay    = document.getElementById('adm-overlay');
  const content    = document.getElementById('adm-content');
  const toggleBtns = document.querySelectorAll('.adm-topbar-toggle');
  const COLLAPSED_KEY = 'sgw_sidebar_collapsed';

  function applyCollapsed(collapsed) {
    sidebar?.classList.toggle('collapsed', collapsed);
    content?.classList.toggle('sidebar-collapsed', collapsed);
  }

  function openSidebar() {
    sidebar?.classList.add('open');
    overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  toggleBtns.forEach(btn => btn.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      sidebar?.classList.contains('open') ? closeSidebar() : openSidebar();
    } else {
      const next = !sidebar?.classList.contains('collapsed');
      applyCollapsed(next);
      try { localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0'); } catch { /* ignore */ }
    }
  }));

  overlay?.addEventListener('click', closeSidebar);

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeSidebar();
  });

  // Restore state dari localStorage
  try {
    if (localStorage.getItem(COLLAPSED_KEY) === '1') applyCollapsed(true);
  } catch { /* ignore */ }
}

// ── Logout ──────────────────────────────────────────────────
function initLogout() {
  document.querySelectorAll('.btn-logout-trigger').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (confirm('Yakin ingin keluar dari panel admin?')) {
        await Auth.logout();
      }
    });
  });
}

// ── Main init ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {

  const ok = await Auth.guard();
  if (!ok) return;

  Auth.initListener();

  initSidebar();
  initLogout();

  const userEmailEl = document.getElementById('adm-user-email');
  try {
    const user = await Auth.getCurrentUser();
    if (user && userEmailEl) userEmailEl.textContent = user.email;
  } catch { /* tidak kritis */ }

  document.getElementById('stat-years')?.classList.add('loading');
  document.getElementById('stat-activities')?.classList.add('loading');
  document.getElementById('stat-photos')?.classList.add('loading');

  const tbody = document.getElementById('recent-tbody');
  if (tbody) tbody.innerHTML = buildSkeletonRows(5);

  try {
    const stats = await DB.getStats();
    setCardNum('stat-years',      stats.totalYears);
    setCardNum('stat-activities', stats.totalActivities);
    setCardNum('stat-photos',     stats.totalPhotos);
  } catch (err) {
    console.warn('[Dashboard] getStats error:', err.message);
    setCardNum('stat-years',      'Err');
    setCardNum('stat-activities', 'Err');
    setCardNum('stat-photos',     'Err');
  }

  try {
    const recent = await DB.getRecentActivities(5);
    if (tbody) tbody.innerHTML = buildTableRows(recent);
  } catch (err) {
    console.warn('[Dashboard] getRecentActivities error:', err.message);
    if (tbody) tbody.innerHTML = `<tr><td colspan="5">
      <div class="adm-table-empty">
        <p>Gagal memuat data. Coba refresh halaman.</p>
      </div>
    </td></tr>`;
  }

  const fyEl = document.getElementById('footer-year');
  if (fyEl) fyEl.textContent = new Date().getFullYear();
});
