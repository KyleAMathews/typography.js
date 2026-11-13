// @flow

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
import configure from "./utils/configure"
import { isNumeric, toNumber } from "./utils/verticalRhythm"
import type { OptionsType } from "Types"


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
  (isNumeric(value) && Number.isFinite(Number(value))) ||
  isMarginKeyword(value) ||
  (typeof value === "string" && isLengthText(trimSpace(value), true))

const typography = function (opts: OptionsType) {
  const { options, vr } = configure(opts)
  if (!isLineHeight(options.headerLineHeight)) {
    throw new RangeError("Invalid CSS line-height for headerLineHeight")
  }
  checkFontStacks(options)
  // v0.16 ignored plugins that were not a list, and overrides that were not
  // functions: each is a mistake to report. A falsy value (null, false, "",
  // 0) is none, as in v0.16, so `cond && plugin` works.
  if (
    options.plugins &&
    !(Array.isArray(options.plugins) && options.plugins.every(p => typeof p === "function"))
  ) {
    throw new TypeError("Invalid plugins: a list of functions")
  }
  const overrides = ["overrideStyles", "overrideThemeStyles"]
  overrides.forEach(name => {
    if (options[name] && typeof options[name] !== "function") {
      throw new TypeError(`Invalid ${name}: a function`)
    }
  })
  if (!isBlockMargin(options.blockMarginBottom)) {
    throw new RangeError("Invalid CSS length for blockMarginBottom")
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
