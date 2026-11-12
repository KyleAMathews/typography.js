// @flow
import {
  asciiLower,
  blank,
  identStart,
  listItems,
  nameChar,
  stringToken,
  trim,
} from "./css"

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

// CSS Values 4 §2.1: valid only as a whole property value.
const cssWideKeywords = ["inherit", "initial", "unset", "revert", "revert-layer"]

// `var(--name)` or `var(--name, fallback)`, where the fallback is a CSS
// <declaration-value> (CSS Syntax 3 §4.3, §8.2; CSS Variables 1 §3).
// The head: `var(`, then a custom property name, with white space or
// comments around it, then "," or ")".
const varHead = new RegExp(`^var\\(${blank}*--${nameChar}+${blank}*[,)]`, "i")

// One var(--name[, fallback]): its parentheses close at the end, with no bad
// string, bad url, unterminated comment, unmatched closer, or ";" or "!" at
// the fallback's top level.
const isVarReference = (item: string) =>
  varHead.test(item) && listItems(item, 4, [")"], true) !== undefined

const identifier = new RegExp(`${blank}+|${identStart}${nameChar}*`, "y")
// A family name of identifiers, none a CSS-wide word or "default"
// (CSS Fonts 4 2.1: <custom-ident>+).
const isIdentifiers = (item: string) => {
  identifier.lastIndex = 0
  for (let match = identifier.exec(item); match; match = identifier.exec(item)) {
    const name = asciiLower(match[0])
    if (name === "default" || cssWideKeywords.indexOf(name) !== -1) return false
    if (identifier.lastIndex === item.length) return true
  }
  return false
}
// An entry that starts with a var() and may continue as a font-family list,
// as #307 allowed: "var(--sans), 'Lato', sans-serif". Each later item is a
// var(), a string, or a family name.
const isVarList = (entry: string) => {
  const items = /^var\(/i.test(entry) && listItems(entry, 0, [])
  return (
    !!items &&
    items.every(raw => {
      const item = trim(raw)
      // The first item starts with "var(", so it can only be a var().
      return isVarReference(item) || stringToken.test(item) || isIdentifiers(item)
    })
  )
}

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
  // Passed through, but a "<" is escaped so the stylesheet cannot close its
  // <style> element. Inside a string or an identifier the escape reads the same.
  // A "<" written raw or as "\<" becomes "\3c " (an escaped backslash
  // before it stays).
  const escaped = entry.replace(/(\\*)</g, (_, slashes) =>
    slashes.length % 2 === 1 ? `${slashes.slice(1)}\\3c ` : `${slashes}\\3c `
  )
  if (isVarList(escaped)) return escaped
  return quote(entry)
}

export const fontFamilyList = (stack: Array<string>) =>
  isLoneCssWide(stack) ? asciiLower(stack[0]) : stack.map(item).join(",")

// The `html` base font. A lone CSS-wide keyword cannot sit inside the `font`
// shorthand, so it gets longhands.
export const baseFont = (
  fontSize: string,
  lineHeight: string | number,
  stack: Array<string>
) =>
  isLoneCssWide(stack)
    ? { fontSize, lineHeight, fontFamily: fontFamilyList(stack) }
    : { font: `${fontSize}/${lineHeight} ${fontFamilyList(stack)}` }

const isFontStack = (stack: mixed) =>
  Array.isArray(stack) &&
  stack.length > 0 &&
  stack.every(entry => typeof entry === "string")

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
