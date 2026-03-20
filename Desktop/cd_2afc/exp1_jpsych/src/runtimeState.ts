import { SIZE } from "@settings";

let maxWidth = Math.min(screen.availWidth, screen.availHeight * SIZE.WINDOW_RATIO)

// Global variables for the system. Normally, you don't need to change them.
export const runtimeState = {
  TRACK: false, // a switch to track participants' interactions with the browser
  nBLUR: 0, // use to count how many times participants left the browser
  MAX_BLUR: 3, // the maximum number of times participants can leave the browser
  FAILED_ATTENTION_CHECK: false,
  CANVAS_WIDTH: maxWidth * 0.95,
  CANVAS_HEIGHT: maxWidth * 0.95 / SIZE.WINDOW_RATIO,
  PAGE_WIDTH: Math.min(maxWidth, 1300) * 0.95,
  LOOP: true, // a switch to control whether participants need to read the instruction and practice again
  RUN_TIMER: false, // a switch to control the countdown timer
  STATUS: "success" // the status of the experiment
};



// // Global runtime variables for the system.
// // Users normally do not need to modify this file.
// export const runtimeState = {
//   TRACK: false, // a switch to track participants' interactions with the browser
//   nBLUR: 0, // use to count how many times participants left the browser
//   MAX_BLUR: 3, // the maximum number of times participants can leave the browser
//   LOOP: true, // a switch to control whether participants need to read the instruction and practice again
//   RUN_TIMER: false, // a switch to control the countdown timer
//   STATUS: "success", // the status of the experiment
// };
