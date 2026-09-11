/**
 * auth.js — Frontend Authentication Module
 *
 * Demo-only validation. No real backend, no password storage.
 * sessionStorage flag: authenticated = 'true'
 *
 * Structured as a service object so Firebase / backend auth
 * can replace these methods without touching other modules.
 */

const AuthService = (() => {

  const SESSION_KEY = 'bcAuthenticated';

  /** Check if a user session exists */
  function isAuthenticated() {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  }

  /**
   * Demo login — validates format only.
   * Returns { ok: true } or { ok: false, errors: {field: message} }
   */
  function login(email, password) {
    const errors = {};

    if (!email || email.trim() === '') {
      errors.email = 'Please enter your email address.';
    } else if (!isValidEmail(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password || password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (Object.keys(errors).length > 0) {
      return { ok: false, errors };
    }

    // Demo: any valid-format email + 6+ char password succeeds
    sessionStorage.setItem(SESSION_KEY, 'true');
    return { ok: true };
  }

  /** Clear session (logout) */
  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  /** Basic RFC-5322-inspired email regex */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /** Redirect to login if unauthenticated */
  function requireAuth() {
    if (!isAuthenticated()) {
      window.location.replace('login.html');
    }
  }

  return { isAuthenticated, login, logout, requireAuth };

})();
