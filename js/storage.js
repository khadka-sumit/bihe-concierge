/**
 * storage.js — Application Data Layer
 *
 * Manages the applicationData master object and localStorage persistence.
 * Never stores passwords, file contents, or government ID data.
 * Structured for future API/Firebase integration.
 */

const STORAGE_KEY = 'biheConciergeApplication';

/** Master application data object */
const applicationData = {
  meta: {
    currentStage: 1,
    submittedAt: null,
    startedAt: null,
  },
  aboutYou: {
    fullName:    '',
    dob:         '',
    gender:      '',
    city:        '',
    country:     '',
    profession:  '',
    education:   '',
    email:       '',
    phone:       '',
    nationality: '',
    story:       '',
  },
  idealPartner: {
    importantQualities:  '',
    nonNegotiableValues: '',
    ageMin:              '',
    ageMax:              '',
    locationPreference:  '',
    preferredEducation:  '',
    preferredProfession: '',
    relationshipGoal:    '',
    lifestylePreference: '',
    additionalNotes:     '',
  },
  compatibility: {
    q1: '', q2: '', q3: '', q4: '', q5: '',
    q6: '', q7: '', q8: '', q9: '', q10: '',
  },
  yourWorld: {
    familyBackground:  '',
    familyExpectations:'',
    faith:             '',
    children:          '',
    fiveYearVision:    '',
    lifestyle:         '',
    hobbies:           '',
    careerAmbitions:   '',
    familyNotes:       '',
    additionalNotes:   '',
  },
  // Document metadata only — never file contents
  documents: {
    governmentId:    null,
    educationCert:   null,
    incomeProof:     null,
    recentPhoto:     null,
    otherDocuments:  null,
  },
};

/**
 * Persist non-sensitive application data to localStorage.
 * Documents are excluded from persistence (handled in-memory only).
 */
function saveToLocal() {
  const safeCopy = {
    meta:          { ...applicationData.meta },
    aboutYou:      { ...applicationData.aboutYou },
    idealPartner:  { ...applicationData.idealPartner },
    compatibility: { ...applicationData.compatibility },
    yourWorld:     { ...applicationData.yourWorld },
    // documents intentionally excluded
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeCopy));
  } catch (e) {
    // localStorage may be unavailable (private mode, quota exceeded)
    console.warn('[Bihe] Could not persist data:', e.message);
  }
}

/**
 * Restore previously saved application data from localStorage.
 * Merges saved values into the master object without overwriting
 * any keys that aren't present in the saved copy.
 */
function loadFromLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    const saved = JSON.parse(raw);

    // Merge each section safely
    ['meta', 'aboutYou', 'idealPartner', 'compatibility', 'yourWorld'].forEach(section => {
      if (saved[section] && typeof saved[section] === 'object') {
        Object.assign(applicationData[section], saved[section]);
      }
    });

    return true;
  } catch (e) {
    console.warn('[Bihe] Could not restore data:', e.message);
    return false;
  }
}

/**
 * Wipe all stored application data and reset the master object.
 * Called when the user confirms "Start Over".
 */
function clearApplicationData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) { /* silently ignore */ }

  // Reset all sections to empty values
  Object.keys(applicationData.aboutYou).forEach(k => { applicationData.aboutYou[k] = ''; });
  Object.keys(applicationData.idealPartner).forEach(k => { applicationData.idealPartner[k] = ''; });
  Object.keys(applicationData.compatibility).forEach(k => { applicationData.compatibility[k] = ''; });
  Object.keys(applicationData.yourWorld).forEach(k => { applicationData.yourWorld[k] = ''; });
  Object.keys(applicationData.documents).forEach(k => { applicationData.documents[k] = null; });
  applicationData.meta.currentStage = 1;
  applicationData.meta.submittedAt  = null;
}

/**
 * Update a single field in the specified data section.
 * Automatically persists to localStorage after each update.
 */
function updateField(section, key, value) {
  if (applicationData[section] !== undefined) {
    applicationData[section][key] = value;
    saveToLocal();
  }
}
