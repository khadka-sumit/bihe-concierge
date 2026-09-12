/**
 * application.js — Stage Router & Application Controller
 *
 * Manages navigation between the 6 application stages,
 * sidebar state, mobile progress bar, and submit flow.
 */

(function () {

  const TOTAL_STAGES = 6;

  const stageNames = [
    '',
    'About You',
    'Your Ideal Partner',
    'Compatibility Blueprint',
    'Your World',
    'Verification & Documents',
    'Review & Submit',
  ];

  let currentStage = 1;
  let isTransitioning = false;

  // ── DOM references ──────────────────────────────────────

  const stageEls       = () => document.querySelectorAll('.stage-section');
  const sidebarStepEls = () => document.querySelectorAll('.sidebar-step');
  const sidebarFill    = document.getElementById('sidebarFill');
  const mobileStepLabel = document.getElementById('mobileStepLabel');
  const mobileStepTitle = document.getElementById('mobileStepTitle');
  const mobileBarFill  = document.getElementById('mobileBarFill');
  const stageOverlay   = document.getElementById('stageOverlay');
  const submitModal    = document.getElementById('submitModal');

  // ── Initialization ──────────────────────────────────────

  function init() {
    // Restore stage from storage (but always start from Stage 1 if it's 0/undefined)
    const restored = loadFromLocal();
    if (restored && applicationData.meta.currentStage && applicationData.meta.currentStage > 0) {
      currentStage = applicationData.meta.currentStage;
    } else {
      currentStage = 1;
    }

    // Show initial stage WITHOUT animation (direct DOM)
    _doGoToStage(currentStage, false);
    bindSidebarClicks();
    bindFormSync();
    restoreFormValues();
    bindDocumentUploads();

    // Questionnaire init (Stage 3)
    initQuestionnaire();

    // Validation live bindings
    stageEls().forEach(el => Validator.bindLiveValidation(el));

    // Submit button
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.addEventListener('click', openSubmitModal);

    const confirmSubmitBtn = document.getElementById('confirmSubmitBtn');
    if (confirmSubmitBtn) confirmSubmitBtn.addEventListener('click', confirmSubmit);

    const cancelSubmitBtn = document.getElementById('cancelSubmitBtn');
    if (cancelSubmitBtn) cancelSubmitBtn.addEventListener('click', closeSubmitModal);

    // Modal backdrop click to close
    if (submitModal) {
      submitModal.addEventListener('click', (e) => {
        if (e.target === submitModal) closeSubmitModal();
      });
    }

    // Start Over
    const startOverBtn = document.getElementById('startOverBtn');
    if (startOverBtn) startOverBtn.addEventListener('click', handleStartOver);
  }

  // ── Stage routing ───────────────────────────────────────

  /**
   * Navigate to a specific stage.
   * @param {number} stageNum
   * @param {boolean} animate  - whether to play the entrance animation
   * @param {boolean} useOverlay - show burgundy overlay (Stage 2→3 only)
   */
  function goToStage(stageNum, animate, useOverlay) {
    if (stageNum < 1 || stageNum > TOTAL_STAGES || isTransitioning) return;

    if (useOverlay && stageOverlay) {
      isTransitioning = true;
      stageOverlay.classList.add('is-active');
      setTimeout(() => {
        stageOverlay.classList.remove('is-active');
        _doGoToStage(stageNum, animate);
        isTransitioning = false;
      }, 750);
    } else {
      _doGoToStage(stageNum, animate);
    }
  }

  function _doGoToStage(stageNum, animate) {
    // Fade out current
    const currentEl = document.querySelector(`.stage-section.is-active`);
    if (currentEl && animate !== false) {
      currentEl.style.opacity = '0';
      currentEl.style.transform = 'translateY(-8px)';
      currentEl.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
    }

    setTimeout(() => {
      // Hide all stages
      stageEls().forEach(el => {
        el.classList.remove('is-active');
        el.style.opacity = '';
        el.style.transform = '';
        el.style.transition = '';
      });

      // Show target stage
      const targetEl = document.getElementById(`stage-${stageNum}`);
      if (targetEl) {
        targetEl.classList.add('is-active');
        // Scroll to top of content area
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Stagger form fields
        if (window.AnimationController) {
          setTimeout(() => AnimationController.staggerFormFields(targetEl, 80), 50);
          AnimationController.observeRevealEls(targetEl);
        }

        // Questionnaire refresh AFTER stage is in DOM
        if (stageNum === 3) {
          setTimeout(() => {
            if (window.QuestionnaireEngine && typeof window.QuestionnaireEngine.refresh === 'function') {
              window.QuestionnaireEngine.refresh();
            }
          }, 100);
        }
      }

      currentStage = stageNum;
      applicationData.meta.currentStage = stageNum;
      saveToLocal();

      updateSidebarState();
      updateMobileBar();
      updateReviewSummary(stageNum);
    }, animate !== false ? 240 : 0);
  }

  // ── Next / Back ─────────────────────────────────────────

  function nextStage() {
    if (isTransitioning) return;

    // Validate current stage first
    if (!Validator.validateStage(currentStage)) {
      // Scroll to the first errored field so the user can see it
      const stageEl = document.getElementById(`stage-${currentStage}`);
      const firstError = stageEl ? stageEl.querySelector('.has-error') : null;
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus({ preventScroll: true });
      } else {
        // Scroll to the banner if no individual error found
        const banner = document.getElementById(`stage-${currentStage}-alert`);
        if (banner) banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      return;
    }

    // Sync form data before navigating away
    syncStageData(currentStage);

    const next = currentStage + 1;
    // Use atmospheric overlay between stage 2 and 3 only
    const useOverlay = (currentStage === 2 && next === 3);
    goToStage(next, true, useOverlay);
  }

  function prevStage() {
    if (isTransitioning) return;
    syncStageData(currentStage);
    goToStage(currentStage - 1, true, false);
  }

  /** Go to a specific stage (edit link from review) */
  function editStage(stageNum) {
    syncStageData(currentStage);
    goToStage(stageNum, true, false);
    // After navigation, scroll to top
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 300);
  }

  // ── Sidebar state ───────────────────────────────────────

  function updateSidebarState() {
    if (window.AnimationController) {
      AnimationController.animateActiveStage(currentStage);
    }

    // Update fill line
    if (sidebarFill) {
      const pct = ((currentStage - 1) / (TOTAL_STAGES - 1)) * 100;
      sidebarFill.style.height = pct + '%';
    }
  }

  function bindSidebarClicks() {
    sidebarStepEls().forEach((el, i) => {
      const stageNum = i + 1;
      el.addEventListener('click', () => {
        syncStageData(currentStage);
        goToStage(stageNum, true, false);
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') el.click();
      });
    });
  }

  // ── Mobile bar ──────────────────────────────────────────

  function updateMobileBar() {
    if (mobileStepLabel) {
      mobileStepLabel.textContent = `Step ${currentStage} of ${TOTAL_STAGES}`;
    }
    if (mobileStepTitle) {
      mobileStepTitle.textContent = stageNames[currentStage] || '';
    }
    if (mobileBarFill) {
      const pct = (currentStage / TOTAL_STAGES);
      mobileBarFill.style.transform = `scaleX(${pct})`;
    }
  }

  // ── Form data sync ──────────────────────────────────────

  function syncStageData(stageNum) {
    const el = id => document.getElementById(id);

    if (stageNum === 1) {
      applicationData.aboutYou.fullName    = val('s1-fullName');
      applicationData.aboutYou.dob         = val('s1-dob');
      applicationData.aboutYou.gender      = val('s1-gender');
      applicationData.aboutYou.city        = val('s1-city');
      applicationData.aboutYou.country     = val('s1-country');
      applicationData.aboutYou.profession  = val('s1-profession');
      applicationData.aboutYou.education   = val('s1-education');
      applicationData.aboutYou.email       = val('s1-email');
      applicationData.aboutYou.phone       = val('s1-phone');
      applicationData.aboutYou.nationality = val('s1-nationality');
      applicationData.aboutYou.story       = val('s1-story');
    }

    if (stageNum === 2) {
      applicationData.idealPartner.importantQualities  = val('s2-qualities');
      applicationData.idealPartner.nonNegotiableValues = val('s2-values');
      applicationData.idealPartner.ageMin              = val('s2-ageMin');
      applicationData.idealPartner.ageMax              = val('s2-ageMax');
      applicationData.idealPartner.locationPreference  = val('s2-location');
      applicationData.idealPartner.preferredEducation  = val('s2-education');
      applicationData.idealPartner.preferredProfession = val('s2-profession');
      applicationData.idealPartner.relationshipGoal    = val('s2-goal');
      applicationData.idealPartner.lifestylePreference = val('s2-lifestyle');
      applicationData.idealPartner.additionalNotes     = val('s2-notes');
    }

    if (stageNum === 4) {
      applicationData.yourWorld.familyBackground   = val('s4-familyBg');
      applicationData.yourWorld.familyExpectations = val('s4-familyExp');
      applicationData.yourWorld.faith              = val('s4-faith');
      applicationData.yourWorld.children           = val('s4-children');
      applicationData.yourWorld.fiveYearVision     = val('s4-vision');
      applicationData.yourWorld.lifestyle          = val('s4-lifestyle');
      applicationData.yourWorld.hobbies            = val('s4-hobbies');
      applicationData.yourWorld.careerAmbitions    = val('s4-career');
      applicationData.yourWorld.familyNotes        = val('s4-familyNotes');
      applicationData.yourWorld.additionalNotes    = val('s4-notes');
    }

    saveToLocal();
  }

  /** Helper: get trimmed value from an input/select/textarea by ID */
  function val(id) {
    const el = document.getElementById(id);
    return el ? (el.value || '').trim() : '';
  }

  /** Restore saved form values into DOM fields */
  function restoreFormValues() {
    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el && value) el.value = value;
    };

    const d = applicationData;

    // Stage 1
    set('s1-fullName',    d.aboutYou.fullName);
    set('s1-dob',         d.aboutYou.dob);
    set('s1-gender',      d.aboutYou.gender);
    set('s1-city',        d.aboutYou.city);
    set('s1-country',     d.aboutYou.country);
    set('s1-profession',  d.aboutYou.profession);
    set('s1-education',   d.aboutYou.education);
    set('s1-email',       d.aboutYou.email);
    set('s1-phone',       d.aboutYou.phone);
    set('s1-nationality', d.aboutYou.nationality);
    set('s1-story',       d.aboutYou.story);

    // Stage 2
    set('s2-qualities',  d.idealPartner.importantQualities);
    set('s2-values',     d.idealPartner.nonNegotiableValues);
    set('s2-ageMin',     d.idealPartner.ageMin);
    set('s2-ageMax',     d.idealPartner.ageMax);
    set('s2-location',   d.idealPartner.locationPreference);
    set('s2-education',  d.idealPartner.preferredEducation);
    set('s2-profession', d.idealPartner.preferredProfession);
    set('s2-goal',       d.idealPartner.relationshipGoal);
    set('s2-lifestyle',  d.idealPartner.lifestylePreference);
    set('s2-notes',      d.idealPartner.additionalNotes);

    // Stage 4
    set('s4-familyBg',    d.yourWorld.familyBackground);
    set('s4-familyExp',   d.yourWorld.familyExpectations);
    set('s4-faith',       d.yourWorld.faith);
    set('s4-children',    d.yourWorld.children);
    set('s4-vision',      d.yourWorld.fiveYearVision);
    set('s4-lifestyle',   d.yourWorld.lifestyle);
    set('s4-hobbies',     d.yourWorld.hobbies);
    set('s4-career',      d.yourWorld.careerAmbitions);
    set('s4-familyNotes', d.yourWorld.familyNotes);
    set('s4-notes',       d.yourWorld.additionalNotes);
  }

  // ── Auto-save on input ──────────────────────────────────

  function bindFormSync() {
    // Sync on blur for all inputs in the application
    document.querySelectorAll('.stage-section input, .stage-section select, .stage-section textarea').forEach(el => {
      el.addEventListener('change', () => syncStageData(currentStage), { passive: true });
    });
  }

  // ── Document upload cards ───────────────────────────────

  function bindDocumentUploads() {
    document.querySelectorAll('.upload-card').forEach(card => {
      const input  = card.querySelector('.upload-card__input');
      const btn    = card.querySelector('.upload-card__upload-btn');
      const status = card.querySelector('.upload-card__status');
      const docKey = card.dataset.docKey;

      if (!input || !btn) return;

      btn.addEventListener('click', () => input.click());

      input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;

        // Show selected filename (no upload, no storage of file data)
        card.classList.add('has-file');
        if (status) {
          status.innerHTML = `
            <svg class="upload-card__check" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <polyline points="2,6 5,9 10,3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>${file.name}</span>
          `;
        }

        // Store only the filename in session (never the file content)
        if (docKey && applicationData.documents) {
          applicationData.documents[docKey] = file.name;
        }

        // Change button text
        btn.textContent = 'Change';
      });
    });
  }

  // ── Questionnaire init ──────────────────────────────────

  function initQuestionnaire() {
    const els = {
      questionText:  document.getElementById('questionText'),
      optionsWrap:   document.getElementById('qOptionsWrap'),
      progressBar:   document.getElementById('qProgressFill'),
      progressLabel: document.getElementById('qProgressLabel'),
      nextBtn:       document.getElementById('qNextBtn'),
      backBtn:       document.getElementById('qBackBtn'),
      completion:    document.getElementById('qCompletion'),
      questionCard:  document.getElementById('questionCard'),
    };

    if (!els.questionText) return;

    QuestionnaireEngine.init(els);

    const nextBtn = document.getElementById('qNextBtn');
    const backBtn = document.getElementById('qBackBtn');

    if (nextBtn) nextBtn.addEventListener('click', () => QuestionnaireEngine.next());
    if (backBtn) backBtn.addEventListener('click', () => QuestionnaireEngine.back());

    // Continue to Stage 4 from completion
    const continueBtn = document.getElementById('qContinueBtn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        syncStageData(3);
        goToStage(4, true, false);
      });
    }
  }

  // ── Review summary update ───────────────────────────────

  function updateReviewSummary(stageNum) {
    if (stageNum !== 6) return;

    const d = applicationData;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val || '—';
    };

    setVal('rv-name',        d.aboutYou.fullName);
    setVal('rv-profession',  d.aboutYou.profession);
    setVal('rv-location',    [d.aboutYou.city, d.aboutYou.country].filter(Boolean).join(', '));
    setVal('rv-education',   d.aboutYou.education);
    setVal('rv-goal',        d.idealPartner.relationshipGoal);
    setVal('rv-lifestyle',   d.yourWorld.lifestyle);
    setVal('rv-qualities',   d.idealPartner.importantQualities);
    setVal('rv-values',      d.idealPartner.nonNegotiableValues);
    setVal('rv-ageRange',    d.idealPartner.ageMin && d.idealPartner.ageMax
      ? `${d.idealPartner.ageMin} – ${d.idealPartner.ageMax} years`
      : d.idealPartner.ageMin || d.idealPartner.ageMax || '—'
    );

    // Compatibility summary
    const answered = Object.values(d.compatibility).filter(v => v).length;
    setVal('rv-compat', `${answered} of 10 questions answered`);
  }

  // ── Submit modal ────────────────────────────────────────

  function openSubmitModal() {
    if (submitModal) {
      submitModal.classList.add('is-open');
      submitModal.setAttribute('aria-hidden', 'false');
      // Focus first button
      setTimeout(() => {
        const firstBtn = submitModal.querySelector('button');
        if (firstBtn) firstBtn.focus();
      }, 100);
    }
  }

  function closeSubmitModal() {
    if (submitModal) {
      submitModal.classList.remove('is-open');
      submitModal.setAttribute('aria-hidden', 'true');
    }
  }

  function confirmSubmit() {
    const confirmBtn = document.getElementById('confirmSubmitBtn');
    if (confirmBtn) {
      confirmBtn.classList.add('btn--loading');
      confirmBtn.setAttribute('aria-busy', 'true');
    }

    // Final sync
    syncStageData(currentStage);
    applicationData.meta.submittedAt = new Date().toISOString();
    saveToLocal();

    // Store submission flag
    sessionStorage.setItem('bcApplicationSubmitted', 'true');

    // Elegant loading pause then redirect
    setTimeout(() => {
      window.location.href = 'confirmation.html';
    }, 1200);
  }

  // ── Start Over ──────────────────────────────────────────

  function handleStartOver() {
    const confirmed = confirm('Are you sure you want to start over? All your progress will be cleared.');
    if (confirmed) {
      clearApplicationData();
      goToStage(1, false, false);
      restoreFormValues();
    }
  }

  // ── Keyboard navigation (modal Escape) ──────────────────

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && submitModal?.classList.contains('is-open')) {
      closeSubmitModal();
    }
  });

  // ── Expose to global scope for inline HTML onclick ──────

  window.nextStage  = nextStage;
  window.prevStage  = prevStage;
  window.editStage  = editStage;
  window.goToStage  = goToStage;

  // ── Boot ────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', init);

})();
