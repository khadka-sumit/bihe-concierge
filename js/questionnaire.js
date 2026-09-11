/**
 * questionnaire.js — Compatibility Blueprint Engine
 *
 * Manages the 10-question single-select questionnaire in Stage 3.
 * Handles rendering, cross-fade transitions, answer persistence.
 */

const QuestionnaireEngine = (() => {

  const questions = [
    {
      id: 'q1',
      text: 'In a relationship, what matters most to you?',
      options: [
        'Deep emotional connection',
        'Shared values and beliefs',
        'Adventure and spontaneity',
        'Building a life and growing together',
      ],
    },
    {
      id: 'q2',
      text: 'I feel most loved when...',
      options: [
        'I spend quality time with them',
        'They support my dreams',
        'We have deep conversations',
        'They show thoughtful acts of care',
      ],
    },
    {
      id: 'q3',
      text: 'When conflict happens, I usually...',
      options: [
        'Talk about it immediately',
        'Take some time before discussing it',
        'Try to understand both perspectives',
        'Avoid conflict unless necessary',
      ],
    },
    {
      id: 'q4',
      text: 'What makes you feel most appreciated?',
      options: [
        'Words of encouragement',
        'Acts of support',
        'Physical affection',
        'Quality time',
        'Thoughtful gestures',
      ],
    },
    {
      id: 'q5',
      text: 'How important is personal space in a relationship?',
      options: [
        'Very important',
        'Somewhat important',
        'I prefer spending most of our time together',
        'It depends on the situation',
      ],
    },
    {
      id: 'q6',
      text: 'How do you prefer spending quality time?',
      options: [
        'Quiet moments at home',
        'Trying new experiences',
        'Traveling together',
        'Long meaningful conversations',
        'Time with friends and family',
      ],
    },
    {
      id: 'q7',
      text: 'How important is family involvement in your relationship?',
      options: [
        'Extremely important',
        'Important, but with healthy boundaries',
        'Somewhat important',
        'Mostly a personal decision between partners',
      ],
    },
    {
      id: 'q8',
      text: 'What communication style makes you feel secure?',
      options: [
        'Frequent communication',
        'Honest and direct conversations',
        'Calm and thoughtful communication',
        'Natural communication without expectations',
      ],
    },
    {
      id: 'q9',
      text: 'When supporting a partner through difficulty, you naturally...',
      options: [
        'Listen without trying to fix everything',
        'Offer practical solutions',
        'Stay physically present',
        'Give them space when needed',
      ],
    },
    {
      id: 'q10',
      text: 'Which statement feels closest to your idea of partnership?',
      options: [
        'We are best friends first',
        'We help each other become better',
        'We build a meaningful life together',
        'We maintain individuality while deeply connected',
      ],
    },
  ];

  let currentIndex = 0;
  let transitioning = false;

  // DOM references (set during init)
  let questionTextEl   = null;
  let optionsWrapEl    = null;
  let progressBarEl    = null;
  let progressLabelEl  = null;
  let nextBtn          = null;
  let backBtn          = null;
  let completionEl     = null;
  let questionCardEl   = null;

  /** Initialize the engine with DOM element references */
  function init(els) {
    questionTextEl  = els.questionText;
    optionsWrapEl   = els.optionsWrap;
    progressBarEl   = els.progressBar;
    progressLabelEl = els.progressLabel;
    nextBtn         = els.nextBtn;
    backBtn         = els.backBtn;
    completionEl    = els.completion;
    questionCardEl  = els.questionCard;

    // Restore any saved answers
    currentIndex = findFirstUnanswered();

    renderQuestion(currentIndex, false);
    updateNav();
  }

  /** Find the first question index without a saved answer */
  function findFirstUnanswered() {
    for (let i = 0; i < questions.length; i++) {
      if (!applicationData.compatibility[questions[i].id]) return i;
    }
    return questions.length - 1;
  }

  /** Render a specific question by index */
  function renderQuestion(index, animate) {
    const q = questions[index];
    if (!q) return;

    const savedAnswer = applicationData.compatibility[q.id] || '';

    const render = () => {
      // Update progress
      progressLabelEl.textContent = `Question ${index + 1} of ${questions.length}`;
      progressBarEl.style.transform = `scaleX(${(index + 1) / questions.length})`;

      // Update question text
      questionTextEl.textContent = q.text;

      // Render option chips
      optionsWrapEl.innerHTML = '';
      q.options.forEach(optText => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'q-option' + (optText === savedAnswer ? ' is-selected' : '');
        btn.textContent = optText;
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', optText === savedAnswer ? 'true' : 'false');

        btn.addEventListener('click', () => selectOption(btn, optText, q.id));
        optionsWrapEl.appendChild(btn);
      });

      updateNextBtn(savedAnswer !== '');
    };

    if (animate && questionCardEl) {
      transitioning = true;
      questionCardEl.classList.add('is-exiting');
      setTimeout(() => {
        render();
        questionCardEl.classList.remove('is-exiting');
        questionCardEl.classList.add('is-entering');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            questionCardEl.classList.remove('is-entering');
            transitioning = false;
          });
        });
      }, 380);
    } else {
      render();
    }
  }

  /** Handle option selection */
  function selectOption(btnEl, value, questionId) {
    // Clear previous selection
    optionsWrapEl.querySelectorAll('.q-option').forEach(b => {
      b.classList.remove('is-selected');
      b.setAttribute('aria-checked', 'false');
    });

    // Set new selection
    btnEl.classList.add('is-selected');
    btnEl.setAttribute('aria-checked', 'true');

    // Persist
    applicationData.compatibility[questionId] = value;
    saveToLocal();

    updateNextBtn(true);
  }

  /** Enable/disable the Next button */
  function updateNextBtn(enabled) {
    if (!nextBtn) return;
    const isLast = currentIndex === questions.length - 1;
    nextBtn.disabled = !enabled;
    nextBtn.textContent = isLast ? 'COMPLETE BLUEPRINT →' : 'NEXT →';
  }

  /** Update back button visibility */
  function updateNav() {
    if (backBtn) {
      backBtn.style.visibility = currentIndex === 0 ? 'hidden' : 'visible';
    }
  }

  /** Advance to next question or complete */
  function next() {
    if (transitioning) return;
    const q = questions[currentIndex];
    if (!applicationData.compatibility[q.id]) return;

    if (currentIndex < questions.length - 1) {
      currentIndex++;
      renderQuestion(currentIndex, true);
      updateNav();
    } else {
      showCompletion();
    }
  }

  /** Go back one question */
  function back() {
    if (transitioning || currentIndex === 0) return;
    currentIndex--;
    renderQuestion(currentIndex, true);
    updateNav();
  }

  /** Show the completion moment */
  function showCompletion() {
    if (questionCardEl) questionCardEl.classList.add('is-exiting');
    if (nextBtn) nextBtn.style.display = 'none';
    if (backBtn) backBtn.style.display = 'none';
    if (completionEl) {
      setTimeout(() => {
        if (questionCardEl) questionCardEl.style.display = 'none';
        completionEl.classList.remove('hidden');
        completionEl.style.animation = 'fadeUp 0.8s var(--ease-luxury) both';
      }, 400);
    }
  }

  /** Check if all questions are answered */
  function isComplete() {
    return questions.every(q => applicationData.compatibility[q.id] !== '');
  }

  return { init, next, back, isComplete };

})();
