/**
 * admin.js — CRUD Kegiatan (Tahun, Kegiatan, Subkategori) + Foto
 * Segorokuwat — Phase 7 + Phase 8
 *
 * Satu file dipakai bersama oleh years.html, activities.html, photos.html.
 * Deteksi halaman berdasarkan elemen yang ada di DOM.
 */

// ── Shared: Icons ────────────────────────────────────────────
const AIcon = {
  inbox: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  layers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
};

// ── Shared: Sidebar toggle (mobile) ─────────────────────────
function initSidebar() {
  const sidebar = document.getElementById('adm-sidebar');
  const overlay = document.getElementById('adm-overlay');
  const content = document.getElementById('adm-content');
  const toggleBtns = document.querySelectorAll('.adm-topbar-toggle');

  // ── Mobile: slide in/out ──────────────────────────────────
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

  // ── Desktop: collapse/expand ──────────────────────────────
  const COLLAPSED_KEY = 'sgw_sidebar_collapsed';

  function applyCollapsed(collapsed) {
    if (collapsed) {
      sidebar?.classList.add('collapsed');
      content?.classList.add('sidebar-collapsed');
    } else {
      sidebar?.classList.remove('collapsed');
      content?.classList.remove('sidebar-collapsed');
    }
  }

  function toggleDesktopSidebar() {
    const isCollapsed = sidebar?.classList.contains('collapsed');
    const next = !isCollapsed;
    applyCollapsed(next);
    try { localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0'); } catch { /* ignore */ }
  }

  // Restore state dari localStorage
  try {
    const saved = localStorage.getItem(COLLAPSED_KEY);
    if (saved === '1') applyCollapsed(true);
  } catch { /* ignore */ }

  // ── Toggle button ─────────────────────────────────────────
  toggleBtns.forEach(btn => btn.addEventListener('click', () => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      sidebar?.classList.contains('open') ? closeSidebar() : openSidebar();
    } else {
      toggleDesktopSidebar();
    }
  }));

  overlay?.addEventListener('click', closeSidebar);
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeSidebar();
  });
}

// ── Shared: Logout ───────────────────────────────────────────
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

// ════════════════════════════════════════════════════════════
//  YEARS PAGE
// ════════════════════════════════════════════════════════════

function buildYearsRows(years) {
  if (!years || years.length === 0) {
    return `<tr><td colspan="3">
      <div class="adm-table-empty">
        ${AIcon.inbox}
        <p>Belum ada tahun yang ditambahkan.</p>
      </div>
    </td></tr>`;
  }
  return years.map(y => `
    <tr>
      <td><span class="adm-badge">${y.year}</span></td>
      <td>${y._activityCount ?? '—'} kegiatan</td>
      <td>
        <button class="btn-adm-outline btn-edit-year" data-id="${y.id}" data-year="${y.year}"
          style="font-size:0.72rem; padding:0.3rem 0.6rem; margin-right:0.4rem;">
          ${AIcon.edit} Edit
        </button>
        <button class="btn-adm-outline btn-delete-year" data-id="${y.id}" data-year="${y.year}"
          style="font-size:0.72rem; padding:0.3rem 0.6rem; color:#dc2626; border-color:#f3c9c9;">
          ${AIcon.trash} Hapus
        </button>
      </td>
    </tr>
  `).join('');
}

function buildYearsSkeleton(n = 3) {
  const row = () => `<tr class="adm-table-skeleton">
    <td><div class="adm-skel" style="width:48px"></div></td>
    <td><div class="adm-skel" style="width:80px"></div></td>
    <td><div class="adm-skel" style="width:120px"></div></td>
  </tr>`;
  return Array.from({ length: n }, row).join('');
}

async function loadYears() {
  const tbody = document.getElementById('years-tbody');
  if (!tbody) return;
  tbody.innerHTML = buildYearsSkeleton();

  try {
    const [years, activities] = await Promise.all([
      DB.getYears(),
      DB.getActivities(),
    ]);
    years.forEach(y => {
      y._activityCount = activities.filter(a => a.year_id === y.id).length;
    });
    tbody.innerHTML = buildYearsRows(years);
    wireYearsRowActions();
  } catch (err) {
    console.error('[Years] loadYears error:', err);
    tbody.innerHTML = `<tr><td colspan="3">
      <div class="adm-table-empty"><p>Gagal memuat data tahun. Coba refresh halaman.</p></div>
    </td></tr>`;
  }
}

function wireYearsRowActions() {
  document.querySelectorAll('.btn-edit-year').forEach(btn => {
    btn.addEventListener('click', () => openYearModal(btn.dataset.id, btn.dataset.year));
  });
  document.querySelectorAll('.btn-delete-year').forEach(btn => {
    btn.addEventListener('click', () => handleDeleteYear(btn.dataset.id, btn.dataset.year));
  });
}

function openYearModal(id = null, yearValue = '') {
  const modal = document.getElementById('year-modal');
  const title = document.getElementById('year-modal-title');
  const idInput = document.getElementById('year-form-id');
  const yearInput = document.getElementById('year-form-input');
  const errorBox = document.getElementById('year-form-error');

  idInput.value = id || '';
  yearInput.value = yearValue || '';
  title.textContent = id ? 'Edit Tahun' : 'Tambah Tahun';
  errorBox.hidden = true;

  modal.hidden = false;
  setTimeout(() => yearInput.focus(), 50);
}

function closeYearModal() {
  document.getElementById('year-modal').hidden = true;
}

function showYearFormError(message) {
  const errorBox = document.getElementById('year-form-error');
  const errorText = document.getElementById('year-form-error-text');
  errorText.textContent = message;
  errorBox.hidden = false;
}

async function handleYearFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('year-form-id').value;
  const yearValue = parseInt(document.getElementById('year-form-input').value, 10);
  const submitBtn = document.getElementById('year-form-submit');
  const errorBox = document.getElementById('year-form-error');

  errorBox.hidden = true;

  if (!yearValue || yearValue < 2000 || yearValue > 2100) {
    showYearFormError('Masukkan tahun yang valid (2000–2100).');
    return;
  }

  UI.setButtonLoading(submitBtn, true);
  try {
    if (id) {
      await DB.updateYear(id, yearValue);
      UI.success('Tahun berhasil diperbarui.');
    } else {
      await DB.createYear(yearValue);
      UI.success('Tahun berhasil ditambahkan.');
    }
    closeYearModal();
    loadYears();
  } catch (err) {
    console.error('[Years] submit error:', err);
    if (err.message && err.message.includes('duplicate')) {
      showYearFormError('Tahun ini sudah ada di daftar.');
    } else {
      showYearFormError('Gagal menyimpan. Coba lagi.');
    }
  } finally {
    UI.setButtonLoading(submitBtn, false);
  }
}

async function handleDeleteYear(id, yearValue) {
  const confirmed = await UI.confirm({
    title: `Hapus Tahun ${yearValue}?`,
    message: 'Menghapus tahun ini akan menghapus SEMUA kegiatan dan foto di dalamnya secara permanen. Tindakan ini tidak dapat dibatalkan.',
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    type: 'danger',
  });
  if (!confirmed) return;

  try {
    await DB.deleteYear(id);
    UI.success(`Tahun ${yearValue} berhasil dihapus.`);
    loadYears();
  } catch (err) {
    console.error('[Years] delete error:', err);
    UI.error('Gagal menghapus tahun. Coba lagi.');
  }
}

function initYearsPage() {
  document.getElementById('btn-add-year')?.addEventListener('click', () => openYearModal());
  document.getElementById('year-form-cancel')?.addEventListener('click', closeYearModal);
  document.getElementById('year-form')?.addEventListener('submit', handleYearFormSubmit);
  document.getElementById('year-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'year-modal') closeYearModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeYearModal();
  });
  loadYears();
}

// ════════════════════════════════════════════════════════════
//  ACTIVITIES PAGE
// ════════════════════════════════════════════════════════════

let _yearsCache = [];

function buildActivitiesRows(activities) {
  if (!activities || activities.length === 0) {
    return `<tr><td colspan="4">
      <div class="adm-table-empty">
        ${AIcon.inbox}
        <p>Belum ada kegiatan yang ditambahkan.</p>
      </div>
    </td></tr>`;
  }
  return activities.map(a => {
    const yearNum = a.year?.year ?? '—';
    const photoCount = a._photoCount ?? '—';
    return `
    <tr>
      <td><span class="adm-link">${a.name}</span></td>
      <td><span class="adm-badge">${yearNum}</span></td>
      <td>${photoCount} foto</td>
      <td>
        <button class="btn-adm-outline btn-edit-activity" data-id="${a.id}"
          style="font-size:0.72rem; padding:0.3rem 0.6rem; margin-right:0.4rem;">
          ${AIcon.edit} Edit
        </button>
        <button class="btn-adm-outline btn-manage-subcat" data-id="${a.id}" data-name="${a.name}"
          style="font-size:0.72rem; padding:0.3rem 0.6rem; margin-right:0.4rem;">
          ${AIcon.layers} Subkategori
        </button>
        <button class="btn-adm-outline btn-delete-activity" data-id="${a.id}" data-name="${a.name}"
          style="font-size:0.72rem; padding:0.3rem 0.6rem; color:#dc2626; border-color:#f3c9c9;">
          ${AIcon.trash} Hapus
        </button>
      </td>
    </tr>`;
  }).join('');
}

function buildActivitiesSkeleton(n = 3) {
  const row = () => `<tr class="adm-table-skeleton">
    <td><div class="adm-skel" style="width:${80 + Math.random() * 80 | 0}px"></div></td>
    <td><div class="adm-skel" style="width:48px"></div></td>
    <td><div class="adm-skel" style="width:60px"></div></td>
    <td><div class="adm-skel" style="width:160px"></div></td>
  </tr>`;
  return Array.from({ length: n }, row).join('');
}

async function loadActivities() {
  const tbody = document.getElementById('activities-tbody');
  if (!tbody) return;
  tbody.innerHTML = buildActivitiesSkeleton();

  try {
    const activities = await DB.getActivities();
    await Promise.all(activities.map(async (a) => {
      try {
        const { count } = await DB.getPhotos({ activityId: a.id, visibleOnly: false, limit: 1 });
        a._photoCount = count ?? 0;
      } catch {
        a._photoCount = '—';
      }
    }));
    tbody.innerHTML = buildActivitiesRows(activities);
    wireActivitiesRowActions(activities);
  } catch (err) {
    console.error('[Activities] loadActivities error:', err);
    tbody.innerHTML = `<tr><td colspan="4">
      <div class="adm-table-empty"><p>Gagal memuat data kegiatan. Coba refresh halaman.</p></div>
    </td></tr>`;
  }
}

function wireActivitiesRowActions(activities) {
  document.querySelectorAll('.btn-edit-activity').forEach(btn => {
    btn.addEventListener('click', () => {
      const activity = activities.find(a => a.id === btn.dataset.id);
      if (activity) openActivityForm(activity);
    });
  });
  document.querySelectorAll('.btn-manage-subcat').forEach(btn => {
    btn.addEventListener('click', () => {
      openSubcatModal(btn.dataset.id, btn.dataset.name);
    });
  });
  document.querySelectorAll('.btn-delete-activity').forEach(btn => {
    btn.addEventListener('click', () => handleDeleteActivity(btn.dataset.id, btn.dataset.name));
  });
}

async function populateYearDropdown(selectedYearId = '') {
  const select = document.getElementById('activity-form-year');
  if (!select) return;
  try {
    if (_yearsCache.length === 0) {
      _yearsCache = await DB.getYears();
    }
    select.innerHTML = '<option value="">— Pilih Tahun —</option>' +
      _yearsCache.map(y => `<option value="${y.id}" ${y.id === selectedYearId ? 'selected' : ''}>${y.year}</option>`).join('');
  } catch (err) {
    console.error('[Activities] populateYearDropdown error:', err);
  }
}

async function openActivityForm(activity = null) {
  const section = document.getElementById('activity-form-section');
  const title = document.getElementById('activity-form-title');
  const idInput = document.getElementById('activity-form-id');
  const nameInput = document.getElementById('activity-form-name');
  const descInput = document.getElementById('activity-form-desc');
  const errorBox = document.getElementById('activity-form-error');

  errorBox.hidden = true;
  await populateYearDropdown(activity?.year_id || '');

  if (activity) {
    title.textContent = 'Edit Kegiatan';
    idInput.value = activity.id;
    nameInput.value = activity.name;
    descInput.value = activity.description || '';
  } else {
    title.textContent = 'Tambah Kegiatan';
    idInput.value = '';
    nameInput.value = '';
    descInput.value = '';
  }

  section.hidden = false;
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => nameInput.focus(), 150);
}

function closeActivityForm() {
  document.getElementById('activity-form-section').hidden = true;
}

function showActivityFormError(message) {
  const errorBox = document.getElementById('activity-form-error');
  document.getElementById('activity-form-error-text').textContent = message;
  errorBox.hidden = false;
}

async function handleActivityFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('activity-form-id').value;
  const name = document.getElementById('activity-form-name').value.trim();
  const yearId = document.getElementById('activity-form-year').value;
  const description = document.getElementById('activity-form-desc').value.trim();
  const submitBtn = document.getElementById('activity-form-submit');
  const errorBox = document.getElementById('activity-form-error');

  errorBox.hidden = true;

  if (!name) { showActivityFormError('Nama kegiatan harus diisi.'); return; }
  if (!yearId) { showActivityFormError('Tahun harus dipilih.'); return; }

  const slug = DB.generateSlug(name);

  UI.setButtonLoading(submitBtn, true);
  try {
    if (id) {
      await DB.updateActivity(id, { name, slug, year_id: yearId, description });
      UI.success('Kegiatan berhasil diperbarui.');
    } else {
      await DB.createActivity({ name, slug, year_id: yearId, description, cover_photo_id: null });
      UI.success('Kegiatan berhasil ditambahkan.');
    }
    closeActivityForm();
    loadActivities();
  } catch (err) {
    console.error('[Activities] submit error:', err);
    if (err.message && err.message.includes('duplicate')) {
      showActivityFormError('Slug ini sudah dipakai kegiatan lain. Coba ubah nama sedikit.');
    } else {
      showActivityFormError('Gagal menyimpan. Coba lagi.');
    }
  } finally {
    UI.setButtonLoading(submitBtn, false);
  }
}

async function handleDeleteActivity(id, name) {
  const confirmed = await UI.confirm({
    title: `Hapus "${name}"?`,
    message: 'Menghapus kegiatan ini akan menghapus SEMUA subkategori dan foto di dalamnya secara permanen. Tindakan ini tidak dapat dibatalkan.',
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    type: 'danger',
  });
  if (!confirmed) return;

  try {
    await DB.deleteActivity(id);
    UI.success(`Kegiatan "${name}" berhasil dihapus.`);
    loadActivities();
  } catch (err) {
    console.error('[Activities] delete error:', err);
    UI.error('Gagal menghapus kegiatan. Coba lagi.');
  }
}

// ── Subcategory Modal ──────────────────────────────────────

function buildSubcatListItems(subcats) {
  if (!subcats || subcats.length === 0) {
    return `<p style="font-size:0.8125rem; color:var(--adm-gray); text-align:center; padding:1rem 0;">Belum ada subkategori.</p>`;
  }
  return subcats.map(s => `
    <div class="subcat-row" id="subcat-row-${s.id}" data-id="${s.id}" data-name="${s.name.replace(/"/g, '&quot;')}"
      style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; padding:0.5rem 0; border-bottom:1px solid var(--adm-border);">
      <span class="subcat-row-view" style="font-size:0.875rem; flex:1;">${s.name}</span>
      <div class="subcat-row-actions" style="display:flex; gap:0.25rem; flex-shrink:0;">
        <button class="btn-edit-subcat" data-id="${s.id}" title="Edit subkategori"
          style="background:none; border:none; color:var(--adm-gray); cursor:pointer; padding:0.25rem;">
          ${AIcon.edit}
        </button>
        <button class="btn-delete-subcat" data-id="${s.id}" data-name="${s.name}"
          style="background:none; border:none; color:#dc2626; cursor:pointer; padding:0.25rem;" title="Hapus subkategori">
          ${AIcon.trash}
        </button>
      </div>
    </div>
  `).join('');
}

function enterSubcatEditMode(id) {
  const row = document.getElementById(`subcat-row-${id}`);
  if (!row) return;
  const currentName = row.dataset.name;

  row.innerHTML = `
    <input type="text" class="login-input subcat-edit-input" value="${currentName.replace(/"/g, '&quot;')}"
      style="flex:1; padding:0.35rem 0.6rem; font-size:0.8125rem;" />
    <div style="display:flex; gap:0.25rem; flex-shrink:0;">
      <button class="btn-save-subcat" data-id="${id}" title="Simpan"
        style="background:none; border:none; color:#16a34a; cursor:pointer; padding:0.25rem;">
        ${AIcon.check}
      </button>
      <button class="btn-cancel-subcat" data-id="${id}" title="Batal"
        style="background:none; border:none; color:var(--adm-gray); cursor:pointer; padding:0.25rem;">
        ${AIcon.x}
      </button>
    </div>
  `;
  row.querySelector('.btn-save-subcat svg').style.cssText = 'width:16px;height:16px;';
  row.querySelector('.btn-cancel-subcat svg').style.cssText = 'width:16px;height:16px;';

  const input = row.querySelector('.subcat-edit-input');
  input.focus();
  input.select();

  const activityId = document.getElementById('subcat-form-activity-id').value;

  row.querySelector('.btn-save-subcat').addEventListener('click', () => saveSubcatEdit(id, activityId));
  row.querySelector('.btn-cancel-subcat').addEventListener('click', () => loadSubcategoryList(activityId));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); saveSubcatEdit(id, activityId); }
    if (e.key === 'Escape') { e.preventDefault(); loadSubcategoryList(activityId); }
  });
}

async function saveSubcatEdit(id, activityId) {
  const row = document.getElementById(`subcat-row-${id}`);
  const input = row?.querySelector('.subcat-edit-input');
  if (!input) return;
  const newName = input.value.trim();
  if (!newName) { input.focus(); return; }

  try {
    await DB.updateSubcategory(id, { name: newName, slug: DB.generateSlug(newName) });
    UI.success('Subkategori berhasil diperbarui.');
    loadSubcategoryList(activityId);
  } catch (err) {
    console.error('[Subcat] edit error:', err);
    UI.error('Gagal memperbarui subkategori.');
  }
}

async function loadSubcategoryList(activityId) {
  const listEl = document.getElementById('subcat-list');
  listEl.innerHTML = `<p style="font-size:0.8125rem; color:var(--adm-gray); text-align:center; padding:1rem 0;">Memuat...</p>`;
  try {
    const subcats = await DB.getSubcategories(activityId);
    listEl.innerHTML = buildSubcatListItems(subcats);
    listEl.querySelectorAll('.btn-edit-subcat').forEach(btn => {
      btn.addEventListener('click', () => enterSubcatEditMode(btn.dataset.id));
    });
    listEl.querySelectorAll('.btn-delete-subcat').forEach(btn => {
      btn.addEventListener('click', () => handleDeleteSubcategory(btn.dataset.id, btn.dataset.name, activityId));
    });
  } catch (err) {
    console.error('[Subcat] load error:', err);
    listEl.innerHTML = `<p style="font-size:0.8125rem; color:#dc2626; text-align:center; padding:1rem 0;">Gagal memuat subkategori.</p>`;
  }
}

function openSubcatModal(activityId, activityName) {
  document.getElementById('subcat-modal-activity-name').textContent = activityName;
  document.getElementById('subcat-form-activity-id').value = activityId;
  document.getElementById('subcat-form-name').value = '';
  document.getElementById('subcat-form-error').hidden = true;
  document.getElementById('subcat-modal').hidden = false;
  loadSubcategoryList(activityId);
}

function closeSubcatModal() {
  document.getElementById('subcat-modal').hidden = true;
  loadActivities();
}

async function handleSubcatFormSubmit(e) {
  e.preventDefault();
  const activityId = document.getElementById('subcat-form-activity-id').value;
  const nameInput = document.getElementById('subcat-form-name');
  const name = nameInput.value.trim();
  const submitBtn = document.getElementById('subcat-form-submit');
  const errorBox = document.getElementById('subcat-form-error');

  errorBox.hidden = true;
  if (!name) {
    document.getElementById('subcat-form-error-text').textContent = 'Nama subkategori harus diisi.';
    errorBox.hidden = false;
    return;
  }

  const slug = DB.generateSlug(name);
  UI.setButtonLoading(submitBtn, true);
  try {
    await DB.createSubcategory({ name, slug, activity_id: activityId });
    nameInput.value = '';
    loadSubcategoryList(activityId);
  } catch (err) {
    console.error('[Subcat] submit error:', err);
    document.getElementById('subcat-form-error-text').textContent = 'Gagal menambahkan subkategori.';
    errorBox.hidden = false;
  } finally {
    UI.setButtonLoading(submitBtn, false);
  }
}

async function handleDeleteSubcategory(id, name, activityId) {
  const confirmed = await UI.confirm({
    title: `Hapus "${name}"?`,
    message: 'Foto yang sebelumnya masuk subkategori ini tidak akan terhapus, hanya kehilangan label subkategorinya.',
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    type: 'danger',
  });
  if (!confirmed) return;

  try {
    await DB.deleteSubcategory(id);
    UI.success(`Subkategori "${name}" dihapus.`);
    loadSubcategoryList(activityId);
  } catch (err) {
    console.error('[Subcat] delete error:', err);
    UI.error('Gagal menghapus subkategori.');
  }
}

function initActivitiesPage() {
  document.getElementById('btn-add-activity')?.addEventListener('click', () => openActivityForm());
  document.getElementById('activity-form-cancel')?.addEventListener('click', closeActivityForm);
  document.getElementById('activity-form')?.addEventListener('submit', handleActivityFormSubmit);

  document.getElementById('subcat-modal-close')?.addEventListener('click', closeSubcatModal);
  document.getElementById('subcat-form')?.addEventListener('submit', handleSubcatFormSubmit);
  document.getElementById('subcat-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'subcat-modal') closeSubcatModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('subcat-modal');
      if (modal && !modal.hidden) closeSubcatModal();
    }
  });

  loadActivities();
}

// ════════════════════════════════════════════════════════════
//  PHOTOS PAGE — Phase 8
// ════════════════════════════════════════════════════════════

const PHOTOS_PER_PAGE = 20;
let _photosCurrentPage = 1;
let _photosFilterActivityId = '';
let _photosActivitiesCache = [];
let _previewDebounceTimer = null;

// ── Build table rows ─────────────────────────────────────────
function buildPhotosRows(photos) {
  if (!photos || photos.length === 0) {
    return `<tr><td colspan="7">
      <div class="adm-table-empty">
        ${AIcon.inbox}
        <p>Belum ada foto yang ditambahkan.</p>
      </div>
    </td></tr>`;
  }

  return photos.map(p => {
    const thumbUrl = GDrive.getThumbnailUrl(p.image_url);
    const actLabel = p.activity
      ? `${p.activity.name}${p.activity.year_id ? '' : ''}`
      : '—';
    const subcatLabel = p.subcategory ? p.subcategory.name : '—';
    const titleShort = p.title.length > 40 ? p.title.substring(0, 40) + '…' : p.title;

    const visibleBadge = p.is_visible
      ? `<button class="badge-toggle adm-badge-visible" data-id="${p.id}" data-field="is_visible" data-value="true" title="Klik untuk sembunyikan">Tampil</button>`
      : `<button class="badge-toggle adm-badge-hidden" data-id="${p.id}" data-field="is_visible" data-value="false" title="Klik untuk tampilkan">Sembunyi</button>`;

    const featuredBadge = p.is_featured
      ? `<button class="badge-toggle adm-badge-featured" data-id="${p.id}" data-field="is_featured" data-value="true" title="Klik untuk hapus dari unggulan">★ Utama</button>`
      : `<button class="badge-toggle adm-badge-hidden" data-id="${p.id}" data-field="is_featured" data-value="false" title="Klik untuk jadikan unggulan">—</button>`;

    return `
    <tr id="photo-row-${p.id}">
      <td>
        <img class="photo-thumb"
          src="${thumbUrl}"
          alt="${p.title}"
          onerror="this.src='${GDrive.FALLBACK_IMAGE}'" />
      </td>
      <td style="font-size:0.8125rem;">${titleShort}</td>
      <td style="font-size:0.8125rem;">${actLabel}</td>
      <td style="font-size:0.8125rem; color:var(--adm-gray);">${subcatLabel}</td>
      <td>${visibleBadge}</td>
      <td>${featuredBadge}</td>
      <td>
        <button class="btn-adm-outline btn-edit-photo" data-id="${p.id}"
          style="font-size:0.72rem; padding:0.3rem 0.6rem; margin-right:0.4rem;">
          ${AIcon.edit} Edit
        </button>
        <button class="btn-adm-outline btn-delete-photo" data-id="${p.id}" data-title="${p.title.replace(/"/g, '&quot;')}"
          style="font-size:0.72rem; padding:0.3rem 0.6rem; color:#dc2626; border-color:#f3c9c9;">
          ${AIcon.trash} Hapus
        </button>
      </td>
    </tr>`;
  }).join('');
}

function buildPhotosSkeleton(n = 5) {
  const row = () => `<tr class="adm-table-skeleton">
    <td><div class="adm-skel" style="width:48px; height:48px; border-radius:4px;"></div></td>
    <td><div class="adm-skel" style="width:${100 + Math.random() * 80 | 0}px"></div></td>
    <td><div class="adm-skel" style="width:80px"></div></td>
    <td><div class="adm-skel" style="width:70px"></div></td>
    <td><div class="adm-skel" style="width:55px"></div></td>
    <td><div class="adm-skel" style="width:55px"></div></td>
    <td><div class="adm-skel" style="width:120px"></div></td>
  </tr>`;
  return Array.from({ length: n }, row).join('');
}

// ── Load photos ───────────────────────────────────────────────
async function loadPhotos(page = 1) {
  _photosCurrentPage = page;
  const tbody = document.getElementById('photos-tbody');
  if (!tbody) return;
  tbody.innerHTML = buildPhotosSkeleton();

  const offset = (page - 1) * PHOTOS_PER_PAGE;

  try {
    const opts = {
      visibleOnly: false,
      limit: PHOTOS_PER_PAGE,
      offset,
    };
    if (_photosFilterActivityId) opts.activityId = _photosFilterActivityId;

    const { data: photos, count } = await DB.getPhotos(opts);

    tbody.innerHTML = buildPhotosRows(photos);
    wirePhotosRowActions(photos);

    const totalPages = Math.ceil((count || 0) / PHOTOS_PER_PAGE);
    UI.renderPagination({
      currentPage: page,
      totalPages,
      onPageChange: (p) => loadPhotos(p),
      containerId: 'photos-pagination',
    });
  } catch (err) {
    console.error('[Photos] loadPhotos error:', err);
    tbody.innerHTML = `<tr><td colspan="7">
      <div class="adm-table-empty"><p>Gagal memuat data foto. Coba refresh halaman.</p></div>
    </td></tr>`;
  }
}

// ── Wire row actions ──────────────────────────────────────────
function wirePhotosRowActions(photos) {
  // Edit
  document.querySelectorAll('.btn-edit-photo').forEach(btn => {
    btn.addEventListener('click', async () => {
      const photo = photos.find(p => p.id === btn.dataset.id);
      if (photo) {
        await openPhotoForm(photo);
      } else {
        // Fallback: fetch from DB (in case photos list changed)
        try {
          const p = await DB.getPhotoById(btn.dataset.id);
          await openPhotoForm(p);
        } catch (e) {
          UI.error('Gagal memuat data foto.');
        }
      }
    });
  });

  // Delete
  document.querySelectorAll('.btn-delete-photo').forEach(btn => {
    btn.addEventListener('click', () => handleDeletePhoto(btn.dataset.id, btn.dataset.title));
  });

  // Quick-toggle (visible / featured)
  document.querySelectorAll('.badge-toggle').forEach(btn => {
    btn.addEventListener('click', () => handleQuickToggle(btn));
  });
}

// ── Quick toggle ──────────────────────────────────────────────
async function handleQuickToggle(btn) {
  const id = btn.dataset.id;
  const field = btn.dataset.field; // 'is_visible' | 'is_featured'
  const currentValue = btn.dataset.value === 'true';
  const newValue = !currentValue;

  btn.classList.add('loading');

  try {
    await DB.updatePhoto(id, { [field]: newValue });

    // Update badge in-place without full reload
    const row = document.getElementById(`photo-row-${id}`);
    if (row) {
      if (field === 'is_visible') {
        const cell = btn.parentElement;
        cell.innerHTML = newValue
          ? `<button class="badge-toggle adm-badge-visible" data-id="${id}" data-field="is_visible" data-value="true" title="Klik untuk sembunyikan">Tampil</button>`
          : `<button class="badge-toggle adm-badge-hidden" data-id="${id}" data-field="is_visible" data-value="false" title="Klik untuk tampilkan">Sembunyi</button>`;
        cell.querySelector('.badge-toggle').addEventListener('click', (e) => handleQuickToggle(e.currentTarget));
      } else {
        const cell = btn.parentElement;
        cell.innerHTML = newValue
          ? `<button class="badge-toggle adm-badge-featured" data-id="${id}" data-field="is_featured" data-value="true" title="Klik untuk hapus dari unggulan">★ Utama</button>`
          : `<button class="badge-toggle adm-badge-hidden" data-id="${id}" data-field="is_featured" data-value="false" title="Klik untuk jadikan unggulan">—</button>`;
        cell.querySelector('.badge-toggle').addEventListener('click', (e) => handleQuickToggle(e.currentTarget));
      }
    }

    const msg = field === 'is_visible'
      ? (newValue ? 'Foto ditampilkan di galeri.' : 'Foto disembunyikan dari galeri.')
      : (newValue ? 'Foto dijadikan unggulan.' : 'Foto dihapus dari unggulan.');
    UI.success(msg);
  } catch (err) {
    console.error('[Photos] quickToggle error:', err);
    UI.error('Gagal mengubah status. Coba lagi.');
    btn.classList.remove('loading');
  }
}

// ── Populate activity dropdown (form & filter) ────────────────
async function populatePhotosActivityDropdown(selectEl, selectedId = '') {
  if (!selectEl) return;
  try {
    if (_photosActivitiesCache.length === 0) {
      _photosActivitiesCache = await DB.getActivities();
    }
    const opts = _photosActivitiesCache.map(a => {
      const yearLabel = a.year?.year ? ` (${a.year.year})` : '';
      return `<option value="${a.id}" ${a.id === selectedId ? 'selected' : ''}>${a.name}${yearLabel}</option>`;
    }).join('');
    selectEl.innerHTML = '<option value="">— Pilih Kegiatan —</option>' + opts;
  } catch (err) {
    console.error('[Photos] populateActivityDropdown error:', err);
  }
}

// ── Filter dropdown populate ──────────────────────────────────
async function populatePhotosFilterDropdown() {
  const sel = document.getElementById('photos-filter-activity');
  if (!sel) return;
  try {
    if (_photosActivitiesCache.length === 0) {
      _photosActivitiesCache = await DB.getActivities();
    }
    const opts = _photosActivitiesCache.map(a => {
      const yearLabel = a.year?.year ? ` (${a.year.year})` : '';
      return `<option value="${a.id}">${a.name}${yearLabel}</option>`;
    }).join('');
    sel.innerHTML = '<option value="">Semua Kegiatan</option>' + opts;
  } catch (err) {
    console.error('[Photos] populateFilterDropdown error:', err);
  }
}

// ── Cascading subcat dropdown ─────────────────────────────────
async function loadSubcatDropdown(activityId, selectedSubcatId = '') {
  const subcatSel = document.getElementById('photo-form-subcat');
  if (!subcatSel) return;

  if (!activityId) {
    subcatSel.innerHTML = '<option value="">— Pilih kegiatan dulu —</option>';
    subcatSel.disabled = true;
    return;
  }

  subcatSel.innerHTML = '<option value="">Memuat...</option>';
  subcatSel.disabled = true;

  try {
    const subcats = await DB.getSubcategories(activityId);
    if (subcats.length === 0) {
      subcatSel.innerHTML = '<option value="">— Tidak ada subkategori —</option>';
    } else {
      subcatSel.innerHTML = '<option value="">— Tidak ada subkategori —</option>' +
        subcats.map(s =>
          `<option value="${s.id}" ${s.id === selectedSubcatId ? 'selected' : ''}>${s.name}</option>`
        ).join('');
    }
    subcatSel.disabled = false;
  } catch (err) {
    console.error('[Photos] loadSubcatDropdown error:', err);
    subcatSel.innerHTML = '<option value="">Gagal memuat</option>';
    subcatSel.disabled = true;
  }
}

// ── URL preview ───────────────────────────────────────────────
function updatePhotoPreview(url) {
  const img = document.getElementById('photo-preview-img');
  const empty = document.getElementById('photo-preview-empty');
  const warning = document.getElementById('photo-url-warning');
  if (!img || !empty) return;

  warning.hidden = true;

  if (!url || !GDrive.isValidGDriveUrl(url)) {
    img.hidden = true;
    img.src = '';
    empty.hidden = false;
    return;
  }

  const previewUrl = GDrive.getImageUrl(url, 'm');
  img.src = previewUrl;
  img.hidden = false;
  empty.hidden = true;

  img.onload = () => { warning.hidden = true; };
  img.onerror = () => { warning.hidden = false; };
}

// ── Open photo form ───────────────────────────────────────────
async function openPhotoForm(photo = null) {
  const section = document.getElementById('photo-form-section');
  const formTitle = document.getElementById('photo-form-title');
  const idInput = document.getElementById('photo-form-id');
  const titleInput = document.getElementById('photo-form-title-input');
  const urlInput = document.getElementById('photo-form-url');
  const actSel = document.getElementById('photo-form-activity');
  const captionInput = document.getElementById('photo-form-caption');
  const visibleChk = document.getElementById('photo-form-visible');
  const featuredChk = document.getElementById('photo-form-featured');
  const errorBox = document.getElementById('photo-form-error');
  const captionCount = document.getElementById('caption-count');

  // Reset
  errorBox.hidden = true;
  document.getElementById('photo-url-warning').hidden = true;

  await populatePhotosActivityDropdown(actSel, photo?.activity_id || '');

  if (photo) {
    formTitle.textContent = 'Edit Foto';
    idInput.value = photo.id;
    titleInput.value = photo.title || '';
    urlInput.value = photo.image_url || '';
    captionInput.value = photo.caption || '';
    captionCount.textContent = captionInput.value.length;
    visibleChk.checked = photo.is_visible !== false;
    featuredChk.checked = !!photo.is_featured;
    updatePhotoPreview(photo.image_url);
    await loadSubcatDropdown(photo.activity_id, photo.subcategory_id || '');
  } else {
    formTitle.textContent = 'Tambah Foto';
    idInput.value = '';
    titleInput.value = '';
    urlInput.value = '';
    captionInput.value = '';
    captionCount.textContent = '0';
    visibleChk.checked = true;
    featuredChk.checked = false;
    updatePhotoPreview('');
    await loadSubcatDropdown('');
  }

  section.hidden = false;
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => titleInput.focus(), 150);
}

function closePhotoForm() {
  document.getElementById('photo-form-section').hidden = true;
}

function showPhotoFormError(message) {
  const errorBox = document.getElementById('photo-form-error');
  document.getElementById('photo-form-error-text').textContent = message;
  errorBox.hidden = false;
}

// ── Submit photo form ─────────────────────────────────────────
async function handlePhotoFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('photo-form-id').value;
  const title = document.getElementById('photo-form-title-input').value.trim();
  const url = document.getElementById('photo-form-url').value.trim();
  const activityId = document.getElementById('photo-form-activity').value;
  const subcategoryId = document.getElementById('photo-form-subcat').value;
  const caption = document.getElementById('photo-form-caption').value.trim();
  const isVisible = document.getElementById('photo-form-visible').checked;
  const isFeatured = document.getElementById('photo-form-featured').checked;
  const submitBtn = document.getElementById('photo-form-submit');

  document.getElementById('photo-form-error').hidden = true;

  // Validasi
  if (!title) { showPhotoFormError('Judul foto harus diisi.'); return; }
  if (!url) { showPhotoFormError('URL foto harus diisi.'); return; }
  if (!GDrive.isValidGDriveUrl(url)) {
    showPhotoFormError('URL tidak dikenali sebagai Google Drive. Pastikan formatnya benar (contoh: https://drive.google.com/file/d/...).');
    return;
  }
  if (!activityId) { showPhotoFormError('Kegiatan harus dipilih.'); return; }

  UI.setButtonLoading(submitBtn, true);
  try {
    const payload = {
      title,
      image_url: url,
      activity_id: activityId,
      subcategory_id: subcategoryId || null,
      caption: caption || null,
      is_visible: isVisible,
      is_featured: isFeatured,
    };

    if (id) {
      await DB.updatePhoto(id, payload);
      UI.success('Foto berhasil diperbarui.');
    } else {
      await DB.createPhoto(payload);
      UI.success('Foto berhasil ditambahkan.');
    }

    closePhotoForm();
    // Invalidate cache dan reload
    _photosActivitiesCache = [];
    loadPhotos(_photosCurrentPage);
  } catch (err) {
    console.error('[Photos] submit error:', err);
    showPhotoFormError('Gagal menyimpan. Coba lagi.');
  } finally {
    UI.setButtonLoading(submitBtn, false);
  }
}

// ── Delete photo ──────────────────────────────────────────────
async function handleDeletePhoto(id, title) {
  const confirmed = await UI.confirm({
    title: `Hapus foto ini?`,
    message: `"${title}" akan dihapus dari database secara permanen. File di Google Drive tidak ikut terhapus.`,
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    type: 'danger',
  });
  if (!confirmed) return;

  try {
    await DB.deletePhoto(id);
    UI.success('Foto berhasil dihapus.');
    loadPhotos(_photosCurrentPage);
  } catch (err) {
    console.error('[Photos] delete error:', err);
    UI.error('Gagal menghapus foto. Coba lagi.');
  }
}

// ── Init photos page ──────────────────────────────────────────
function initPhotosPage() {
  // Tombol tambah
  document.getElementById('btn-add-photo')?.addEventListener('click', () => openPhotoForm());

  // Form cancel & submit
  document.getElementById('photo-form-cancel')?.addEventListener('click', closePhotoForm);
  document.getElementById('photo-form')?.addEventListener('submit', handlePhotoFormSubmit);

  // URL preview (debounced)
  document.getElementById('photo-form-url')?.addEventListener('input', (e) => {
    clearTimeout(_previewDebounceTimer);
    _previewDebounceTimer = setTimeout(() => updatePhotoPreview(e.target.value.trim()), 600);
  });

  // Caption counter
  document.getElementById('photo-form-caption')?.addEventListener('input', (e) => {
    const counter = document.getElementById('caption-count');
    if (counter) counter.textContent = e.target.value.length;
  });

  // Cascading dropdown: kegiatan → subkategori
  document.getElementById('photo-form-activity')?.addEventListener('change', (e) => {
    loadSubcatDropdown(e.target.value);
  });

  // Filter by activity
  document.getElementById('photos-filter-activity')?.addEventListener('change', (e) => {
    _photosFilterActivityId = e.target.value;
    loadPhotos(1);
  });

  // Load data
  populatePhotosFilterDropdown();
  loadPhotos(1);
}

// ════════════════════════════════════════════════════════════
//  MAIN INIT
// ════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  const ok = await Auth.guard();
  if (!ok) return;
  Auth.initListener();
  Auth.initIdleWatcher();

  initSidebar();
  initLogout();

  const userEmailEl = document.getElementById('adm-user-email');
  try {
    const user = await Auth.getCurrentUser();
    if (user && userEmailEl) userEmailEl.textContent = user.email;
  } catch {
    // tidak kritis
  }

  const fyEl = document.getElementById('footer-year');
  if (fyEl) fyEl.textContent = new Date().getFullYear();

  // Page-specific init
  if (document.getElementById('years-tbody')) {
    initYearsPage();
  }
  if (document.getElementById('activities-tbody')) {
    initActivitiesPage();
  }
  if (document.getElementById('photos-tbody')) {
    initPhotosPage();
  }
});
