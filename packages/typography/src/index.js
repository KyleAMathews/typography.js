// @flow
import objectAssign from "object-assign"

import createStyles from "./utils/createStyles"
import compileStyles from "./utils/compileStyles"
import { checkFontStacks } from "./utils/fontFamily"
import verticalRhythm, {
  isNumeric,
  positiveLength,
  toNumber,
} from "./utils/verticalRhythm"
import type { OptionsType } from "Types"

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
  const { base, helpers: vr } = verticalRhythm(options)
  const scaleRatio = toNumber("scaleRatio", ratioOf(options.scaleRatio), true)
  // A multiplier (a number or a numeric string), or a length, kept as given.
  if (isNumeric(options.headerLineHeight)) {
    toNumber("headerLineHeight", options.headerLineHeight, true)
  } else positiveLength("headerLineHeight", options.headerLineHeight)
  checkFontStacks(options)

  // Add this function to the vertical rhythm object so it'll be passed around
  // as well and be available. A null position is position 0, as in v0.16.
  vr.scale = (value: any) => {
    // This doesn't pick the right scale ratio if a theme has more than one ratio.
    const position = value == null ? 0 : toNumber("scale position", value)
    const size = toNumber("scale result", Math.pow(scaleRatio, position) * base)
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
