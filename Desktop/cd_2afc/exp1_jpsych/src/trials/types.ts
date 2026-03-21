/**
 * Shared trial types template file.
 *
 * Purpose:
 * - Keep shared interfaces/types for all trial modules in one place.
 * - Update these types as your trial data/layout structures evolve.
 */
import type { SampledColor } from "@lib/color/colorSampler";

// ── Core labels used throughout trial generation and later scoring ─────

/**
 * The three task variants used in the experiment.
 *
 * This is the main discriminator for `TrialSpec`. Later code can switch
 * on `trial.paradigm` and automatically narrow to the correct probe and
 * answer shape.
 */
export type Paradigm = "CD" | "2AFC" | "9AFC";

/**
 * The two spatial halves of the bilateral display.
 */
export type Side = "left" | "right";

/**
 * The attended side for the current trial.
 *
 * Both sides are shown during the probe, but only the cued side
 * determines accuracy.
 */
export type CueDirection = Side;

/**
 * Correct-answer format for change-detection trials.
 */
export type CDAnswer = "same" | "different";

/**
 * Correct-answer format for 2AFC probes.
 *
 * Here `left` / `right` refer to the two halves inside one probe item,
 * not to the attended side of the whole display.
 */
export type HalfChoice = Side;

// ── Geometry primitives ────────────────────────────────────────────────

/**
 * A canvas-centered point in pixels.
 *
 * The experiment stores positions relative to fixation, so the canvas
 * center is `(0, 0)`.
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Rectangular bounds for one side's legal stimulus region.
 *
 * These bounds are used during rejection sampling in `stimuli.ts`.
 */
export interface RegionBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

// ── Memory-array data ──────────────────────────────────────────────────

/**
 * One colored square shown in the memory array.
 *
 * `index` is the within-side item index used later when selecting the
 * probed item on that side.
 */
export interface ArrayItem {
  side: Side;
  index: number;
  position: Point;
  color: SampledColor;
}

// ── Probe-display data per paradigm ────────────────────────────────────

/**
 * Probe data for a change-detection item on one side.
 *
 * `targetColor` is the original memory-array color at the probed
 * location. `shownColor` is what is actually displayed during the probe.
 * If `isChange` is false, `shownColor` should equal `targetColor`.
 */
export interface CDProbeDisplay {
  side: Side;
  index: number;
  anchor: Point;
  targetColor: SampledColor;
  shownColor: SampledColor;
  isChange: boolean;
}

/**
 * Probe data for a 2AFC item on one side.
 *
 * `halves` stores the displayed colors in left-to-right order.
 * `correctHalf` marks which half contains the original target color.
 */
export interface TwoAFCProbeDisplay {
  side: Side;
  index: number;
  anchor: Point;
  halves: [SampledColor, SampledColor];
  correctHalf: HalfChoice;
}

/**
 * A fixed-length list of colors for the 3x3 9AFC grid.
 *
 * Using a tuple here makes the "exactly 9 cells" requirement explicit.
 */
export type NineAFCCells = [
  SampledColor,
  SampledColor,
  SampledColor,
  SampledColor,
  SampledColor,
  SampledColor,
  SampledColor,
  SampledColor,
  SampledColor,
];

/**
 * Probe data for a 9AFC item on one side.
 *
 * `cells` stores the nine displayed colors in the order that later
 * layout code will map onto the 3x3 grid. `correctCellIndex` tells
 * later scoring code where the target is located.
 */
export interface NineAFCProbeDisplay {
  side: Side;
  index: number;
  anchor: Point;
  cells: NineAFCCells;
  correctCellIndex: number;
}

// ── Trial-level data shared across paradigms ───────────────────────────

/**
 * Fields shared by all trial variants.
 *
 * Every trial stores both left and right memory arrays and one probed
 * item index per side, because the probe display is always bilateral
 * even though only the cued side is relevant for correctness.
 */
export interface BaseTrialSpec {
  trialId: string;
  paradigm: Paradigm;
  setSize: number;
  cueDirection: CueDirection;
  leftItems: ArrayItem[];
  rightItems: ArrayItem[];
  leftProbeIndex: number;
  rightProbeIndex: number;
}

/**
 * Full trial specification for change-detection trials.
 *
 * Both sides have probe displays, but `correctAnswer` is defined only
 * from the cued side.
 */
export interface CDTrialSpec extends BaseTrialSpec {
  paradigm: "CD";
  leftProbe: CDProbeDisplay;
  rightProbe: CDProbeDisplay;
  correctAnswer: CDAnswer;
}

/**
 * Full trial specification for 2AFC trials.
 *
 * `correctAnswer` is the correct half on the cued side's probe item.
 */
export interface TwoAFCTrialSpec extends BaseTrialSpec {
  paradigm: "2AFC";
  leftProbe: TwoAFCProbeDisplay;
  rightProbe: TwoAFCProbeDisplay;
  correctAnswer: HalfChoice;
}

/**
 * Full trial specification for 9AFC trials.
 *
 * `correctAnswer` is the correct grid-cell index on the cued side's
 * probe item.
 */
export interface NineAFCTrialSpec extends BaseTrialSpec {
  paradigm: "9AFC";
  leftProbe: NineAFCProbeDisplay;
  rightProbe: NineAFCProbeDisplay;
  correctAnswer: number;
}

/**
 * Union of all concrete trial types.
 *
 * This is the main output type for `stimuli.ts`.
 */
export type TrialSpec = CDTrialSpec | TwoAFCTrialSpec | NineAFCTrialSpec;
