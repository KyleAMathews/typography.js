// @flow
// CSS Syntax 3 pieces, shared by the font-stack and line-height checks. Each
// pattern is written once here.

// Keywords are ASCII case-insensitive (CSS Values 4 4.1).
export const asciiLower = (s: string) =>
  s.replace(/[A-Z]/g, c => String.fromCharCode(c.charCodeAt(0) + 32))

// CSS Values 4 2.1: valid only as a whole property value.
export const cssWideKeywords = ["inherit", "initial", "unset", "revert", "revert-layer"]

// The package runs on ES5 engines, as v0.16 did: no sticky regular
// expressions and no ES2015 built-ins (Number.isFinite, Array.from,
// String.fromCodePoint). A "g" expression with a last alternative that takes
// any character matches at lastIndex, as a sticky one would.

// Every entry of a list passes `test`, holes included (every() skips them).
export const everyEntry = (list: Array<mixed>, test: (entry: mixed) => boolean) => {
  for (let i = 0; i < list.length; i++) if (!test(list[i])) return false
  return true
}

// CSS white space (4.2). Only these spaces count: JavaScript's trim() also
// strips NBSP and others that CSS reads as text.
export const ws = "[ \\t\\n\\r\\f]"
// A CSS number (4.3.12).
export const number = "[+-]?(?:\\d*\\.\\d+|\\d+)(?:e[+-]?\\d+)?"
// One pass from each end: a pattern such as /\s+$/ backtracks on a long run
// of white space before a non-space.
const isSpace = (c: string) => c === " " || c === "\t" || c === "\n" || c === "\r" || c === "\f"
// Past either end, charAt() is "", which is not white space; for white space
// alone, end falls below start and the slice is "".
export const trimSpace = (text: string) => {
  let start = 0
  let end = text.length
  while (isSpace(text.charAt(start))) start++
  while (isSpace(text.charAt(end - 1))) end--
  return text.slice(start, end)
}
// auto or a CSS-wide keyword: a margin, but not a length calc() takes.
export const isMarginKeyword = (value: mixed) =>
  typeof value === "string" && ["auto", ...cssWideKeywords].indexOf(asciiLower(trimSpace(value))) !== -1
// A number and its unit, which may be empty, with white space around them.
export const dimension = new RegExp(`^${ws}*(${number})([a-z%]*)${ws}*$`, "i")
// "<" as the escape "\3c ", which CSS reads as the same character in a
// string, a url, or a name (4.3.7); a "<" already escaped ("\<") loses its
// backslash. With beforeSlash, only a "<" before "/": HTML ends a <style> at
// "</style", and a "<" elsewhere, as in @media (width < 600px), must stay.
// One pass, counting the backslashes before each "<".
export const escapeLessThan = (text: string, beforeSlash: boolean) => {
  let out = ""
  let slashes = 0
  for (let k = 0; k < text.length; k++) {
    const c = text[k]
    if (c === "<" && (!beforeSlash || text[k + 1] === "/")) {
      // An odd count: the last backslash escapes this "<"; it goes.
      out = (slashes % 2 === 1 ? out.slice(0, -1) : out) + "\\3c "
      slashes = 0
    } else {
      out += c
      slashes = c === "\\" ? slashes + 1 : 0
    }
  }
  return out
}
// A comment ends at its first "*/" (4.3.2).
const comment = "\\/\\*(?:[^*]|\\*+[^*/])*\\*+\\/"
// Its hex digits are all the digits there are, up to six, so an escape and
// the name characters after it cannot divide them two ways.
const escape = "\\\\(?:(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{1,5}(?![0-9a-fA-F]))[ \\t\\n\\r\\f]?|[^\\n\\r\\f0-9a-fA-F])"
const string = `"(?:\\\\[^]|[^"\\\\\\n\\r\\f])*"|'(?:\\\\[^]|[^'\\\\\\n\\r\\f])*'`
// White space and comments.
export const blank = `(?:${ws}|${comment})`
// A character of a name (4.3.9). NUL reads as U+FFFD, a name character (3.3).
export const nameChar = `(?:[-\\w\\u0000\\u0080-\\uFFFF]|${escape})`
// A property name: one identifier (4.3.11), or a custom property's "--" and
// name characters (CSS Variables 1 2).
const identifier = new RegExp(`^(?:--${nameChar}+|-?(?:[a-zA-Z_\\u0080-\\uFFFF]|${escape})${nameChar}*)$`)
export const isPropertyName = (name: string) => identifier.test(name)
// `var(--name` then "," or ")" (CSS Variables 1 3), and `env(name` likewise;
// the arguments alone, after the "(".
const varArgs = new RegExp(`^${blank}*--${nameChar}+${blank}*[,)]`)
const envArgs = new RegExp(`^${blank}*[a-z-]${nameChar}*${blank}*[,)]`, "i")
export const varHead = new RegExp(`^var\\(${blank}*--${nameChar}+${blank}*[,)]`, "i")

// A token as CSS reads it. In order: a comment; an unterminated comment; a
// string; a run of name characters and escapes (a name, so "xurl(" is not a
// url); any other character. A lone quote is a string that a line break or
// the end cut off, and a lone backslash is not an escape.
const token = new RegExp(`${comment}|\\/\\*|${string}|${nameChar}+|[^]`, "g")
// A name with its escapes decoded (4.3.7): "\\75 rl" is "url". Only ASCII
// names are compared ("url", "var", "env", "important"), so a code point
// beyond U+FFFF only needs to stay non-ASCII.
const decodeName = (name: string) =>
  name.replace(/\\(?:([0-9a-fA-F]{1,6})[ \t\n\r\f]?|([^]))/g, (_, hex, c) =>
    hex ? String.fromCharCode(Math.min(parseInt(hex, 16), 0xffff)) : c
  )
const isName = (t: string) => /^(?:[-\w\u0000\u0080-\uFFFF]|\\[^\n\r\f])/.test(t)
const isWs = (c: string) => c === " " || c === "\t" || c === "\n" || c === "\r" || c === "\f"
// After a name "url" (in any spelling) and its "(": the index of the ")" that
// ends an unquoted url token; -1 for a bad url (4.3.6: white space inside, a
// quote, "(", a non-printable character, or a bad escape); or undefined when
// a quote comes first, as url("…") is an ordinary function.
const urlEnd = (text: string, at: number) => {
  let j = at
  while (isWs(text.charAt(j))) j++
  if (text[j] === '"' || text[j] === "'") return undefined
  for (; ; j++) {
    const c = text.charAt(j)
    if (c === "") return -1
    if (c === ")") return j
    if (isWs(c)) {
      while (isWs(text.charAt(j))) j++
      return text[j] === ")" ? j : -1
    }
    if (/["'(\u0000-\u0008\u000b\u000e-\u001f\u007f]/.test(c)) return -1
    // An escape: a backslash, then a character other than a line break.
    if (c === "\\") {
      if (/^$|[\n\r\f]/.test(text.charAt(j + 1))) return -1
      j++
    }
  }
}
// The text before a trailing !important (CSS Cascade 5 6.1), read token by
// token as CSS reads it (a comment ends at its first "*/"), with the white
// space and comments around "!" and "important"; else the text. One pass,
// which keeps the last three tokens that are not white space or comments.
export const withoutImportant = (text: string) => {
  let before
  let bang
  let flag
  token.lastIndex = 0
  for (let match = token.exec(text); match; match = token.exec(text)) {
    const t = match[0]
    // An open comment: the caller rejects the text.
    if (t === "/*") return text
    if (!isWs(t) && t.slice(0, 2) !== "/*") {
      before = bang
      bang = flag
      flag = match
    }
  }
  if (!flag || asciiLower(decodeName(flag[0])) !== "important" || !bang || bang[0] !== "!") return text
  return before ? text.slice(0, before.index + before[0].length) : ""
}
const closerOf = { "(": ")", "[": "]", "{": "}" }
// A lone backslash (before a line break or the end) is not an escape: at the
// end, it would escape the ";" written after it.
const broken = { "/*": true, '"': true, "'": true, "\\": true }

// Whether CSS reads `text` as one declaration's value (8.2, 5.4.6): no bad
// string, no bad url, no unterminated comment, no lone backslash, no
// unmatched closer, no ";" or "!" at the top level or a var() fallback's,
// nothing left open at the end, and no top-level {} block unless the property
// is custom.
export const isDeclarationValue = (text: string, custom: boolean = false) => {
  // Each open block's closer; "v" closes a var() or env(), whose fallback
  // is a <declaration-value> of its own (CSS Variables 1 3).
  const closers = []
  let before = ""
  token.lastIndex = 0
  for (let match = token.exec(text); match; match = token.exec(text)) {
    const t = match[0]
    const top = closers[closers.length - 1]
    if (broken[t]) return false
    if ((top === undefined || top === "v") && (t === ";" || t === "!")) return false
    if (t === "{" && top === undefined && !custom) return false
    // A name "url" (in any spelling) and "(" start a url token, unless a
    // quote follows: then it is a function like any other.
    if (isName(t) && asciiLower(decodeName(t)) === "url" && text[token.lastIndex] === "(") {
      const end = urlEnd(text, token.lastIndex + 1)
      if (end === -1) return false
      if (end !== undefined) {
        token.lastIndex = end + 1
        before = ")"
        continue
      }
    }
    if (t === "(" && /^(?:var|env)$/i.test(decodeName(before))) closers.push("v")
    else if (closerOf[t]) closers.push(closerOf[t])
    else if ((t === ")" || t === "]" || t === "}") && (closers.pop() || "").replace("v", ")") !== t) return false
    before = t
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
    // The name before "(" with its escapes decoded: v\61r( is var( (review
    // U4). Its arguments follow the "(".
    const head = before && asciiLower(decodeName(before[0]))
    if (match[0] === "(" && (head === "var" || head === "env")) {
      if (!(head === "var" ? varArgs : envArgs).test(text.slice(match.index + 1))) return false
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
  "gi"
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
// Functions whose type is not a number or a dimension: colors, images, urls,
// and counters (CSS Color 4 and 5, Images 3 and 4, Values 4 4.5, Lists 3).
const notNumeric = /^(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark|url|src|image|image-set|cross-fade|element|(?:repeating-)?(?:linear|radial|conic)-gradient|counters?|format|local)$/i
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
    if (/^(?:var|env)$/i.test(name) || notNumeric.test(name)) return undefined
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
