// @flow
import { asciiLower, cssWideKeywords, escapeLessThan, everyEntry, isDeclarationValue, varHead } from "./css"

// Font stacks to CSS. Each entry of `bodyFontFamily` and `headerFontFamily`
// becomes one item of a `font-family` list, following CSS Fonts 4 §2.1.

// CSS Fonts 4 (W3C WD 2026-11-04) §2.1.2 generic families.
const genericFamilies = [
  "serif",
  "sans-serif",
  "system-ui",
  "cursive",
  "fantasy",
  "math",
  "monospace",
  "ui-serif",
  "ui-sans-serif",
  "ui-monospace",
  "ui-rounded",
]
// CSS Fonts 4's functional generics (`generic(kai)`) are left as family
// names: browsers do not implement them yet, and Chrome drops a whole
// declaration that holds one.

// An entry that starts with a well-formed var() and is a <declaration-value>
// (no bad string or url, nothing left open, no top-level ";" or "!"). CSS
// reads it only after substitution, so it passes through as written, as #307
// passed it: "var(--sans), sans-serif" or "var(--a) var(--b)".
const isVarEntry = (entry: string) =>
  varHead.test(entry) && isDeclarationValue(entry)

// A family name as a CSS string (CSS Syntax 3 §4.3.5). Only what a string
// cannot hold raw is escaped: the quote, the backslash, and line breaks (LF,
// CR, FF). "<" is escaped too, so the stylesheet can sit inside a <style>
// element.
const quote = (name: string) =>
  `'${name.replace(
    /['\\<\n\r\f]/g,
    c => `\\${c.charCodeAt(0).toString(16)} `
  )}'`

const isLoneCssWide = (stack: Array<string>) =>
  stack.length === 1 && cssWideKeywords.indexOf(asciiLower(stack[0])) !== -1

const item = (entry: string) => {
  const word = asciiLower(entry)
  if (genericFamilies.indexOf(word) !== -1) return word
  // A vendor keyword (WebKit), and a valid unquoted family name.
  if (entry === "-apple-system") return entry
  // Passed through, with each "<" escaped (law S1 L3). baseFont() asks the
  // same question of the same entry.
  if (isVarEntry(entry)) return escapeLessThan(entry, false)
  return quote(entry)
}

export const fontFamilyList = (stack: Array<string>) =>
  isLoneCssWide(stack) ? asciiLower(stack[0]) : stack.map(item).join(",")

// The `html` base font. A lone CSS-wide keyword cannot sit inside the `font`
// shorthand, so it gets longhands. So does a stack with a var() entry: an
// undefined variable drops the declaration it is in, and in the shorthand
// the base size and line height would go with it.
export const baseFont = (
  fontSize: string,
  lineHeight: string | number,
  stack: Array<string>
) =>
  isLoneCssWide(stack) || stack.some(isVarEntry)
    ? { fontSize, lineHeight, fontFamily: fontFamilyList(stack) }
    : { font: `${fontSize}/${lineHeight} ${fontFamilyList(stack)}` }

// A hole in a sparse stack is not a string.
const isFontStack = (stack: mixed) =>
  Array.isArray(stack) &&
  stack.length > 0 &&
  everyEntry(stack, entry => typeof entry === "string")

// Throws for every invalid stack at once, naming each.
export const checkFontStacks = (options: Object) => {
  const invalid = ["bodyFontFamily", "headerFontFamily"].filter(
    option => !isFontStack(options[option])
  )
  if (invalid.length) {
    throw new TypeError(
      `typography: a font stack must be a non-empty array of strings (invalid: ${invalid.join(
        ", "
      )})`
    )
  }
}
