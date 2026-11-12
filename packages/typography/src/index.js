// @flow
import objectAssign from "object-assign"

import createStyles from "./utils/createStyles"
import compileStyles from "./utils/compileStyles"
import { checkFontStacks } from "./utils/fontFamily"
import type { OptionsType } from "Types"

const checkNumber = (name: string, value: any, positive: boolean = false) => {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    (positive && value <= 0)
  ) {
    throw new RangeError(`Invalid numerical value for ${name}`)
  }
  return value
}

// A CSS length's number (exponent allowed, CSS Syntax 3) and its unit.
const parseLength = (name: string, value: any) => {
  const match =
    typeof value === "string" &&
    /^([+-]?(?:\d*\.\d+|\d+)(?:e[+-]?\d+)?)([a-z%]*)$/i.exec(value)
  if (!match) throw new RangeError(`Invalid CSS length for ${name}`)
  return [Number(match[1]), match[2].toLowerCase()]
}

// CSS Values 4 5.2: absolute lengths in px.
const absolutePx = {
  px: 1,
  in: 96,
  pt: 96 / 72,
  pc: 16,
  cm: 96 / 2.54,
  mm: 96 / 25.4,
  q: 96 / 101.6,
}

// A positive finite pixel length, such as "16px".
const pixelLength = (name: string, value: any) => {
  const [number, unit] = parseLength(name, value)
  if (unit !== "px") throw new RangeError(`Invalid CSS length for ${name}`)
  return checkNumber(name, number, true)
}

// modularscale's named ratios, which `scaleRatio` accepted through v0.16.
const namedRatios = {
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
const ratioOf = (ratio: any) =>
  typeof ratio === "string" &&
  Object.prototype.hasOwnProperty.call(namedRatios, ratio)
    ? namedRatios[ratio]
    : ratio

const typography = function (opts: OptionsType) {
  const defaults: OptionsType = {
    baseFontSize: "16px",
    baseLineHeight: 1.45,
    headerLineHeight: 1.1,
    scaleRatio: 2,
    googleFonts: [],
    headerFontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Roboto",
      "Oxygen",
      "Ubuntu",
      "Cantarell",
      "Fira Sans",
      "Droid Sans",
      "Helvetica Neue",
      "sans-serif",
    ],
    bodyFontFamily: ["georgia", "serif"],
    headerColor: "inherit",
    bodyColor: "hsla(0,0%,0%,0.8)",
    headerWeight: "bold",
    bodyWeight: "normal",
    boldWeight: "bold",
    includeNormalize: true,
    blockMarginBottom: 1,
  }

  // An option set to undefined is omitted: it takes the default (engineer
  // decision 2026-11-12).
  const given = {}
  Object.keys(opts || {}).forEach(key => {
    if (opts[key] !== undefined) given[key] = opts[key]
  })
  const options = objectAssign({}, defaults, given)
  const baseFont = pixelLength("baseFontSize", options.baseFontSize)
  const scaleRatio = checkNumber("scaleRatio", ratioOf(options.scaleRatio), true)
  // A unitless multiple of the base, or a pixel length (accepted through v0.16).
  // The product must be usable too: 16 × 1e308 is not.
  const lineHeightPx = checkNumber(
    "baseLineHeight",
    typeof options.baseLineHeight === "string"
      ? pixelLength("baseLineHeight", options.baseLineHeight)
      : baseFont * checkNumber("baseLineHeight", options.baseLineHeight),
    true
  )
  checkNumber("headerLineHeight", options.headerLineHeight, true)
  checkFontStacks(options)

  // The vertical rhythm helpers (compass-vertical-rhythm 1.4.5's API, inlined).
  // Lengths convert by CSS Values 4: rem is the base; em and % are the parent
  // size; ex is 0.5em (6.1.1, the x-height fallback); absolute units are exact.
  const pxPer = (unit: string, parent: number) =>
    unit === "rem"
      ? baseFont
      : unit === "em"
      ? parent
      : unit === "%"
      ? parent / 100
      : unit === "ex"
      ? parent / 2
      : absolutePx[unit]
  const rhythmUnit =
    options.rhythmUnit === undefined ? "rem" : String(options.rhythmUnit).toLowerCase()
  if (rhythmUnit === "%" || pxPer(rhythmUnit, 1) === undefined) {
    throw new RangeError("Invalid CSS unit for rhythmUnit")
  }
  const toPixels = (name: string, length: any, parent: number) => {
    const [number, unit] = parseLength(name, length)
    const factor = pxPer(unit, parent)
    if (factor === undefined) throw new RangeError(`Invalid CSS length for ${name}`)
    return checkNumber(name, number * factor)
  }
  // px in the rhythm unit, relative to a font size, to 5 decimals. Rhythm in
  // px is floored (whole pixels, as compass-vertical-rhythm wrote it).
  const inUnit = (name: string, px: number, fontSize: number, floor: boolean) => {
    if (rhythmUnit === "px") return `${floor ? Math.floor(px) : px}px`
    const factor = pxPer(rhythmUnit, fontSize)
    const value = parseFloat((px / factor).toFixed(5))
    // Rounding can cross the representability limit.
    checkNumber(name, value * factor)
    return `${value}${rhythmUnit}`
  }
  const vr = {}

  // The lines a font size needs: whole lines, or half lines by default, with
  // at least minLinePadding (default 2px) above and below the text.
  vr.linesForFontSize = (fontSize: any) => {
    const px = toPixels("linesForFontSize font size", fontSize, baseFont)
    const padding = toPixels(
      "minLinePadding",
      options.minLinePadding == null ? "2px" : options.minLinePadding,
      baseFont
    )
    const step = options.roundToNearestHalfLine === false ? 1 : 0.5
    const lines = Math.ceil(px / lineHeightPx / step) * step
    return lines * lineHeightPx - px < 2 * padding ? lines + step : lines
  }
  vr.establishBaseline = () => ({
    fontSize: `${(baseFont / 16) * 100}%`,
    // As given: a unitless line height stays unitless.
    lineHeight: String(options.baseLineHeight),
  })
  vr.rhythm = (lines: number = 1, fontSize: any, offset: any) => {
    checkNumber("rhythm lines", lines)
    const context = toPixels(
      "rhythm font size",
      fontSize == null ? options.baseFontSize : fontSize,
      baseFont
    )
    const px = lineHeightPx * lines - (offset == null ? 0 : offset)
    return inUnit("rhythm result", checkNumber("rhythm result", px), context, true)
  }
  vr.adjustFontSizeTo = (fontSize: any, lines: any, fromSize: any) => {
    const parent = toPixels(
      "adjustFontSizeTo fromSize",
      fromSize == null ? options.baseFontSize : fromSize,
      baseFont
    )
    const px = toPixels("adjustFontSizeTo font size", fontSize, parent)
    return {
      fontSize: inUnit("adjustFontSizeTo font size", px, parent, false),
      // Relative to the element's own, new font size.
      lineHeight: vr.rhythm(
        lines == null || lines === "auto" ? vr.linesForFontSize(`${px}px`) : lines,
        `${px}px`
      ),
    }
  }

  // Add this function to the vertical rhythm object so it'll be passed around
  // as well and be available. Not related really but this is the easiest
  // way to pass around extra utility functions atm... :-\
  vr.scale = (value: number = 0) => {
    // This doesn't pick the right scale ratio if a theme has more than one ratio.
    // Perhaps add optional parameter for a width and it'll get the ratio
    // for this width. Tricky part is maxWidth could be set in non-pixels.
    checkNumber("scale position", value)
    const size = checkNumber(
      "scale result",
      Math.pow(scaleRatio, value) * baseFont
    )
    return vr.adjustFontSizeTo(`${size}px`)
  }

  return {
    options,
    ...vr,
    createStyles() {
      return this.toString()
    }, // TODO remove in next breaking release.
    toJSON() {
      return createStyles(vr, options)
    },
    toString() {
      return compileStyles(vr, options, this.toJSON())
    },
    injectStyles() {
      if (typeof document !== "undefined") {
        // Replace existing
        if (document.getElementById("typography.js")) {
          const styleNode = document.getElementById("typography.js")
          styleNode.innerHTML = this.toString()
        } else {
          const node = document.createElement("style")
          node.id = "typography.js"
          node.innerHTML = this.toString()
          const head = document.head
          if (head.firstChild) {
            head.insertBefore(node, head.firstChild)
          } else {
            head.appendChild(node)
          }
        }
      }
    },
  }
}

export default typography
