/**
 * validation.js — Form Validation Engine
 *
 * Per-stage field rules with inline error display.
 * Never uses alert(). All errors rendered as DOM elements.
 * Validates real, legitimate information (format, length, age, etc.)
 */

const Validator = (() => {

  // ── Core helpers ────────────────────────────────────────

  /** Show an inline error on a field */
  function showError(fieldEl, message) {
    if (!fieldEl) return;
    fieldEl.classList.add('has-error');
    // Find the closest .field wrapper, then its error span
    const wrapper = fieldEl.closest('.field') || fieldEl.parentElement;
    const errorEl = wrapper ? wrapper.querySelector('.field__error') : null;
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.setAttribute('role', 'alert');
    }
  }

  /** Clear the error state on a field */
  function clearError(fieldEl) {
    if (!fieldEl) return;
    fieldEl.classList.remove('has-error');
    const wrapper = fieldEl.closest('.field') || fieldEl.parentElement;
    const errorEl = wrapper ? wrapper.querySelector('.field__error') : null;
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.removeAttribute('role');
    }
  }

  /** Clear all errors within a container */
  function clearAllErrors(containerEl) {
    if (!containerEl) return;
    containerEl.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
    containerEl.querySelectorAll('.field__error').forEach(el => {
      el.textContent = '';
      el.removeAttribute('role');
    });
  }

  /** Show the stage-level error banner with a summary */
  function showBanner(stageNum, errorCount) {
    const banner = document.getElementById(`stage-${stageNum}-alert`);
    if (!banner) return;
    banner.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>Please complete ${errorCount} required field${errorCount !== 1 ? 's' : ''} before continuing.</span>
    `;
    banner.classList.remove('hidden');
    banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /** Hide the stage-level error banner */
  function hideBanner(stageNum) {
    const banner = document.getElementById(`stage-${stageNum}-alert`);
    if (banner) banner.classList.add('hidden');
  }

  // ── Field-level validators ───────────────────────────────

  /** Required non-empty text / select */
  function requireField(fieldEl, label) {
    if (!fieldEl) return false;
    const v = (fieldEl.value || '').trim();
    if (!v || v === '') {
      showError(fieldEl, `Please ${fieldEl.tagName === 'SELECT' ? 'select' : 'enter'} your ${label}.`);
      return false;
    }
    clearError(fieldEl);
    return true;
  }

  /** Full name: letters, spaces, hyphens, apostrophes only, min 2 chars */
  function requireName(fieldEl) {
    if (!fieldEl) return false;
    const v = (fieldEl.value || '').trim();
    if (!v) {
      showError(fieldEl, 'Please enter your full name.');
      return false;
    }
    if (v.length < 2) {
      showError(fieldEl, 'Name must be at least 2 characters.');
      return false;
    }
    if (!/^[a-zA-Z\u0900-\u097F\s\-'\.]+$/.test(v)) {
      showError(fieldEl, 'Name may only contain letters, spaces, hyphens, or apostrophes.');
      return false;
    }
    clearError(fieldEl);
    return true;
  }

  /** Date of birth: must exist and person must be 18–80 years old */
  function requireDOB(fieldEl) {
    if (!fieldEl) return false;
    const v = (fieldEl.value || '').trim();
    if (!v) {
      showError(fieldEl, 'Please enter your date of birth.');
      return false;
    }
    const dob = new Date(v);
    if (isNaN(dob.getTime())) {
      showError(fieldEl, 'Please enter a valid date of birth.');
      return false;
    }
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
    if (age < 18) {
      showError(fieldEl, 'You must be at least 18 years old to apply.');
      return false;
    }
    if (age > 80) {
      showError(fieldEl, 'Please enter a valid date of birth.');
      return false;
    }
    clearError(fieldEl);
    return true;
  }

  /** Email: standard format */
  function requireEmail(fieldEl) {
    if (!fieldEl) return false;
    const v = (fieldEl.value || '').trim();
    if (!v) {
      showError(fieldEl, 'Please enter your email address.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
      showError(fieldEl, 'Please enter a valid email address (e.g. name@domain.com).');
      return false;
    }
    clearError(fieldEl);
    return true;
  }

  /** Phone: digits, +, spaces, hyphens, brackets — min 7 digits */
  function requirePhone(fieldEl) {
    if (!fieldEl) return false;
    const v = (fieldEl.value || '').trim();
    if (!v) {
      showError(fieldEl, 'Please enter your contact number.');
      return false;
    }
    const digitsOnly = v.replace(/\D/g, '');
    if (digitsOnly.length < 7) {
      showError(fieldEl, 'Please enter a valid phone number (at least 7 digits).');
      return false;
    }
    if (!/^[+\d\s\-()]+$/.test(v)) {
      showError(fieldEl, 'Phone number may only contain digits, +, spaces, or hyphens.');
      return false;
    }
    clearError(fieldEl);
    return true;
  }

  /** Textarea minimum-length check */
  function requireMinLength(fieldEl, label, minLen) {
    if (!fieldEl) return false;
    const v = (fieldEl.value || '').trim();
    if (!v) {
      showError(fieldEl, `Please share ${label}.`);
      return false;
    }
    if (v.length < minLen) {
      showError(fieldEl, `Please provide at least ${minLen} characters for ${label}.`);
      return false;
    }
    clearError(fieldEl);
    return true;
  }

  // ── Stage validators ─────────────────────────────────────

  /**
   * Stage 1 — About You
   * Required: fullName (letters only), dob (adult 18+), gender, city (text),
   *           profession (text), education (select), email (format), phone (format)
   */
  function validateStage1() {
    const g = id => document.getElementById(id);
    let errCount = 0;

    if (!requireName(g('s1-fullName')))          errCount++;
    if (!requireDOB(g('s1-dob')))                errCount++;
    if (!requireField(g('s1-gender'), 'gender')) errCount++;
    if (!requireField(g('s1-city'), 'city of residence')) errCount++;
    if (!requireField(g('s1-profession'), 'profession or field of work')) errCount++;
    if (!requireField(g('s1-education'), 'education level')) errCount++;
    if (!requireEmail(g('s1-email')))            errCount++;
    if (!requirePhone(g('s1-phone')))            errCount++;

    if (errCount > 0) {
      showBanner(1, errCount);
      return false;
    }
    hideBanner(1);
    return true;
  }

  /**
   * Stage 2 — Ideal Partner
   * Required: importantQualities (min 10 chars), relationshipGoal (select)
   */
  function validateStage2() {
    const g = id => document.getElementById(id);
    let errCount = 0;

    if (!requireMinLength(g('s2-qualities'), 'the qualities that matter to you', 10)) errCount++;
    if (!requireField(g('s2-goal'), 'relationship goal')) errCount++;

    if (errCount > 0) {
      showBanner(2, errCount);
      return false;
    }
    hideBanner(2);
    return true;
  }

  /**
   * Stage 3 — Compatibility Blueprint
   * Must have answered at least 1 question to proceed (gated per-question in questionnaire.js)
   */
  function validateStage3() {
    const answeredCount = Object.values(applicationData.compatibility || {}).filter(Boolean).length;
    if (answeredCount === 0) {
      const errEl = document.getElementById('q-error');
      if (errEl) {
        errEl.textContent = 'Please choose an answer to continue.';
        errEl.setAttribute('role', 'alert');
      }
      return false;
    }
    // Clear any previous error
    const errEl = document.getElementById('q-error');
    if (errEl) { errEl.textContent = ''; errEl.removeAttribute('role'); }
    return true;
  }

  /**
   * Stage 4 — Your World & Family
   * Required: familyBackground (min 15 chars), lifestyle (select)
   */
  function validateStage4() {
    const g = id => document.getElementById(id);
    let errCount = 0;

    if (!requireMinLength(g('s4-familyBg'), 'your family background', 15)) errCount++;
    if (!requireField(g('s4-lifestyle'), 'lifestyle preference')) errCount++;

    if (errCount > 0) {
      showBanner(4, errCount);
      return false;
    }
    hideBanner(4);
    return true;
  }

  /** Stage 5 — Verification: all optional */
  function validateStage5() { return true; }

  /** Stage 6 — Review: always valid */
  function validateStage6() { return true; }

  /** Dispatch to the correct stage validator */
  function validateStage(stageNumber) {
    switch (stageNumber) {
      case 1: return validateStage1();
      case 2: return validateStage2();
      case 3: return validateStage3();
      case 4: return validateStage4();
      case 5: return validateStage5();
      case 6: return validateStage6();
      default: return true;
    }
  }

  /** Bind live error clearing on user input */
  function bindLiveValidation(containerEl) {
    if (!containerEl) return;
    containerEl.querySelectorAll('.field__input, .field__select, .field__textarea').forEach(el => {
      el.addEventListener('input', () => {
        clearError(el);
        // Also hide banner when user starts correcting
        const stage = containerEl.id ? containerEl.id.replace('stage-', '') : null;
        if (stage) hideBanner(parseInt(stage));
      }, { passive: true });
      el.addEventListener('change', () => {
        clearError(el);
      }, { passive: true });
    });
  }

  return { validateStage, showError, clearError, clearAllErrors, bindLiveValidation };

})();
