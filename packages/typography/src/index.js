// @flow
import objectAssign from "object-assign"

import createStyles from "./utils/createStyles"
import compileStyles from "./utils/compileStyles"
import { checkFontStacks } from "./utils/fontFamily"
import {
  asciiLower,
  cssWideKeywords,
  hasSubstitution,
  isDeclarationValue,
  isMarginKeyword,
  isMathFunction,
  dimension,
  lengthUnit,
  trimSpace,
  withoutImportant,
} from "./utils/css"
import verticalRhythm, { isNumeric, toNumber } from "./utils/verticalRhythm"
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

// A CSS length (a percentage is one) or a math function of one (of a
// number too, unless lengthOnly), or a value whose var() or env() reference,
// or a function the browser types, CSS decides.
const isLengthText = (text: string, lengthOnly: boolean) => {
  const length = dimension.exec(text)
  return (
    (!!length && lengthUnit.test(length[2])) ||
    ((isMathFunction(text, lengthOnly) || hasSubstitution(text)) &&
      text.indexOf("<") === -1 &&
      isDeclarationValue(text))
  )
}
// headerLineHeight is written as given, so it may be any CSS line-height
// (CSS Inline 3), with or without !important: a number or length of 0 or
// more, normal, a CSS-wide keyword, a math function, or a value with var() or env().
const isLineHeight = (value: any) => {
  if (isNumeric(value)) return toNumber("headerLineHeight", value) >= 0
  if (typeof value !== "string") return false
  const text = trimSpace(withoutImportant(value))
  const length = dimension.exec(text)
  return (
    (isNumeric(text) && toNumber("headerLineHeight", text) >= 0) ||
    ["normal", ...cssWideKeywords].indexOf(asciiLower(text)) !== -1 ||
    ((!length || Number(length[1]) >= 0) && isLengthText(text, false))
  )
}
// blockMarginBottom: rhythm units (a number or numeric string, or null for
// one, as v0.16 read it), a CSS length that the margins put in calc(), or a
// margin keyword (createStyles leaves the calc() margins out for it).
const isBlockMargin = (value: any) =>
  value === null ||
  isNumeric(value) ||
  isMarginKeyword(value) ||
  (typeof value === "string" && isLengthText(trimSpace(value), true))

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
  if (!isLineHeight(options.headerLineHeight)) {
    throw new RangeError("Invalid CSS line-height for headerLineHeight")
  }
  checkFontStacks(options)
  // v0.16 ignored plugins that were not a list, and overrides that were not
  // functions: each is a mistake to report. null is none, as in v0.16.
  if (
    options.plugins != null &&
    !(Array.isArray(options.plugins) && options.plugins.every(p => typeof p === "function"))
  ) {
    throw new TypeError("Invalid plugins: a list of functions")
  }
  const overrides = ["overrideStyles", "overrideThemeStyles"]
  overrides.forEach(name => {
    if (options[name] != null && typeof options[name] !== "function") {
      throw new TypeError(`Invalid ${name}: a function`)
    }
  })
  if (!isBlockMargin(options.blockMarginBottom)) {
    throw new RangeError("Invalid CSS length for blockMarginBottom")
  }

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
    // Replaces the text of an existing style#typography.js, or inserts one
    // first in <head>. An empty head appends, as v0.16's tests pin.
    injectStyles() {
      if (typeof document === "undefined") return
      // Before the document changes: toString() throws on invalid CSS.
      const css = this.toString()
      let node = document.getElementById("typography.js")
      if (!node) {
        node = document.createElement("style")
        node.id = "typography.js"
        const head = document.head
        if (head.firstChild) head.insertBefore(node, head.firstChild)
        else head.appendChild(node)
      }
      node.innerHTML = css
    },
  }
}

export default typography
