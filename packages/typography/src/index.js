// @flow
import objectAssign from "object-assign"
import verticalRhythm from "compass-vertical-rhythm"

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

const checkLength = (name: string, value: any) => {
  if (
    typeof value !== "string" ||
    !/^[+-]?(?:\d*\.\d+|\d+)(?:e[+-]?\d+)?(?:px|rem|em|ex|%|in|cm|mm|q|pt|pc)$/i.test(
      value
    )
  ) {
    throw new RangeError(`Invalid CSS length for ${name}`)
  }
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

  const options = objectAssign({}, defaults, opts)
  if (
    typeof options.baseFontSize !== "string" ||
    !/^[+]?(?:\d*\.\d+|\d+)(?:e[+-]?\d+)?px$/i.test(options.baseFontSize)
  ) {
    throw new TypeError("baseFontSize must be a positive finite pixel length")
  }
  const baseFont = checkNumber(
    "baseFontSize",
    parseFloat(options.baseFontSize),
    true
  )
  const scaleRatio = checkNumber("scaleRatio", ratioOf(options.scaleRatio), true)
  // A unitless multiple of the base, or a pixel length (accepted through v0.16).
  const lineHeightPx =
    typeof options.baseLineHeight === "string" &&
    /^[+]?(?:\d*\.\d+|\d+)(?:e[+-]?\d+)?px$/i.test(options.baseLineHeight)
      ? checkNumber(
          "baseLineHeight",
          parseFloat(options.baseLineHeight),
          true
        )
      : baseFont * checkNumber("baseLineHeight", options.baseLineHeight, true)
  checkNumber("headerLineHeight", options.headerLineHeight, true)
  checkFontStacks(options)

  // compass-vertical-rhythm gets the line height in pixels: it reads a
  // unitless 1e-7 as a length with the unit "e-7". html still carries the
  // line height as given, so a unitless one stays unitless.
  const vr = verticalRhythm(
    objectAssign({}, options, { baseLineHeight: `${lineHeightPx}px` })
  )
  const establishBaseline = vr.establishBaseline
  vr.establishBaseline = () =>
    objectAssign(establishBaseline(), {
      lineHeight: String(options.baseLineHeight),
    })
  const remRhythm =
    options.rhythmUnit === undefined || options.rhythmUnit === "rem"
  const rhythm = vr.rhythm
  vr.rhythm = (lines: number = 1, ...args: any[]) => {
    checkNumber("rhythm lines", lines)
    if (remRhythm) {
      // Avoid the dependency's exponent-as-unit parsing for small pixel bases.
      const offset = args[1] == null ? 0 : args[1]
      const rem = parseFloat(
        ((lineHeightPx * lines - offset) / baseFont).toFixed(5)
      )
      // Rounding the coefficient can cross the physical representability limit.
      checkNumber("rhythm result", rem * baseFont)
      return `${rem}rem`
    }
    const result = rhythm(lines, ...args)
    checkLength("rhythm result", result)
    return result
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
    // In rem, the line height comes from the rhythm above: the dependency's
    // own rhythm misreads a length it writes with an exponent ("1e+22px").
    const result = remRhythm
      ? {
        fontSize: `${parseFloat((size / baseFont).toFixed(5))}rem`,
        lineHeight: vr.rhythm(vr.linesForFontSize(`${size}px`)),
      }
      : vr.adjustFontSizeTo(`${size}px`)
    checkLength("scale lineHeight", result.lineHeight)
    return result
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
