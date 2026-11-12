// @flow
// CSS Syntax 3 pieces, shared by the font-stack and line-height checks. Each
// pattern is written once here.

// Keywords are ASCII case-insensitive (CSS Values 4 4.1).
export const asciiLower = (s: string) =>
  s.replace(/[A-Z]/g, c => String.fromCharCode(c.charCodeAt(0) + 32))

// CSS Values 4 2.1: valid only as a whole property value.
export const cssWideKeywords = ["inherit", "initial", "unset", "revert", "revert-layer"]

const ws = "[ \\t\\n\\r\\f]"
// A CSS number (4.3.12). Only these spaces count: JavaScript's trim() also
// strips NBSP and others that CSS reads as text.
export const number = "[+-]?(?:\\d*\\.\\d+|\\d+)(?:e[+-]?\\d+)?"
export const trimSpace = (text: string) => text.replace(/^[ \t\n\r\f]+|[ \t\n\r\f]+$/g, "")
// A comment ends at its first "*/" (4.3.2).
const comment = "\\/\\*(?:[^*]|\\*+[^*/])*\\*+\\/"
const escape = "\\\\(?:[0-9a-fA-F]{1,6}[ \\t\\n\\r\\f]?|[^\\n\\r\\f0-9a-fA-F])"
const string = `"(?:\\\\[^]|[^"\\\\\\n\\r\\f])*"|'(?:\\\\[^]|[^'\\\\\\n\\r\\f])*'`
// White space and comments.
export const blank = `(?:${ws}|${comment})`
// A character of a name (4.3.9). NUL reads as U+FFFD, a name character (3.3).
export const nameChar = `(?:[-\\w\\u0000\\u0080-\\uFFFF]|${escape})`
// `var(--name` then "," or ")" (CSS Variables 1 3), and `env(name` likewise.
export const varHead = new RegExp(`^var\\(${blank}*--${nameChar}+${blank}*[,)]`, "i")
const envHead = new RegExp(`^env\\(${blank}*[a-z-]${nameChar}*${blank}*[,)]`, "i")

// A token as CSS reads it. In order: a comment; an unterminated comment; an
// escape; a string; `url(` with a quoted argument (an ordinary function,
// through its string); an unquoted url token; any other `url(` (a bad url); a
// run of name characters (so "xurl(" is not a url); any other character. A
// lone quote is a string that a line break or the end cut off.
const token = new RegExp(
  `${comment}|\\/\\*|\\\\[^\\n\\r\\f]|${string}|url\\(${ws}*(?:${string})|url\\(${ws}*(?:[^"'()\\\\ \\t\\n\\r\\f\\u0000-\\u0008\\u000b\\u000e-\\u001f\\u007f]|\\\\[^\\n\\r\\f])*${ws}*\\)|url\\(|[-\\w\\u0000\\u0080-\\uFFFF]+|[^]`,
  "iy"
)
const closerOf = { "(": ")", "[": "]", "{": "}" }
const broken = { "/*": true, '"': true, "'": true }

// Whether CSS reads `text` as a <declaration-value> (8.2): no bad string,
// no bad url, no unterminated comment, no unmatched closer, no ";" or "!" at
// the top level, and nothing left open at the end.
export const isDeclarationValue = (text: string) => {
  const closers = []
  token.lastIndex = 0
  for (let match = token.exec(text); match; match = token.exec(text)) {
    const t = match[0]
    if (broken[t] || /^url\($/i.test(t)) return false
    if (closers.length <= 1 && (t === ";" || t === "!")) return false
    if (/^url\(/i.test(t)) {
      // A quoted url() stays open after its string; an unquoted one is whole.
      if (t[t.length - 1] !== ")") closers.push(")")
    } else if (closerOf[t]) closers.push(closerOf[t])
    else if ((t === ")" || t === "]" || t === "}") && closers.pop() !== t) return false
  }
  return closers.length === 0
}

// Whether `text` holds var() or env() references, each well formed: a name
// run "var" or "env" right before "(" (so "pi-var(" is a function named
// pi-var, not a reference), then its name. CSS checks such a value only after
// substitution (CSS Variables 1 3; CSS Environment Variables 1 3), but a
// malformed reference fails at once.
export const hasSubstitution = (text: string) => {
  token.lastIndex = 0
  let before = undefined
  let found = false
  for (let match = token.exec(text); match; match = token.exec(text)) {
    if (match[0] === "(" && before && /^(?:var|env)$/i.test(before[0])) {
      const rest = text.slice(before.index)
      if (!(/^var/i.test(rest) ? varHead : envHead).test(rest)) return false
      found = true
    }
    before = match
  }
  return found
}

export const lengthUnit = /^(?:%|px|r?em|r?ex|r?ch|r?ic|r?cap|r?lh|[sld]?v(?:w|h|i|b|min|max)|cq(?:w|h|i|b|min|max)|cm|mm|q|in|pt|pc)$/i
const angleUnit = /^(?:deg|rad|grad|turn)$/i
const timeUnit = /^m?s$/i

// A math function (CSS Values 4 10), read by recursive descent and typed:
// "number", "length", "percentage", "length-percentage", "angle", or "time".
// Undefined when CSS rejects it: an unknown name, word, or unit; a missing or
// extra argument; "+" or "-" without white space around it; or types that do
// not combine. (A value with a var() reference is checked only after
// substitution, so the caller accepts it before this.)
// Groups: 1 white space; 2 a number, 3 its unit; 4 an operator or bracket;
// 5 a word, 6 its "(" when it names a function. A word may start with "-"
// (-infinity), so words come before operators.
const mathToken = new RegExp(`(${ws}+)|(${number})([a-z]+|%)?|(-?[a-z][-a-z0-9]*)(\\()?|([-+*/,()])`, "iy")
const add = (a: ?string, b: ?string) => {
  if (a === b) return a
  const lp = ["length", "percentage", "length-percentage"]
  return lp.indexOf(a) !== -1 && lp.indexOf(b) !== -1 ? "length-percentage" : undefined
}
const numeric = (t: ?string) => t === "number"
const same = (types: Array<?string>) => types.reduce(add)
// Each function: its argument count, and its result from its arguments' types.
const mathFunctions = {
  calc: [1, 1, ([a]) => a],
  min: [1, Infinity, same],
  max: [1, Infinity, same],
  hypot: [1, Infinity, same],
  clamp: [3, 3, same],
  // round(A) omits its step only when A is a number (10.6).
  round: [1, 2, types => (types.length === 1 && !numeric(types[0]) ? undefined : same(types))],
  mod: [2, 2, same],
  rem: [2, 2, same],
  abs: [1, 1, ([a]) => a],
  sign: [1, 1, () => "number"],
  sin: [1, 1, ([a]) => (numeric(a) || a === "angle" ? "number" : undefined)],
  cos: [1, 1, ([a]) => (numeric(a) || a === "angle" ? "number" : undefined)],
  tan: [1, 1, ([a]) => (numeric(a) || a === "angle" ? "number" : undefined)],
  asin: [1, 1, ([a]) => (numeric(a) ? "angle" : undefined)],
  acos: [1, 1, ([a]) => (numeric(a) ? "angle" : undefined)],
  atan: [1, 1, ([a]) => (numeric(a) ? "angle" : undefined)],
  atan2: [2, 2, types => same(types) && "angle"],
  pow: [2, 2, types => (types.every(numeric) ? "number" : undefined)],
  sqrt: [1, 1, ([a]) => (numeric(a) ? "number" : undefined)],
  exp: [1, 1, ([a]) => (numeric(a) ? "number" : undefined)],
  log: [1, 2, types => (types.every(numeric) ? "number" : undefined)],
}
const constants = /^(?:e|pi|infinity|-infinity|nan)$/i
const roundingStrategy = /^(?:nearest|up|down|to-zero)$/i

export const mathType = (text: string) => {
  const tokens = []
  mathToken.lastIndex = 0
  while (mathToken.lastIndex < text.length) {
    const m = mathToken.exec(text)
    if (!m) return undefined
    tokens.push(m)
  }
  let k = 0
  const peek = () => tokens[k]
  const space = () => {
    const had = !!peek() && peek()[1] !== undefined
    if (had) k++
    return had
  }
  const call = (name: string): ?string => {
    const fn = mathFunctions[asciiLower(name)]
    if (!fn) return undefined
    const args = []
    space()
    // round() may start with its rounding strategy.
    const first = peek()
    if (asciiLower(name) === "round" && first && first[4] && !first[5] && roundingStrategy.test(first[4])) {
      k++
      space()
      if (!peek() || peek()[6] !== ",") return undefined
      k++
    }
    for (;;) {
      space()
      args.push(sum())
      space()
      const t = peek()
      if (!t || t[6] === undefined) return undefined
      k++
      if (t[6] === ")") break
      if (t[6] !== ",") return undefined
    }
    if (args.length < fn[0] || args.length > fn[1] || args.some(a => !a)) return undefined
    return fn[2](args)
  }
  const value = (): ?string => {
    const t = peek()
    if (!t) return undefined
    k++
    if (t[2] !== undefined) {
      const unit = t[3]
      return unit === undefined
        ? "number"
        : unit === "%"
        ? "percentage"
        : lengthUnit.test(unit)
        ? "length"
        : angleUnit.test(unit)
        ? "angle"
        : timeUnit.test(unit)
        ? "time"
        : undefined
    }
    if (t[6] === "(") {
      space()
      const inner = sum()
      space()
      const close = peek()
      if (!close || close[6] !== ")") return undefined
      k++
      return inner
    }
    if (t[4] !== undefined && t[5] !== undefined) {
      return call(t[4])
    }
    return t[4] !== undefined && constants.test(t[4]) ? "number" : undefined
  }
  const product = (): ?string => {
    let type = value()
    for (;;) {
      const at = k
      space()
      const t = peek()
      if (!t || (t[6] !== "*" && t[6] !== "/")) {
        k = at
        return type
      }
      k++
      space()
      const right = value()
      // "*" needs a number on one side; "/" needs one on the right.
      type =
        t[6] === "/"
          ? numeric(right) ? type : undefined
          : numeric(type) ? right : numeric(right) ? type : undefined
    }
  }
  const sum = (): ?string => {
    let type = product()
    for (;;) {
      const at = k
      if (!space()) return type
      const t = peek()
      if (!t || (t[6] !== "+" && t[6] !== "-")) {
        k = at
        return type
      }
      k++
      // "+" and "-" need white space on both sides.
      if (!space()) return undefined
      type = add(type, product())
    }
  }
  const head = peek()
  if (!head || head[4] === undefined || head[5] === undefined) return undefined
  k++
  const type = call(head[4])
  return k === tokens.length ? type : undefined
}

// A math function whose type line-height accepts: a number, a length, or a
// percentage (CSS Inline 3).
export const isMathFunction = (text: string) =>
  ["number", "length", "percentage", "length-percentage"].indexOf(mathType(text)) !== -1
