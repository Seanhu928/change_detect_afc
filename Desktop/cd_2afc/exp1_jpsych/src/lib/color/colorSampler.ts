import { getLabCol } from "./CIElab";
import { COLOR } from "@settings";

export interface SampledColor {
    angle: number;  // Hue angle on the CIELAB wheel (0–360). Undefined for fixed mode.
    hex: string;    // Color as hex string (e.g. "#a3c1f0")
}

/**
 * Returns the shortest angular distance between two hue angles on a
 * 0–360° circle.
 */
function angularDistance(a: number, b: number): number {
    const diff = Math.abs(a - b) % 360;
    return diff > 180 ? 360 - diff : diff;
}

/**
 * Checks whether `candidate` is at least `minDist` degrees away from
 * every angle in `existing`.
 */
function isFarEnough(candidate: number, existing: number[], minDist: number): boolean {
    return existing.every((a) => angularDistance(candidate, a) >= minDist);
}

/**
 * Samples a random angle (0–360) that is at least `minDist` degrees
 * from all angles in `existing`. Retries up to `maxAttempts` times.
 *
 * @throws if no valid angle is found within the attempt limit
 */
function sampleAngle(existing: number[], minDist: number, maxAttempts = 1000): number {
    for (let i = 0; i < maxAttempts; i++) {
        const candidate = Math.random() * 360;
        if (isFarEnough(candidate, existing, minDist)) {
            return candidate;
        }
    }
    
    throw new Error(
        `colorSampler: failed to find a valid angle after ${maxAttempts} attempts ` +
        `(existing: ${existing.length}, minDist: ${minDist}°)`
    );
}

/**
 * Samples `n` mutually distinct colors.
 *
 * - Continuous mode: picks random CIELAB wheel angles with at least
 *   `COLOR.MIN_DISTANCE` degrees between any pair.
 * - Fixed mode: draws `n` colors at random (without replacement) from
 *   `COLOR.FIXED_COLORS`.
 *
 * @param n Number of colors to sample
 * @returns Array of `SampledColor` objects (length `n`)
 */
export function sampleColors(n: number): SampledColor[] {
    if (COLOR.MODE === "fixed") {
        return sampleFromFixed(n);
    }
    
    return sampleFromWheel(n);
}

/**
 * Generates foil colors that are each at least `COLOR.MIN_DISTANCE`
 * degrees away from the target AND from each other.
 *
 * - Continuous mode: samples new angles avoiding `targetAngle` and
 *   each previously sampled foil.
 * - Fixed mode: draws colors from `COLOR.FIXED_COLORS` that are not
 *   the target.
 *
 * @param targetAngle Hue angle of the target color (ignored in fixed mode)
 * @param targetHex   Hex string of the target color (used in fixed mode)
 * @param count       Number of foil colors to generate
 * @returns Array of `SampledColor` objects (length `count`)
 */
export function sampleFoilColors(
    targetAngle: number,
    targetHex: string,
    count: number
): SampledColor[] {
    if (COLOR.MODE === "fixed") {
        return sampleFoilsFromFixed(targetHex, count);
    }
    
    return sampleFoilsFromWheel(targetAngle, count);
}

// ── Continuous mode internals ──────────────────────────────────────────
 
function sampleFromWheel(n: number): SampledColor[] {
    const minDist = COLOR.MIN_DISTANCE;
    const angles: number[] = [];
    const results: SampledColor[] = [];

    for (let i = 0; i < n; i++) {
        const angle = sampleAngle(angles, minDist);
        angles.push(angle);
        results.push({
            angle,
            hex: getLabCol(angle),
        });
    }
    
    return results;
}

function sampleFoilsFromWheel(targetAngle: number, count: number): SampledColor[] {
    // 9AFC condition
    if (count === 8) {
        const step = 360/9; 
        const results: SampledColor[] = [];

        for (let i = 1; i <= count; i++) {
            const angle = (targetAngle + step * i) % 360;
            results.push({angle, hex: getLabCol(angle) })
        }

        return results;
    }

    // other conditions
    const minDist = COLOR.MIN_DISTANCE;
    const existing: number[] = [targetAngle];
    const results: SampledColor[] = [];
    for (let i = 0; i < count; i++) {
        const angle = sampleAngle(existing, minDist);
        existing.push(angle);
        results.push({
            angle,
            hex: getLabCol(angle),
        });
    }
    
    return results;
}
 
// ── Fixed mode internals ───────────────────────────────────────────────
 
/**
 * Fisher-Yates shuffle (in-place).
 */
function shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    
    return arr;
}
 
function sampleFromFixed(n: number): SampledColor[] {
    const pool = [...COLOR.FIXED_COLORS];
    if (pool.length < n) {
        throw new Error(
            `colorSampler: FIXED_COLORS has ${pool.length} colors but ${n} were requested`
        );
    }
    const selected = shuffle(pool).slice(0, n);
    
    return selected.map((hex) => ({ angle: -1, hex }));
}
 
function sampleFoilsFromFixed(targetHex: string, count: number): SampledColor[] {
    const pool = COLOR.FIXED_COLORS.filter((c) => c !== targetHex);
    if (pool.length < count) {
        throw new Error(
            `colorSampler: not enough FIXED_COLORS for ${count} foils (available: ${pool.length})`
        );
    }
    const selected = shuffle([...pool]).slice(0, count);
    return selected.map((hex) => ({ angle: -1, hex }));
}
 