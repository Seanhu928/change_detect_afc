# Working Memory Experiment: Comparing Three Testing Paradigms

## 1. Experiment Overview

This experiment investigates visual working memory capacity by comparing three testing paradigms across varying memory loads. It is implemented using the `coglabuzh/jspsych-template` (TypeScript, jsPsych 8, jspsych-psychophysics).

### 1.1 Research Design

**Fully within-subjects** with two independent variables:

- **IV1 — Testing paradigm** (3 levels):
  - **Change Detection (CD):** A single probe square appears at a previously occupied location showing either the same or a different color. Participant clicks "same" or "different."
  - **2-Alternative Forced Choice (2AFC):** A probe square is split into two halves — one half shows the original color, the other shows a foil. Participant clicks the half with the correct color.
  - **9-Alternative Forced Choice (9AFC):** A probe square is divided into a 3×3 grid. One cell shows the original color, the other 8 show foils. Participant clicks the cell with the correct color.

- **IV2 — Set size** (3 levels): 2, 4, or 6 colored squares per side of the display.

### 1.2 Display

The memory array is **bilateral**: colored squares appear on both the left and right halves of the screen. A central arrow cue indicates which side the participant should attend to. Set size refers to items per side (e.g., set size 4 = 4 left + 4 right = 8 squares total on screen).

### 1.3 Trial Sequence

Each trial follows this sequence:

| Phase                | Duration | Description                                                      |
| -------------------- | -------- | ---------------------------------------------------------------- |
| 1. Arrow cue         | 200 ms   | Central arrow pointing left or right                             |
| 2. Memory array      | 100 ms   | Colored squares on both sides of fixation                        |
| 3. Retention interval| 900 ms   | Blank screen                                                     |
| 4. Probe             | ≤ 3000 ms| Probe display                                                    |
| 5. Inter-trial interval | 1000 ms | Blank screen before the next trial                             |

All timing values are centralized in `settings.ts` for easy adjustment.

### 1.4 Probe Display & Response

The probe display is **bilateral** — both the cued and uncued sides show a probe shape at one randomly selected location, matching the current paradigm format. This keeps the display visually symmetric. The participant is instructed to **only responds to the cued side**.

**Change Detection (CD):**
- Both sides: a single square appears at one of that side's locations, showing either the original color (same trial) or a foil color (different trial, randomly sampled with ≥ 40° distance from the original).
- The participant clicks a "same" or "different" button based on the **cued side**.

**2AFC:**
- Both sides: a probe square split into two halves — one half shows the correct (original) color, the other shows a foil color (random, ≥ 40° from the correct color).
- The participant clicks the half showing the correct color on the **cued side**.

**9AFC:**
- Both sides: a probe square divided into a 3×3 grid — one cell shows the correct color, the other 8 show foils.
- Foils are evenly spaced at 40° intervals around the CIELAB wheel, anchored on the target color's angle (deterministic even spacing because 9 colors × 40° = 360° is the mathematical limit).
- The participant clicks the cell showing the correct color on the **cued side**.

### 1.5 Color System

Colors are sampled from a **continuous CIELAB color wheel** with a **40° minimum angular distance** between any two colors that must be discriminable. The system is designed to be switchable to a **fixed color set** via a `MODE` flag in settings, pending a final decision with the mentor.

**Minimum distance constraints:**
- Within each side of the memory array: all colors are mutually ≥ 40° apart.
- Left and right sides are sampled independently (no cross-side constraint).
- Foil colors in 2AFC/9AFC: each foil is ≥ 40° from the target and from every other foil.

**Sampling algorithm:**
- **Memory array colors (sampleColors):** Uses a gap-based algorithm. Computes `n` random gaps on the 360° circle (each ≥ 40°, summing to 360°) via the broken-stick method, then places colors at cumulative gap positions from a random starting angle. Guaranteed to succeed in a single pass with no retries.
- **Foil colors for CD/2AFC (sampleFoilColors, count ≤ 7):** Uses the same gap-based algorithm, treating the target + foils as `count + 1` points on the wheel.
- **Foil colors for 9AFC (sampleFoilColors, count = 8):** Uses deterministic even spacing at 40° intervals anchored on the target angle, since 9 × 40° = 360° is the exact mathematical limit.

**CIELAB parameters:** L = 70, a = 20, b = 38, radius = 60 (defaults defined in `src/lib/color/CIElab.ts`).

### 1.6 Trial & Block Counts

To be determined. Current placeholder values in settings:
- `nTRIALS: 10` (trials per condition cell)
- `nBLOCKS: 1`
- `nPRACTICE: 10` (practice trials per paradigm)

---

## 2. Implementation Plan

The implementation follows the template's recommended editing order (`settings.ts` → `lib/` → `trials/` → `experiment.ts`) and is organized into nine phases.

### Phase 1: Configuration — `settings.ts` and `runtimeState.ts` ✅ Complete

**Goal:** Centralize all experiment parameters.

**`settings.ts`** — Added four new sections to the `config` object:
- `DESIGN`: paradigms (`["CD", "2AFC", "9AFC"]`), set sizes (`[2, 4, 6]`), trial/block/practice counts.
- `TIMING`: all six trial-phase durations (FIXATION, CUE, ARRAY, RETENTION, MAX_RESPONSE, ITI) plus existing START and BREAK.
- `SIZE`: `WINDOW_RATIO` (16/9) for canvas computation, and proportional layout values (SQUARE_WIDTH, SQUARE_GAP, STIM_WIDTH, STIM_HEIGHT, FIXATION_GAP, ARROW_WIDTH, ARROW_HEIGHT) — all as proportions of canvas dimensions for cross-monitor scaling.
- `COLOR`: `MODE` flag ("continuous" / "fixed"), `MIN_DISTANCE` (40°), `FIXED_COLORS` placeholder, background color.

**`runtimeState.ts`** — Added computed canvas dimensions following the demo2 project pattern:
- Imports `SIZE.WINDOW_RATIO` from settings.
- Computes `CANVAS_WIDTH`, `CANVAS_HEIGHT`, and `PAGE_WIDTH` from `screen.availWidth` / `screen.availHeight` at runtime with a 0.95 margin factor.
- Preserves all original template runtime fields (TRACK, nBLUR, MAX_BLUR, LOOP, RUN_TIMER, STATUS).

### Phase 2: Color System — `src/lib/color/colorSampler.ts` ✅ Complete

**Goal:** Abstract color selection behind the continuous/fixed mode flag.

**Created `colorSampler.ts`** with two public functions:
- `sampleColors(n)` — samples `n` mutually distinct colors for one side of the memory array.
- `sampleFoilColors(targetAngle, targetHex, count)` — generates foil colors for the probe display.

**Key implementation details:**
- Gap-based sampling algorithm using the broken-stick method. Generates `n` random gaps on the 360° circle (each ≥ `MIN_DISTANCE`, summing to 360°), then places colors at cumulative positions from a random start. Guarantees success in a single pass.
- 9AFC special case: when `count === 8`, uses deterministic even spacing at 40° intervals anchored on the target (since 9 × 40° = 360° is the exact limit).
- Fixed mode: draws without replacement from `FIXED_COLORS`, with proper error handling for insufficient colors.

**Testing:** A standalone test script (`colorSampler_real_test.mjs`) validates 13 cases including deterministic verification, minimum distance enforcement, 9AFC even spacing, fixed mode, error handling, property-based tests with real randomness, and a 100-iteration stress test.

**Files touched:**
- Created: `src/lib/color/colorSampler.ts`
- Updated: `src/lib/color/index.ts` (added export)

### Phase 3: Types & Stimulus Generation — `src/trials/types.ts` and `src/trials/stimuli.ts`

**Goal:** Define core data interfaces and generate the full trial list.

**`types.ts`** — Define experiment-specific types:
- `Paradigm`: union type `"CD" | "2AFC" | "9AFC"`
- `CueDirection`: `"left" | "right"`
- `TrialSpec`: full specification for one trial — paradigm, set size, cue direction, item positions and colors per side, probed item index (both cued and uncued sides), target color, foil color(s) for both sides, whether it's a change trial (CD only), correct answer.

**`stimuli.ts`** — Generate the complete trial list:
- Cross all condition cells: paradigm (3) × set size (3) × cue direction (2) × `nTRIALS`.
- For CD trials: also cross with change/no-change (balanced).
- For each trial: sample colors per side using `sampleColors`, pick a random probe location on each side (cued and uncued), generate appropriate foils for both sides using `sampleFoilColors`.
- Shuffle the trial list or organize into blocks.

### Phase 4: Visual Layout — `src/trials/layout.ts`

**Goal:** Build psychophysics stimulus objects for each display phase.

Create functions for each screen using `jspsych-psychophysics` objects:
- `fixationLayout()` — central fixation cross.
- `cueLayout(direction)` — central arrow pointing left or right.
- `memoryArrayLayout(leftItems, rightItems)` — colored squares positioned within the left/right regions.
- `probeLayout_CD(cuedProbe, uncuedProbe)` — bilateral probe: single square on each side + "same"/"different" buttons (same button above the probe square, different button below the probe square).
- `probeLayout_2AFC(cuedProbe, uncuedProbe)` — bilateral probe: split square on each side (both clickable).
- `probeLayout_9AFC(cuedProbe, uncuedProbe)` — bilateral probe: 3×3 grid on each side (both clickable).

All spatial positioning uses proportional values from `config.SIZE`, converted to pixels via `runtimeState.CANVAS_WIDTH` / `CANVAS_HEIGHT`.

### Phase 5: Trial Assembly — `src/trials/trial.ts`

**Goal:** Compose a complete multi-screen jsPsych timeline for one trial.

Each trial is a jsPsych timeline node containing:
1. Cue screen (psychophysics plugin, `TIMING.CUE` ms)
2. Memory array screen (psychophysics plugin, `TIMING.ARRAY` ms)
3. Retention screen (blank, `TIMING.RETENTION` ms)
4. Probe screen (psychophysics plugin, `response_type: "mouse"`, `trial_duration: TIMING.MAX_RESPONSE`) — dispatches to the appropriate probe layout based on paradigm
5. ITI screen (blank, `TIMING.ITI` ms)

Trial data recorded: paradigm, set size, cue direction, cued probe position, uncued probe position, target color/angle (both sides), foil color(s)/angle(s) (both sides), left/right array colors, whether change trial (CD), participant response, RT, accuracy.

### Phase 6: Trial Builders — `src/trials/builders/`

**Goal:** Build block-level trial sequences.

**`mainTrial.ts`:**
- Takes the full trial list from `stimuli.ts`.
- Groups trials into blocks, respecting the within-subjects design.
- Returns jsPsych timeline nodes with block-break screens between blocks.

**`practiceTrial.ts`:**
- Generates a small practice set per paradigm.
- Includes feedback after each trial (correct/incorrect).

### Phase 7: Response Handling — `src/lib/response/scoring.ts`

**Goal:** Evaluate participant responses and compute accuracy measures.

- `scoreCD(response, trialSpec)` — compares "same"/"different" click to the correct answer.
- `score2AFC(clickPosition, trialSpec)` — determines which half was clicked and whether it matches the correct color.
- `score9AFC(clickPosition, trialSpec)` — determines which grid cell was clicked and whether it contains the correct color.
- Shared helpers for computing hit/false-alarm rates and Cowan's K.

### Phase 8: Instructions — `src/instructions/experimentInstr.ts`

**Goal:** Create instruction screens explaining the three paradigms.

- Overview of the task and what participants will see.
- Visual examples or descriptions of each paradigm (CD, 2AFC, 9AFC).
- Practice instructions and transition screens.
- Could use static images in `assets/` or dynamically drawn psychophysics demonstrations.

### Phase 9: Wiring — `src/experiment.ts`

**Goal:** Assemble the full experiment timeline.

Final timeline order:
1. Preload assets
2. Welcome screen
3. Consent screen
4. Notice screen
5. Browser check
6. Fullscreen transition
7. Experiment instructions (Phase 8)
8. Practice blocks with feedback (Phase 6)
9. Main experiment blocks with breaks (Phase 6)
10. End screen / data upload

---

## 3. File Map

Summary of which template files are touched or created at each phase:

| Phase | File                              | Action   |
| ----- | --------------------------------- | -------- |
| 1     | `src/settings.ts`                 | Modified |
| 1     | `src/runtimeState.ts`             | Modified |
| 2     | `src/lib/color/colorSampler.ts`   | Created  |
| 2     | `src/lib/color/index.ts`          | Modified |
| 3     | `src/trials/types.ts`             | Modified |
| 3     | `src/trials/stimuli.ts`           | Modified |
| 4     | `src/trials/layout.ts`            | Modified |
| 5     | `src/trials/trial.ts`             | Modified |
| 6     | `src/trials/builders/mainTrial.ts`| Modified |
| 6     | `src/trials/builders/practiceTrial.ts` | Modified |
| 7     | `src/lib/response/scoring.ts`     | Created  |
| 7     | `src/lib/response/index.ts`       | Modified |
| 8     | `src/instructions/experimentInstr.ts` | Modified |
| 9     | `src/experiment.ts`               | Modified |

---

## 4. To Be Determined

- Final trial counts per condition cell.
- Practice trial structure and count.
- Fixed color set (if switching from continuous mode).
- Exact visual design of 2AFC split-square and 9AFC grid probe displays.
- Instruction screen content and visual examples.