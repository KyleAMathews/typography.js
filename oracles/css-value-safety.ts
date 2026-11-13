// An independent reader of whether a CSS value is safe to write as one
// declaration's value: it opens nothing that the ";" after it does not close
// (a string, a comment, a bracket, a url token in any spelling), it ends no
// rule, and it holds no top-level ";" or "!" (CSS Syntax 3 §4.3, §5.4.6;
// CSS Variables 1 §2 and §3). It does not use typography.js's code. The
// stylesheet oracles share it.

// A name and its end (CSS Syntax 3 §4.3.11), with its escapes decoded, at k.
const NAME_CHAR = /[-\w\u0080-\uFFFF]/
const readName = (text: string, k: number): { name: string; end: number } => {
  let name = ''
  let j = k
  for (;;) {
    if (j < text.length && NAME_CHAR.test(text[j])) name += text[j++]
    else if (text[j] === '\\' && j + 1 < text.length && !/[\n\r\f]/.test(text[j + 1])) {
      const hex = /^[0-9a-fA-F]{1,6}[ \t\n\r\f]?/.exec(text.slice(j + 1, j + 8))
      if (hex) {
        // Zero, a surrogate, or beyond Unicode reads as U+FFFD (§4.3.7).
        const n = parseInt(hex[0], 16)
        name += n === 0 || n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff) ? '\uFFFD' : String.fromCodePoint(n)
        j += 1 + hex[0].length
      } else {
        name += text[j + 1]
        j += 2
      }
    } else return { name, end: j }
  }
}
// After "url(" (any spelling): the end of an unquoted url token, at its ")",
// or -1 for a bad url (§4.3.6), or undefined when a string follows (then it
// is a function).
const urlEnd = (text: string, k: number): number | undefined => {
  let j = k
  while (/[ \t\n\r\f]/.test(text.charAt(j))) j++
  if (text[j] === '"' || text[j] === "'") return undefined
  for (; j < text.length; j++) {
    const c = text[j]
    if (c === ')') return j
    if (/[ \t\n\r\f]/.test(c)) {
      while (/[ \t\n\r\f]/.test(text.charAt(j))) j++
      return text[j] === ')' ? j : -1
    }
    if (c === '"' || c === "'" || c === '(' || /[\u0000-\u0008\u000b\u000e-\u001f\u007f]/.test(c)) return -1
    if (c === '\\') {
      if (j + 1 >= text.length || /[\n\r\f]/.test(text[j + 1])) return -1
      j++
    }
  }
  return -1
}
// CSS Syntax 3 §5.4.6: a top-level {} block is a custom property's only; a
// non-custom declaration with one and any other value is dropped.
// The text before a trailing !important (CSS Cascade 5 §6.1), or the text.
// It reads units from the start, as CSS reads tokens: a comment (to its first
// "*/"), a string, an escape (a backslash and the character after it, so an
// escaped space is not white space), white space, or one other character.
// The last two units that are not white space or comments must be "!" and
// the word "important"; the value ends with the unit before them.
const importantBody = (v: string) => {
  const units: Array<{ text: string; end: number }> = []
  for (let k = 0; k < v.length; ) {
    const start = k
    if (v.startsWith('/*', k)) {
      const end = v.indexOf('*/', k + 2)
      if (end < 0) return v
      k = end + 2
      continue
    }
    if (/[ \t\n\r\f]/.test(v[k])) {
      k++
      continue
    }
    if (v[k] === '"' || v[k] === "'") {
      const q = v[k]
      for (k++; k < v.length && v[k] !== q; k++) if (v[k] === '\\') k++
      k++
    } else if (NAME_CHAR.test(v[k]) || v[k] === '\\') k = Math.max(readName(v, k).end, k + 1)
    else k++
    units.push({ text: v.slice(start, k), end: k })
  }
  const [before, bang, flag] = units.slice(-3).length === 3 ? units.slice(-3) : [undefined, ...units.slice(-2)]
  if (!flag || readName(flag.text, 0).name.toLowerCase() !== 'important' || bang?.text !== '!') return v
  return before ? v.slice(0, before.end) : ''
}
export const isSafeText = (v: string, custom: boolean) => {
  // A trailing !important is CSS, but only after a value.
  const body = importantBody(v)
  if (/^[ \t\n\r\f]*$/.test(body)) return custom
  let quote: string | undefined
  // Open blocks: "v" for a var() or env() fallback, else the bracket.
  const open: Array<string> = []
  for (let k = 0; k < body.length; k++) {
    const c = body[k]
    if (quote) {
      // A line break ends a string as a bad string (§4.3.5); an escaped one
      // continues it.
      if (c === '\\') k++
      else if (c === quote) quote = undefined
      else if (/[\n\r\f]/.test(c)) return false
      continue
    }
    // A name: "url(" in any spelling (an escape included, review T2) starts
    // a url token, which a quote does not end.
    if ((NAME_CHAR.test(c) || c === '\\') && !NAME_CHAR.test(body[k - 1] ?? '') && body[k - 1] !== '\\') {
      const { name, end } = readName(body, k)
      if (end > k) {
        if (name.toLowerCase() === 'url' && body[end] === '(') {
          const close = urlEnd(body, end + 1)
          if (close === -1) return false
          if (close !== undefined) {
            k = close
            continue
          }
        }
        k = end - 1
        continue
      }
    }
    if (c === '/' && body[k + 1] === '*') {
      // A comment ends at its first "*/".
      const end = body.indexOf('*/', k + 2)
      if (end < 0) return false
      k = end + 1
    } else if (c === '\\') {
      // An escape: a backslash, then a character other than a line break.
      if (k + 1 >= body.length || /[\n\r\f]/.test(body[k + 1])) return false
      k++
    } else if (c === '"' || c === "'") quote = c
    else if (c === '{' && open.length === 0 && !custom) return false
    else if (c === '(') open.push(/(?:^|[^-\w])(?:var|env)$/i.test(body.slice(0, k)) ? 'v' : '(')
    else if (c === '{' || c === '[') open.push(c)
    // A closer must close the innermost block: <declaration-value> holds no
    // unmatched ")", "]", or "}" (CSS Syntax 3 §8.2).
    else if (c === ')' || c === '}' || c === ']') {
      const top = open.pop()
      if (top === undefined || { ')': '(v', ']': '[', '}': '{' }[c]?.includes(top) !== true) return false
    }
    // At the top, or at the top of a var() fallback (CSS Variables 1 §3);
    // inside any other block, ";" and "!" are part of it (review R6).
    else if ((c === ';' || c === '!') && (open.length === 0 || open[open.length - 1] === 'v')) return false
  }
  return !quote && open.length === 0
}
// No declaration: null and undefined, and false and '' as in `cond && value`
// (engineer decision 2026-11-12, review Q2). A custom property's '' is its
// empty value.
// White space alone is empty too (review T5).
export const isAbsent = (v: unknown, property: string) =>
  v === null || v === undefined || v === false || (typeof v === 'string' && /^[ \t\n\r\f]*$/.test(v) && !property.startsWith('--'))
