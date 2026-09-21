/**
 * Auth Guard — Segorokuwat
 * 
 * Handles admin authentication, session management,
 * and route protection for admin pages.
 */

const Auth = {
  /**
   * Check if user is authenticated.
   * Redirects to login page if not.
   * Call this on every admin page load.
   */
  async guard() {
    try {
      const session = await DB.getSession();
      if (!session) {
        window.location.href = '/admin/login.html';
        return false;
      }
      return true;
    } catch (error) {
      console.error('Auth guard error:', error);
      window.location.href = '/admin/login.html';
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
    window.location.href = '/admin/login.html';
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
        window.location.href = '/admin/dashboard.html';
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
          window.location.href = '/admin/login.html';
        }
      }
    });
  },
};

// Expose globally
window.Auth = Auth;
