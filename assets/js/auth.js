/**
 * Auth Guard — Segorokuwat
 * 
 * Handles admin authentication, session management,
 * and route protection for admin pages.
 */

/**
 * Auth Guard — Segorokuwat
 * 
 * Handles admin authentication, session management,
 * and route protection for admin pages.
 *
 * Idle Timeout: 30 menit tanpa interaksi → otomatis logout.
 */

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 menit
const IDLE_WARNING_MS = 2 * 60 * 1000;  // warning 2 menit sebelum logout
const IDLE_STORAGE_KEY = 'sgw_last_active';

const Auth = {
  _idleTimer: null,
  _warningTimer: null,
  _warningToast: null,

  /**
   * Perbarui timestamp aktivitas terakhir.
   * Dipanggil setiap ada interaksi user.
   */
  _resetIdle() {
    localStorage.setItem(IDLE_STORAGE_KEY, Date.now().toString());
    clearTimeout(this._idleTimer);
    clearTimeout(this._warningTimer);
    if (this._warningToast) {
      this._warningToast.remove();
      this._warningToast = null;
    }

    // Warning 2 menit sebelum logout
    this._warningTimer = setTimeout(() => {
      this._showIdleWarning();
    }, IDLE_TIMEOUT_MS - IDLE_WARNING_MS);

    // Logout setelah 30 menit idle
    this._idleTimer = setTimeout(() => {
      this._forceLogout();
    }, IDLE_TIMEOUT_MS);
  },

  _showIdleWarning() {
    // Hapus warning lama kalau ada
    if (this._warningToast) this._warningToast.remove();

    const toast = document.createElement('div');
    toast.id = 'idle-warning-toast';
    toast.style.cssText = `
      position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%);
      background: #854d0e; color: #fff; padding: 0.85rem 1.4rem;
      border-radius: 8px; font-size: 0.875rem; z-index: 9999;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
      display: flex; align-items: center; gap: 0.75rem;
      animation: fadeIn 0.2s ease;
    `;
    toast.innerHTML = `
      <span>⚠️ Sesi akan berakhir dalam <strong>2 menit</strong> karena tidak ada aktivitas.</span>
      <button onclick="Auth._resetIdle()" style="
        background: rgba(255,255,255,0.2); border: none; color: #fff;
        padding: 0.3rem 0.75rem; border-radius: 4px; cursor: pointer;
        font-size: 0.8125rem; font-weight: 600;
      ">Tetap Login</button>
    `;
    document.body.appendChild(toast);
    this._warningToast = toast;
  },

  async _forceLogout() {
    if (this._warningToast) this._warningToast.remove();
    localStorage.removeItem(IDLE_STORAGE_KEY);
    try { await DB.signOut(); } catch { /* ignore */ }
    // Redirect ke login dengan pesan
    window.location.href = 'login.html?reason=idle';
  },

  /**
   * Pasang event listener untuk deteksi aktivitas user.
   * Dipanggil sekali saat halaman admin dimuat.
   */
  initIdleWatcher() {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    const reset = () => this._resetIdle();
    events.forEach(ev => window.addEventListener(ev, reset, { passive: true }));

    // Cek antar tab: kalau tab lain sudah idle logout, ikut logout
    window.addEventListener('storage', (e) => {
      if (e.key === IDLE_STORAGE_KEY && e.newValue === null) {
        window.location.href = 'login.html?reason=idle';
      }
    });

    // Mulai timer pertama
    this._resetIdle();
  },
  /**
   * Check if user is authenticated.
   * Redirects to login page if not.
   * Call this on every admin page load.
   */
  async guard() {
    try {
      const session = await DB.getSession();
      if (!session) {
        window.location.href = 'login.html';
        return false;
      }
      return true;
    } catch (error) {
      console.error('Auth guard error:', error);
      window.location.href = 'login.html';
      return false;
    }
  },

  /**
   * Login with email and password.
   * 
   * @param {string} email 
   * @param {string} password 
   * @returns {Object} Session data
   */
  async login(email, password) {
    if (!email || !password) {
      throw new Error('Email dan password harus diisi.');
    }
    
    try {
      const data = await DB.signIn(email, password);
      return data;
    } catch (error) {
      // Translate Supabase errors to Indonesian
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Email atau password salah.');
      }
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Email belum dikonfirmasi.');
      }
      throw new Error('Gagal masuk. Silakan coba lagi.');
    }
  },

  /**
   * Logout and redirect to login page.
   */
  async logout() {
    try {
      await DB.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    window.location.href = 'login.html';
  },

  /**
   * Get current user info.
   * @returns {Object|null} User object or null
   */
  async getCurrentUser() {
    try {
      return await DB.getUser();
    } catch {
      return null;
    }
  },

  /**
   * Check if user is on the login page and already authenticated.
   * If so, redirect to dashboard.
   */
  async redirectIfAuthenticated() {
    try {
      const session = await DB.getSession();
      if (session) {
        window.location.href = 'dashboard.html';
        return true;
      }
    } catch {
      // Not authenticated, stay on login page
    }
    return false;
  },

  /**
   * Initialize auth listener for session changes.
   */
  initListener() {
    const client = DB.init();
    if (!client) return;

    client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // If on an admin page (not login), redirect
        if (!window.location.pathname.includes('login')) {
          window.location.href = 'login.html';
        }
      }
    });
  },
};

// Expose globally
window.Auth = Auth;
