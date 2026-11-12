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
 * gives, and that of every rule outside the headings, is at least its font
 * size, so lines of that text do not overlap (N6, engineer decisions
 * 2026-11-11 and 2026-11-12). The rhythm helpers convert lengths by CSS
 * Values 4 in the rhythm unit (N7). An option set to undefined is omitted. The base line height
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
import {
  MATH_SIGNATURES,
  hasMismatch,
  lineHeightAccepts,
  mathAccepted,
  mathFeatures,
  mathText,
  mathTree,
  mathTypeOf,
  mathWitnesses,
} from "./css-math"
import type { MathCall } from "./css-math"

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
  // The base spelled with an exponent, such as "1.65e+1px" (review R1).
  // How the base is written: "16.5px", "1.65e+1px", 16.5, "16.5", or in pt.
  // A number or numeric string is px, as v0.16 read it; pt converts exactly
  // (review U1).
  baseForm: "px" | "exponent" | "number" | "string" | "pt" | "rem" | "%"
  // An omitted option passed as a key whose value is undefined. It means the
  // default (engineer decision 2026-11-12, review R5).
  explicitUndefined: boolean
  // Numbers written as strings ("2", "1.45"), and an omitted scale position
  // passed as null: both mean what v0.16 read (engineer, 2026-11-12).
  stringNumbers: boolean
  nullPosition: boolean
  // headerLineHeight as any CSS line-height, kept as given (v0.16 passed it
  // through; review U2): a length, a percentage, normal, var(), or calc().
  // Or one written value from HEADER_VALUES (math functions, env()).
  headerForm: false | "em" | "px" | "%" | "vh" | "ex" | "normal" | "var" | "calc" | "round" | "important" | `value:${string}`
  // blockMarginBottom in rhythm units, as a number or numeric string (README).
  blockMargin: number | string | undefined
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

// Heading line heights written as given (review V3). Math functions have
// their own grammar in numerical-heading-line-height-math.
const HEADER_VALUES = ["calc(1.2 * 1)", "env(safe-area-inset-top, 1.2)", "1.2ex"] as const

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
    // em and rem are the base at html; % is of the base (CSS Values 4).
    fc.tuple(fc.double({ min: 0.5, max: 3, noNaN: true }), fc.constantFrom("em", "rem", "%")).map(
      ([n, unit]) => (unit === "%" ? `${n * 100}%` : `${n}${unit}`),
      (text) => {
        const match = typeof text === "string" && /^(.*?)(em|rem|%)$/.exec(text)
        const n = match ? Number(match[1]) / (match[2] === "%" ? 100 : 1) : NaN
        if (!match || !(n >= 0.5 && n <= 3) || `${match[2] === "%" ? n * 100 : n}${match[2]}` !== text)
          throw new Error("not a generated relative line height")
        return [n, match[2]]
      }
    ),
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
  headerLineHeight: fc.oneof(optionalNumber(0.5, 2), fc.constant(0)),
  position: optionalNumber(-4, 4),
  lines: fc.double({ min: -4, max: 4, noNaN: true }),
  explicitRhythmUnit: fc.oneof(fc.constant(undefined), fc.boolean()),
  baseForm: fc.constantFrom<History["baseForm"]>("px", "exponent", "number", "string", "pt", "rem", "%"),
  explicitUndefined: fc.boolean(),
  stringNumbers: fc.boolean(),
  nullPosition: fc.boolean(),
  headerForm: fc.constantFrom<History["headerForm"]>(
    false, "em", "px", "%", "vh", "ex", "normal", "var", "calc", "round", "important",
    ...HEADER_VALUES.map((value) => `value:${value}` as const)
  ),
  blockMargin: fc.oneof(
    fc.constant(undefined),
    fc.double({ min: 0, max: 3, noNaN: true }),
    fc.double({ min: 0, max: 3, noNaN: true }).map(String, (text) => {
      const n = typeof text === "string" ? Number(text) : NaN
      if (!(n >= 0 && n <= 3) || String(n) !== text) throw new Error("not a generated margin")
      return n
    })
  ),
})

const defaultHistory: History = {
  base: undefined,
  ratio: undefined,
  lineHeight: undefined,
  headerLineHeight: undefined,
  position: undefined,
  lines: 1,
  explicitRhythmUnit: undefined,
  baseForm: "px",
  explicitUndefined: false,
  stringNumbers: false,
  nullPosition: false,
  headerForm: false,
  blockMargin: undefined,
}

// A base line height in px: a multiple of the base, or a length (CSS Values 4:
// em and rem are the base at html, % is of it).
function lineHeightInPixels(lineHeight: number | string | undefined, base: number) {
  if (typeof lineHeight !== "string") return base * (lineHeight ?? 1.45)
  const [, n, unit] = /^(.*?)(px|em|rem|%)$/.exec(lineHeight)!
  return Number(n) * (unit === "px" ? 1 : unit === "%" ? base / 100 : base)
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
      lineHeightPx: lineHeightInPixels(history.lineHeight, history.base ?? 16),
      headerLineHeight: history.headerLineHeight ?? 1.1,
      position: history.position ?? 0,
    },
  }
}

// A heading line height in one of the forms CSS accepts.
const headerText = (n: number, form: Exclude<History["headerForm"], false>) =>
  form.startsWith("value:")
    ? form.slice("value:".length)
    : form === "%"
    ? `${n * 100}%`
    : form === "normal"
    ? "normal"
    : form === "var"
    ? `var(--lh, ${n})`
    : form === "calc"
    ? `calc(${n}em + 1px)`
    : form === "round"
    ? `round(${n}, 0.25)`
    : form === "important"
    ? `${n} !important`
    : `${n}${form}`

const spell = (history: History, value: unknown) =>
  history.stringNumbers && typeof value === "number" ? String(value) : value

function optionsFor(history: History) {
  return Object.fromEntries(
    [
      [
        "baseFontSize",
        history.base === undefined
          ? undefined
          : history.baseForm === "exponent"
          ? `${history.base.toExponential()}px`
          : history.baseForm === "number"
          ? history.base
          : history.baseForm === "string"
          ? String(history.base)
          : history.baseForm === "pt"
          ? `${(history.base * 72) / 96}pt`
          : history.baseForm === "rem"
          ? `${history.base / 16}rem`
          : history.baseForm === "%"
          ? `${(history.base / 16) * 100}%`
          : `${history.base}px`,
      ],
      ["scaleRatio", spell(history, history.ratio)],
      ["baseLineHeight", spell(history, history.lineHeight)],
      [
        "headerLineHeight",
        history.headerForm && history.headerLineHeight !== undefined
          ? headerText(history.headerLineHeight, history.headerForm)
          : spell(history, history.headerLineHeight),
      ],
      ["rhythmUnit", history.explicitRhythmUnit ? "rem" : undefined],
      ["blockMarginBottom", history.blockMargin],
    ].filter(([, value]) => history.explicitUndefined || value !== undefined)
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

// Every font size and line height that toJSON() declares outside html (whose
// shorthand the root checks read), as [selector, property, value].
function declaredLengths(styles: Styles): Array<[string, string, unknown]> {
  return Object.entries(styles).flatMap(([selector, declarations]) =>
    selector === "html" ||
    declarations === null ||
    typeof declarations !== "object"
      ? []
      : (["fontSize", "lineHeight"] as const)
          .filter(
            (property) =>
              property in declarations &&
              !(property === "lineHeight" && /^h[1-6]$/.test(selector))
          )
          .map((property): [string, string, unknown] => [
            selector,
            property,
            (declarations as Record<string, unknown>)[property],
          ])
  )
}

// N4 over a whole stylesheet: each declared font size and line height is a
// finite nonnegative CSS length (a line height may be a unitless number).
function invalidDeclaredLength(
  lengths: Array<[string, string, unknown]>,
  root: number
): [string, string, unknown] | undefined {
  const sizes = new Map(
    lengths
      .filter(([, property]) => property === "fontSize")
      .map(([selector, , value]) => [
        selector,
        lengthInPixels(value, root, root),
      ])
  )
  return lengths.find(([selector, property, value]) => {
    const px =
      property === "fontSize"
        ? sizes.get(selector)!
        : linePixels(value, sizes.get(selector) ?? root, root)
    return !(Number.isFinite(px) && px >= 0)
  })
}

// N6 over a stylesheet: a rule outside h1–h6 that declares both a font size
// and a line height has a line height of at least its font size.
function uncoveredRule(
  lengths: Array<[string, string, unknown]>,
  root: number
): string | undefined {
  const rules = new Map<string, Record<string, unknown>>()
  for (const [selector, property, value] of lengths)
    rules.set(selector, { ...rules.get(selector), [property]: value })
  for (const [selector, rule] of rules) {
    if (/^h[1-6]$/.test(selector) || !("fontSize" in rule) || !("lineHeight" in rule))
      continue
    const size = lengthInPixels(rule.fontSize, root, root)
    if (linePixels(rule.lineHeight, size, root) < size - root * 0.000011)
      return selector
  }
  return undefined
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
  "exponent-spelled base",
  "base as a number, string, or pt",
  "block margin as a string",
  "explicit undefined option",
  "relative base line height",
  "numbers as strings",
  "null position",
  "em heading line height",
  "custom heading line height",
]

oracleProperty<History, ReturnType<typeof expectedMeasurements>, Plan>({
  id: "numerical-typography",
  owns: [
    "packages/typography/src/index.js",
    "packages/typography/src/utils/verticalRhythm.js", "packages/typography/src/utils/css.js",
    "packages/typography/src/utils/createStyles.js",
  ],
  law: {
    statement:
      "N1 root/h1 preserve the base and ratio (a modularscale ratio name means its number); N2 scale uses base × ratio^position; N3 html carries the base line height (a unitless lineHeight as that multiplier, or a px lineHeight), and rhythm uses it × count; N4 valid calls return finite usable measurements; N5 headings retain headerLineHeight as given (a number as that multiplier, an em length as that length); N6 the line height of scale() and of every rule outside h1–h6 covers its font size.",
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
        name: "an em base line height",
        enters: ["relative base line height"],
        build: (h) => ({ ...h, lineHeight: "1.5em" }),
      },
      {
        name: "numbers written as strings",
        enters: ["numbers as strings"],
        build: (h) => ({ ...h, ratio: 2, lineHeight: 1.6, headerLineHeight: 1.2, stringNumbers: true }),
      },
      {
        name: "an em heading line height",
        enters: ["em heading line height", "custom heading line height"],
        build: (h) => ({ ...h, headerLineHeight: 1.2, headerForm: "em" }),
      },
      {
        name: "heading line heights CSS keeps as given",
        enters: ["em heading line height", "custom heading line height"],
        build: (h) => ({ ...h, headerLineHeight: 1.25, headerForm: "var" }),
      },
      {
        name: "a zero heading line height",
        enters: ["custom heading line height"],
        build: (h) => ({ ...h, headerLineHeight: 0 }),
      },
      {
        name: "a block margin as a string (U8)",
        enters: ["block margin as a string"],
        build: (h) => ({ ...h, blockMargin: "1" }),
      },
      {
        name: "a base written as a number",
        enters: ["base as a number, string, or pt"],
        build: (h) => ({ ...h, base: 16, baseForm: "number" }),
      },
      {
        name: "a px heading line height",
        enters: ["em heading line height", "custom heading line height"],
        build: (h) => ({ ...h, headerLineHeight: 1.8, headerForm: "px" }),
      },
      {
        name: "a null scale position",
        enters: ["null position", "zero position"],
        build: (h) => ({ ...h, position: undefined, nullPosition: true }),
      },
      {
        name: "every option explicitly undefined",
        enters: ["explicit undefined option", "defaults"],
        build: () => ({ ...defaultHistory, explicitUndefined: true }),
      },
      {
        name: "exponent-spelled base",
        enters: ["exponent-spelled base", "fractional base"],
        build: (h) => ({ ...h, base: 16.5, baseForm: "exponent" }),
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
    if (typeof plan.lineHeight === "string" && plan.lineHeight.endsWith("px"))
      states.push("pixel base line height")
    if (typeof plan.lineHeight === "string" && !plan.lineHeight.endsWith("px"))
      states.push("relative base line height")
    if (plan.stringNumbers) states.push("numbers as strings")
    if (typeof plan.blockMargin === "string") states.push("block margin as a string")
    if (plan.headerForm && plan.headerLineHeight !== undefined) states.push("em heading line height")
    if (plan.nullPosition && plan.position === undefined) states.push("null position")
    if (plan.baseForm === "exponent" && plan.base !== undefined)
      states.push("exponent-spelled base")
    if (["number", "string", "pt", "rem", "%"].includes(plan.baseForm) && plan.base !== undefined)
      states.push("base as a number, string, or pt")
    if (
      plan.explicitUndefined &&
      [plan.base, plan.ratio, plan.lineHeight, plan.headerLineHeight].includes(
        undefined
      )
    )
      states.push("explicit undefined option")
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
      observe("styles", declaredLengths(styles))
      observe("block margin", (styles.p as { marginBottom?: unknown } | undefined)?.marginBottom)
      observe(
        "headings",
        [1, 2, 3, 4, 5, 6].map((n) => styles[`h${n}`])
      )
      observe(
        "scale",
        t.scale(
          plan.position === undefined && plan.nullPosition
            ? null
            : spell(plan, plan.position)
        )
      )
      observe("rhythm", t.rhythm(spell(plan, plan.lines)))
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
    // N4 (review X9): the root size is the base as a percentage, written
    // without floating-point noise: at most 15 significant digits
    // ("115%", not "114.99999999999999%").
    const rootText = String(html.fontSize ?? (typeof html.font === "string" ? html.font.split("/")[0].trim().split(/\s+/).at(-1) : ""))
    if (rootText.replace(/e.*$/i, "").replace(/[^0-9]/g, "").replace(/^0+/, "").length > 15)
      return violation("root", "the root font size carries floating-point noise", "N4 valid numerical CSS", { actual: rootText })
    const bad = invalidDeclaredLength(
      (observation(trace, "styles")?.value ?? []) as Array<
        [string, string, unknown]
      >,
      root
    )
    if (bad)
      return violation(
        "styles",
        "a declared font size or line height is not finite nonnegative CSS",
        "N4 valid numerical CSS",
        { actual: bad }
      )
    // N6 for the rules typography writes outside the headings (N5 owns
    // their line height): each line height covers its font size.
    const covered = uncoveredRule(
      (observation(trace, "styles")?.value ?? []) as Array<[string, string, unknown]>,
      root
    )
    if (covered)
      return violation(
        "styles",
        "a rule's line height is below its font size",
        "N6 helper line height covers its font size",
        { actual: covered }
      )
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
    // N3: a block's bottom margin is blockMarginBottom rhythm units (README:
    // "Defaults to one rhythm unit").
    const margin = observation(trace, "block margin")?.value
    const marginLines = plan.blockMargin === undefined ? 1 : Number(plan.blockMargin)
    const marginFailure = close(
      "block margin",
      lengthInPixels(margin, root, root),
      plan.effective.lineHeightPx * marginLines,
      lineTolerance(plan.effective.lineHeightPx * marginLines),
      "N3 proportional rhythm"
    )
    if (marginFailure) return marginFailure
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
      // N5: any other form is kept as given.
      if (plan.headerForm && plan.headerLineHeight !== undefined) {
        const failure = differs(
          "headings",
          "N5 independent heading line height",
          heading.lineHeight,
          headerText(plan.headerLineHeight, plan.headerForm)
        )
        if (failure) return failure
        continue
      }
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
      name: "a zero line height in a non-heading rule",
      law: "N6 helper line height covers its font size",
      // The first rule outside h1–h6 with a line height (code, at the defaults).
      corrupt: (trace) => {
        const styles = trace.find((o) => o.checkpoint === "styles")?.value as Array<[string, string, unknown]> | undefined
        const at = styles?.findIndex(([selector, property]) => property === "lineHeight" && !/^h[1-6]$/.test(selector)) ?? -1
        if (!styles || at < 0) return undefined
        return trace.map((o) =>
          o.checkpoint === "styles"
            ? { ...o, value: styles.map((entry, k): [string, string, unknown] => (k === at ? [entry[0], entry[1], "0e-7px"] : entry)) }
            : o
        )
      },
    },
    {
      name: "malformed line height in a non-heading rule",
      law: "N4 valid numerical CSS",
      corrupt: (trace) =>
        trace.map((o) =>
          o.checkpoint === "styles"
            ? {
                ...o,
                value: [
                  ...(o.value as Array<[string, string, unknown]>),
                  ["table", "lineHeight", "1.45e+22e+22px"],
                ],
              }
            : o
        ),
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
  owns: ["packages/typography/src/index.js", "packages/typography/src/utils/verticalRhythm.js", "packages/typography/src/utils/css.js"],
  law: {
    statement:
      "N4 ordinary generic rhythm calls return finite signed spacing; extreme calls throw or return finite signed numerical CSS spacing. scale(1) in the same unit, and every font size and line height in toJSON(), are finite nonnegative CSS at ordinary bases, and otherwise throw or are such CSS.",
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
      "base past the exponent spelling",
    ],
    constructed: [
      {
        name: "a base past 1e21px, in each unit",
        enters: ["base past the exponent spelling"],
        build: (h) => ({
          ...h,
          base: 1e21 * (1 + h.base / Number.MAX_VALUE),
          lines: 1,
        }),
      },
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
        name: "R1: base 1e22px",
        history: { base: 1e22, unit: "rem", lineHeight: undefined, lines: 1 },
      },
      {
        name: "R1: base 1e22px in em",
        history: { base: 1e22, unit: "em", lineHeight: undefined, lines: 1 },
      },
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
    ...(plan.base >= 1e21 && plan.base <= 1e290
      ? ["base past the exponent spelling"]
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
      observe("styles", {
        outcome: "returned",
        value: declaredLengths(
          typography({
            baseFontSize: `${plan.base}px`,
            rhythmUnit: plan.unit,
            ...(plan.lineHeight === undefined
              ? {}
              : { baseLineHeight: plan.lineHeight }),
          }).toJSON() as Styles
        ),
      })
    } catch (error) {
      observe("styles", { outcome: "throws", error })
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
    const styles = observation(trace, "styles")?.value as
      | { outcome: string; value?: Array<[string, string, unknown]> }
      | undefined
    const badStyle =
      styles?.outcome === "returned"
        ? invalidDeclaredLength(styles.value!, plan.base)
        : undefined
    if (
      badStyle ||
      (styles?.outcome === "throws" && plan.base <= 256) ||
      styles === undefined
    )
      return violation(
        "styles",
        "a declared font size or line height is not finite nonnegative CSS, or toJSON threw at an ordinary base",
        "N4 valid numerical CSS",
        { actual: badStyle ?? styles, expected: "finite nonnegative CSS" }
      )
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
      name: "malformed generic stylesheet line height",
      law: "N4 valid numerical CSS",
      corrupt: (trace) =>
        trace.map((o) =>
          o.checkpoint === "styles"
            ? {
                ...o,
                value: {
                  outcome: "returned",
                  value: [["table", "lineHeight", "1.45e+22e+22px"]],
                },
              }
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

// Q2: "errors should identify the invalid argument/result". For an invalid
// option, the message names that option.
function namesTheOption(plan: InvalidHistory, result: { error?: unknown }) {
  const option = OPTION_OF_KIND[plan.kind]
  if (option === undefined) return pass
  const message = result.error instanceof Error ? result.error.message : ""
  return message.includes(option)
    ? pass
    : violation(
        "result",
        "the error does not name the invalid option",
        "N4 reject invalid numeric input",
        { actual: message, expected: `a message naming ${option}` }
      )
}
// A numeric string and null are valid arguments, as in v0.16 (engineer
// decision 2026-11-12: no breaking changes).
const INVALID_ARGUMENTS: unknown[] = [NaN, Infinity, -Infinity, true, "x", "1px", ""]
const invalidArguments = fc.constantFrom(...INVALID_ARGUMENTS)
// A numeric string is a valid number option, as in v0.16; null is invalid.
// White space around a number is ignored, as CSS ignores it (review U1).
const INVALID_CONFIGURATION: unknown[] = [0, -1, NaN, Infinity, -Infinity, null, true, "x", "0", "-1", "1 x"]
// A heading line height is any CSS line-height (review U2): 0 and normal are
// valid; a negative value, an unknown unit, or text that is not safe CSS is not.
const INVALID_HEADER_VALUES: unknown[] = [-1, NaN, Infinity, null, true, "x", "-1", "-1em", "1.2 em", "em", "1.2foo", "1;x", "var(--a", "calc(1", "normal;", "a<b", "{}",
  // Review V4, V5: a function whose contents CSS rejects, and a non-CSS space.
  "calc(foo)", "min()", "var(x)", "calc()", "normal\u00a0", "1.1 !importan", "!important",
  "calc(1.2foo)", "calc(var(x))", "calc(1 + )", "clamp(1)", "calc(1 1)", "calc(1))", "calc((1)",
  "calc(1, 2)", "round(up)", "calc(up)", "min(1,)", "pow(2)", "env(1)", "env()",
  // Gap check: an expression cut off, a comma in a group, and a character no
  // CSS token starts with.
  "calc(1 *", "calc((1, 2))", "calc(1 # 2)",
  // Gap check: a word where round()'s comma belongs, a second operand inside a
  // group, and a group where a comma belongs.
  "round(up x 1)", "calc((1 2))", "min(1 (2))", "min(1+ 2)", "calc((1 2)",
  // Gap check (review round 6): an unknown function that does not close.
  "sibling-index(1", "calc(sibling-index(1)"]
// A base font size: a positive length that converts to px, or a number (px).
const INVALID_BASES: unknown[] = ["0px", "-1px", "", "oops", "16pxoops", "1.2.3px", "16vw", null, true, NaN, 0, -16, "1ex"]
const invalidConfiguration = fc.constantFrom(...INVALID_CONFIGURATION)
// Values that are not a named ratio: case and spacing matter, an inherited
// object key is not a name, and neither is a non-string that stringifies to one.
const INVALID_RATIO_NAMES: unknown[] = [
  "Golden",
  "minor  third",
  "oops",
  "",
  "constructor",
  "toString",
  ["golden"],
  { toString: () => "octave" },
]
const invalidRatioName = fc.constantFrom(...INVALID_RATIO_NAMES)
// [base px, base line height] pairs whose product overflows or underflows.
const LINE_HEIGHT_RANGE = [
  [16, 1e308],
  [256, Number.MAX_VALUE],
  [1e-200, 1e-200],
] as const
// Q2: an error names the invalid option. Each configuration kind's name.
const OPTION_OF_KIND: Record<string, string> = {
  baseFontSize: "baseFontSize",
  scaleRatio: "scaleRatio",
  baseLineHeight: "baseLineHeight",
  headerLineHeight: "headerLineHeight",
  "line height range": "baseLineHeight",
  rhythmUnit: "rhythmUnit",
  minLinePadding: "minLinePadding",
}
// A rhythm unit must be a length unit that converts from px: not a viewport
// or font-relative unit other than em and ex, not %, not a non-string.
const INVALID_RHYTHM_UNITS: unknown[] = ["vw", "ch", "%", "foo", "", 12, null, ["rem"], "constructor", "toString", "ex", "EX"]
// headerLineHeight may be a length kept as given; it must be positive and
// convert to px.

// minLinePadding must be a CSS length that converts to px (review T9).
const INVALID_PADDINGS: unknown[] = ["abc", "2vw", NaN, "", true, "2 px", "1ex"]
// Only a positive finite pixel length is a base line height with a unit.
// A base line height may be a number, a numeric string, or a CSS length that
// converts to px (v0.16 accepted em and rem; CSS adds % and the others).
const INVALID_PIXEL_LINE_HEIGHTS = ["0px", "-24px", "24pxx", "NaNpx", "24 px", "1.5vw", "-1.5", "px", "", "1.5ex"]
const invalidPixelLineHeight = fc.constantFrom(...INVALID_PIXEL_LINE_HEIGHTS)
const invalidArbitrary = fc.oneof(
  fc.record({
    kind: fc.constant("baseFontSize"),
    value: fc.constantFrom(...INVALID_BASES),
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
    value: fc.constantFrom(...INVALID_HEADER_VALUES),
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
  }),
  fc.record({
    kind: fc.constant("rhythmUnit"),
    value: fc.constantFrom(...INVALID_RHYTHM_UNITS),
  }),
  fc.record({
    kind: fc.constant("minLinePadding"),
    value: fc.constantFrom(...INVALID_PADDINGS),
  }),
  // A positive finite base and line height whose pixel product is not a
  // usable line height (review R4).
  fc.record({
    kind: fc.constant("line height range"),
    value: fc.constantFrom(...LINE_HEIGHT_RANGE),
  })
)

oracleProperty<InvalidHistory, string>({
  id: "numerical-input-rejection",
  owns: [
    "packages/typography/src/index.js",
    "packages/typography/src/utils/verticalRhythm.js", "packages/typography/src/utils/css.js",
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
      "line height product out of range",
    ],
    constructed: [
      ...INVALID_PADDINGS.map((value) => ({
        name: `invalid minLinePadding: ${JSON.stringify(value)}`,
        enters: ["invalid configuration"],
        build: () => ({ kind: "minLinePadding", value }),
      })),
      ...INVALID_RHYTHM_UNITS.map((value) => ({
        name: `invalid rhythmUnit: ${JSON.stringify(value)}`,
        enters: ["invalid configuration"],
        build: () => ({ kind: "rhythmUnit", value }),
      })),
      ...LINE_HEIGHT_RANGE.map((value) => ({
        name: `line height product out of range: ${value.join(" × ")}`,
        enters: ["line height product out of range"],
        build: () => ({ kind: "line height range", value }),
      })),
      ...INVALID_HEADER_VALUES.map((value) => ({
        name: `invalid headerLineHeight: ${JSON.stringify(value)}`,
        enters: ["invalid configuration"],
        build: () => ({ kind: "headerLineHeight", value }),
      })),
      ...["scaleRatio", "baseLineHeight"].flatMap((kind) =>
        INVALID_CONFIGURATION.map((value) => ({
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
      ...INVALID_BASES.map((value) => ({
        name: `invalid pixel base: ${String(value)}`,
        enters: ["invalid configuration"],
        build: () => ({ kind: "baseFontSize", value }),
      })),
      ...["scale", "rhythm"].flatMap((kind) =>
        INVALID_ARGUMENTS.map((value) => ({
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
      : plan.kind === "line height range"
      ? "line height product out of range"
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
        case "line height range": {
          const [base, lineHeight] = plan.value as readonly [number, number]
          observe("result", {
            outcome: "returned",
            value: typography({
              baseFontSize: `${base}px`,
              baseLineHeight: lineHeight,
            }).toJSON(),
          })
          break
        }
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
      ) ?? namesTheOption(_plan, result.value as { error?: unknown })
    )
  },
  calibrations: [
    {
      name: "an error that names another option",
      law: "N4 reject invalid numeric input",
      corrupt: (trace, plan) =>
        OPTION_OF_KIND[plan.kind] === undefined
          ? undefined
          : trace.map((o) => ({
              ...o,
              value: {
                outcome: "throws",
                error: new RangeError("Invalid numerical value for rhythm result"),
              },
            })),
    },
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
// rhythmUnit varies too (review R3): the owed result does not depend on it.
type ExtremeHistory = {
  base: number
  lineHeight: number
  position: number
  unit: string | undefined
}
const OWED_MAX_PIXELS = 1e300
const owesResult = (plan: ExtremeHistory) =>
  plan.lineHeight >= 0.5 && plan.base * 2 ** plan.position <= OWED_MAX_PIXELS
oracleProperty<ExtremeHistory, string>({
  id: "numerical-result-validity",
  owns: ["packages/typography/src/index.js", "packages/typography/src/utils/verticalRhythm.js", "packages/typography/src/utils/css.js"],
  law: {
    statement:
      "N4 finite numerical boundary calls either throw or return finite nonnegative scale measurements whose line height covers the font size (N6). A call with a font size up to 1e300px and a line height of 0.5 or more returns base × 2^position (N2).",
    authority:
      "Engineer decision 2026-11-11: no invalid CSS; throw on nonfinite results. Approved S3 N4. Owed results and N6: engineer decision 2026-11-11 (review A7).",
    limits:
      "Base 0.125–256px, line height 1e-200–3, ratio two, positions -1024–1024, rhythm unit default/rem/em/px. Exact helper line heights are not modeled. N6 is checked for rem only (px is floored; em line heights are relative to the base). Calls with tiny line heights or font sizes over 1e300px may throw. Ordinary return and scale equations remain covered by numerical-typography.",
  },
  histories: {
    arbitrary: fc.record({
      base: fc.double({ min: 0.125, max: 256, noNaN: true }),
      lineHeight: fc.oneof(
        fc.double({ min: 1e-200, max: 3, noNaN: true }),
        fc.double({ min: 0.5, max: 3, noNaN: true })
      ),
      position: fc.double({ min: -1024, max: 1024, noNaN: true }),
      unit: fc.constantFrom(undefined, "rem", "em", "px"),
    }),
    runs: 100,
    fixedSeeds: [64491],
    states: [
      "owed size over 1e21px in px or em",
      "tiny line height with large position",
      "negative extreme position",
      "owed size over 1e21px",
    ],
    constructed: [
      {
        name: "helper line-height arithmetic overflow",
        enters: ["tiny line height with large position"],
        build: () => ({ base: 16, lineHeight: 1e-200, position: 900, unit: undefined }),
      },
      {
        name: "scale underflow boundary",
        enters: ["negative extreme position"],
        build: () => ({ base: 16, lineHeight: 1.45, position: -1024, unit: undefined }),
      },
      {
        name: "a size past the exponent spelling",
        enters: ["owed size over 1e21px"],
        build: () => ({ base: 16, lineHeight: 1.45, position: 70, unit: undefined }),
      },
      {
        name: "a size past the exponent spelling in em",
        enters: ["owed size over 1e21px in px or em", "owed size over 1e21px"],
        build: () => ({ base: 16, lineHeight: 1.45, position: 80, unit: "em" }),
      },
    ],
    fixed: [
      {
        name: "malformed scientific line-height regression",
        history: {
          base: 0.125,
          lineHeight: 1e-200,
          position: 69.76048999263462,
          unit: undefined,
        },
      },
      { name: "A7: scale(70)", history: { base: 16, lineHeight: 1.45, position: 70, unit: undefined } },
      { name: "A7: scale(990)", history: { base: 16, lineHeight: 1.45, position: 990, unit: undefined } },
      { name: "A7: scale(-30)", history: { base: 16, lineHeight: 1.45, position: -30, unit: undefined } },
      { name: "R3: scale(80) in em", history: { base: 16, lineHeight: 1.45, position: 80, unit: "em" } },
      { name: "R3: scale(80) in px", history: { base: 16, lineHeight: 1.45, position: 80, unit: "px" } },
      { name: "R3: scale(-30) in em", history: { base: 16, lineHeight: 1.45, position: -30, unit: "em" } },
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
    ...(owesResult(plan) &&
    plan.base * 2 ** plan.position > 1e21 &&
    (plan.unit === "px" || plan.unit === "em")
      ? ["owed size over 1e21px in px or em"]
      : []),
  ],
  driver(plan, observe) {
    try {
      observe("result", {
        outcome: "returned",
        measurement: typography({
          baseFontSize: `${plan.base}px`,
          baseLineHeight: plan.lineHeight,
          ...(plan.unit === undefined ? {} : { rhythmUnit: plan.unit }),
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
        // A five-decimal rem rounds by the base, a five-decimal px by 5e-6px,
        // and a huge size by its own scale.
        const model = plan.base * 2 ** plan.position
        const tolerance = plan.base * 0.000011 + 0.0000051 + model * 1e-9
        if (expected === "returns") {
          const failure = close("result", size, model, tolerance, "N2 geometric scale")
          if (failure) return failure
        }
        // px line heights are floored, so N6 is checked for rem only.
        return plan.unit === "px" || plan.unit === "em"
          ? pass
          : covers("result", height, size, tolerance) ?? pass
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

// N7: rhythm(lines, fontSize, offset) and adjustFontSizeTo(toSize, lines,
// fromSize) keep compass-vertical-rhythm's API (v0.16 re-exported it):
// results in the rhythm unit (rem by default), 5 decimals, px rhythm floored.
// Lengths convert by CSS Values 4 (engineer: "spec is always the law",
// 2026-11-12), which fixes where compass differed:
// - rem is the base. em and % are the parent size: fromSize, or the font
//   size passed to rhythm. ex is 0.5em (§6.1.1, the x-height fallback).
//   Absolute units are exact (§5.2: 1in = 96px = 72pt = 6pc = 2.54cm).
// - An em or ex line height is relative to the element's own font size, so
//   adjustFontSizeTo("42px", 3, "10.5px") gives 4em and 2em (compass: 8em).
// N6 for adjustFontSizeTo: with lines "auto", the line height is a whole
// number of half lines and covers the font size. Explicit lines may give less
// (compass's own fixture allows it).
// "num" and "numstr" are a plain number and a numeric string: px, as compass
// read them (review U3, U4). An ex length throws wherever px must be
// computed, since only the browser knows the x-height (review V7).
type Length = { n: number; unit: "px" | "rem" | "em" | "%" | "ex" | "pt" | "cm" | "num" | "numstr" }
type RhythmUnit = "rem" | "em" | "px" | "pt" | "pc" | "in" | "cm" | "mm" | "q"
// CSS Values 4 §5.2: absolute lengths in px.
const ABSOLUTE: Record<string, number> = {
  px: 1,
  in: 96,
  pt: 96 / 72,
  pc: 16,
  cm: 96 / 2.54,
  mm: 96 / 25.4,
  q: 96 / 101.6,
}
type HelperHistory = {
  base: number
  // baseFontSize as written: px, rem, em, or % (of the initial 16px), or a
  // number (review V1).
  baseForm: "px" | "rem" | "em" | "%" | "number"
  lineHeight: number | string
  unit: RhythmUnit | undefined
  // compass's options for the auto line count (defaults 2px and true). A
  // padding of 0 may be written unitless (CSS Values 4 5.1, review T2). Any
  // truthy or falsy value picks half or whole lines, as compass read it (T5).
  minLinePadding: number | string | undefined
  roundToNearestHalfLine: unknown
  call:
    | { kind: "rhythm"; lines: number | null; context: Length | undefined; offset: number | undefined }
    | { kind: "adjust"; size: Length; lines: number | "auto" | null | undefined; from: Length | undefined }
    | { kind: "lines"; size: Length }
}
const baseOption = (base: number, form: HelperHistory["baseForm"]) =>
  form === "number" ? base : form === "%" ? `${(base / 16) * 100}%` : form === "px" ? `${base}px` : `${base / 16}${form}`
const lengthOf = (l: Length, plan: HelperHistory): string | number =>
  l.unit === "num"
    ? l.n
    : l.unit === "numstr"
    ? String(l.n)
    : `${l.n}${l.unit}`
const lengthArbitrary = fc.oneof(
  fc.record({ n: fc.double({ min: 4, max: 64, noNaN: true }), unit: fc.constant("px" as const) }),
  fc.record({
    n: fc.double({ min: 0.25, max: 4, noNaN: true }),
    unit: fc.constantFrom("rem" as const, "em" as const, "ex" as const),
  }),
  fc.record({ n: fc.double({ min: 25, max: 400, noNaN: true }), unit: fc.constant("%" as const) }),
  fc.record({ n: fc.double({ min: 3, max: 48, noNaN: true }), unit: fc.constant("pt" as const) }),
  fc.record({ n: fc.double({ min: 0.1, max: 2, noNaN: true }), unit: fc.constant("cm" as const) }),
  fc.record({ n: fc.double({ min: 4, max: 64, noNaN: true }), unit: fc.constantFrom("num" as const, "numstr" as const) }),
  // The base size in any unit, as typography.js's own rules and the themes ask for it.
  fc.record({ n: fc.constant(100), unit: fc.constant("%" as const) })
)
// A font size: mostly valid lengths; a negative one is invalid CSS (N4,
// reviews T3 and W8); zero is valid.
const sizeArbitrary = fc.oneof(
  { weight: 6, arbitrary: lengthArbitrary },
  { weight: 1, arbitrary: fc.record({ n: fc.double({ min: -64, max: 0, noNaN: true }), unit: fc.constant("px" as const) }) }
)
const helperArbitrary = fc.record({
  base: fc.double({ min: 1, max: 64, noNaN: true }),
  baseForm: fc.constantFrom<HelperHistory["baseForm"]>("px", "rem", "em", "%", "number"),
  lineHeight: fc.oneof(
    fc.double({ min: 0.5, max: 3, noNaN: true }),
    fc.double({ min: 8, max: 64, noNaN: true }).map(
      (px) => `${px}px`,
      (text) => {
        const px =
          typeof text === "string" && text.endsWith("px")
            ? Number(text.slice(0, -2))
            : NaN
        if (!(px >= 8 && px <= 64)) throw new Error("not a generated px line height")
        return px
      }
    )
  ),
  unit: fc.constantFrom<RhythmUnit | undefined>(undefined, "rem", "em", "px", "pt", "pc", "in", "cm", "mm", "q"),
  minLinePadding: fc.oneof(
    fc.constant(undefined),
    fc.constantFrom(0, "0", 2, "3"),
    fc.double({ min: 0, max: 8, noNaN: true }).map(
      (px) => `${px}px`,
      (text) => {
        const px = typeof text === "string" && text.endsWith("px") ? Number(text.slice(0, -2)) : NaN
        if (!(px >= 0 && px <= 8)) throw new Error("not a generated padding")
        return px
      }
    )
  ),
  roundToNearestHalfLine: fc.constantFrom(undefined, true, false, 0, null, "", 1, "x"),
  call: fc.oneof(
    fc.record({
      kind: fc.constant("rhythm" as const),
      lines: fc.oneof(fc.double({ min: -4, max: 4, noNaN: true }), fc.constant(null)),
      context: fc.option(sizeArbitrary, { nil: undefined }),
      offset: fc.option(fc.double({ min: -8, max: 8, noNaN: true }), { nil: undefined }),
    }),
    fc.record({ kind: fc.constant("lines" as const), size: sizeArbitrary }),
    fc.record({
      kind: fc.constant("adjust" as const),
      size: sizeArbitrary,
      lines: fc.oneof(
        fc.constant("auto" as const),
        fc.constant(undefined),
        fc.constant(null),
        fc.double({ min: -4, max: 4, noNaN: true })
      ),
      from: fc.option(sizeArbitrary, { nil: undefined }),
    })
  ),
})

// A length as N7 predicts it: its number and unit.
type Out = { n: number; unit: string }
type HelperExpected = {
  // N4: a negative font size or line height is invalid CSS, so the call throws.
  throws?: true
  // linesForFontSize: the line count.
  lines?: number
  fontSize?: Out
  lineHeight?: Out
  // lines "auto": the font size in px that the line height must cover (N6).
  coverPx?: number
}
// Compass's lines-for-font-size: the fewest lines (half lines by default)
// that contain the size, and one more step when the space left is under
// twice minLinePadding.
function autoLines(sizePx: number, linePx: number, padding: number, half: boolean) {
  const step = half ? 0.5 : 1
  const lines = Math.ceil(sizePx / linePx / step) * step
  return lines * linePx - sizePx < 2 * padding ? lines + step : lines
}
function expectedHelper(plan: HelperHistory): HelperExpected {
  const base = plan.base
  const linePx =
    typeof plan.lineHeight === "string"
      ? Number(plan.lineHeight.slice(0, -2))
      : base * plan.lineHeight
  const unit = plan.unit ?? "rem"
  // A parent size, spelled relative to the base (its own parent).
  const parentPx = (l: Length | undefined) =>
    l === undefined ? base : toPx(l, base)
  const toPx = (l: Length, parent: number) =>
    l.unit === "rem"
      ? l.n * base
      : l.unit === "em"
      ? l.n * parent
      : l.unit === "%"
      ? (l.n / 100) * parent
      : l.unit === "ex"
      ? NaN
      : l.unit === "num" || l.unit === "numstr"
      ? l.n
      : l.n * ABSOLUTE[l.unit]
  // An em or ex length relative to a zero (or underflowing) size cannot
  // express the value: it is in px (engineer decision 2026-11-12, review T6).
  const inUnit = (px: number, relativeTo: number): Out => {
    if (unit === "rem") return { n: px / base, unit }
    if (unit !== "em") return { n: px / ABSOLUTE[unit], unit }
    return relativeTo === 0 || !Number.isFinite(px / relativeTo) ? { n: px, unit: "px" } : { n: px / relativeTo, unit }
  }
  // An ex length throws (review V7), and the error names the call.
  const lengths = plan.call.kind === "rhythm" ? [plan.call.context] : plan.call.kind === "lines" ? [plan.call.size] : [plan.call.size, plan.call.from]
  if (lengths.some((l) => l?.unit === "ex")) return { throws: true }
  // N4: a negative font size, context or fromSize included, is invalid CSS
  // (review X3). "-0px" is written "0px".
  if (lengths.some((l) => l !== undefined && l.n + 0 < 0)) return { throws: true }
  if (plan.call.kind === "rhythm") {
    const own = parentPx(plan.call.context)
    // null lines are the default, one line (compass, review T8).
    const px = (plan.call.lines ?? 1) * linePx - (plan.call.offset ?? 0)
    return { lineHeight: inUnit(px, own) }
  }
  // A padding in px, or a plain number or numeric string (px).
  const padding = plan.minLinePadding === undefined ? 2 : parseFloat(String(plan.minLinePadding))
  const half = plan.roundToNearestHalfLine === undefined || !!plan.roundToNearestHalfLine
  if (plan.call.kind === "lines") {
    // + 0: a size of -0 is written "0px", which reads as 0.
    const px = toPx(plan.call.size, base) + 0
    return px < 0 ? { throws: true } : { lines: autoLines(px, linePx, padding, half) }
  }
  const parent = parentPx(plan.call.from)
  const sizePx = toPx(plan.call.size, parent)
  const lines = plan.call.lines
  const auto = lines === "auto" || lines == null
  if (sizePx < 0 || (!auto && lines < 0)) return { throws: true }
  const count = auto ? autoLines(sizePx, linePx, padding, half) : lines
  return {
    fontSize: inUnit(sizePx, parent),
    lineHeight: inUnit(count * linePx, sizePx),
    ...(auto ? { coverPx: sizePx } : {}),
  }
}

// A length the helpers return: a number and its unit, read independently.
function readLength(value: unknown): { n: number; unit: string } | undefined {
  const match =
    typeof value === "string" &&
    /^([+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?)(rem|em|ex|px|pt|pc|in|cm|mm|q)$/.exec(value)
  return match ? { n: Number(match[1]), unit: match[2] } : undefined
}
// 5-decimal results (px rhythm floored): the expected value, rounded the same
// way, within one unit in the last place of either rounding.
function closeRounded(actual: number, expected: number, unit: string, floor: boolean) {
  // At most 5 decimals (whole pixels for floored px): v0.16's rounding.
  if (Math.abs(actual) < 1e21 && actual !== Number(actual.toFixed(floor && unit === "px" ? 0 : 5))) return false
  if (unit === "px")
    return floor
      ? actual >= Math.floor(expected - 1e-9 * Math.abs(expected) - 1e-12) &&
          actual <= Math.floor(expected + 1e-9 * Math.abs(expected) + 1e-12)
      : Math.abs(actual - Number(expected.toFixed(5))) <= 5.000001e-6 + 1e-9 * Math.abs(expected)
  return Math.abs(actual - expected) <= 5.000001e-6 + 1e-12 * Math.abs(expected)
}

oracleProperty<HelperHistory, HelperExpected>({
  id: "numerical-helper-units",
  owns: ["packages/typography/src/index.js", "packages/typography/src/utils/verticalRhythm.js", "packages/typography/src/utils/css.js"],
  law: {
    statement:
      "N7 rhythm(lines, fontSize, offset) is lines × the base line height − offset, and adjustFontSizeTo(size, lines, fromSize) gives size and a line height of the lines, in the rhythm unit, converted by CSS Values 4: rem of the base; em and % of the parent size; ex as 0.5em; absolute units exact; an em or ex line height of the element's own size; 5 decimals, px rhythm floored. N6: with lines auto, the line height is whole half lines and covers the font size.",
    authority:
      "compass-vertical-rhythm 1.4.5's API and fixtures (re-exported through v0.16) for the calls, rounding, and px floor; CSS Values 4 §5.1.1, §5.2, §6.1.1 for every conversion (engineer, 2026-11-12: spec is always the law; review L2, L3).",
    limits:
      "Base 1–64px, line height 0.5–3 unitless or 8–64px, lengths 4–64px, 0.25–4 rem/em/ex, 25–400%, 3–48pt, 0.1–2cm, every rhythm unit, lines and offsets within ±4 and ±8. Exact auto line counts (compass's minimum padding) are not modeled, only whole half lines that cover the size. N6 is not checked for px (floored).",
  },
  histories: {
    arbitrary: helperArbitrary,
    runs: 100,
    fixedSeeds: [64491],
    states: [
      "em adjust with a parent size",
      "percent with a parent size",
      "ex unit",
      "a relative base size",
      "explicit lines",
      "auto lines",
      "px rhythm",
      "rhythm with an offset",
      "padding exactly at the boundary",
      "whole lines",
      "a negative size",
      "unitless zero padding",
      "null lines",
      "lines for a font size",
      "lines for a negative size",
      "a negative context",
    ],
    constructed: [
      {
        name: "a negative fromSize (X3)",
        enters: ["a negative context", "auto lines"],
        build: (h) => ({ ...h, call: { kind: "adjust", size: { n: 20, unit: "px" }, lines: "auto", from: { n: -16, unit: "px" } } }),
      },
      {
        name: "lines for a negative size (W8)",
        enters: ["lines for a font size", "lines for a negative size"],
        build: (h) => ({ ...h, call: { kind: "lines", size: { n: -10, unit: "px" } } }),
      },
      {
        name: "a negative size (T3)",
        enters: ["a negative size", "auto lines"],
        build: (h) => ({
          ...h,
          call: { kind: "adjust", size: { n: -10, unit: "px" }, lines: "auto", from: undefined },
        }),
      },
      {
        name: "unitless zero padding (T2) with falsy rounding (T5)",
        enters: ["unitless zero padding", "auto lines", "whole lines"],
        build: () => ({
          base: 21,
          baseForm: "px",
          lineHeight: 4 / 3,
          unit: "rem",
          minLinePadding: "0",
          roundToNearestHalfLine: 0,
          call: { kind: "adjust", size: { n: 26, unit: "px" }, lines: "auto", from: undefined },
        }),
      },
      {
        name: "T6: a zero font size in em",
        enters: ["auto lines"],
        build: () => ({
          base: 16,
          baseForm: "px",
          lineHeight: 1.5,
          unit: "em",
          minLinePadding: undefined,
          roundToNearestHalfLine: undefined,
          call: { kind: "adjust", size: { n: 0, unit: "px" }, lines: "auto", from: undefined },
        }),
      },
      {
        name: "linesForFontSize",
        enters: ["lines for a font size"],
        build: (h) => ({ ...h, call: { kind: "lines", size: { n: 26, unit: "px" } } }),
      },
      {
        name: "explicit zero lines",
        enters: ["explicit lines"],
        build: (h) => ({ ...h, call: { kind: "adjust", size: { n: 20, unit: "px" }, lines: 0, from: undefined } }),
      },
      {
        name: "null lines (T8)",
        enters: ["null lines"],
        build: (h) => ({ ...h, call: { kind: "rhythm", lines: null, context: undefined, offset: undefined } }),
      },
      {
        // 20px in 24px lines leaves 4px = 2 × 2px: no extra half line.
        name: "padding exactly at the boundary",
        enters: ["padding exactly at the boundary", "auto lines"],
        build: () => ({
          base: 16,
          baseForm: "px",
          lineHeight: "24px",
          unit: "px",
          minLinePadding: 2,
          roundToNearestHalfLine: undefined,
          call: { kind: "adjust", size: { n: 20, unit: "px" }, lines: "auto", from: undefined },
        }),
      },
      {
        name: "whole lines with padding",
        enters: ["whole lines", "auto lines"],
        build: () => ({
          base: 16,
          baseForm: "px",
          lineHeight: 1.5,
          unit: undefined,
          minLinePadding: "3",
          roundToNearestHalfLine: false,
          call: { kind: "adjust", size: { n: 21, unit: "px" }, lines: "auto", from: undefined },
        }),
      },
      {
        name: "compass's fixture: 42px to 3 lines from 10.5px, in em (4em, 2em)",
        enters: ["em adjust with a parent size", "explicit lines"],
        build: () => ({
          base: 21,
          baseForm: "px",
          lineHeight: 4 / 3,
          unit: "em",
          minLinePadding: undefined,
          roundToNearestHalfLine: undefined,
          call: { kind: "adjust", size: { n: 42, unit: "px" }, lines: 3, from: { n: 10.5, unit: "px" } },
        }),
      },
      {
        name: "percent with a parent size",
        enters: ["percent with a parent size", "auto lines"],
        build: () => ({
          base: 16,
          baseForm: "px",
          lineHeight: 1.5,
          unit: undefined,
          minLinePadding: undefined,
          roundToNearestHalfLine: undefined,
          call: { kind: "adjust", size: { n: 200, unit: "%" }, lines: "auto", from: { n: 20, unit: "px" } },
        }),
      },
      {
        name: "an ex length throws (V7)",
        enters: ["ex unit", "rhythm with an offset"],
        build: () => ({
          base: 16,
          baseForm: "px",
          lineHeight: 1.5,
          unit: "em",
          minLinePadding: undefined,
          roundToNearestHalfLine: undefined,
          call: { kind: "rhythm", lines: 1, context: { n: 2, unit: "ex" }, offset: 2 },
        }),
      },
      {
        name: "a rem base size with em rhythm (V1)",
        enters: ["a relative base size"],
        build: () => ({
          base: 24,
          baseForm: "rem",
          lineHeight: 1.5,
          unit: "em",
          minLinePadding: undefined,
          roundToNearestHalfLine: undefined,
          call: { kind: "rhythm", lines: 1, context: undefined, offset: undefined },
        }),
      },
      {
        name: 'adjustFontSizeTo("100%") with a % base (V1)',
        enters: ["a relative base size"],
        build: () => ({
          base: 24,
          baseForm: "%",
          lineHeight: 1.5,
          unit: undefined,
          minLinePadding: undefined,
          roundToNearestHalfLine: undefined,
          call: { kind: "adjust", size: { n: 100, unit: "%" }, lines: "auto", from: undefined },
        }),
      },
      {
        name: "px rhythm floors",
        enters: ["px rhythm"],
        build: () => ({
          base: 24,
          baseForm: "px",
          lineHeight: 1.25,
          unit: "px",
          minLinePadding: undefined,
          roundToNearestHalfLine: undefined,
          call: { kind: "rhythm", lines: 0.25, context: undefined, offset: undefined },
        }),
      },
    ],
    fixed: [
      { name: "T4: a px font size converted from em", history: { base: 17, baseForm: "px", lineHeight: 1.45, unit: "px", minLinePadding: undefined, roundToNearestHalfLine: undefined, call: { kind: "adjust", size: { n: 1.1, unit: "em" }, lines: "auto", from: undefined } } },
      { name: "T5: falsy rounding gives whole lines", history: { base: 21, baseForm: "px", lineHeight: 4 / 3, unit: "rem", minLinePadding: undefined, roundToNearestHalfLine: 0, call: { kind: "adjust", size: { n: 26, unit: "px" }, lines: "auto", from: undefined } } },
      { name: "T2: a unitless zero padding", history: { base: 21, baseForm: "px", lineHeight: 4 / 3, unit: "rem", minLinePadding: 0, roundToNearestHalfLine: undefined, call: { kind: "adjust", size: { n: 26, unit: "px" }, lines: "auto", from: undefined } } },
      { name: "T8: rhythm(null)", history: { base: 16, baseForm: "px", lineHeight: 1.45, unit: undefined, minLinePadding: undefined, roundToNearestHalfLine: undefined, call: { kind: "rhythm", lines: null, context: undefined, offset: undefined } } },
      // compass-vertical-rhythm's fixtures, as N7 reads them.
      {
        name: "compass: rem rhythm 21px × 4/3",
        history: { base: 21, baseForm: "px", lineHeight: 4 / 3, unit: "rem", minLinePadding: undefined, roundToNearestHalfLine: undefined, call: { kind: "rhythm", lines: 0.5, context: undefined, offset: undefined } },
      },
      {
        name: "compass: em rhythm 24px × 1.25",
        history: { base: 24, baseForm: "px", lineHeight: 1.25, unit: "em", minLinePadding: undefined, roundToNearestHalfLine: undefined, call: { kind: "rhythm", lines: 0.25, context: undefined, offset: undefined } },
      },
      {
        name: "compass: px line height 30px",
        history: { base: 24, baseForm: "px", lineHeight: "30px", unit: "px", minLinePadding: undefined, roundToNearestHalfLine: undefined, call: { kind: "rhythm", lines: 0.25, context: undefined, offset: undefined } },
      },
      {
        name: "compass: 3em adjusted to 3 lines",
        history: { base: 21, baseForm: "px", lineHeight: 4 / 3, unit: "rem", minLinePadding: undefined, roundToNearestHalfLine: undefined, call: { kind: "adjust", size: { n: 3, unit: "em" }, lines: 3, from: undefined } },
      },
      {
        name: "compass: 200%",
        history: { base: 21, baseForm: "px", lineHeight: 4 / 3, unit: "rem", minLinePadding: undefined, roundToNearestHalfLine: undefined, call: { kind: "adjust", size: { n: 200, unit: "%" }, lines: "auto", from: undefined } },
      },
    ],
  },
  model: expectedHelper,
  reached: (plan) => {
    const states: string[] = []
    const call = plan.call
    if (((call.kind === "rhythm" ? call.context : call.kind === "adjust" ? call.from : undefined)?.n ?? 0) < 0) states.push("a negative context")
    if (call.kind === "lines") {
      states.push("lines for a font size")
      if (call.size.n < 0) states.push("lines for a negative size")
    } else if (call.kind === "adjust") {
      if (call.from !== undefined && plan.unit === "em") states.push("em adjust with a parent size")
      if (call.from !== undefined && call.size.unit === "%") states.push("percent with a parent size")
      states.push(typeof call.lines === "number" ? "explicit lines" : "auto lines")
      if (call.size.n < 0) states.push("a negative size")
      if (typeof call.lines !== "number") {
        const linePx =
          typeof plan.lineHeight === "string" ? Number(plan.lineHeight.slice(0, -2)) : plan.base * plan.lineHeight
        const parent = call.from === undefined ? plan.base : NaN
        const sizePx = call.size.unit === "px" ? call.size.n : call.size.unit === "%" ? (call.size.n / 100) * parent : NaN
        const half = plan.roundToNearestHalfLine === undefined || !!plan.roundToNearestHalfLine
        if (plan.roundToNearestHalfLine !== undefined && !plan.roundToNearestHalfLine) states.push("whole lines")
        const step = half ? 0.5 : 1
        const lines = Math.ceil(sizePx / linePx / step) * step
        if (lines * linePx - sizePx === 2 * parseFloat(String(plan.minLinePadding ?? 2))) states.push("padding exactly at the boundary")
      }
    } else {
      if (call.lines === null) states.push("null lines")
      if (call.offset !== undefined && call.offset !== 0) states.push("rhythm with an offset")
      if (plan.unit === "px") states.push("px rhythm")
    }
    if (plan.minLinePadding === 0 || plan.minLinePadding === "0") states.push("unitless zero padding")
    if ((call.kind === "rhythm" ? call.context?.unit : call.size.unit) === "ex") states.push("ex unit")
    if (plan.baseForm !== "px" && plan.baseForm !== "number") states.push("a relative base size")
    return states
  },
  driver(plan, observe) {
    try {
      const t = typography({
        baseFontSize: baseOption(plan.base, plan.baseForm),
        baseLineHeight: plan.lineHeight,
        ...(plan.unit === undefined ? {} : { rhythmUnit: plan.unit }),
        ...(plan.minLinePadding === undefined
          ? {}
          : { minLinePadding: plan.minLinePadding }),
        ...(plan.roundToNearestHalfLine === undefined
          ? {}
          : { roundToNearestHalfLine: plan.roundToNearestHalfLine }),
      })
      const call = plan.call
      observe(
        "result",
        call.kind === "lines"
          ? { lines: t.linesForFontSize(lengthOf(call.size, plan)) }
          : call.kind === "rhythm"
          ? {
              lineHeight: t.rhythm(
                call.lines,
                call.context === undefined ? undefined : lengthOf(call.context, plan),
                call.offset
              ),
            }
          : t.adjustFontSizeTo(
              lengthOf(call.size, plan),
              call.lines,
              call.from === undefined ? undefined : lengthOf(call.from, plan)
            )
      )
    } catch (error) {
      observe("production error", error)
    }
  },
  check(plan, trace, expected) {
    const error = observation(trace, "production error")
    if (expected.throws)
      return !error
        ? violation("result", "an invalid length was accepted", "N4 valid numerical CSS", {
            actual: observation(trace, "result")?.value,
          })
        : error.value instanceof Error &&
          error.value.message.includes(
            plan.call.kind === "lines" ? "linesForFontSize" : plan.call.kind === "rhythm" ? "rhythm" : "adjustFontSizeTo"
          )
        ? pass
        : violation("production error", "the error does not name the call", "N4 reject invalid numeric input", {
            actual: error.value,
          })
    if (expected.lines !== undefined)
      return error
        ? violation("production error", "a helper call threw", "no throw on valid input", { actual: error.value })
        : differs("result", "N7 helper units", (observation(trace, "result")?.value as { lines: unknown })?.lines, expected.lines) ?? pass
    if (error)
      return violation("production error", "a helper call threw", "no throw on valid input", {
        actual: error.value,
      })
    const result = observation(trace, "result")?.value as
      | { fontSize?: unknown; lineHeight?: unknown }
      | undefined
    for (const [name, owed, floor] of [
      ["fontSize", expected.fontSize, false],
      ["lineHeight", expected.lineHeight, true],
    ] as const) {
      if (owed === undefined) continue
      const got = readLength(result?.[name])
      if (!got || got.unit !== owed.unit)
        return violation("result", `the ${name} is not a length in the unit N7 owes`, "N7 helper units", {
          actual: result?.[name],
          expected: owed.unit,
        })
      // lines "auto": N6, production's line height, read in px, covers the
      // font size. px is floored, so it is not checked there.
      const sizePx = expected.coverPx
      if (name === "lineHeight" && sizePx !== undefined && got.unit !== "px") {
        const px =
          got.n *
          (got.unit === "rem"
            ? plan.base
            : got.unit === "em"
            ? sizePx
            : got.unit === "ex"
            ? 0.5 * sizePx
            : ABSOLUTE[got.unit])
        if (px < sizePx - 1e-5 * Math.max(plan.base, sizePx, ABSOLUTE[got.unit] ?? 0))
          return violation("result", "line height is below its font size", "N6 helper line height covers its font size", {
            actual: px,
            expected: `at least ${sizePx}`,
          })
      }
      if (!closeRounded(got.n, owed.n, got.unit, floor))
        return violation("result", `the ${name} differs from N7`, "N7 helper units", {
          actual: got.n,
          expected: owed.n,
        })
    }
    return pass
  },
  calibrations: [
    {
      name: "compass's adjusted em line height, relative to fromSize",
      law: "N7 helper units",
      corrupt: (trace, plan) => {
        const call = plan.call
        if (call.kind !== "adjust" || plan.unit !== "em" || typeof call.lines !== "number") return undefined
        const value = observation(trace, "result")?.value as { fontSize: string; lineHeight: string }
        const size = readLength(value?.fontSize)
        const line = readLength(value?.lineHeight)
        if (!size || !line || Math.abs(size.n - 1) < 0.01 || Math.abs(line.n) < 0.01) return undefined
        return trace.map((o) =>
          o.checkpoint === "result" ? { ...o, value: { ...value, lineHeight: `${line.n * size.n}em` } } : o
        )
      },
    },
    {
      name: "a length in the wrong unit",
      law: "N7 helper units",
      corrupt: (trace, plan) =>
        (plan.unit ?? "rem") === "px" ||
        !/(rem|em|ex)$/.test(String((observation(trace, "result")?.value as { lineHeight?: unknown })?.lineHeight))
          ? undefined
          : trace.map((o) =>
              o.checkpoint === "result"
                ? {
                    ...o,
                    value: {
                      ...(o.value as object),
                      lineHeight: String((o.value as { lineHeight: string }).lineHeight).replace(/(rem|em|ex)$/, "px"),
                    },
                  }
                : o
            ),
    },
    {
      name: "an auto line height below its font size",
      law: "N6 helper line height covers its font size",
      corrupt: (trace, plan) =>
        plan.call.kind !== "adjust" || typeof plan.call.lines === "number" || (plan.unit ?? "rem") === "px"
          ? undefined
          : trace.map((o) =>
              o.checkpoint === "result"
                ? { ...o, value: { ...(o.value as object), lineHeight: `0${plan.unit ?? "rem"}` } }
                : o
            ),
    },
  ],
})

// N5 for math functions: headerLineHeight may be any CSS Values 4 math
// function that line-height accepts, written as given. CSS reads it by a
// grammar (§10): operands (numbers, dimensions, constants, var(), nested
// functions) and operators, with "+" and "-" between white space (a comment
// is not white space, and is otherwise nothing); each function takes the
// arguments CSS gives it; "*" and "/" multiply and divide types, and the
// other operators and functions need matching types; and line-height takes a
// number, a length, or a percentage (CSS Inline 3). A function this grammar
// does not know is the browser's to judge, as a var() is. Anything else is
// invalid CSS, so typography() throws (N4, Q2).
// The model types a generated expression tree by those rules. It does not
// read production's text.
type MathHistory = { call: MathCall }
oracleProperty<MathHistory, { written: string } | { throws: true }>({
  id: "numerical-heading-line-height-math",
  owns: ["packages/typography/src/index.js", "packages/typography/src/utils/css.js"],
  law: {
    statement:
      "N5 a headerLineHeight that is a CSS Values 4 math function of a type line-height accepts (number, length, percentage), or that holds a var() reference or a function the grammar does not know, is written to h1–h6 as given; N4 any other math text makes typography() throw an error naming headerLineHeight.",
    authority:
      "CSS Values 4 Editor's Draft 24 Aug 2026 §10 (math functions, their arguments, white space around + and -, typed arithmetic); CSS Syntax 3 (comments); CSS Inline 3 line-height; engineer decisions 2026-11-12 (no breaking changes; full math grammar; N4; review W6: keep the grammar, update it to the draft, and let the browser judge unknown functions).",
    limits:
      "Trees of depth about 3 with up to 4 arguments; units px, em, %, deg, and s (angle and time are math types that line-height does not take as a result); a value with a var() reference or an unknown function is checked only by the browser. Comments are generated beside operators and inside parentheses only. Rounding strategy up only. Frequency, resolution, and flex are not generated. The unknown function generated is sibling-index(). Calibrated against Chrome 157 CSS.supports (probe math-vs-chrome).",
  },
  histories: {
    arbitrary: fc.record({ call: mathTree.call }),
    runs: 200,
    fixedSeeds: [64491],
    states: [
      "valid",
      "invalid",
      "a type line-height rejects",
      "types that do not combine",
      "+ or - without white space",
      "an unknown function",
      "a rounding strategy",
      "a var() inside",
      "a group",
      "two operands side by side",
      "padded parentheses",
      "a comment",
    ],
    constructed: [
      { name: "a length plus an angle", enters: ["invalid", "types that do not combine"], build: () => ({ call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "op", op: "+", space: "both", left: { kind: "num", n: 1, unit: "px" }, right: { kind: "num", n: 3, unit: "deg" } }] } }) },
      { name: "1+1 without white space", enters: ["invalid", "+ or - without white space"], build: () => ({ call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "op", op: "+", space: "none", left: { kind: "num", n: 1, unit: "" }, right: { kind: "num", n: 1, unit: "" } }] } }) },
      { name: "an unknown function", enters: ["valid", "an unknown function"], build: () => ({ call: { kind: "fn", name: "sibling-index", strategy: undefined, pad: false, args: [{ kind: "num", n: 1, unit: "" }] } }) },
      { name: "a comment beside an operator", enters: ["valid", "a comment"], build: () => ({ call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "op", op: "*", space: "comment-tight", left: { kind: "num", n: 1.2, unit: "" }, right: { kind: "num", n: 1, unit: "" } }] } }) },
      { name: "a length over a length", enters: ["valid"], build: () => ({ call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "op", op: "/", space: "both", left: { kind: "num", n: 2.4, unit: "px" }, right: { kind: "num", n: 1, unit: "px" } }] } }) },
      { name: "round(up, …) with a var()", enters: ["valid", "a rounding strategy", "a var() inside"], build: () => ({ call: { kind: "fn", name: "round", strategy: "up", pad: false, args: [{ kind: "var" }, { kind: "num", n: 0.25, unit: "" }] } }) },
      { name: "a grouped length-percentage", enters: ["valid", "a group"], build: () => ({ call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "op", op: "*", space: "none", left: { kind: "group", pad: false, inner: { kind: "op", op: "+", space: "both", left: { kind: "num", n: 1, unit: "em" }, right: { kind: "num", n: 4, unit: "%" } } }, right: { kind: "num", n: 1.1, unit: "" } }] } }) },
      { name: "1 2 side by side", enters: ["invalid", "two operands side by side"], build: () => ({ call: { kind: "fn", name: "min", strategy: undefined, pad: false, args: [{ kind: "op", op: "", space: "both", left: { kind: "num", n: 1, unit: "" }, right: { kind: "num", n: 2, unit: "" } }] } }) },
      { name: "padded min()", enters: ["valid", "padded parentheses", "a group"], build: () => ({ call: { kind: "fn", name: "min", strategy: undefined, pad: true, args: [{ kind: "num", n: 1, unit: "px" }, { kind: "group", pad: true, inner: { kind: "num", n: 2, unit: "px" } }] } }) },
      { name: "an angle result", enters: ["invalid", "a type line-height rejects"], build: () => ({ call: { kind: "fn", name: "atan", strategy: undefined, pad: false, args: [{ kind: "num", n: 1, unit: "" }] } }) },
    ],
    fixed: [
      ...mathWitnesses().map(({ name, call }) => ({ name, history: { call } })),
      // Each type rule, and the var() reference rule, at its edge.
      { name: "sin() of an angle", history: { call: { kind: "fn", name: "sin", strategy: undefined, pad: false, args: [{ kind: "num", n: 3, unit: "deg" }] } } },
      { name: "sin() of a length", history: { call: { kind: "fn", name: "sin", strategy: undefined, pad: false, args: [{ kind: "num", n: 1, unit: "px" }] } } },
      { name: "a length times a length", history: { call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "op", op: "*", space: "both", left: { kind: "num", n: 1, unit: "px" }, right: { kind: "num", n: 2, unit: "px" } }] } } },
      { name: "a number over a length", history: { call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "op", op: "/", space: "both", left: { kind: "num", n: 1, unit: "" }, right: { kind: "num", n: 2, unit: "px" } }] } } },
      { name: "a length over a number", history: { call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "op", op: "/", space: "both", left: { kind: "num", n: 1, unit: "px" }, right: { kind: "num", n: 2, unit: "" } }] } } },
      { name: "an em plus a percentage", history: { call: { kind: "fn", name: "min", strategy: undefined, pad: false, args: [{ kind: "op", op: "+", space: "both", left: { kind: "num", n: 1, unit: "em" }, right: { kind: "num", n: 4, unit: "%" } }, { kind: "num", n: 2, unit: "px" }] } } },
      { name: "a number plus a length", history: { call: { kind: "fn", name: "max", strategy: undefined, pad: false, args: [{ kind: "num", n: 1, unit: "" }, { kind: "num", n: 2, unit: "px" }] } } },
      { name: "a strategy on a function other than round()", history: { call: { kind: "fn", name: "max", strategy: "up", pad: false, args: [{ kind: "num", n: 1, unit: "" }] } } },
      { name: "round(up) with no value", history: { call: { kind: "fn", name: "round", strategy: "up", pad: false, args: [] } } },
      { name: "pi-var( is one function token, named pi-var", history: { call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "op", op: "-", space: "none", left: { kind: "const", name: "pi" }, right: { kind: "var" } }] } } },
      { name: "pi -var( is pi beside a function named -var", history: { call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "op", op: "-", space: "left", left: { kind: "const", name: "pi" }, right: { kind: "var" } }] } } },
      { name: "e-sin( is one function token, named e-sin", history: { call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "op", op: "-", space: "none", left: { kind: "const", name: "e" }, right: { kind: "fn", name: "sin", strategy: undefined, pad: false, args: [{ kind: "num", n: 1, unit: "" }] } }] } } },
      { name: "a var() inside an unknown function", history: { call: { kind: "fn", name: "sibling-index", strategy: undefined, pad: false, args: [{ kind: "var" }] } } },
      { name: "cos() of an angle", history: { call: { kind: "fn", name: "cos", strategy: undefined, pad: false, args: [{ kind: "num", n: 3, unit: "deg" }] } } },
      { name: "tan() of an angle", history: { call: { kind: "fn", name: "tan", strategy: undefined, pad: false, args: [{ kind: "num", n: 3, unit: "deg" }] } } },
      { name: "sin(atan2()) of mixed types", history: { call: { kind: "fn", name: "sin", strategy: undefined, pad: false, args: [{ kind: "fn", name: "atan2", strategy: undefined, pad: false, args: [{ kind: "num", n: 1, unit: "px" }, { kind: "num", n: 3, unit: "deg" }] }] } } },
      { name: "sign() of a mismatch", history: { call: { kind: "fn", name: "sign", strategy: undefined, pad: false, args: [{ kind: "op", op: "+", space: "both", left: { kind: "num", n: 1, unit: "px" }, right: { kind: "num", n: 3, unit: "deg" } }] } } },
      { name: "a number times a length", history: { call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "op", op: "*", space: "both", left: { kind: "num", n: 2, unit: "" }, right: { kind: "num", n: 1, unit: "px" } }] } } },
      { name: "padded round(up , …)", history: { call: { kind: "fn", name: "round", strategy: "up", pad: true, args: [{ kind: "num", n: 1.27, unit: "" }, { kind: "num", n: 0.1, unit: "" }] } } },
      { name: "round(up 1) without its comma", history: { call: { kind: "fn", name: "round", strategy: "up-no-comma", pad: false, args: [{ kind: "num", n: 1, unit: "" }] } } },
      { name: "1 +1 spaced on one side", history: { call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "op", op: "+", space: "left", left: { kind: "num", n: 1, unit: "" }, right: { kind: "num", n: 1, unit: "" } }] } } },
      { name: "a bare var word beside a reference", history: { call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "op", op: "+", space: "both", left: { kind: "var" }, right: { kind: "const", name: "var" } }] } } },
      { name: "a bare var word alone", history: { call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "const", name: "var" }] } } },
      { name: "sign() of a time", history: { call: { kind: "fn", name: "sign", strategy: undefined, pad: false, args: [{ kind: "num", n: 3, unit: "s" }] } } },
      { name: "1+ 1 spaced on the right", history: { call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "op", op: "+", space: "right", left: { kind: "num", n: 1, unit: "" }, right: { kind: "num", n: 1, unit: "" } }] } } },
      { name: "-infinity", history: { call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "const", name: "-infinity" }] } } },
      { name: "V4: calc() with nothing", history: { call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [] } } },
      // Review W3: types multiply and divide (CSS Values 4 ED §10.9).
      { name: "a length squared over a length", history: { call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "op", op: "/", space: "both", left: { kind: "op", op: "*", space: "both", left: { kind: "num", n: 2, unit: "px" }, right: { kind: "num", n: 1, unit: "em" } }, right: { kind: "num", n: 1, unit: "px" } }] } } },
      { name: "abs() of a length squared", history: { call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "op", op: "/", space: "both", left: { kind: "fn", name: "abs", strategy: undefined, pad: false, args: [{ kind: "op", op: "*", space: "both", left: { kind: "num", n: 1, unit: "px" }, right: { kind: "num", n: 1, unit: "px" } }] }, right: { kind: "num", n: 1, unit: "px" } }] } } },
      { name: "sign() of a length squared", history: { call: { kind: "fn", name: "sign", strategy: undefined, pad: false, args: [{ kind: "op", op: "*", space: "both", left: { kind: "num", n: 1, unit: "px" }, right: { kind: "num", n: 1, unit: "px" } }] } } },
      { name: "a length over a length squared", history: { call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "op", op: "/", space: "both", left: { kind: "num", n: 2, unit: "px" }, right: { kind: "op", op: "*", space: "both", left: { kind: "num", n: 1, unit: "px" }, right: { kind: "num", n: 1, unit: "px" } } }] } } },
      { name: "an angle over an angle in sqrt()", history: { call: { kind: "fn", name: "sqrt", strategy: undefined, pad: false, args: [{ kind: "op", op: "/", space: "both", left: { kind: "num", n: 3, unit: "deg" }, right: { kind: "num", n: 1, unit: "deg" } }] } } },
      { name: "sqrt() of a length", history: { call: { kind: "fn", name: "sqrt", strategy: undefined, pad: false, args: [{ kind: "num", n: 1, unit: "px" }] } } },
      { name: "round() of a length with no step", history: { call: { kind: "fn", name: "round", strategy: undefined, pad: false, args: [{ kind: "num", n: 1, unit: "px" }] } } },
      { name: "a comment between padded arguments", history: { call: { kind: "fn", name: "min", strategy: undefined, pad: "comment", args: [{ kind: "num", n: 1, unit: "px" }, { kind: "num", n: 2, unit: "" }] } } },
      { name: "1 /**/ + /**/ 1", history: { call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "op", op: "+", space: "comment", left: { kind: "num", n: 1, unit: "" }, right: { kind: "num", n: 1, unit: "" } }] } } },
      { name: "1/**/+/**/1", history: { call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "op", op: "+", space: "comment-tight", left: { kind: "num", n: 1, unit: "" }, right: { kind: "num", n: 1, unit: "" } }] } } },
      // Gap check (review round 6): an unknown function in typed arithmetic,
      // two operands in a group, and "+" with white space on its left only
      // before a group and before a constant.
      { name: "an unknown function times a length", history: { call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "op", op: "*", space: "both", left: { kind: "fn", name: "sibling-index", strategy: undefined, pad: false, args: [] }, right: { kind: "num", n: 1, unit: "px" } }] } } },
      { name: "a length over an unknown function", history: { call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "op", op: "/", space: "both", left: { kind: "num", n: 2, unit: "px" }, right: { kind: "fn", name: "sibling-index", strategy: undefined, pad: false, args: [] } }] } } },
      { name: "two operands in a group", history: { call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "group", pad: false, inner: { kind: "op", op: "", space: "both", left: { kind: "num", n: 1, unit: "" }, right: { kind: "num", n: 2, unit: "" } } }] } } },
      { name: "1 +(2)", history: { call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "op", op: "+", space: "left", left: { kind: "num", n: 1, unit: "" }, right: { kind: "group", pad: false, inner: { kind: "num", n: 2, unit: "" } } }] } } },
      { name: "1 +pi", history: { call: { kind: "fn", name: "calc", strategy: undefined, pad: false, args: [{ kind: "op", op: "+", space: "left", left: { kind: "num", n: 1, unit: "" }, right: { kind: "const", name: "pi" } }] } } },
      { name: "V3: round(1.25, 0.25)", history: { call: { kind: "fn", name: "round", strategy: undefined, pad: false, args: [{ kind: "num", n: 1.25, unit: "" }, { kind: "num", n: 0.25, unit: "" }] } } },
    ],
  },
  model: (plan) => (mathAccepted(plan.call) ? { written: mathText(plan.call) } : { throws: true }),
  reached: (plan) => {
    const type = mathTypeOf(plan.call)
    const states = [...mathFeatures(plan.call)].filter((s) => s !== "a math function")
    states.push(mathAccepted(plan.call) ? "valid" : "invalid")
    if (type !== undefined && !lineHeightAccepts(type)) states.push("a type line-height rejects")
    if (hasMismatch(plan.call)) states.push("types that do not combine")
    return states
  },
  driver(plan, observe) {
    try {
      const t = typography({ headerLineHeight: mathText(plan.call) })
      observe(
        "headings",
        [1, 2, 3, 4, 5, 6].map((n) => ((t.toJSON() as Styles)[`h${n}`] as { lineHeight?: unknown }).lineHeight)
      )
    } catch (error) {
      observe("production error", error)
    }
  },
  check(_plan, trace, expected) {
    const error = observation(trace, "production error")
    if ("throws" in expected)
      return error
        ? error.value instanceof Error && error.value.message.includes("headerLineHeight")
          ? pass
          : violation("production error", "the error does not name headerLineHeight", "N4 reject invalid numeric input", { actual: error.value })
        : violation("headings", "an invalid math function was written", "N4 valid numerical CSS", { actual: observation(trace, "headings")?.value })
    if (error) return violation("production error", "a valid math function threw", "no throw on valid input", { actual: error.value })
    return differs("headings", "N5 independent heading line height", observation(trace, "headings")?.value, Array(6).fill(expected.written)) ?? pass
  },
  calibrations: [
    {
      name: "an invalid math function written as given",
      law: "N4 valid numerical CSS",
      corrupt: (trace, plan) =>
        mathAccepted(plan.call)
          ? undefined
          : [{ checkpoint: "headings", value: Array(6).fill(mathText(plan.call)) }],
    },
    {
      name: "a valid math function rejected",
      law: "no throw on valid input",
      corrupt: (trace, plan) =>
        mathAccepted(plan.call)
          ? [{ checkpoint: "production error", value: new RangeError("Invalid CSS line-height for headerLineHeight") }]
          : undefined,
    },
  ],
})
