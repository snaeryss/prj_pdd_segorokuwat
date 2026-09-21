/**
 * Reusable UI Components — Segorokuwat
 * 
 * Toast notifications, modals, loading states,
 * and other shared UI utilities.
 * Adapted from Cuba Admin Template patterns.
 */

const UI = {
  // ══════════════════════════════════════
  //  Toast Notifications
  // ══════════════════════════════════════

  /**
   * Show a toast notification.
   * 
   * @param {string} message - The message to display
   * @param {'success'|'error'|'warning'|'info'} type - Toast type
   * @param {number} duration - Duration in ms before auto-dismiss (default 3500)
   */
  toast(message, type = 'success', duration = 3500) {
    // Create toast container if not exists
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1080;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 380px;
        width: 100%;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    const icons = {
      success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
      error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    };

    const colors = {
      success: { bg: '#eaf6e9', border: '#54ba4a', text: '#2d6b28' },
      error: { bg: '#fee9e7', border: '#fc4438', text: '#9c1a12' },
      warning: { bg: '#fff5e0', border: '#ffaa05', text: '#805500' },
      info: { bg: '#e0f7fe', border: '#16c7f9', text: '#0a6e8a' },
    };

    const color = colors[type] || colors.info;

    const toast = document.createElement('div');
    toast.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      background: ${color.bg};
      border-left: 4px solid ${color.border};
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      color: ${color.text};
      font-family: 'Rubik', sans-serif;
      font-size: 14px;
      line-height: 1.4;
      pointer-events: auto;
      transform: translateX(120%);
      transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease;
      opacity: 0;
    `;

    toast.innerHTML = `
      <span style="flex-shrink:0; color:${color.border}">${icons[type] || icons.info}</span>
      <span style="flex:1">${message}</span>
      <button onclick="this.parentElement.remove()" style="flex-shrink:0; background:none; border:none; cursor:pointer; color:${color.text}; opacity:0.5; font-size:18px; line-height:1; padding:0 2px;">&times;</button>
    `;

    container.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    });

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 350);
      }, duration);
    }
  },

  success(message) { this.toast(message, 'success'); },
  error(message) { this.toast(message, 'error'); },
  warning(message) { this.toast(message, 'warning'); },
  info(message) { this.toast(message, 'info'); },


  // ══════════════════════════════════════
  //  Modal / Confirm Dialog
  // ══════════════════════════════════════

  /**
   * Show a confirmation modal.
   * 
   * @param {Object} options
   * @param {string} options.title - Modal title
   * @param {string} options.message - Modal message (supports HTML)
   * @param {string} [options.confirmText='Ya, Lanjutkan'] - Confirm button text
   * @param {string} [options.cancelText='Batal'] - Cancel button text
   * @param {'primary'|'danger'|'warning'} [options.type='primary'] - Button color type
   * @returns {Promise<boolean>} Resolves true if confirmed, false if cancelled
   */
  confirm({ title, message, confirmText = 'Ya, Lanjutkan', cancelText = 'Batal', type = 'primary' }) {
    return new Promise((resolve) => {
      const buttonColors = {
        primary: 'var(--primary)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',
      };
      const btnColor = buttonColors[type] || buttonColors.primary;

      const overlay = document.createElement('div');
      overlay.id = 'modal-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1050;
        padding: 16px;
        animation: fadeIn 0.2s ease;
      `;

      const modal = document.createElement('div');
      modal.style.cssText = `
        background: #fff;
        border-radius: 12px;
        max-width: 420px;
        width: 100%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        animation: slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1);
        overflow: hidden;
      `;

      modal.innerHTML = `
        <div style="padding: 24px 24px 16px">
          <h5 style="margin:0 0 12px; font-family:'Rubik',sans-serif; font-size:18px; font-weight:600; color:#2b2b2b">${title}</h5>
          <p style="margin:0; font-family:'Rubik',sans-serif; font-size:14px; color:#6c757d; line-height:1.6">${message}</p>
        </div>
        <div style="padding: 12px 24px 20px; display:flex; gap:10px; justify-content:flex-end">
          <button id="modal-cancel" style="padding:8px 20px; font-family:'Rubik',sans-serif; font-size:14px; font-weight:500; border:1px solid #dee2e6; border-radius:6px; background:#fff; color:#6c757d; cursor:pointer; transition:all 0.2s">${cancelText}</button>
          <button id="modal-confirm" style="padding:8px 20px; font-family:'Rubik',sans-serif; font-size:14px; font-weight:500; border:none; border-radius:6px; background:${btnColor}; color:#fff; cursor:pointer; transition:all 0.2s">${confirmText}</button>
        </div>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';

      const close = (result) => {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.2s ease';
        setTimeout(() => {
          overlay.remove();
          document.body.style.overflow = '';
          resolve(result);
        }, 200);
      };

      modal.querySelector('#modal-confirm').addEventListener('click', () => close(true));
      modal.querySelector('#modal-cancel').addEventListener('click', () => close(false));
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(false);
      });
      document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
          document.removeEventListener('keydown', escHandler);
          close(false);
        }
      });
    });
  },


  // ══════════════════════════════════════
  //  Loading State
  // ══════════════════════════════════════

  /**
   * Show a full-page loading overlay.
   * @param {string} [message] - Optional loading message
   */
  showLoading(message = '') {
    let loader = document.getElementById('global-loader');
    if (loader) {
      loader.style.display = 'flex';
      return;
    }

    loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255,255,255,0.85);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      z-index: 1090;
      backdrop-filter: blur(2px);
    `;
    loader.innerHTML = `
      <div class="spinner" style="width:40px; height:40px; border:3px solid #e9ecef; border-top-color:#7366ff; border-radius:50%; animation:spin 0.7s linear infinite"></div>
      ${message ? `<p style="font-family:'Rubik',sans-serif; font-size:14px; color:#6c757d; margin:0">${message}</p>` : ''}
    `;
    document.body.appendChild(loader);
  },

  /**
   * Hide the full-page loading overlay.
   */
  hideLoading() {
    const loader = document.getElementById('global-loader');
    if (loader) {
      loader.style.opacity = '0';
      loader.style.transition = 'opacity 0.25s ease';
      setTimeout(() => loader.remove(), 250);
    }
  },

  /**
   * Set loading state on a button.
   * 
   * @param {HTMLButtonElement} btn - The button element
   * @param {boolean} loading - Whether to show loading state
   */
  setButtonLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.dataset.originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner spinner-sm" style="width:16px; height:16px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; display:inline-block"></span> Memproses...`;
    } else {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    }
  },


  // ══════════════════════════════════════
  //  Skeleton Loading
  // ══════════════════════════════════════

  /**
   * Create skeleton placeholder elements.
   * 
   * @param {number} count - Number of skeleton items
   * @param {string} type - 'card' | 'row' | 'image'
   * @returns {string} HTML string
   */
  skeleton(count = 3, type = 'card') {
    const templates = {
      card: `
        <div class="card" style="overflow:hidden">
          <div class="skeleton" style="height:200px; border-radius:0"></div>
          <div style="padding:16px">
            <div class="skeleton" style="height:16px; width:70%; margin-bottom:10px"></div>
            <div class="skeleton" style="height:12px; width:50%"></div>
          </div>
        </div>
      `,
      row: `
        <div style="display:flex; gap:16px; padding:12px 0; border-bottom:1px solid #f1f3f5">
          <div class="skeleton" style="width:40px; height:40px; border-radius:6px; flex-shrink:0"></div>
          <div style="flex:1">
            <div class="skeleton" style="height:14px; width:60%; margin-bottom:8px"></div>
            <div class="skeleton" style="height:12px; width:40%"></div>
          </div>
        </div>
      `,
      image: `
        <div class="skeleton" style="width:100%; padding-top:75%; border-radius:8px"></div>
      `,
    };

    const template = templates[type] || templates.card;
    return Array(count).fill(template).join('');
  },


  // ══════════════════════════════════════
  //  Empty State
  // ══════════════════════════════════════

  /**
   * Render an empty state message.
   * 
   * @param {string} title - Empty state title
   * @param {string} [description] - Optional description
   * @param {string} [actionLabel] - Optional action button label
   * @param {Function} [onAction] - Action button click handler
   * @returns {string} HTML string
   */
  emptyState(title, description = '', actionLabel = '', onAction = null) {
    const actionId = 'empty-action-' + Date.now();
    const html = `
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.3; margin-bottom:16px">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <h5 style="color:#495057; margin-bottom:6px">${title}</h5>
        ${description ? `<p style="max-width:400px; font-size:13px; color:#898989">${description}</p>` : ''}
        ${actionLabel ? `<button class="btn btn-primary btn-sm mt-md" id="${actionId}">${actionLabel}</button>` : ''}
      </div>
    `;
    
    // Attach action handler after render if needed
    if (actionLabel && onAction) {
      setTimeout(() => {
        const btn = document.getElementById(actionId);
        if (btn) btn.addEventListener('click', onAction);
      }, 0);
    }
    
    return html;
  },


  // ══════════════════════════════════════
  //  Pagination
  // ══════════════════════════════════════

  /**
   * Render pagination controls.
   * 
   * @param {Object} options
   * @param {number} options.currentPage - Current active page (1-based)
   * @param {number} options.totalPages - Total number of pages
   * @param {Function} options.onPageChange - Callback when page changes
   * @param {string} [options.containerId] - Container element ID
   */
  renderPagination({ currentPage, totalPages, onPageChange, containerId = 'pagination' }) {
    const container = document.getElementById(containerId);
    if (!container || totalPages <= 1) {
      if (container) container.innerHTML = '';
      return;
    }

    let pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 3) { start = 2; end = 4; }
      if (currentPage >= totalPages - 2) { start = totalPages - 3; end = totalPages - 1; }
      
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      
      pages.push(totalPages);
    }

    container.innerHTML = `
      <nav class="pagination-nav" style="display:flex; justify-content:center; gap:4px; margin-top:32px">
        <button class="btn btn-outline-secondary btn-sm" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        ${pages.map(p => {
          if (p === '...') {
            return `<span style="padding:6px 10px; font-size:13px; color:#adb5bd">…</span>`;
          }
          return `<button class="btn btn-sm ${p === currentPage ? 'btn-primary' : 'btn-outline-secondary'}" data-page="${p}">${p}</button>`;
        }).join('')}
        <button class="btn btn-outline-secondary btn-sm" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </nav>
    `;

    container.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        if (page >= 1 && page <= totalPages && page !== currentPage) {
          onPageChange(page);
        }
      });
    });
  },


  // ══════════════════════════════════════
  //  Format Helpers
  // ══════════════════════════════════════

  /**
   * Format a date string to Indonesian locale.
   * @param {string} dateStr - ISO date string
   * @returns {string} Formatted date
   */
  formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  },

  /**
   * Format a date string to relative time (e.g., "2 hari lalu").
   * @param {string} dateStr - ISO date string
   * @returns {string} Relative time string
   */
  timeAgo(dateStr) {
    if (!dateStr) return '-';
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Baru saja';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)} hari lalu`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} bulan lalu`;
    return `${Math.floor(seconds / 31536000)} tahun lalu`;
  },

  /**
   * Truncate text to a maximum length.
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum characters
   * @returns {string} Truncated text
   */
  truncate(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength).trim() + '…';
  },
};

// Expose globally
window.UI = UI;
