// @flow
// CSS Syntax 3 pieces, shared by the font-stack and line-height checks. Each
// pattern is written once here.

// Keywords are ASCII case-insensitive (CSS Values 4 4.1).
export const asciiLower = (s: string) =>
  s.replace(/[A-Z]/g, c => String.fromCharCode(c.charCodeAt(0) + 32))

// CSS Values 4 2.1: valid only as a whole property value.
export const cssWideKeywords = ["inherit", "initial", "unset", "revert", "revert-layer"]

// CSS white space (4.2). Only these spaces count: JavaScript's trim() also
// strips NBSP and others that CSS reads as text.
export const ws = "[ \\t\\n\\r\\f]"
// A CSS number (4.3.12).
export const number = "[+-]?(?:\\d*\\.\\d+|\\d+)(?:e[+-]?\\d+)?"
const edgeSpace = new RegExp(`^${ws}+|${ws}+$`, "g")
export const trimSpace = (text: string) => text.replace(edgeSpace, "")
// A number and its unit, which may be empty, with white space around them.
export const dimension = new RegExp(`^${ws}*(${number})([a-z%]*)${ws}*$`, "i")
// A trailing !important (CSS Cascade 5 6.1), and the white space before it.
const important = new RegExp(`${ws}*!${ws}*important${ws}*$`, "i")
export const withoutImportant = (text: string) => text.replace(important, "")
// A comment ends at its first "*/" (4.3.2).
const comment = "\\/\\*(?:[^*]|\\*+[^*/])*\\*+\\/"
const escape = "\\\\(?:[0-9a-fA-F]{1,6}[ \\t\\n\\r\\f]?|[^\\n\\r\\f0-9a-fA-F])"
const string = `"(?:\\\\[^]|[^"\\\\\\n\\r\\f])*"|'(?:\\\\[^]|[^'\\\\\\n\\r\\f])*'`
// White space and comments.
export const blank = `(?:${ws}|${comment})`
// A character of a name (4.3.9). NUL reads as U+FFFD, a name character (3.3).
export const nameChar = `(?:[-\\w\\u0000\\u0080-\\uFFFF]|${escape})`
// A property name: one identifier (4.3.11), or a custom property's "--" and
// name characters (CSS Variables 1 2).
const identifier = new RegExp(`^(?:--${nameChar}+|-?(?:[a-zA-Z_\\u0080-\\uFFFF]|${escape})${nameChar}*)$`)
export const isPropertyName = (name: string) => identifier.test(name)
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
// A lone backslash (before a line break or the end) is not an escape: at the
// end, it would escape the ";" written after it.
const broken = { "/*": true, '"': true, "'": true, "\\": true }

// Whether CSS reads `text` as one declaration's value (8.2, 5.4.6): no bad
// string, no bad url, no unterminated comment, no lone backslash, no
// unmatched closer, no ";" or "!" at the top level or a function's top level,
// nothing left open at the end, and no top-level {} block unless the property
// is custom.
export const isDeclarationValue = (text: string, custom: boolean = false) => {
  const closers = []
  token.lastIndex = 0
  for (let match = token.exec(text); match; match = token.exec(text)) {
    const t = match[0]
    if (broken[t] || /^url\($/i.test(t)) return false
    if (closers.length <= 1 && (t === ";" || t === "!")) return false
    if (t === "{" && closers.length === 0 && !custom) return false
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

// A math function (CSS Values 4 10), read by recursive descent and typed
// (10.9): a type maps each base type to its power, so {} is a number and
// { length: 1 } a length. "*" adds powers and "/" subtracts them; "+", "-",
// and the comparison functions need one type. A percentage is a length: in
// line-height it is of the font size. A function this grammar does not know
// is the browser's to type ("any"), as a var() is. Undefined when CSS rejects
// the text: an unknown word or unit; a missing or extra argument; "+" or "-"
// without white space around it (a comment is not white space); or types
// that do not combine.
// Groups: 1 a comment; 2 white space; 3 a number, 4 its unit; 5 a word, 6 its
// "(" when it names a function; 7 an operator or bracket; 8 any other token.
// A word may start with "-" (-infinity), so words come before operators.
const mathToken = new RegExp(
  `(${comment})|(${ws}+)|(${number})([a-z]+|%)?|(-?[a-z][-a-z0-9]*)(\\()?|([-+*/,()])|(${string}|${escape}|[^])`,
  "iy"
)
type MathType = ?({ [base: string]: number } | "any")
const NUMBER = {}
const ANGLE = { angle: 1 }
const sameType = (a, b) => Object.keys({ ...a, ...b }).every(k => (a[k] || 0) === (b[k] || 0))
const add = (a: MathType, b: MathType): MathType =>
  !a || !b ? undefined : a === "any" ? b : b === "any" ? a : sameType(a, b) ? a : undefined
const multiply = (a: MathType, b: MathType, sign: number): MathType => {
  if (!a || !b) return undefined
  if (a === "any" || b === "any") return "any"
  const out = { ...a }
  Object.keys(b).forEach(k => {
    out[k] = (out[k] || 0) + sign * b[k]
    if (out[k] === 0) delete out[k]
  })
  return out
}
// A CSS type: a number, or one base type to the power 1. Every math function
// and each of its arguments resolves to one (10.9, 10.6): length² is only an
// intermediate result.
const cssType = (t: MathType) =>
  t === "any" || (!!t && Object.keys(t).length <= 1 && Object.keys(t).every(k => t[k] === 1))
const numeric = (t: MathType) => t === "any" || (!!t && sameType(t, NUMBER))
const angular = (t: MathType) => numeric(t) || (!!t && sameType(t, ANGLE))
const same = (types: Array<MathType>) => types.reduce(add)
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
  sign: [1, 1, () => NUMBER],
  sin: [1, 1, ([a]) => (angular(a) ? NUMBER : undefined)],
  cos: [1, 1, ([a]) => (angular(a) ? NUMBER : undefined)],
  tan: [1, 1, ([a]) => (angular(a) ? NUMBER : undefined)],
  asin: [1, 1, ([a]) => (numeric(a) ? ANGLE : undefined)],
  acos: [1, 1, ([a]) => (numeric(a) ? ANGLE : undefined)],
  atan: [1, 1, ([a]) => (numeric(a) ? ANGLE : undefined)],
  atan2: [2, 2, types => (same(types) ? ANGLE : undefined)],
  pow: [2, 2, types => (types.every(numeric) ? NUMBER : undefined)],
  sqrt: [1, 1, ([a]) => (numeric(a) ? NUMBER : undefined)],
  exp: [1, 1, ([a]) => (numeric(a) ? NUMBER : undefined)],
  log: [1, 2, types => (types.every(numeric) ? NUMBER : undefined)],
}
const constants = /^(?:e|pi|infinity|-infinity|nan)$/i
const roundingStrategy = /^(?:nearest|up|down|to-zero)$/i
const unitType = (unit: ?string): MathType =>
  unit === undefined
    ? NUMBER
    : lengthUnit.test(unit)
    ? { length: 1 }
    : angleUnit.test(unit)
    ? ANGLE
    : timeUnit.test(unit)
    ? { time: 1 }
    : undefined

const mathType = (text: string): MathType => {
  // Comments are dropped: CSS reads them as nothing (4.3.2).
  // Every character starts a token (group 8 takes any other).
  const tokens = []
  mathToken.lastIndex = 0
  for (let m = mathToken.exec(text); m; m = mathToken.exec(text)) {
    if (m[1] === undefined) tokens.push(m)
  }
  let k = 0
  const peek = () => tokens[k]
  const space = () => {
    const at = k
    while (peek() && peek()[2] !== undefined) k++
    return k > at
  }
  const call = (name: string): MathType => {
    const fn = mathFunctions[asciiLower(name)]
    // A var() or env() reference: the caller accepts a well-formed one first.
    if (/^(?:var|env)$/i.test(name)) return undefined
    if (!fn) {
      // The browser types it: skip to its ")".
      for (let depth = 1; depth; k++) {
        const t = peek()
        if (!t) return undefined
        if (t[6] || t[7] === "(") depth++
        else if (t[7] === ")") depth--
      }
      return "any"
    }
    const args = []
    space()
    // round() may start with its rounding strategy.
    const first = peek()
    if (asciiLower(name) === "round" && first && first[5] && !first[6] && roundingStrategy.test(first[5])) {
      k++
      space()
      if (!peek() || peek()[7] !== ",") return undefined
      k++
    }
    for (;;) {
      space()
      args.push(sum())
      space()
      const t = peek()
      if (!t || t[7] === undefined) return undefined
      k++
      if (t[7] === ")") break
      if (t[7] !== ",") return undefined
    }
    if (args.length < fn[0] || args.length > fn[1] || !args.every(cssType)) return undefined
    const type = fn[2](args)
    return cssType(type) ? type : undefined
  }
  const value = (): MathType => {
    const t = peek()
    if (!t) return undefined
    k++
    if (t[3] !== undefined) return unitType(t[4])
    if (t[7] === "(") {
      space()
      const inner = sum()
      space()
      // Its ")": the caller types only balanced text, and every token must be
      // read, so any other token here leaves a ")" unread.
      k++
      return inner
    }
    if (t[5] !== undefined && t[6] !== undefined) return call(t[5])
    return t[5] !== undefined && constants.test(t[5]) ? NUMBER : undefined
  }
  const product = (): MathType => {
    let type = value()
    for (;;) {
      const at = k
      space()
      const t = peek()
      if (!t || (t[7] !== "*" && t[7] !== "/")) {
        k = at
        return type
      }
      k++
      space()
      type = multiply(type, value(), t[7] === "*" ? 1 : -1)
    }
  }
  const sum = (): MathType => {
    let type = product()
    for (;;) {
      const at = k
      if (!space()) return type
      const t = peek()
      if (!t || (t[7] !== "+" && t[7] !== "-")) {
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
  if (!head || head[5] === undefined || head[6] === undefined) return undefined
  k++
  const type = call(head[5])
  return k === tokens.length ? type : undefined
}

// A math function of a length (a percentage is one), or of a number unless
// lengthOnly, or one the browser types. Call it on a declaration value: its
// brackets balance.
export const isMathFunction = (text: string, lengthOnly: boolean) => {
  const type = mathType(text)
  return type === "any" || (!!type && ((!lengthOnly && sameType(type, NUMBER)) || sameType(type, { length: 1 })))
}
