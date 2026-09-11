/**
 * validation.js — Form Validation Engine
 *
 * Per-stage field rules with inline error display.
 * Never uses alert(). All errors rendered as DOM elements.
 */

const Validator = (() => {

  /** Show an inline error on a field */
  function showError(fieldEl, message) {
    fieldEl.classList.add('has-error');
    const errorEl = fieldEl.closest('.field')?.querySelector('.field__error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.setAttribute('role', 'alert');
    }
  }

  /** Clear the error state on a field */
  function clearError(fieldEl) {
    fieldEl.classList.remove('has-error');
    const errorEl = fieldEl.closest('.field')?.querySelector('.field__error');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.removeAttribute('role');
    }
  }

  /** Clear all errors within a container */
  function clearAllErrors(containerEl) {
    containerEl.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
    containerEl.querySelectorAll('.field__error').forEach(el => {
      el.textContent = '';
      el.removeAttribute('role');
    });
  }

  /** Validate a required text/select field */
  function requireField(fieldEl, label) {
    const val = fieldEl.value?.trim() ?? '';
    if (!val) {
      showError(fieldEl, `Please ${fieldEl.tagName === 'SELECT' ? 'select' : 'enter'} your ${label.toLowerCase()}.`);
      return false;
    }
    clearError(fieldEl);
    return true;
  }

  /** Validate email format */
  function requireEmail(fieldEl) {
    const val = fieldEl.value?.trim() ?? '';
    if (!val) {
      showError(fieldEl, 'Please enter your email address.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      showError(fieldEl, 'Please enter a valid email address.');
      return false;
    }
    clearError(fieldEl);
    return true;
  }

  /**
   * Validate stage 1 — About You
   * Required: fullName, dob, gender, city, profession, education, email, phone
   */
  function validateStage1() {
    const el = id => document.getElementById(id);
    let valid = true;

    if (!requireField(el('s1-fullName'), 'full name'))    valid = false;
    if (!requireField(el('s1-dob'),      'date of birth')) valid = false;
    if (!requireField(el('s1-gender'),   'gender'))        valid = false;
    if (!requireField(el('s1-city'),     'city'))          valid = false;
    if (!requireField(el('s1-profession'), 'profession'))  valid = false;
    if (!requireField(el('s1-education'), 'education'))    valid = false;
    if (!requireEmail(el('s1-email')))                     valid = false;
    if (!requireField(el('s1-phone'),    'contact number')) valid = false;

    return valid;
  }

  /**
   * Validate stage 2 — Ideal Partner
   * Required: importantQualities, relationshipGoal
   */
  function validateStage2() {
    const el = id => document.getElementById(id);
    let valid = true;

    if (!requireField(el('s2-qualities'), 'important qualities'))  valid = false;
    if (!requireField(el('s2-goal'),      'relationship goal'))    valid = false;

    return valid;
  }

  /**
   * Stage 3 is validated question-by-question inside questionnaire.js.
   * This function is a no-op passthrough (all 10 must be answered).
   */
  function validateStage3() {
    const answered = Object.values(applicationData.compatibility).every(v => v !== '');
    if (!answered) {
      const errEl = document.getElementById('q-error');
      if (errEl) {
        errEl.textContent = 'Please answer all questions before continuing.';
        errEl.setAttribute('role', 'alert');
      }
      return false;
    }
    return true;
  }

  /**
   * Validate stage 4 — Your World
   * Required: familyBackground, children, lifestyle
   */
  function validateStage4() {
    const el = id => document.getElementById(id);
    let valid = true;

    if (!requireField(el('s4-familyBg'),  'family background')) valid = false;
    if (!requireField(el('s4-lifestyle'), 'lifestyle'))         valid = false;

    return valid;
  }

  /** Stage 5 — Verification: no required fields (all optional uploads) */
  function validateStage5() {
    return true;
  }

  /** Stage 6 — Review: always valid if reached */
  function validateStage6() {
    return true;
  }

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

  /** Auto-clear errors on field input */
  function bindLiveValidation(containerEl) {
    containerEl.querySelectorAll('.field__input, .field__select, .field__textarea').forEach(el => {
      el.addEventListener('input', () => clearError(el), { passive: true });
      el.addEventListener('change', () => clearError(el), { passive: true });
    });
  }

  // Expose the id helper for internal use
  function id(str) { return document.getElementById(str); }

  return { validateStage, showError, clearError, clearAllErrors, bindLiveValidation };

})();
