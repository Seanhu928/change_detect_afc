/**
 * Central experiment configuration.
 *
 * Template users should primarily edit values in `config`.
 * Other modules import either `config` or the named exports at the bottom.
 */
import { setCSS } from "@lib/general/setCSS";

// Apply global experiment styles at startup.
setCSS();

/**
 * Main configuration object.
 *
 * Sections:
 * - CONSENT: values injected into consent HTML and language selection
 * - DESIGN: trial/block counts and condition IDs
 * - TIMING: durations used by instruction/trial timers
 * - CODES: completion/error codes (typically for Prolific/JATOS workflows)
 * - KEYS: key mappings used in task logic
 * - RUN_* flags: environment/platform behavior toggles
 */
export const config = {
  // Values injected into `assets/external-html/consent-*.html` placeholders.
  CONSENT: {
    TITLE: "experiment_name", // Used for exported data file names.
    LANG: "en", // Active language key used across text modules.
    DURATION: 45, // Study duration in minutes (number only).
    CONTACT_PERSON: "Gengshi Hu", // Shown in consent page.
    CONTACT_EMAIL: "gengshihu@uchicago.edu", // Shown in consent page.
    INSTITUTION: "The University of Chicago", // Shown in consent page.
  },

  // Experimental design parameters.
  DESIGN: {
    PARADIGMS: ["CD", "2AFC", "9AFC"] as const,
    SET_SIZES: [2, 4, 6] as const,
    nTRIALS: 10, // Trials per condition cell (paradigm × set size × cue direction). TBD.
    nBLOCKS: 1,  // Number of blocks. TBD.
    nPRACTICE: 10, // Practice trials per paradigm. TBD.
  },

  // Timing values used by instruction/trial screens.
  TIMING: {
    CUE: 200,
    ARRAY: 100,
    RETENTION: 900,
    MAX_RESPONSE: 3000,
    ITI: 1000, 
    START: 10 * 1000, // Countdown before a trial starts (milliseconds).
    BREAK: 30, // Break duration between blocks (seconds).
  },

  SIZE: {
    WINDOW_RATIO: 16 / 9,
    SQUARE_WIDTH: 0.05, // Size of color squares. TBD.
    SQUARE_GAP: 0.025, // Minimum gap between squares. TBD.
    STIM_WIDTH: 0.5, // Width of the region for memory array presentation. TBD.
    STIM_HEIGHT: 0.5, // Height of the region for memory array presentation. TBD.
    FIXATION_GAP: 0.05, // Exclusion zone around fixation cross. TBD.
    ARROW_WIDTH: 0.05, // Width of arrow cue. TBD.
    ARROW_HEIGHT: 0.05, // Height of arrow cue. TBD.
  },

  COLOR: {
    MODE: "continuous" as "continuous" | "fixed",
    MIN_DISTANCE: 40,                // Minimum angular distance (degrees)
    FIXED_COLORS: [] as string[],    // Placeholder for predefined color list
    BG_NAME: "grey",
    BACKGROUND: "#bababa",
  },

  // Completion codes used at end-of-study redirects/messages.
  CODES: {
    SUCCESS: "success", // Completed successfully.
    OFFLINE: "offline", // Completed but offline upload fallback.
    FAILED_ATTENTION: "failedAttention", // Failed attention/browser interaction check.
    FAILED_OTHERS: "failedOthers", // Other failure conditions (e.g., resize failure).
  },

  /**
   * Key mappings for task actions.
   *
   * Notes:
   * - Key names are case-sensitive and keyboard-layout-sensitive.
   * - If needed, normalize key input in response handlers.
   */
  KEYS: {
    CONTINUE: ["enter"],
    START_TRIAL: [" "],
  },

  // Platform/environment toggles.
  RUN_JATOS: false, // Run with JATOS integration and upload behavior.
  RUN_PROLIFIC: false, // When false, do not redirect to Prolific at the end.
};

// Convenience named exports for cleaner imports in other modules.
export const { CONSENT, DESIGN, TIMING, SIZE, COLOR, CODES, KEYS, RUN_JATOS, RUN_PROLIFIC } =
  config;

// Frequently used design shortcuts.
export const { nTRIALS, nBLOCKS, PARADIGMS, SET_SIZES } = DESIGN;

