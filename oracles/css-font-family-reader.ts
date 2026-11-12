// An independent reader for CSS font-family lists, used by the font-family
// oracle (font-family.oracle.ts) to judge what typography.js emits. It
// follows the specs, not typography.js:
//
// - CSS Syntax 3 (W3C CRD, 1 October 2026): §3.3 preprocessing (CR, FF, and
//   CRLF become LF; NUL and surrogate code points become U+FFFD), §4.3.5
//   strings (a raw newline makes a bad string), §4.3.7 escapes (a zero,
//   surrogate, or too-large escape becomes U+FFFD), §4.3.9-§4.3.11 ident
//   sequences, and comments.
// - CSS Fonts 4 (W3C WD, 4 November 2026): §2.1 `font-family` is
//   `[ <font-family-name> | <generic-font-family> ]#`; §2.1.1 a family name
//   is a `<string>` or a sequence of `<custom-ident>`s joined by single
//   spaces; §2.1.2 the generic keywords and `generic(...)`.
// - CSS Values 4 (W3C WD, 12 March 2024): §2.1 a CSS-wide keyword is valid
//   only as the whole property value; §4.1 keywords and §9 function names are
//   ASCII case-insensitive; a `<custom-ident>` is never `default`.
//
// It reads only what a font-family value needs. It is deliberately strict:
// anything it does not understand is a parse error, so an oracle failure
// points at the text a browser would reject or misread.

/** CSS Fonts 4 §2.1.2: <generic-font-complete> and <generic-font-incomplete>. */
export const GENERIC_KEYWORDS: ReadonlyArray<string> = [
  'serif',
  'sans-serif',
  'system-ui',
  'cursive',
  'fantasy',
  'math',
  'monospace',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'ui-rounded',
]

/** CSS Fonts 4 §2.1.2: <generic-font-script-specific>, only as generic(...). */
export const GENERIC_FUNCTION_ARGUMENTS = [
  'fangsong',
  'kai',
  'khmer-mul',
  'nastaliq',
] as const

/** CSS Values 4 §2.1 (CSS-wide keywords). */
export const CSS_WIDE_KEYWORDS: ReadonlyArray<string> = [
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
]

/** One item of a font-family list, as a browser reads it. */
export type FamilyItem =
  | { name: string }
  | { generic: string }
  | { var: string }
  | { keyword: string }

export type ReadResult =
  | { ok: true; items: Array<FamilyItem> }
  | { ok: false; error: string; itemsRead: number }

/** ASCII lower case: CSS keywords ignore ASCII case only (CSS Values 4 §4.1). */
export const asciiLower = (s: string) =>
  s.replace(/[A-Z]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 32))

/** CSS Syntax 3 §3.3: what the tokenizer sees. */
export function preprocess(text: string): string {
  let out = ''
  const s = text.replace(/\r\n|\r|\f/g, '\n')
  for (const ch of s) {
    const cp = ch.codePointAt(0)!
    out += cp === 0 || (cp >= 0xd800 && cp <= 0xdfff) ? '�' : ch
  }
  return out
}

const isNameStart = (c: string | undefined) =>
  c !== undefined && (/[A-Za-z_]/.test(c) || c.codePointAt(0)! >= 0x80)
const isNameChar = (c: string | undefined) =>
  c !== undefined && (isNameStart(c) || /[0-9-]/.test(c))
const isWhitespace = (c: string | undefined) =>
  c === ' ' || c === '\t' || c === '\n'
const isHex = (c: string | undefined) => c !== undefined && /[0-9A-Fa-f]/.test(c)

type Token =
  | { type: 'ws' }
  | { type: 'comma' }
  | { type: 'string'; value: string }
  | { type: 'ident'; value: string }
  | {
      type: 'function'
      name: string
      raw: string
      // The first argument, when it is an ident, and what follows it.
      firstIdent?: string
      afterFirst?: 'end' | 'comma' | 'other'
    }

class ReadError extends Error {
  /** The list items completed before the error: the commas read so far. */
  itemsRead = 0
}

/** Tokenizes a preprocessed font-family value. Throws ReadError. */
function tokenize(src: string): Array<Token> {
  const tokens: Array<Token> = []
  try {
    return tokenizeInto(src, tokens)
  } catch (e) {
    if (e instanceof ReadError) e.itemsRead = tokens.filter((t) => t.type === 'comma').length
    throw e
  }
}

function tokenizeInto(src: string, tokens: Array<Token>): Array<Token> {
  let i = 0
  // Code points, so that astral characters stay whole.
  const cps = Array.from(src)
  const at = (k: number) => cps[k]

  const validEscape = (k: number) => at(k) === '\\' && at(k + 1) !== '\n'
  const startsIdent = (k: number) => {
    const c = at(k)
    if (c === '-')
      return isNameStart(at(k + 1)) || at(k + 1) === '-' || validEscape(k + 1)
    return isNameStart(c) || validEscape(k)
  }
  // CSS Syntax 3 §4.3.7: consume an escaped code point, after the backslash.
  const escaped = (): string => {
    const c = at(i)
    if (c === undefined) return '�'
    if (isHex(c)) {
      let hex = ''
      while (hex.length < 6 && isHex(at(i))) hex += at(i++)
      if (isWhitespace(at(i))) i++
      const cp = parseInt(hex, 16)
      return cp === 0 || (cp >= 0xd800 && cp <= 0xdfff) || cp > 0x10ffff
        ? '�'
        : String.fromCodePoint(cp)
    }
    i++
    return c
  }
  const identSequence = (): string => {
    let v = ''
    while (i < cps.length) {
      if (isNameChar(at(i))) v += at(i++)
      else if (validEscape(i)) {
        i++
        v += escaped()
      } else break
    }
    return v
  }
  const skipComment = () => {
    if (at(i) !== '/' || at(i + 1) !== '*') return false
    i += 2
    while (i < cps.length && !(at(i) === '*' && at(i + 1) === '/')) i++
    if (i >= cps.length) throw new ReadError('unterminated comment')
    i += 2
    return true
  }
  const stringToken = (quote: string): string => {
    let v = ''
    while (true) {
      const c = at(i++)
      if (c === undefined) return v // EOF ends the string (a parse error, but kept)
      if (c === quote) return v
      if (c === '\n') throw new ReadError('newline in a string (bad string)')
      if (c === '\\') {
        if (at(i) === undefined) continue
        if (at(i) === '\n') {
          i++
          continue
        }
        v += escaped()
      } else v += c
    }
  }

  // CSS Syntax 3 §4.3.6, after `url(`: a quoted argument makes it an
  // ordinary function (returns true; the caller reads its contents);
  // otherwise consume the url token (returns false), or throw for a bad url.
  const nonPrintable = (c: string | undefined) =>
    c !== undefined && /[\u0000-\u0008\u000b\u000e-\u001f\u007f]/.test(c)
  function urlRest(): boolean {
    let k = i
    while (isWhitespace(at(k))) k++
    if (at(k) === '"' || at(k) === "'") return true
    i = k
    for (;;) {
      const c = at(i)
      if (c === undefined) throw new ReadError('unterminated url(')
      if (c === ')') {
        i++
        return false
      }
      if (isWhitespace(c)) {
        while (isWhitespace(at(i))) i++
        if (at(i) === ')') continue
        throw new ReadError('bad url (white space inside)')
      }
      if (c === '"' || c === "'" || c === '(' || nonPrintable(c)) throw new ReadError(`bad url (${JSON.stringify(c)})`)
      if (c === '\\') {
        if (!validEscape(i)) throw new ReadError('bad url (escape)')
        i++
        escaped()
        continue
      }
      i++
    }
  }

  while (i < cps.length) {
    const c = at(i)
    if (skipComment()) continue
    if (isWhitespace(c)) {
      while (isWhitespace(at(i))) i++
      if (tokens.at(-1)?.type !== 'ws') tokens.push({ type: 'ws' })
    } else if (c === ',') {
      i++
      tokens.push({ type: 'comma' })
    } else if (c === '"' || c === "'") {
      i++
      tokens.push({ type: 'string', value: stringToken(c) })
    } else if (startsIdent(i)) {
      const start = i
      const name = identSequence()
      if (at(i) === '(') {
        i++
        // The first argument, read as tokens: comments are dropped and
        // escapes decoded (CSS Syntax 3 §4.3), so `var(/**/--\\66 )` names
        // `--f`. Then what follows it: the end, a comma, or anything else.
        const skipTrivia = () => {
          for (;;) {
            if (isWhitespace(at(i))) i++
            else if (!skipComment()) return
          }
        }
        skipTrivia()
        let firstIdent: string | undefined
        let afterFirst: 'end' | 'comma' | 'other' | undefined
        if (startsIdent(i)) {
          firstIdent = identSequence()
          skipTrivia()
          afterFirst = at(i) === ')' ? 'end' : at(i) === ',' ? 'comma' : 'other'
        }
        // The rest of the contents, up to the matching ")", as CSS Syntax 3
        // consumes them: comments dropped; strings (a newline makes a bad
        // string); escapes; `url(` with an unquoted argument as one url token
        // (§4.3.6), where white space inside, a quote, or "(" makes a bad url;
        // and nested (), [], {} blocks. The contents must be a
        // <declaration-value> (CSS Syntax 3 §8.2; CSS Variables 1 §3): no bad
        // string or bad url, no unmatched closer, and no top-level ";" or "!".
        const closers: Array<string> = [')']
        while (closers.length > 0) {
          const d = at(i)
          if (d === undefined) throw new ReadError(`unterminated ${name}(`)
          if (skipComment()) continue
          if (d === '"' || d === "'") {
            i++
            stringToken(d)
            continue
          }
          if (validEscape(i)) {
            i++
            escaped()
            continue
          }
          if (startsIdent(i)) {
            const word = identSequence()
            if (at(i) !== '(') continue
            i++
            if (asciiLower(word) !== 'url' || urlRest()) closers.push(')')
            continue
          }
          if (d === '(' || d === '[' || d === '{') closers.push(d === '(' ? ')' : d === '[' ? ']' : '}')
          else if (d === ')' || d === ']' || d === '}') {
            if (closers.at(-1) !== d) throw new ReadError(`unmatched ${d} in ${name}()`)
            closers.pop()
          } else if (closers.length === 1 && (d === ';' || d === '!'))
            throw new ReadError(`top-level ${d} in ${name}()`)
          i++
        }
        tokens.push({
          type: 'function',
          name: asciiLower(name),
          raw: cps.slice(start, i).join(''),
          firstIdent,
          afterFirst,
        })
      } else tokens.push({ type: 'ident', value: name })
    } else {
      throw new ReadError(`unexpected ${JSON.stringify(c)}`)
    }
  }
  return tokens
}

/**
 * Reads a font-family value as a browser would. `context` is `property` for
 * a `font-family` declaration, and `shorthand` for the family part of a
 * `font` shorthand, where a CSS-wide keyword is never valid.
 */
export function readFamilyList(
  value: string,
  context: 'property' | 'shorthand' = 'property',
): ReadResult {
  let tokens: Array<Token>
  try {
    tokens = tokenize(preprocess(value))
  } catch (e) {
    if (!(e instanceof ReadError)) throw e
    return { ok: false, error: e.message, itemsRead: e.itemsRead }
  }
  // Split at top-level commas into components, dropping whitespace at the edges.
  const components: Array<Array<Token>> = [[]]
  for (const t of tokens)
    if (t.type === 'comma') components.push([])
    else components.at(-1)!.push(t)
  const items: Array<FamilyItem> = []
  for (const raw of components) {
    const comp = raw.filter((t, k) => !(t.type === 'ws' && (k === 0 || k === raw.length - 1)))
    const fail = (error: string): ReadResult => ({ ok: false, error, itemsRead: items.length })
    if (comp.length === 0) return fail('empty list item')
    const [first] = comp
    if (comp.length === 1 && first.type === 'string') {
      items.push({ name: first.value })
    } else if (comp.length === 1 && first.type === 'function') {
      if (first.name === 'var') {
        if (!(first.firstIdent?.startsWith('--') && first.firstIdent.length > 2) || first.afterFirst === 'other' || first.afterFirst === undefined)
          return fail(`malformed ${first.raw}`)
        items.push({ var: first.raw })
      } else if (first.name === 'generic') {
        const arg = first.firstIdent && asciiLower(first.firstIdent)
        if (!arg || first.afterFirst !== 'end' || !(GENERIC_FUNCTION_ARGUMENTS as ReadonlyArray<string>).includes(arg))
          return fail(`unknown ${first.raw}`)
        items.push({ generic: `generic(${arg})` })
      } else return fail(`function ${first.name}() in a font-family list`)
    } else if (comp.every((t) => t.type === 'ident' || t.type === 'ws')) {
      const idents = comp.filter((t) => t.type === 'ident').map((t) => (t as { value: string }).value)
      const lowered = idents.map(asciiLower)
      if (idents.length === 1) {
        const k = lowered[0]
        if ((GENERIC_KEYWORDS as ReadonlyArray<string>).includes(k)) items.push({ generic: k })
        else if ((CSS_WIDE_KEYWORDS as ReadonlyArray<string>).includes(k)) {
          if (context === 'shorthand' || components.length > 1)
            return fail(`CSS-wide keyword ${k} not as the whole value`)
          items.push({ keyword: k })
        } else if (k === 'default') return fail('unquoted reserved word default')
        else items.push({ name: idents[0] })
      } else {
        // An unquoted name of several identifiers is one family name, even
        // when one of them is a keyword. This follows Chrome, not the letter
        // of the spec: CSS Values 4's <custom-ident> excludes CSS-wide words
        // and `default`, but Chrome reads "Lato inherit" and "Default Lato" as
        // names (probe 7). typography.js never emits unquoted multi-word
        // names, so the difference is not reachable through production.
        items.push({ name: idents.join(' ') })
      }
    } else return fail('a list item mixes tokens')
  }
  return { ok: true, items }
}

/**
 * The base font that `html` carries, from its declarations in order: the
 * `font` shorthand (as `<size>/<line-height> <family list>`) and the
 * `font-size`, `line-height`, and `font-family` longhands. A later declaration
 * of a property wins, as in the cascade. A shorthand that does not parse is
 * dropped whole, as a browser drops it.
 */
export function readBaseFont(declarations: ReadonlyArray<[string, unknown]>): {
  fontSize?: string
  lineHeight?: string
  family?: ReadResult
  // The family part as written, for a list with var(), which CSS reads only
  // after substitution, and the context it is read in.
  familyText?: string
  familyContext?: 'property' | 'shorthand'
} {
  const out: {
    fontSize?: string
    lineHeight?: string
    family?: ReadResult
    familyText?: string
    familyContext?: 'property' | 'shorthand'
  } = {}
  for (const [property, value] of declarations) {
    const text = String(value)
    if (property === 'font') {
      const m = /^[ \t\n]*([^\s/]+)[ \t\n]*\/[ \t\n]*([^\s]+)[ \t\n]+([\s\S]*)$/.exec(text)
      const family = m ? readFamilyList(m[3], 'shorthand') : undefined
      if (m) {
        out.fontSize = m[1]
        out.lineHeight = m[2]
        out.familyText = m[3]
        out.familyContext = 'shorthand'
      }
      if (!m || !family?.ok) {
        // Dropped: keep the failure, so the check can say why.
        out.family ??= family ?? { ok: false, error: 'font shorthand does not parse', itemsRead: 0 }
        continue
      }
      out.family = family
    } else if (property === 'fontSize') out.fontSize = text
    else if (property === 'lineHeight') out.lineHeight = text
    else if (property === 'fontFamily') {
      const family = readFamilyList(text, 'property')
      out.familyText = text
      out.familyContext = 'property'
      if (family.ok || !out.family?.ok) out.family = family
    }
  }
  return out
}

/**
 * CSS Variables 1 §3 and CSS Syntax 3 §8.2: `value` starts with a well-formed
 * `var(--name[, fallback])`, and the whole of it is a <declaration-value>
 * (balanced blocks, no bad string or url, no top-level ";" or "!"), read as
 * it sits in a declaration. CSS reads such a value only after substitution.
 */
export function startsWithVarDeclaration(value: string): boolean {
  const src = preprocess(value)
  if (!/^var\(/i.test(src)) return false
  // The first token is the var(): the tokenizer pushes it before it meets a
  // token a font-family list cannot hold.
  const first: Array<Token> = []
  try {
    tokenizeInto(src, first)
  } catch (e) {
    if (!(e instanceof ReadError)) throw e
  }
  const head = first[0]
  if (
    head?.type !== 'function' ||
    head.name !== 'var' ||
    !(head.firstIdent?.startsWith('--') && head.firstIdent.length > 2) ||
    head.afterFirst === 'other' ||
    head.afterFirst === undefined
  )
    return false
  // The whole value as one function's contents: the same <declaration-value>
  // rules, with the value's top level as the contents' top level.
  try {
    tokenize(`x(${src})`)
    return true
  } catch (e) {
    if (e instanceof ReadError) return false
    throw e
  }
}

/**
 * CSS Syntax 3: the top-level, comma-separated pieces of a value, each as
 * written; undefined when a string, comment, or block does not close.
 */
export function splitTopLevel(value: string): Array<string> | undefined {
  const pieces: Array<string> = []
  const closers: Array<string> = []
  let piece = ''
  let i = 0
  while (i < value.length) {
    const c = value[i]
    if (c === '\\') {
      piece += value.slice(i, i + 2)
      i += 2
      continue
    }
    if (value.startsWith('/*', i)) {
      const end = value.indexOf('*/', i + 2)
      if (end < 0) return undefined
      piece += value.slice(i, end + 2)
      i = end + 2
      continue
    }
    // An unquoted url( is one url token up to its ")" (CSS Syntax 3 §4.3.6),
    // whatever it holds, unless a name character comes before it.
    const url = /^url\([ \t\n\r\f]*(?!["'])/i.exec(value.slice(i))
    if (url && !/[-\w\u0080-\uFFFF]/.test(value[i - 1] ?? '')) {
      let j = i + url[0].length
      while (j < value.length && value[j] !== ')') j += value[j] === '\\' ? 2 : 1
      if (j >= value.length) return undefined
      piece += value.slice(i, j + 1)
      i = j + 1
      continue
    }
    if (c === '"' || c === "'") {
      let j = i + 1
      while (j < value.length && value[j] !== c) {
        if (/[\n\r\f]/.test(value[j])) return undefined
        j += value[j] === '\\' ? 2 : 1
      }
      if (j >= value.length) return undefined
      piece += value.slice(i, j + 1)
      i = j + 1
      continue
    }
    if (c === '(' || c === '[' || c === '{') closers.push(c === '(' ? ')' : c === '[' ? ']' : '}')
    else if (c === ')' || c === ']' || c === '}') {
      if (closers.pop() !== c) return undefined
    } else if (c === ',' && closers.length === 0) {
      pieces.push(piece)
      piece = ''
      i++
      continue
    }
    piece += c
    i++
  }
  if (closers.length > 0) return undefined
  pieces.push(piece)
  return pieces
}
