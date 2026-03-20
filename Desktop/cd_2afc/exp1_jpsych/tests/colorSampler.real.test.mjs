import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const DEFAULT_FIXED_COLORS = [
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#ffff00",
  "#ff00ff",
  "#00ffff",
  "#ff8800",
  "#8800ff",
  "#008800",
  "#880000",
];

const COLOR = {
  MODE: "continuous",
  MIN_DISTANCE: 40,
  FIXED_COLORS: [...DEFAULT_FIXED_COLORS],
};

globalThis.__colorSamplerTestColor = COLOR;

function toDataUrl(source) {
  return `data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`;
}

async function buildModuleUrl(filePath, replacements = []) {
  let source = await readFile(filePath, "utf8");
  source = stripTypeScriptTypes(source, { mode: "strip" });

  for (const [pattern, replacement] of replacements) {
    source = source.replace(pattern, replacement);
  }

  return toDataUrl(source);
}

function resetColor() {
  COLOR.MODE = "continuous";
  COLOR.MIN_DISTANCE = 40;
  COLOR.FIXED_COLORS.length = 0;
  COLOR.FIXED_COLORS.push(...DEFAULT_FIXED_COLORS);
}

function angularDistance(a, b) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function assertMinDistance(colors, minDistance, label) {
  for (let i = 0; i < colors.length; i += 1) {
    for (let j = i + 1; j < colors.length; j += 1) {
      const distance = angularDistance(colors[i].angle, colors[j].angle);
      assert.ok(
        distance >= minDistance,
        `${label}: colors at ${colors[i].angle} and ${colors[j].angle} were only ${distance} degrees apart`
      );
    }
  }
}

function formatColor(color) {
  if (color.angle === -1) {
    return color.hex;
  }

  return `${color.angle.toFixed(2)}° ${color.hex}`;
}

function logColors(label, colors) {
  console.log(`    ${label}: ${colors.map(formatColor).join(", ")}`);
}

function withMockedRandom(values, fn) {
  const originalRandom = Math.random;
  let index = 0;

  Math.random = () => {
    if (index >= values.length) {
      throw new Error(`Math.random exhausted after ${values.length} calls`);
    }

    return values[index++];
  };

  try {
    return fn();
  } finally {
    Math.random = originalRandom;
  }
}

let passed = 0;
let failed = 0;

async function run(name, fn) {
  resetColor();

  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  ✗ ${name}`);
    console.log(`    ${error.stack ?? error}`);
  }
}

const settingsUrl = toDataUrl(
  "export const COLOR = globalThis.__colorSamplerTestColor;"
);

const cielabUrl = await buildModuleUrl(
  path.join(ROOT, "src/lib/color/CIElab.ts")
);

const colorSamplerUrl = await buildModuleUrl(
  path.join(ROOT, "src/lib/color/colorSampler.ts"),
  [
    [/from "\.\/CIElab";/, `from "${cielabUrl}";`],
    [/from "@settings";/, `from "${settingsUrl}";`],
  ]
);

const { getLabCol } = await import(cielabUrl);
const { sampleColors, sampleFoilColors } = await import(colorSamplerUrl);

console.log("\nTesting real src/lib/color/colorSampler.ts\n");

await run("sampleColors returns deterministic wheel colors and matching hex values", () => {
  const colors = withMockedRandom(
    [0 / 360, 60 / 360, 120 / 360, 180 / 360],
    () => sampleColors(4)
  );

  logColors("sampleColors(4)", colors);
  assert.equal(colors.length, 4);

  for (const [index, color] of colors.entries()) {
    const expectedAngle = index * 60;
    assert.equal(color.angle, expectedAngle);
    assert.equal(color.hex, getLabCol(expectedAngle));
  }
});

await run("sampleColors enforces minimum pairwise distance in continuous mode", () => {
  const colors = withMockedRandom(
    [0 / 360, 60 / 360, 120 / 360, 180 / 360, 240 / 360, 300 / 360],
    () => sampleColors(6)
  );

  logColors("sampleColors(6)", colors);
  assert.equal(colors.length, 6);
  assertMinDistance(colors, COLOR.MIN_DISTANCE, "sampleColors(6)");
});

await run("sampleFoilColors uses the random-sampling branch for smaller foil counts", () => {
  const targetAngle = 15;
  const targetHex = getLabCol(targetAngle);
  const foils = withMockedRandom(
    [100 / 360, 200 / 360, 300 / 360],
    () => sampleFoilColors(targetAngle, targetHex, 3)
  );

  logColors("target", [{ angle: targetAngle, hex: targetHex }]);
  logColors("sampleFoilColors(..., 3)", foils);
  assert.equal(foils.length, 3);

  for (const foil of foils) {
    assert.ok(
      angularDistance(foil.angle, targetAngle) >= COLOR.MIN_DISTANCE,
      `foil at ${foil.angle} was too close to target ${targetAngle}`
    );
    assert.equal(foil.hex, getLabCol(foil.angle));
  }

  assertMinDistance(foils, COLOR.MIN_DISTANCE, "sampleFoilColors(..., 3)");
});

await run("sampleFoilColors uses exact 9AFC spacing when count is 8", () => {
  const targetAngle = 17;
  const targetHex = getLabCol(targetAngle);
  const foils = sampleFoilColors(targetAngle, targetHex, 8);
  const expectedAngles = Array.from({ length: 8 }, (_, index) =>
    (targetAngle + 40 * (index + 1)) % 360
  );

  logColors("target", [{ angle: targetAngle, hex: targetHex }]);
  logColors("sampleFoilColors(..., 8)", foils);
  assert.equal(foils.length, 8);
  assert.deepEqual(
    foils.map((foil) => foil.angle),
    expectedAngles
  );

  for (const foil of foils) {
    assert.equal(foil.hex, getLabCol(foil.angle));
  }
});

await run("fixed-mode sampleColors draws unique colors from FIXED_COLORS and sets angle to -1", () => {
  COLOR.MODE = "fixed";
  const colors = sampleColors(4);

  logColors("fixed sampleColors(4)", colors);
  assert.equal(colors.length, 4);
  assert.equal(new Set(colors.map((color) => color.hex)).size, 4);
  assert.ok(colors.every((color) => COLOR.FIXED_COLORS.includes(color.hex)));
  assert.ok(colors.every((color) => color.angle === -1));
});

await run("fixed-mode sampleFoilColors excludes the target and does not duplicate foils", () => {
  COLOR.MODE = "fixed";
  const targetHex = COLOR.FIXED_COLORS[0];
  const foils = sampleFoilColors(-1, targetHex, 4);

  logColors("target", [{ angle: -1, hex: targetHex }]);
  logColors("fixed sampleFoilColors(..., 4)", foils);
  assert.equal(foils.length, 4);
  assert.ok(foils.every((foil) => foil.hex !== targetHex));
  assert.equal(new Set(foils.map((foil) => foil.hex)).size, 4);
  assert.ok(foils.every((foil) => foil.angle === -1));
});

await run("sampleColors throws when fixed mode requests more colors than available", () => {
  COLOR.MODE = "fixed";
  COLOR.FIXED_COLORS.length = 0;
  COLOR.FIXED_COLORS.push("#111111", "#222222");

  assert.throws(
    () => sampleColors(3),
    /FIXED_COLORS has 2 colors but 3 were requested/
  );
});

await run("sampleFoilColors throws when fixed mode requests more foils than available", () => {
  COLOR.MODE = "fixed";
  COLOR.FIXED_COLORS.length = 0;
  COLOR.FIXED_COLORS.push("#111111", "#222222");

  assert.throws(
    () => sampleFoilColors(-1, "#111111", 2),
    /not enough FIXED_COLORS for 2 foils/
  );
});

await run("continuous sampleColors throws when the distance constraint is impossible", () => {
  COLOR.MIN_DISTANCE = 200;

  assert.throws(
    () => sampleColors(2),
    /failed to find a valid angle after 1000 attempts/
  );
});

await run("continuous sampleFoilColors throws when the foil constraint is impossible", () => {
  COLOR.MIN_DISTANCE = 181;

  assert.throws(
    () => sampleFoilColors(0, getLabCol(0), 2),
    /failed to find a valid angle after 1000 attempts/
  );
});

await run("sampleColors(2) returns valid continuous colors with real randomness", () => {
  const colors = sampleColors(2);

  logColors("sampleColors(2)", colors);
  assert.equal(colors.length, 2);

  for (const color of colors) {
    assert.match(color.hex, /^#[0-9a-f]{6}$/);
    assert.ok(
      color.angle >= 0 && color.angle < 360,
      `angle ${color.angle} was outside the expected 0-360 range`
    );
  }

  assertMinDistance(colors, COLOR.MIN_DISTANCE, "sampleColors(2)");
});

await run("sampleColors(6) returns valid continuous colors with real randomness", () => {
  const colors = sampleColors(6);

  logColors("sampleColors(6) with real randomness", colors);
  assert.equal(colors.length, 6);

  for (const color of colors) {
    assert.match(color.hex, /^#[0-9a-f]{6}$/);
    assert.ok(
      color.angle >= 0 && color.angle < 360,
      `angle ${color.angle} was outside the expected 0-360 range`
    );
  }

  assertMinDistance(colors, COLOR.MIN_DISTANCE, "sampleColors(6) with real randomness");
});

await run("stress test: 100 continuous iterations of sampleColors(6) followed by sampleFoilColors(..., 8)", () => {
  for (let iteration = 0; iteration < 100; iteration += 1) {
    const colors = sampleColors(6);
    const target = colors[0];
    const foils = sampleFoilColors(target.angle, target.hex, 8);

    logColors(`iteration ${iteration} sampleColors(6)`, colors);
    logColors(`iteration ${iteration} target`, [target]);
    logColors(`iteration ${iteration} sampleFoilColors(..., 8)`, foils);
    assert.equal(colors.length, 6, `iteration ${iteration}: sampleColors(6) returned the wrong count`);
    assert.equal(foils.length, 8, `iteration ${iteration}: sampleFoilColors(..., 8) returned the wrong count`);

    for (const color of colors) {
      assert.match(color.hex, /^#[0-9a-f]{6}$/, `iteration ${iteration}: ${color.hex} was not valid hex`);
      assert.ok(
        color.angle >= 0 && color.angle < 360,
        `iteration ${iteration}: angle ${color.angle} was outside the expected 0-360 range`
      );
    }

    for (const foil of foils) {
      assert.match(foil.hex, /^#[0-9a-f]{6}$/, `iteration ${iteration}: ${foil.hex} was not valid hex`);
      assert.ok(
        foil.angle >= 0 && foil.angle < 360,
        `iteration ${iteration}: foil angle ${foil.angle} was outside the expected 0-360 range`
      );
    }

    assertMinDistance(colors, COLOR.MIN_DISTANCE, `iteration ${iteration}: sampleColors(6)`);

    const targetAndFoils = [target, ...foils];
    for (let i = 0; i < targetAndFoils.length; i += 1) {
      for (let j = i + 1; j < targetAndFoils.length; j += 1) {
        const distance = angularDistance(
          targetAndFoils[i].angle,
          targetAndFoils[j].angle
        );

        assert.ok(
          distance + 1e-9 >= COLOR.MIN_DISTANCE,
          `iteration ${iteration}: target + foils: colors at ${targetAndFoils[i].angle} and ${targetAndFoils[j].angle} were only ${distance} degrees apart`
        );
      }
    }
  }
});

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);

process.exitCode = failed === 0 ? 0 : 1;
