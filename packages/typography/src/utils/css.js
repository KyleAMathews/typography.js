// @flow
// CSS Syntax 3 pieces, shared by the font-stack and line-height checks. Each
// pattern is written once here.

// Keywords are ASCII case-insensitive (CSS Values 4 4.1).
export const asciiLower = (s: string) =>
  s.replace(/[A-Z]/g, c => String.fromCharCode(c.charCodeAt(0) + 32))

const ws = "[ \\t\\n\\r\\f]"
// A comment ends at its first "*/" (4.3.2).
const comment = "\\/\\*(?:[^*]|\\*+[^*/])*\\*+\\/"
const escape = "\\\\(?:[0-9a-fA-F]{1,6}[ \\t\\n\\r\\f]?|[^\\n\\r\\f0-9a-fA-F])"
const string = `"(?:\\\\[^]|[^"\\\\\\n\\r\\f])*"|'(?:\\\\[^]|[^'\\\\\\n\\r\\f])*'`
// White space and comments.
export const blank = `(?:${ws}|${comment})`
// A character of a name, and the start of an identifier (4.3.9).
export const nameChar = `(?:[-\\w\\u0080-\\uFFFF]|${escape})`
export const identStart = `(?:--|-?(?:[a-zA-Z_\\u0080-\\uFFFF]|${escape}))`
export const stringToken = new RegExp(`^(?:${string})$`)

// A token as CSS reads it. In order: a comment; an unterminated comment; an
// escape; a string; `url(` with a quoted argument (an ordinary function,
// through its string); an unquoted url token; any other `url(` (a bad url); a
// run of name characters (so "xurl(" is not a url); any other character. A
// lone quote is a string that a line break or the end cut off.
const token = new RegExp(
  `${comment}|\\/\\*|\\\\[^\\n\\r\\f]|${string}|url\\(${ws}*(?:${string})|url\\(${ws}*(?:[^"'()\\\\ \\t\\n\\r\\f\\u0000-\\u0008\\u000b\\u000e-\\u001f\\u007f]|\\\\[^\\n\\r\\f])*${ws}*\\)|url\\(|[-\\w\\u0080-\\uFFFF]+|[^]`,
  "iy"
)
const closerOf = { "(": ")", "[": "]", "{": "}" }
const broken = { "/*": true, '"': true, "'": true }

// The top-level, comma-separated items of `text` from `start`, inside the
// open blocks `closers`. Undefined when CSS would not read it as a
// <declaration-value> (8.2): a bad string, a bad url, an unterminated
// comment, an unmatched closer, or ";" or "!" at the top level. With `whole`,
// also when the blocks close before the end.
export const listItems = (
  text: string,
  start: number,
  closers: Array<string>,
  whole: boolean = false
) => {
  const items = [""]
  token.lastIndex = start
  for (let match = token.exec(text); match; match = token.exec(text)) {
    const t = match[0]
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
        return token.lastIndex === text.length ? items : undefined
    }
    items[items.length - 1] += t
  }
  // An open block at the end of a list sits inside a function item, which the
  // caller reads as a whole.
  return whole ? undefined : items
}

const edges = new RegExp(`^${blank}+|${blank}+$`, "g")
// White space and comments around a list item.
export const trim = (item: string) => item.replace(edges, "")

// One function call that closes at the end and holds safe CSS, such as
// `calc(1em + 2px)`, of one of `names`. No "<", so a <style> element holds it.
export const isFunction = (text: string, names: RegExp) => {
  const head = /^([a-z-]+)\(/i.exec(text)
  return (
    !!head &&
    names.test(head[1]) &&
    text.indexOf("<") === -1 &&
    listItems(text, head[0].length, [")"], true) !== undefined
  )
}
