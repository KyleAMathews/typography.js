/**
 * Typography's base size and rhythm determine its public measurements. This
 * oracle checks scale(), rhythm(), and generated root/heading styles through
 * the main source entry. It owns its numerical defaults and scale wrapper,
 * together with the heading measurements in createStyles.
 *
 * ```js
 * typography({ baseFontSize: '16.5px', scaleRatio: 2 }).toJSON() // → h1 33px
 * typography({ baseFontSize: '16px', scaleRatio: 2 }).scale(-1) // → 8px
 * typography({ scaleRatio: 'minor third' }).toJSON() // → h1 16px × 6/5
 * typography({ baseLineHeight: 1.6 }).rhythm(-0.25) // → -0.4rem
 * typography({ baseLineHeight: '24px' }).rhythm(1) // → 1.5rem; html line height 24px
 * typography().toJSON() // → headings use line-height 1.1
 * typography().scale(NaN) // → throws
 * ```
 *
 * A 16px base and ratio two give a 32px heading. A nearby fractional base of
 * 16.5px must give 33px: the base cannot be truncated before scaling. The
 * README's base and ratio define that relationship; scale positions move
 * geometrically above or below the base, as adopted on 2026-11-11.
 *
 * For every supported base and ratio, the root retains the base and h1 retains
 * their product. A ratio may also be one of modularscale's named ratios
 * ('golden', 'minor third', …), which typography.js accepted through v0.16;
 * it means that name's number (engineer decision 2026-11-11, review A3). Any
 * other string is invalid. For every finite supported position, scale gives base times
 * ratio to that position. For every supported line count, rhythm gives that
 * count times the base line height, which html carries. The line height scale
 * gives is at least its font size, so lines of that text do not overlap (N6,
 * engineer decision 2026-11-11, review A7). The base line height
 * is a unitless multiple of the base or, as v0.16 allowed, a pixel length
 * (engineer decision 2026-11-11, review A4). Valid calls return usable measurements.
 * Invalid configuration, nonfinite numeric arguments, and overflow throw,
 * following the engineer's 2026-11-11 decision. With ratios above one, negative
 * positions produce smaller positive sizes; negative rhythm counts produce
 * valid negative space.
 *
 * Heading line heights have another authority: commit 22d8ec8 deliberately
 * sets a unitless headerLineHeight, default 1.1, independently of the scale
 * helper's rhythm-rounded line height. All six headings owe that multiplier.
 * A fixed length with the same current pixel value is insufficient: unitless
 * line heights retain their multiplier when inherited by differently sized text.
 *
 * The model computes from the caller's inputs, without production converters.
 * Histories include fractional/subpixel bases, signed/fractional positions and
 * spacing, omitted defaults, unity and sub-unity ratios, and invalid inputs.
 * Constructed histories retain the boundaries even when random runs miss them.
 * The driver records returned CSS values and caught production errors; only
 * the check judges them. CSS lengths are compared numerically, allowing
 * equivalent units and conversion precision rather than one string spelling.
 *
 * Generation is bounded as declared below. No browser layout is claimed; the
 * reader handles numerical absolute lengths, rem/em and percentages. Other
 * representations cause a reader error, not a production-law violation. Exact
 * helper line heights, option-object mutation, plugins, and override CSS remain
 * outside this oracle.
 */
import fc from "fast-check"
import { differs, oracleProperty, pass, violation } from "@tanstack/oracles"
import type { Observation, Verdict } from "@tanstack/oracles"
import typography from "../packages/typography/src/index.js"

// modularscale 1.0.2's named ratios, the names v0.16 accepted (review A3).
// Copied from that package's source, not from production.
const NAMED_RATIOS: Record<string, number> = {
  "minor second": 16 / 15,
  "major second": 9 / 8,
  "minor third": 6 / 5,
  "major third": 4 / 3,
  "diminished fourth": Math.sqrt(2),
  "perfect fifth": 3 / 2,
  "minor sixth": 8 / 5,
  golden: 1.61803398875,
  phi: 1.61803398875,
  "major sixth": 5 / 3,
  "minor seventh": 16 / 9,
  "major seventh": 15 / 8,
  octave: 2,
  "major tenth": 5 / 2,
  "major eleventh": 8 / 3,
  "major twelfth": 3,
  "double octave": 4,
}

type History = {
  base: number | undefined
  ratio: number | string | undefined
  // A unitless multiplier, or a pixel length such as "24px" (review A4).
  lineHeight: number | string | undefined
  headerLineHeight: number | undefined
  position: number | undefined
  lines: number
  explicitRhythmUnit: boolean | undefined
}

type Plan = History & {
  effective: {
    base: number
    ratio: number
    lineHeightPx: number
    headerLineHeight: number
    position: number
  }
}

type Measurement = { fontSize: unknown; lineHeight: unknown }
type Styles = {
  html: { font?: unknown; fontSize?: unknown; lineHeight?: unknown }
  [selector: string]: unknown
}

const optionalNumber = (min: number, max: number) =>
  fc.oneof(fc.constant(undefined), fc.double({ min, max, noNaN: true }))

// These are measurement bounds, not a narrower adoption of the laws. Each
// coordinate contributes separately: base reveals truncation, ratio/position
// reveal the scale relation, and the two line heights separate the contracts.
// Explicit invalid inputs have their own grammar below, rather than fc.pre.
const arbitrary = fc.record({
  base: optionalNumber(1e-10, 256),
  ratio: fc.oneof(
    optionalNumber(0.5, 4),
    fc.constantFrom(...Object.keys(NAMED_RATIOS))
  ),
  lineHeight: fc.oneof(
    optionalNumber(0.5, 3),
    fc.double({ min: 0.5, max: 512, noNaN: true }).map(
      (px) => `${px}px`,
      (text) => {
        const px = typeof text === "string" && text.endsWith("px")
          ? Number(text.slice(0, -2))
          : NaN
        if (!(px >= 0.5 && px <= 512))
          throw new Error("not a generated pixel line height")
        return px
      }
    )
  ),
  headerLineHeight: optionalNumber(0.5, 2),
  position: optionalNumber(-4, 4),
  lines: fc.double({ min: -4, max: 4, noNaN: true }),
  explicitRhythmUnit: fc.oneof(fc.constant(undefined), fc.boolean()),
})

const defaultHistory: History = {
  base: undefined,
  ratio: undefined,
  lineHeight: undefined,
  headerLineHeight: undefined,
  position: undefined,
  lines: 1,
  explicitRhythmUnit: undefined,
}

// Resolution fills documented configuration defaults, not expected outputs.
// The mathematical model therefore has no cases named after regressions.
function resolve(history: History): Plan {
  return {
    ...history,
    effective: {
      base: history.base ?? 16,
      ratio:
        typeof history.ratio === "string"
          ? NAMED_RATIOS[history.ratio]
          : history.ratio ?? 2,
      lineHeightPx:
        typeof history.lineHeight === "string"
          ? Number(history.lineHeight.slice(0, -"px".length))
          : (history.base ?? 16) * (history.lineHeight ?? 1.45),
      headerLineHeight: history.headerLineHeight ?? 1.1,
      position: history.position ?? 0,
    },
  }
}

function optionsFor(history: History) {
  return Object.fromEntries(
    [
      [
        "baseFontSize",
        history.base === undefined ? undefined : `${history.base}px`,
      ],
      ["scaleRatio", history.ratio],
      ["baseLineHeight", history.lineHeight],
      ["headerLineHeight", history.headerLineHeight],
      ["rhythmUnit", history.explicitRhythmUnit ? "rem" : undefined],
    ].filter(([, value]) => value !== undefined)
  )
}

// The reader is independent of convert-css-length. Absolute unit ratios come
// from CSS's fixed inch definition; relative lengths use the declared context.
// A valid representation outside this reader is a harness limit, never a kill.
function lengthInPixels(value: unknown, root: number, parent: number): number {
  if (value === 0) return 0
  if (typeof value !== "string") return NaN
  const text = value.trim()
  if (/NaN|Infinity/.test(text)) return NaN
  if (/^(?:undefined|null)(?:px|rem|em|%|in|cm|mm|q|pt|pc)?$/i.test(text))
    return NaN
  const match = text.match(
    /^([+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?)(px|rem|em|%|in|cm|mm|q|pt|pc)?$/i
  )
  if (!match) {
    // A malformed numeric literal with a known unit is invalid CSS, rather
    // than a supported expression (such as calc) outside this reader.
    if (/^[+\-\d.e]+(?:px|rem|em|%|in|cm|mm|q|pt|pc)$/i.test(text)) return NaN
    throw new Error(
      `Numerical CSS reader cannot judge ${JSON.stringify(value)}`
    )
  }
  const number = Number(match[1])
  const unit = (match[2] ?? "").toLowerCase()
  const factors: Record<string, number> = {
    px: 1,
    rem: root,
    em: parent,
    "%": parent / 100,
    in: 96,
    cm: 96 / 2.54,
    mm: 96 / 25.4,
    q: 96 / 101.6,
    pt: 96 / 72,
    pc: 16,
  }
  if (unit === "" && number !== 0) return NaN
  return number === 0 ? 0 : number * factors[unit]
}

function rootPixels(html: Styles["html"]): number {
  const prefix =
    typeof html.font === "string"
      ? html.font.split("/")[0].trim().split(/\s+/)
      : undefined
  const value =
    html.fontSize ??
    prefix?.findLast(
      (token) =>
        /^[+\-\d.]/.test(token) &&
        /(?:px|rem|em|%|in|cm|mm|q|pt|pc)$/i.test(token)
    ) ??
    prefix?.at(-1)
  return lengthInPixels(value, 16, 16)
}

// A root font shorthand owes a numerical line height after its slash. A quoted
// family in that position means the token was omitted, not an unfamiliar unit.
function rootLinePixels(
  html: Styles["html"],
  root: number
): number | undefined {
  const value = rootLineToken(html)
  if (value === undefined) return undefined
  if (typeof value === "string" && /^["']/.test(value)) return NaN
  return linePixels(value, root, root)
}

// The root's stated line height: the longhand, or the token after the slash.
function rootLineToken(html: Styles["html"]): unknown {
  if (html.lineHeight !== undefined) return html.lineHeight
  if (typeof html.font !== "string" || !html.font.includes("/"))
    return undefined
  return html.font.split("/")[1]?.trim().split(/\s+/)[0]
}

// N5 preserves a unitless multiplier, not just one computed pixel height.
// Equivalent CSS number spellings are allowed, including exponent notation.
function unitlessMultiplier(value: unknown): number {
  if (typeof value === "number") return value
  if (
    typeof value === "string" &&
    /^[+-]?(?:\d*\.\d+|\d+)(?:e[+-]?\d+)?$/i.test(value.trim())
  )
    return Number(value)
  return NaN
}

function linePixels(value: unknown, fontSize: number, root: number): number {
  const multiplier = unitlessMultiplier(value)
  if (!Number.isNaN(multiplier)) return multiplier * fontSize
  return lengthInPixels(value, root, fontSize)
}

function close(
  checkpoint: string,
  actual: number,
  expected: number,
  tolerance: number,
  law: string
): Verdict | undefined {
  if (Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance)
    return
  return violation(
    checkpoint,
    "measurement differs from the input-derived model",
    law,
    {
      actual,
      expected,
    }
  )
}

// N6: a line height below its font size makes lines of that text overlap.
function covers(
  checkpoint: string,
  lineHeight: number,
  fontSize: number,
  tolerance: number
): Verdict | undefined {
  if (lineHeight >= fontSize - tolerance) return
  return violation(
    checkpoint,
    "line height is below its font size",
    "N6 helper line height covers its font size",
    { actual: lineHeight, expected: `at least ${fontSize}` }
  )
}

function observation(trace: ReadonlyArray<Observation>, checkpoint: string) {
  return trace.find((item) => item.checkpoint === checkpoint)
}

function hasMeasurements(value: unknown): value is Measurement {
  return (
    value !== null &&
    typeof value === "object" &&
    "fontSize" in value &&
    "lineHeight" in value
  )
}

const requiredStates = [
  "defaults",
  "fractional base",
  "subpixel base",
  "scientific small base",
  "decimal small base",
  "explicit rem rhythm",
  "negative fractional position",
  "zero position",
  "negative spacing",
  "zero spacing",
  "ratio below one",
  "unity ratio",
  "named ratio",
  "pixel base line height",
  "custom heading line height",
]

oracleProperty<History, ReturnType<typeof expectedMeasurements>, Plan>({
  id: "numerical-typography",
  owns: [
    "packages/typography/src/index.js",
    "packages/typography/src/utils/createStyles.js",
  ],
  law: {
    statement:
      "N1 root/h1 preserve the base and ratio (a modularscale ratio name means its number); N2 scale uses base × ratio^position; N3 html carries the base line height (a unitless lineHeight as that multiplier, or a px lineHeight), and rhythm uses it × count; N4 valid calls return finite usable measurements; N5 headings retain headerLineHeight; N6 scale's line height is at least its font size.",
    authority:
      "README API baseFontSize/scaleRatio; docs/what.md scale and rhythm sections; commit 22d8ec8; S3 engineer decisions 2026-11-11; named ratios: modularscale 1.0.2 (the v0.16 behavior), engineer decision 2026-11-11 (review A3); pixel base line heights: the v0.16 behavior, engineer decision 2026-11-11 (review A4).",
    limits:
      "Base 1e-10–256px, ratio 0.5–4 or one of the 17 names, base line height 0.5–3 unitless or 0.5–512px (no exponent spellings), heading multiplier 0.5–2, positions/counts -4–4, with optional defaults. No browser layout, font-relative/viewport/calc output reader, exact helper line-height model, options mutation, plugins, overrides, or h2–h6 font-size law. Other regions of the owned files remain unjudged.",
  },
  histories: {
    arbitrary,
    runs: 100,
    fixedSeeds: [64491],
    states: requiredStates,
    constructed: [
      {
        name: "omitted configuration",
        enters: ["defaults"],
        build: () => defaultHistory,
      },
      {
        name: "fractional base",
        enters: ["fractional base"],
        build: (h) => ({ ...h, base: 16.5 }),
      },
      {
        name: "base below a pixel",
        enters: ["subpixel base"],
        build: (h) => ({ ...h, base: 0.5 }),
      },
      {
        name: "scientific notation base",
        enters: ["scientific small base"],
        build: (h) => ({ ...h, base: 1e-7 }),
      },
      {
        name: "explicit rem with scientific base",
        enters: ["scientific small base", "explicit rem rhythm"],
        build: (h) => ({ ...h, base: 1e-7, explicitRhythmUnit: true }),
      },
      {
        name: "adjacent decimal notation base",
        enters: ["decimal small base"],
        build: (h) => ({ ...h, base: 1e-6 }),
      },
      {
        name: "negative fractional scale position",
        enters: ["negative fractional position"],
        build: (h) => ({ ...h, position: -0.5 }),
      },
      {
        name: "scale origin",
        enters: ["zero position"],
        build: (h) => ({ ...h, position: 0 }),
      },
      {
        name: "negative spacing",
        enters: ["negative spacing"],
        build: (h) => ({ ...h, lines: -0.75 }),
      },
      {
        name: "zero spacing",
        enters: ["zero spacing"],
        build: (h) => ({ ...h, lines: -0 }),
      },
      {
        name: "ratio below one",
        enters: ["ratio below one"],
        build: (h) => ({ ...h, ratio: 0.75 }),
      },
      {
        name: "unity ratio",
        enters: ["unity ratio"],
        build: (h) => ({ ...h, ratio: 1 }),
      },
      {
        name: "pixel base line height",
        enters: ["pixel base line height"],
        build: (h) => ({ ...h, lineHeight: "24px" }),
      },
      {
        name: "named ratio",
        enters: ["named ratio"],
        build: (h) => ({ ...h, ratio: "golden" }),
      },
      {
        name: "independent heading line height",
        enters: ["custom heading line height"],
        build: (h) => ({ ...h, headerLineHeight: 1.3 }),
      },
    ],
    fixed: [
      {
        name: "scientific small-base rhythm regression",
        history: { ...defaultHistory, base: 1e-7 },
      },
      {
        name: "fractional-base regression",
        history: { ...defaultHistory, base: 16.5, ratio: 2, position: 1 },
      },
      {
        name: "existing fractional scale example",
        history: { ...defaultHistory, position: 1.333 },
      },
      {
        name: "existing scale-two example",
        history: { ...defaultHistory, position: 2 },
      },
      {
        name: "negative whole scale position",
        history: { ...defaultHistory, position: -1 },
      },
      {
        name: "negative fractional scale position",
        history: { ...defaultHistory, base: 12, position: -0.5 },
      },
      {
        name: "negative position with ratio below one",
        history: { ...defaultHistory, ratio: 0.75, position: -1 },
      },
      {
        name: "negative fractional spacing",
        history: { ...defaultHistory, base: 20, lineHeight: 1.6, lines: -0.25 },
      },
      {
        name: "A4: pixel base line height",
        history: { ...defaultHistory, lineHeight: "24px" },
      },
      {
        name: "A4: fractional pixel line height on a fractional base",
        history: { ...defaultHistory, base: 16.5, lineHeight: "19.2px", lines: -0.5, explicitRhythmUnit: true },
      },
      // Every name, since random runs need not draw each one.
      ...Object.keys(NAMED_RATIOS).map((ratio) => ({
        name: `A3: named ratio ${ratio}`,
        history: { ...defaultHistory, ratio, position: 2 },
      })),
    ],
  },
  resolve,
  model: expectedMeasurements,
  // The states describe input premises; no internal production path is inferred.
  reached(plan) {
    const states: string[] = []
    if (
      plan.base === undefined &&
      plan.ratio === undefined &&
      plan.lineHeight === undefined &&
      plan.headerLineHeight === undefined
    )
      states.push("defaults")
    if (!Number.isInteger(plan.effective.base)) states.push("fractional base")
    if (plan.effective.base < 1) states.push("subpixel base")
    if (plan.effective.base < 1e-6) states.push("scientific small base")
    if (plan.explicitRhythmUnit) states.push("explicit rem rhythm")
    if (plan.effective.base >= 1e-6 && plan.effective.base < 0.001)
      states.push("decimal small base")
    if (
      plan.effective.position < 0 &&
      !Number.isInteger(plan.effective.position)
    )
      states.push("negative fractional position")
    if (plan.effective.position === 0) states.push("zero position")
    if (plan.lines < 0) states.push("negative spacing")
    if (plan.lines === 0) states.push("zero spacing")
    if (plan.effective.ratio < 1) states.push("ratio below one")
    if (plan.effective.ratio === 1) states.push("unity ratio")
    if (typeof plan.ratio === "string") states.push("named ratio")
    if (typeof plan.lineHeight === "string")
      states.push("pixel base line height")
    if (plan.effective.headerLineHeight !== 1.1)
      states.push("custom heading line height")
    return states
  },
  // Only production calls are caught. Reader/framework errors remain harness
  // errors, so a parsing limitation cannot masquerade as a production defect.
  driver(plan, observe) {
    try {
      const t = typography(optionsFor(plan))
      const styles = t.toJSON() as Styles
      observe("root", styles.html)
      observe(
        "headings",
        [1, 2, 3, 4, 5, 6].map((n) => styles[`h${n}`])
      )
      observe("scale", t.scale(plan.position))
      observe("rhythm", t.rhythm(plan.lines))
    } catch (error) {
      observe("production error", error)
    }
  },
  check(plan, trace, expected) {
    const error = observation(trace, "production error")
    if (error)
      return violation(
        "production error",
        "valid numerical input threw",
        "no throw on valid input",
        { actual: error.value, expected: "return" }
      )
    for (const checkpoint of ["root", "headings", "scale", "rhythm"]) {
      if (!observation(trace, checkpoint))
        return violation(
          checkpoint,
          "missing public observation",
          "complete measurements"
        )
    }
    const html = observation(trace, "root")!.value as Styles["html"]
    const headings = observation(trace, "headings")!.value as Measurement[]
    const scale = observation(trace, "scale")!.value as Measurement
    const rhythm = observation(trace, "rhythm")!.value
    if (html === null || typeof html !== "object")
      return violation(
        "root",
        "missing root measurement",
        "N1 base and heading ratio"
      )
    if (
      !Array.isArray(headings) ||
      headings.length !== 6 ||
      !headings.every(hasMeasurements) ||
      !hasMeasurements(scale)
    )
      return violation(
        "headings",
        "missing numerical measurements",
        "N4 valid numerical CSS"
      )
    const root = rootPixels(html)
    const tolerance = plan.effective.base * 0.000011
    // A pixel line height is not proportional to the base, so the line
    // height and rhythm also allow floating-point error relative to their size.
    const lineTolerance = (value: number) =>
      tolerance + Math.abs(value) * 1e-12
    const rootFailure = close(
      "root",
      root,
      expected.root,
      tolerance,
      "N1 base and heading ratio"
    )
    if (rootFailure) return rootFailure
    const rootHeight = rootLinePixels(html, root)
    if (
      rootHeight !== undefined &&
      (!Number.isFinite(rootHeight) || rootHeight < 0)
    )
      return violation(
        "root",
        "root line height is not finite nonnegative CSS",
        "N4 valid numerical CSS"
      )
    // When the root states a line height, it is the base line height.
    if (rootHeight !== undefined) {
      const lineFailure = close(
        "root",
        rootHeight,
        expected.rootLine,
        lineTolerance(expected.rootLine),
        "N3 proportional rhythm"
      )
      if (lineFailure) return lineFailure
      // A unitless base line height stays a multiplier, so text with another
      // font size inherits the ratio, not one length (as for N5).
      if (typeof plan.lineHeight !== "string") {
        const failure = differs(
          "root",
          "N3 proportional rhythm",
          unitlessMultiplier(rootLineToken(html)),
          plan.lineHeight ?? 1.45
        )
        if (failure) return failure
      }
    }
    const headingSize = lengthInPixels(headings[0].fontSize, root, root)
    const headingFailure = close(
      "headings",
      headingSize,
      expected.h1,
      tolerance,
      "N1 base and heading ratio"
    )
    if (headingFailure) return headingFailure
    const scaleFailure = close(
      "scale",
      lengthInPixels(scale.fontSize, root, root),
      expected.scale,
      tolerance,
      "N2 geometric scale"
    )
    if (scaleFailure) return scaleFailure
    const rhythmFailure = close(
      "rhythm",
      lengthInPixels(rhythm, root, root),
      expected.rhythm,
      lineTolerance(expected.rhythm),
      "N3 proportional rhythm"
    )
    if (rhythmFailure) return rhythmFailure
    const helperLineHeight = linePixels(
      scale.lineHeight,
      lengthInPixels(scale.fontSize, root, root),
      root
    )
    if (!Number.isFinite(helperLineHeight) || helperLineHeight < 0) {
      return violation(
        "scale",
        "helper line height is not finite nonnegative CSS",
        "N4 valid numerical CSS"
      )
    }
    const coverFailure = covers(
      "scale",
      helperLineHeight,
      lengthInPixels(scale.fontSize, root, root),
      tolerance
    )
    if (coverFailure) return coverFailure
    for (const heading of headings) {
      const size = lengthInPixels(heading.fontSize, root, root)
      const lineHeight = linePixels(heading.lineHeight, size, root)
      if (
        !Number.isFinite(size) ||
        size < 0 ||
        !Number.isFinite(lineHeight) ||
        lineHeight < 0
      )
        return violation(
          "headings",
          "heading size or line height is not finite nonnegative CSS",
          "N4 valid numerical CSS"
        )
      const multiplier = unitlessMultiplier(heading.lineHeight)
      if (!Number.isFinite(multiplier))
        return violation(
          "headings",
          "heading line height must retain a unitless multiplier",
          "N5 independent heading line height",
          { actual: heading.lineHeight, expected: expected.headingMultiplier }
        )
      // This is a caller-provided declaration, with no conversion or rounding.
      // Compare it directly: a zero font size must not erase the multiplier.
      const failure = differs(
        "headings",
        "N5 independent heading line height",
        multiplier,
        expected.headingMultiplier
      )
      if (failure) return failure
    }
    return pass
  },
  // Each plausible wrong answer targets one observation and names the law
  // that must reject it. Integer/default histories provide clean controls.
  calibrations: [
    ...["longhand", "shorthand"].map((representation) => ({
      name: `optional root line height before wrong heading multiplier: ${representation}`,
      law: "N5 independent heading line height",
      corrupt: (trace: ReadonlyArray<Observation>) =>
        trace.map((o) => {
          if (o.checkpoint === "root") {
            const html = o.value as Styles["html"]
            return {
              ...o,
              value:
                representation === "longhand"
                  ? { fontSize: (html.font as string).split("/")[0] }
                  : {
                      ...html,
                      font: (html.font as string).replace(/\/\S+/, ""),
                    },
            }
          }
          return o.checkpoint === "headings"
            ? {
                ...o,
                value: (o.value as Measurement[]).map((h) => ({
                  ...h,
                  lineHeight: 9,
                })),
              }
            : o
        }),
    })),
    {
      name: "missing numeric token in helper CSS",
      law: "N4 valid numerical CSS",
      corrupt: (trace) =>
        trace.map((o) =>
          o.checkpoint === "scale"
            ? {
                ...o,
                value: {
                  ...(o.value as Measurement),
                  lineHeight: "undefinedrem",
                },
              }
            : o
        ),
    },
    ...["NaN", "Infinity", ""].map((value) => ({
      name: `invalid root shorthand line height: ${value || "missing"}`,
      law: "N4 valid numerical CSS",
      corrupt: (trace: ReadonlyArray<Observation>) =>
        trace.map((o) =>
          o.checkpoint === "root"
            ? {
                ...o,
                value: {
                  ...(o.value as Styles["html"]),
                  font: ((o.value as Styles["html"]).font as string).replace(
                    /\/\S*/,
                    `/${value}`
                  ),
                },
              }
            : o
        ),
    })),
    {
      name: "invalid root longhand line height",
      law: "N4 valid numerical CSS",
      corrupt: (trace) =>
        trace.map((o) =>
          o.checkpoint === "root"
            ? {
                ...o,
                value: {
                  fontSize: ((o.value as Styles["html"]).font as string).split(
                    "/"
                  )[0],
                  lineHeight: "Infinity",
                },
              }
            : o
        ),
    },
    {
      name: "malformed trailing-dot helper length",
      law: "N4 valid numerical CSS",
      corrupt: (trace) =>
        trace.map((o) =>
          o.checkpoint === "scale"
            ? {
                ...o,
                value: { ...(o.value as Measurement), lineHeight: "1.px" },
              }
            : o
        ),
    },
    {
      name: "wrong heading multiplier at zero font size",
      law: "N5 independent heading line height",
      corrupt: (trace) =>
        trace.map((o) =>
          o.checkpoint === "headings"
            ? {
                ...o,
                value: (o.value as Measurement[]).map((h, n) =>
                  n === 1 ? { ...h, fontSize: "0px", lineHeight: 9 } : h
                ),
              }
            : o
        ),
    },
    {
      name: "missing secondary heading measurements",
      law: "N4 valid numerical CSS",
      corrupt: (trace) =>
        trace.map((o) =>
          o.checkpoint === "headings"
            ? {
                ...o,
                value: (o.value as Measurement[]).map((h, n) =>
                  n === 1 ? undefined : h
                ),
              }
            : o
        ),
    },
    {
      name: "truncated or lost heading",
      law: "N1 base and heading ratio",
      corrupt: (trace) =>
        trace.map((o) =>
          o.checkpoint === "headings"
            ? {
                ...o,
                value: (o.value as Measurement[]).map((h, n) =>
                  n === 0 ? { ...h, fontSize: "0px" } : h
                ),
              }
            : o
        ),
    },
    {
      name: "scale ignores its position",
      law: "N2 geometric scale",
      corrupt: (trace) =>
        trace.map((o) =>
          o.checkpoint === "scale"
            ? {
                ...o,
                value: { ...(o.value as Measurement), fontSize: "999px" },
              }
            : o
        ),
    },
    {
      name: "unitless root line height written as a length",
      law: "N3 proportional rhythm",
      corrupt: (trace, plan) => {
        if (typeof plan.lineHeight === "string") return undefined
        const html = observation(trace, "root")?.value as Styles["html"]
        if (typeof html?.font !== "string") return undefined
        const root = rootPixels(html)
        const px = rootLinePixels(html, root)
        return trace.map((o) =>
          o.checkpoint === "root"
            ? {
                ...o,
                value: {
                  ...html,
                  font: (html.font as string).replace(/\/\S+/, `/${px}px`),
                },
              }
            : o
        )
      },
    },
    {
      name: "helper line height below its font size",
      law: "N6 helper line height covers its font size",
      corrupt: (trace) =>
        trace.map((o) =>
          o.checkpoint === "scale"
            ? { ...o, value: { ...(o.value as Measurement), lineHeight: "0px" } }
            : o
        ),
    },
    {
      name: "root line height is not the base line height",
      law: "N3 proportional rhythm",
      corrupt: (trace) =>
        trace.map((o) =>
          o.checkpoint === "root"
            ? {
                ...o,
                value: {
                  ...(o.value as Styles["html"]),
                  font: ((o.value as Styles["html"]).font as string).replace(
                    /\/\S+/,
                    "/9"
                  ),
                },
              }
            : o
        ),
    },
    {
      name: "spacing ignores its line count",
      law: "N3 proportional rhythm",
      corrupt: (trace) =>
        trace.map((o) =>
          o.checkpoint === "rhythm" ? { ...o, value: "999px" } : o
        ),
    },
    {
      name: "invalid helper line height",
      law: "N4 valid numerical CSS",
      corrupt: (trace) =>
        trace.map((o) =>
          o.checkpoint === "scale"
            ? {
                ...o,
                value: { ...(o.value as Measurement), lineHeight: "NaNpx" },
              }
            : o
        ),
    },
    {
      name: "negative helper line height",
      law: "N4 valid numerical CSS",
      corrupt: (trace) =>
        trace.map((o) =>
          o.checkpoint === "scale"
            ? {
                ...o,
                value: { ...(o.value as Measurement), lineHeight: "-1px" },
              }
            : o
        ),
    },
    {
      name: "negative secondary heading size",
      law: "N4 valid numerical CSS",
      corrupt: (trace) =>
        trace.map((o) =>
          o.checkpoint === "headings"
            ? {
                ...o,
                value: (o.value as Measurement[]).map((h, n) =>
                  n === 1 ? { ...h, fontSize: "-1px" } : h
                ),
              }
            : o
        ),
    },
    {
      name: "heading multiplier replaced by fixed length",
      law: "N5 independent heading line height",
      corrupt: (trace) => {
        const root = rootPixels(
          observation(trace, "root")!.value as Styles["html"]
        )
        return trace.map((o) =>
          o.checkpoint === "headings"
            ? {
                ...o,
                value: (o.value as Measurement[]).map((h) => ({
                  ...h,
                  lineHeight: `${linePixels(
                    h.lineHeight,
                    lengthInPixels(h.fontSize, root, root),
                    root
                  )}px`,
                })),
              }
            : o
        )
      },
    },
    {
      name: "heading uses the wrong multiplier",
      law: "N5 independent heading line height",
      corrupt: (trace) =>
        trace.map((o) =>
          o.checkpoint === "headings"
            ? {
                ...o,
                value: (o.value as Measurement[]).map((h) => ({
                  ...h,
                  lineHeight: 9,
                })),
              }
            : o
        ),
    },
  ],
})

// N4 still protects the retained dependency path for non-rem rhythm output.
// Pixel flooring and font-relative conversion are not exact N3 claims here;
// every successful returned spacing must remain finite, including signed space.
type GenericRhythmHistory = {
  base: number
  unit: string
  lines: number
  lineHeight: number | undefined
}
oracleProperty<GenericRhythmHistory, string>({
  id: "numerical-generic-rhythm-validity",
  owns: ["packages/typography/src/index.js"],
  law: {
    statement:
      "N4 ordinary generic rhythm calls return finite signed spacing; extreme calls throw or return finite signed numerical CSS spacing. scale(1) in the same unit returns finite nonnegative CSS at ordinary bases, and otherwise throws or returns it.",
    authority:
      "Engineer decision 2026-11-11: no invalid numerical CSS; throw on nonfinite results. Approved S3 N4 permits signed spacing.",
    limits:
      "Base 0.125–Number.MAX_VALUE px, px/em/rem output, optional line height 0.5–3, finite counts within plus/minus Number.MAX_VALUE, explicit pixel font context and zero offset. Counts within -4–4 at bases up to 256px require a return; larger boundaries allow rejection. No exact generic unit conversion or rounding claim. scale is called only at position 1, and N6 is not checked here: px output is floored (N6 is checked for rem in numerical-typography and numerical-result-validity).",
  },
  histories: {
    arbitrary: fc.record({
      base: fc.double({ min: 0.125, max: Number.MAX_VALUE, noNaN: true }),
      unit: fc.constantFrom("px", "em", "rem"),
      lineHeight: optionalNumber(0.5, 3),
      lines: fc.double({
        min: -Number.MAX_VALUE,
        max: Number.MAX_VALUE,
        noNaN: true,
      }),
    }),
    runs: 100,
    fixedSeeds: [64491],
    states: [
      "pixel rhythm",
      "font-relative rhythm",
      "ordinary pixel rhythm",
      "ordinary font-relative rhythm",
      "large-base rem rounding",
    ],
    constructed: [
      {
        name: "pixel rhythm overflow",
        enters: ["pixel rhythm"],
        build: () => ({
          base: 16,
          unit: "px",
          lines: Number.MAX_VALUE,
          lineHeight: undefined,
        }),
      },
      {
        name: "signed font-relative rhythm",
        enters: ["font-relative rhythm", "ordinary font-relative rhythm"],
        build: (h) => ({ ...h, base: 16, unit: "em", lines: -0.5 }),
      },
      {
        name: "ordinary pixel rhythm",
        enters: ["pixel rhythm", "ordinary pixel rhythm"],
        build: (h) => ({ ...h, base: 16, unit: "px", lines: 0.5 }),
      },
      {
        name: "rounded rem crossing physical limit",
        enters: ["large-base rem rounding"],
        build: () => ({
          base: 1.23e308,
          unit: "rem",
          lineHeight: 1,
          lines: 1.461539134034403,
        }),
      },
      {
        name: "generated rem physical-limit neighbor",
        enters: ["large-base rem rounding"],
        build: (h) => {
          const base = 1.1e308 + (h.base / Number.MAX_VALUE) * 0.5e308
          return {
            base,
            unit: "rem",
            lineHeight: 1,
            lines: Number.MAX_VALUE / base,
          }
        },
      },
    ],
    fixed: [
      {
        name: "rounded rem physical overflow regression",
        history: {
          base: 1.23e308,
          unit: "rem",
          lineHeight: 1,
          lines: 1.461539134034403,
        },
      },
    ],
  },
  // Bounded ordinary arithmetic and context conversion are finite here. A
  // blanket throw is not permitted merely because overflow is allowed elsewhere.
  model: (plan) =>
    Math.abs(plan.lines) <= 4 && plan.base <= 256
      ? "returns finite signed spacing"
      : "throws or finite signed spacing",
  reached: (plan) => [
    ...(plan.unit === "px"
      ? ["pixel rhythm"]
      : plan.unit === "em"
      ? ["font-relative rhythm"]
      : []),
    ...(Math.abs(plan.lines) <= 4 && plan.base <= 256 && plan.unit !== "rem"
      ? [
          plan.unit === "px"
            ? "ordinary pixel rhythm"
            : "ordinary font-relative rhythm",
        ]
      : []),
    ...(plan.unit === "rem" && plan.base >= 1e300 && Math.abs(plan.lines) <= 4
      ? ["large-base rem rounding"]
      : []),
  ],
  driver(plan, observe) {
    try {
      const t = typography({
        baseFontSize: `${plan.base}px`,
        rhythmUnit: plan.unit,
        ...(plan.lineHeight === undefined
          ? {}
          : { baseLineHeight: plan.lineHeight }),
      })
      observe("result", {
        outcome: "returned",
        value: t.rhythm(plan.lines, `${plan.base}px`, 0),
      })
    } catch (error) {
      observe("result", { outcome: "throws", error })
    }
    try {
      observe("scale", {
        outcome: "returned",
        value: typography({
          baseFontSize: `${plan.base}px`,
          rhythmUnit: plan.unit,
          ...(plan.lineHeight === undefined
            ? {}
            : { baseLineHeight: plan.lineHeight }),
        }).scale(1),
      })
    } catch (error) {
      observe("scale", { outcome: "throws", error })
    }
  },
  check(plan, trace, expected) {
    const scale = observation(trace, "scale")?.value as
      | { outcome: string; value?: unknown }
      | undefined
    const scaleValid =
      scale?.outcome === "returned"
        ? hasMeasurements(scale.value) &&
          [scale.value.fontSize, scale.value.lineHeight].every((length) => {
            const px = lengthInPixels(length, plan.base, plan.base)
            return Number.isFinite(px) && px >= 0
          })
        : scale?.outcome === "throws" && plan.base > 256
    if (!scaleValid)
      return violation(
        "scale",
        "generic scale returned invalid CSS or threw at an ordinary base",
        "N4 valid numerical CSS",
        { actual: scale, expected: "finite nonnegative measurements" }
      )
    const result = observation(trace, "result")?.value as
      | { outcome: string; value?: unknown }
      | undefined
    if (
      result?.outcome === "throws" &&
      expected === "throws or finite signed spacing"
    )
      return pass
    if (
      result?.outcome === "returned" &&
      Number.isFinite(lengthInPixels(result.value, plan.base, plan.base))
    )
      return pass
    return violation(
      "result",
      "generic rhythm returned invalid spacing",
      "N4 valid numerical CSS",
      { actual: result, expected }
    )
  },
  calibrations: [
    {
      name: "nonfinite generic spacing",
      law: "N4 valid numerical CSS",
      corrupt: (trace) =>
        trace.map((o) =>
          o.checkpoint === "result"
            ? { ...o, value: { outcome: "returned", value: "Infinitypx" } }
            : o
        ),
    },
    {
      name: "malformed generic scale line height",
      law: "N4 valid numerical CSS",
      corrupt: (trace) =>
        trace.map((o) =>
          o.checkpoint === "scale"
            ? {
                ...o,
                value: {
                  outcome: "returned",
                  value: { fontSize: "2em", lineHeight: "1e+22e+22px" },
                },
              }
            : o
        ),
    },
  ],
})

// Each expression is the approved sentence for one measurement, rather than
// a copy of the scale library, font parser, or vertical-rhythm algorithm.
function expectedMeasurements(plan: Plan) {
  const { base, ratio, lineHeightPx, headerLineHeight, position } =
    plan.effective
  return {
    root: base,
    rootLine: lineHeightPx,
    h1: base * ratio,
    scale: base * ratio ** position,
    rhythm: lineHeightPx * plan.lines,
    headingMultiplier: headerLineHeight,
  }
}

type InvalidHistory = { kind: string; value: unknown }
const invalidArguments = fc.constantFrom(
  NaN,
  Infinity,
  -Infinity,
  null,
  true,
  "1"
)
const invalidConfiguration = fc.constantFrom(
  0,
  -1,
  NaN,
  Infinity,
  -Infinity,
  null,
  true,
  "1"
)
// Values that are not a named ratio: case and spacing matter, an inherited
// object key is not a name, and neither is a non-string that stringifies to one.
const INVALID_RATIO_NAMES: unknown[] = [
  "Golden",
  "minor  third",
  "oops",
  "2",
  "",
  "constructor",
  "toString",
  ["golden"],
  { toString: () => "octave" },
]
const invalidRatioName = fc.constantFrom(...INVALID_RATIO_NAMES)
// Only a positive finite pixel length is a base line height with a unit.
const INVALID_PIXEL_LINE_HEIGHTS = ["0px", "-24px", "24", "24pxx", "NaNpx", "24 px", "1.5em", "px", ""]
const invalidPixelLineHeight = fc.constantFrom(...INVALID_PIXEL_LINE_HEIGHTS)
const invalidArbitrary = fc.oneof(
  fc.record({
    kind: fc.constant("baseFontSize"),
    value: fc.constantFrom(
      "0px",
      "-1px",
      "",
      "oops",
      "16em",
      "16pxoops",
      "1.2.3px",
      "16",
      null,
      16
    ),
  }),
  fc.record({
    kind: fc.constant("scaleRatio"),
    value: fc.oneof(invalidConfiguration, invalidRatioName),
  }),
  fc.record({
    kind: fc.constant("baseLineHeight"),
    value: fc.oneof(invalidConfiguration, invalidPixelLineHeight),
  }),
  fc.record({
    kind: fc.constant("headerLineHeight"),
    value: invalidConfiguration,
  }),
  fc.record({ kind: fc.constant("scale"), value: invalidArguments }),
  fc.record({ kind: fc.constant("rhythm"), value: invalidArguments }),
  fc.record({
    kind: fc.constant("overflow"),
    value: fc.integer({ min: 1024, max: 2048 }),
  }),
  fc.record({
    kind: fc.constant("rhythm overflow"),
    value: fc.constant(Number.MAX_VALUE),
  }),
  fc.record({
    kind: fc.constant("rhythm physical overflow"),
    value: fc.constant(Number.MAX_VALUE / 2),
  })
)

oracleProperty<InvalidHistory, string>({
  id: "numerical-input-rejection",
  owns: [
    "packages/typography/src/index.js",
    "packages/typography/src/utils/createStyles.js",
  ],
  law: {
    statement:
      "N4 unsupported numerical configuration, nonfinite/wrong-type numeric arguments, and overflow throw; no invalid CSS or silent fallback is returned.",
    authority:
      "Engineer decision 2026-11-11, S3 Q2: throw on invalid values; positive finite numerical configuration (or, for scaleRatio, an exact modularscale name: review A3), signed finite positions/counts.",
    limits:
      "Enumerated invalid classes with generated choices, scale-overflow positions 1024–2048 at default ratio two, and Number.MAX_VALUE rhythm overflow. Not a complete wrong-type/input-string grammar. Error class/message and exact rejection timing are not asserted.",
  },
  histories: {
    arbitrary: invalidArbitrary,
    runs: 100,
    fixedSeeds: [64491],
    states: [
      "invalid configuration",
      "invalid scale argument",
      "invalid rhythm argument",
      "finite overflow",
    ],
    constructed: [
      ...["scaleRatio", "baseLineHeight", "headerLineHeight"].flatMap((kind) =>
        [0, -1, NaN, Infinity, -Infinity, null, true, "1"].map((value) => ({
          name: `invalid ${kind}: ${String(value)}`,
          enters: ["invalid configuration"],
          build: () => ({ kind, value }),
        }))
      ),
      ...INVALID_PIXEL_LINE_HEIGHTS.map((value) => ({
        name: `invalid baseLineHeight: ${JSON.stringify(value)}`,
        enters: ["invalid configuration"],
        build: () => ({ kind: "baseLineHeight", value }),
      })),
      ...INVALID_RATIO_NAMES.map((value) => ({
        name: `invalid scaleRatio: ${JSON.stringify(value)}`,
        enters: ["invalid configuration"],
        build: () => ({ kind: "scaleRatio", value }),
      })),
      ...[
        "0px",
        "-1px",
        "",
        "oops",
        "16em",
        "16pxoops",
        "1.2.3px",
        "16",
        null,
        16,
      ].map((value) => ({
        name: `invalid pixel base: ${String(value)}`,
        enters: ["invalid configuration"],
        build: () => ({ kind: "baseFontSize", value }),
      })),
      ...["scale", "rhythm"].flatMap((kind) =>
        [NaN, Infinity, -Infinity, null, true, "1"].map((value) => ({
          name: `invalid ${kind} argument: ${String(value)}`,
          enters: [
            kind === "scale"
              ? "invalid scale argument"
              : "invalid rhythm argument",
          ],
          build: () => ({ kind, value }),
        }))
      ),
      {
        name: "invalid configuration",
        enters: ["invalid configuration"],
        build: () => ({ kind: "baseLineHeight", value: null }),
      },
      {
        name: "nonfinite scale position",
        enters: ["invalid scale argument"],
        build: () => ({ kind: "scale", value: NaN }),
      },
      {
        name: "nonfinite rhythm count",
        enters: ["invalid rhythm argument"],
        build: () => ({ kind: "rhythm", value: Infinity }),
      },
      {
        name: "finite index overflowing the scale",
        enters: ["finite overflow"],
        build: () => ({ kind: "overflow", value: 1024 }),
      },
      {
        name: "finite count overflowing rhythm",
        enters: ["finite overflow"],
        build: () => ({ kind: "rhythm overflow", value: Number.MAX_VALUE }),
      },
      {
        name: "finite rem coefficient overflowing physical rhythm",
        enters: ["finite overflow"],
        build: () => ({
          kind: "rhythm physical overflow",
          value: Number.MAX_VALUE / 2,
        }),
      },
    ],
    fixed: [
      { name: "NaN scale rejection", history: { kind: "scale", value: NaN } },
      {
        name: "infinite rhythm rejection",
        history: { kind: "rhythm", value: Infinity },
      },
      {
        name: "finite overflow rejection",
        history: { kind: "overflow", value: 1024 },
      },
    ],
  },
  // The invalid grammar itself supplies the premise. No production answer is
  // needed to decide that the law owes a rejection for every such history.
  model: () => "throws",
  reached: (plan) => [
    plan.kind === "scale"
      ? "invalid scale argument"
      : plan.kind === "rhythm"
      ? "invalid rhythm argument"
      : plan.kind === "overflow" ||
        plan.kind === "rhythm overflow" ||
        plan.kind === "rhythm physical overflow"
      ? "finite overflow"
      : "invalid configuration",
  ],
  driver(plan, observe) {
    try {
      switch (plan.kind) {
        case "scale":
          observe("result", {
            outcome: "returned",
            value: typography().scale(plan.value),
          })
          break
        case "rhythm":
        case "rhythm overflow":
          observe("result", {
            outcome: "returned",
            value: typography().rhythm(plan.value),
          })
          break
        case "overflow":
          observe("result", {
            outcome: "returned",
            value: typography().scale(plan.value),
          })
          break
        case "rhythm physical overflow":
          observe("result", {
            outcome: "returned",
            value: typography({
              baseFontSize: "256px",
              baseLineHeight: 0.5,
            }).rhythm(plan.value),
          })
          break
        default:
          observe("result", {
            outcome: "returned",
            value: typography({ [plan.kind]: plan.value }).toJSON(),
          })
      }
    } catch (error) {
      observe("result", { outcome: "throws", error })
    }
  },
  check(_plan, trace, expected) {
    const result = observation(trace, "result")
    if (!result)
      return violation(
        "result",
        "missing rejection observation",
        "N4 reject invalid numeric input"
      )
    return (
      differs(
        "result",
        "N4 reject invalid numeric input",
        (result.value as { outcome: string }).outcome,
        expected
      ) ?? pass
    )
  },
  calibrations: [
    {
      name: "silent fallback instead of rejection",
      law: "N4 reject invalid numeric input",
      corrupt: (trace) =>
        trace.map((o) => ({
          ...o,
          value: { outcome: "returned", value: "1rem" },
        })),
    },
  ],
})

// N4 also covers finite inputs whose helper arithmetic reaches representability
// edges. Exact rhythm-rounded line heights are not modeled. A call is owed a
// result when its font size is at most 1e300px and its line height is an
// ordinary multiplier (0.5 or more): then scale returns base × 2^position,
// within the rounding of a five-decimal rem, with a line height that covers it
// (N2, N4, N6; engineer decision 2026-11-11, review A7). Other calls may throw.
type ExtremeHistory = { base: number; lineHeight: number; position: number }
const OWED_MAX_PIXELS = 1e300
const owesResult = (plan: ExtremeHistory) =>
  plan.lineHeight >= 0.5 && plan.base * 2 ** plan.position <= OWED_MAX_PIXELS
oracleProperty<ExtremeHistory, string>({
  id: "numerical-result-validity",
  owns: ["packages/typography/src/index.js"],
  law: {
    statement:
      "N4 finite numerical boundary calls either throw or return finite nonnegative scale measurements whose line height covers the font size (N6). A call with a font size up to 1e300px and a line height of 0.5 or more returns base × 2^position (N2).",
    authority:
      "Engineer decision 2026-11-11: no invalid CSS; throw on nonfinite results. Approved S3 N4. Owed results and N6: engineer decision 2026-11-11 (review A7).",
    limits:
      "Base 0.125–256px, line height 1e-200–3, ratio two, positions -1024–1024. Exact helper line heights are not modeled. Calls with tiny line heights or font sizes over 1e300px may throw. Ordinary return and scale equations remain covered by numerical-typography.",
  },
  histories: {
    arbitrary: fc.record({
      base: fc.double({ min: 0.125, max: 256, noNaN: true }),
      lineHeight: fc.oneof(
        fc.double({ min: 1e-200, max: 3, noNaN: true }),
        fc.double({ min: 0.5, max: 3, noNaN: true })
      ),
      position: fc.double({ min: -1024, max: 1024, noNaN: true }),
    }),
    runs: 100,
    fixedSeeds: [64491],
    states: [
      "tiny line height with large position",
      "negative extreme position",
      "owed size over 1e21px",
    ],
    constructed: [
      {
        name: "helper line-height arithmetic overflow",
        enters: ["tiny line height with large position"],
        build: () => ({ base: 16, lineHeight: 1e-200, position: 900 }),
      },
      {
        name: "scale underflow boundary",
        enters: ["negative extreme position"],
        build: () => ({ base: 16, lineHeight: 1.45, position: -1024 }),
      },
      {
        name: "a size past the exponent spelling",
        enters: ["owed size over 1e21px"],
        build: () => ({ base: 16, lineHeight: 1.45, position: 70 }),
      },
    ],
    fixed: [
      {
        name: "malformed scientific line-height regression",
        history: {
          base: 0.125,
          lineHeight: 1e-200,
          position: 69.76048999263462,
        },
      },
      { name: "A7: scale(70)", history: { base: 16, lineHeight: 1.45, position: 70 } },
      { name: "A7: scale(990)", history: { base: 16, lineHeight: 1.45, position: 990 } },
      { name: "A7: scale(-30)", history: { base: 16, lineHeight: 1.45, position: -30 } },
    ],
  },
  model: (plan) =>
    owesResult(plan) ? "returns" : "throws or finite nonnegative measurements",
  reached: (plan) => [
    ...(plan.lineHeight < 1e-100 && plan.position > 500
      ? ["tiny line height with large position"]
      : []),
    ...(plan.position <= -1000 ? ["negative extreme position"] : []),
    ...(owesResult(plan) && plan.base * 2 ** plan.position > 1e21
      ? ["owed size over 1e21px"]
      : []),
  ],
  driver(plan, observe) {
    try {
      observe("result", {
        outcome: "returned",
        measurement: typography({
          baseFontSize: `${plan.base}px`,
          baseLineHeight: plan.lineHeight,
        }).scale(plan.position),
      })
    } catch (error) {
      observe("result", { outcome: "throws", error })
    }
  },
  check(plan, trace, expected) {
    const result = observation(trace, "result")?.value as
      | { outcome: string; measurement?: unknown }
      | undefined
    if (result?.outcome === "throws")
      return expected === "returns"
        ? violation(
            "result",
            "an owed scale call threw",
            "no throw on valid input",
            { actual: result, expected }
          )
        : pass
    if (result?.outcome === "returned" && hasMeasurements(result.measurement)) {
      const size = lengthInPixels(
        result.measurement.fontSize,
        plan.base,
        plan.base
      )
      const height = linePixels(result.measurement.lineHeight, size, plan.base)
      if (
        Number.isFinite(size) &&
        size >= 0 &&
        Number.isFinite(height) &&
        height >= 0
      ) {
        // A five-decimal rem rounds by the base; a huge size by its own scale.
        const model = plan.base * 2 ** plan.position
        const tolerance = plan.base * 0.000011 + model * 1e-9
        if (expected === "returns") {
          const failure = close("result", size, model, tolerance, "N2 geometric scale")
          if (failure) return failure
        }
        return covers("result", height, size, tolerance) ?? pass
      }
    }
    return violation(
      "result",
      "extreme call returned invalid measurements",
      "N4 valid numerical CSS",
      { actual: result, expected }
    )
  },
  calibrations: [
    {
      name: "malformed scientific notation returned as CSS",
      law: "N4 valid numerical CSS",
      corrupt: (trace) =>
        trace.map((o) => ({
          ...o,
          value: {
            outcome: "returned",
            measurement: { fontSize: "1rem", lineHeight: "1e+21e+21rem" },
          },
        })),
    },
    {
      name: "overflow returned as CSS",
      law: "N4 valid numerical CSS",
      corrupt: (trace) =>
        trace.map((o) => ({
          ...o,
          value: {
            outcome: "returned",
            measurement: { fontSize: "Infinitypx", lineHeight: "1rem" },
          },
        })),
    },
    {
      name: "an owed call throws",
      law: "no throw on valid input",
      corrupt: (trace, plan) =>
        owesResult(plan)
          ? trace.map((o) => ({
              ...o,
              value: { outcome: "throws", error: new RangeError("scale") },
            }))
          : undefined,
    },
    {
      name: "a zero helper line height",
      law: "N6 helper line height covers its font size",
      // Only where the font size is visibly above zero.
      corrupt: (trace, plan) => {
        const value = observation(trace, "result")?.value as
          | { outcome: string; measurement: Measurement }
          | undefined
        if (
          value?.outcome !== "returned" ||
          !(
            lengthInPixels(value.measurement.fontSize, plan.base, plan.base) >
            plan.base * 0.001
          )
        )
          return undefined
        return trace.map((o) =>
          o.checkpoint === "result"
            ? {
                ...o,
                value: {
                  outcome: "returned",
                  measurement: { ...value.measurement, lineHeight: "0px" },
                },
              }
            : o
        )
      },
    },
  ],
})
