// @flow
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

// Keywords are ASCII case-insensitive (CSS Values 4 §4.1).
const asciiLower = (s: string) =>
  s.replace(/[A-Z]/g, c => String.fromCharCode(c.charCodeAt(0) + 32))

// `var(--name)` or `var(--name, fallback)`, where the fallback is a CSS
// <declaration-value> (CSS Syntax 3 §4.3, §8.2; CSS Variables 1 §3).
// The head: `var(`, then a custom property name, with white space or
// comments around it, then "," or ")".
// A comment ends at the first "*/" (CSS Syntax 3 4.3.2).
const varHead = /^var\((?:[ \t\n\r\f]|\/\*(?:[^*]|\*+[^*/])*\*+\/)*--(?:[-\w\u0080-\uFFFF]|\\(?:[0-9a-fA-F]{1,6}[ \t\n\r\f]?|[^\n\r\f0-9a-fA-F]))+(?:[ \t\n\r\f]|\/\*(?:[^*]|\*+[^*/])*\*+\/)*[,)]/i
// The contents, token by token as CSS reads them. In order: a comment; an
// unterminated comment; an escape; a string; `url(` with a quoted argument (an
// ordinary function, through its string); an unquoted url token; any other
// `url(` (a bad url); a run of name characters (so "xurl(" is not a url); any
// other character. A lone quote is a string that a line break or the end cut
// off.
const varToken = /\/\*[^]*?\*\/|\/\*|\\[^\n\r\f]|"(?:\\[^]|[^"\\\n\r\f])*"|'(?:\\[^]|[^'\\\n\r\f])*'|url\([ \t\n\r\f]*(?:"(?:\\[^]|[^"\\\n\r\f])*"|'(?:\\[^]|[^'\\\n\r\f])*')|url\([ \t\n\r\f]*(?:[^"'()\\ \t\n\r\f\u0000-\u0008\u000b\u000e-\u001f\u007f]|\\[^\n\r\f])*[ \t\n\r\f]*\)|url\(|[-\w\u0080-\uFFFF]+|[^]/iy
const closerOf = { "(": ")", "[": "]", "{": "}" }
const broken = { "/*": true, '"': true, "'": true }

// One var(--name[, fallback]): its parentheses close at the end, with no bad
// string, bad url, unterminated comment, unmatched closer, or ";" or "!" at
// the fallback's top level.
const isVarReference = (item: string) => varHead.test(item) && listItems(item, 4, [")"], true) !== undefined
// The top-level, comma-separated items of `text` from `start`, inside the
// open blocks `closers`; undefined when CSS would not read it as a list, or,
// with `whole`, when the blocks close before the end.
const listItems = (
  text: string,
  start: number,
  closers: Array<string>,
  whole: boolean = false
) => {
  const items = [""]
  varToken.lastIndex = start
  for (let token = varToken.exec(text); token; token = varToken.exec(text)) {
    const t = token[0]
    if (broken[t] || /^url\($/i.test(t)) return undefined
    if (closers.length <= 1 && (t === ";" || t === "!")) return undefined
    if (closers.length === 0 && t === ",") {
      items.push("")
      continue
    }
    if (/^url\(/i.test(t)) {
      // A quoted url() stays open after its string; an unquoted one is whole.
      if (t[t.length - 1] !== ")") closers.push(")")
    } else if (closerOf[t]) closers.push(closerOf[t])
    else if (t === ")" || t === "]" || t === "}") {
      if (closers.pop() !== t) return undefined
      if (whole && closers.length === 0)
        return varToken.lastIndex === text.length ? items : undefined
    }
    items[items.length - 1] += t
  }
  // An open block at the end sits inside a var() item, which isVarReference
  // rejects as a whole.
  return whole ? undefined : items
}

// White space and comments around a list item.
const trim = (item: string) =>
  item.replace(
    /^(?:[ \t\n\r\f]|\/\*(?:[^*]|\*+[^*/])*\*+\/)+|(?:[ \t\n\r\f]|\/\*(?:[^*]|\*+[^*/])*\*+\/)+$/g,
    ""
  )
const string = /^(?:"(?:\\[^]|[^"\\\n\r\f])*"|'(?:\\[^]|[^'\\\n\r\f])*')$/
const word = /(?:[ \t\n\r\f]|\/\*(?:[^*]|\*+[^*/])*\*+\/)+|(?:--|-?(?:[a-zA-Z_\u0080-\uFFFF]|\\(?:[0-9a-fA-F]{1,6}[ \t\n\r\f]?|[^\n\r\f0-9a-fA-F])))(?:[-\w\u0080-\uFFFF]|\\(?:[0-9a-fA-F]{1,6}[ \t\n\r\f]?|[^\n\r\f0-9a-fA-F]))*/y
// A family name of identifiers, none a CSS-wide word or "default"
// (CSS Fonts 4 2.1: <custom-ident>+).
const isIdentifiers = (item: string) => {
  word.lastIndex = 0
  for (let match = word.exec(item); match; match = word.exec(item)) {
    const w = asciiLower(match[0])
    if (w === "default" || cssWideKeywords.indexOf(w) !== -1) return false
    if (word.lastIndex === item.length) return true
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
      return isVarReference(item) || string.test(item) || isIdentifiers(item)
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
