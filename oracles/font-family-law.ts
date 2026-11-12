// The shared parts of the font-family oracle: the law's names and sentence,
// the history grammar, the model, the check, reach, and the calibrations. Two
// oracle files use them with different drivers: `font-family.oracle.ts`
// (production's toJSON() in Node; it holds the law block) and
// `font-family.chrome.oracle.ts` (production's toString() in Chrome).
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import fc from 'fast-check'
import { differs, pass, violation } from '@tanstack/oracles'
import type { Calibration, ConstructedHistory, FixedHistory, Observation, Verdict } from '@tanstack/oracles'
import {
  CSS_WIDE_KEYWORDS,
  GENERIC_FUNCTION_ARGUMENTS,
  asciiLower,
  GENERIC_KEYWORDS,
  readBaseFont,
  readFamilyList,
  splitTopLevel,
  startsWithVarDeclaration,
} from './css-font-family-reader'
import type { FamilyItem } from './css-font-family-reader'

export const L0 = 'L0 options are kept as given'
export const L1 = 'L1 a family name round-trips'
export const L2 = 'L2 a generic family stays generic'
export const L3 = 'L3 var() passes through'
export const L4 = 'L4 reserved and CSS-wide words'
export const L5 = 'L5 an empty or non-string stack throws'
export const NO_THROW = 'L5 every other stack returns'

// ---------------------------------------------------------------------------
// History grammar. A history is the two stacks a caller passes. Every entry
// kind the law distinguishes has its own arbitrary, and each `.map` has an
// inverse, so fixed and constructed histories go back through the grammar.
// ---------------------------------------------------------------------------

export type Entry = string | number | boolean | null | undefined
// An undefined stack is an omitted one: the README default (engineer
// decision 2026-11-12, review R5).
export type History = { body: Array<Entry> | undefined; header: Array<Entry> | undefined }
// The plan: each stack as typography.js must use it, and the stacks as given.
export type Plan = { body: Array<Entry>; header: Array<Entry>; given: History }

const isAsciiLetter = (c: string) => /[A-Za-z]/.test(c)

// A word in any ASCII case: the mask says which letters are upper case.
const casedWord = (words: ReadonlyArray<string>) =>
  fc
    .tuple(fc.constantFrom(...words), fc.array(fc.boolean(), { maxLength: 16 }))
    .map(
      ([word, mask]) =>
        Array.from(word, (c, k) => (mask[k] && isAsciiLetter(c) ? c.toUpperCase() : c)).join(''),
      (value) => {
        if (typeof value !== 'string' || !words.includes(asciiLower(value)))
          throw new Error('not a cased keyword')
        const mask = Array.from(value, (c) => c !== c.toLowerCase())
        while (mask.length && !mask.at(-1)) mask.pop()
        return [asciiLower(value), mask]
      },
    )

// Characters that break a naive CSS string or identifier, plus every code
// point (`binary` leaves out lone surrogates, so two are added here: the law
// decides them).
const nameUnit = fc.oneof(
  { weight: 3, arbitrary: fc.constantFrom("'", '"', '\\', '\n', '\r', '\f', '\t', '\0', '\uD800', '\uDFFF', ',', ';', '{', '}', '(', ')', '/', '*', ' ', '-', '<') },
  { weight: 3, arbitrary: fc.constantFrom('a', 'L', 'o', '0', '9', '_', 'é', '字') },
  { weight: 2, arbitrary: fc.string({ unit: 'binary', minLength: 1, maxLength: 1 }) },
)
const familyName = fc.string({ unit: nameUnit, maxLength: 20 })

// generic(...) in the spellings CSS allows around its argument: white space
// and comments (review R2). All are family names (law delta R1).
const GENERIC_PADDING = ['', ' ', '/**/'] as const
const genericFunction = fc
  .tuple(casedWord(['generic']), casedWord(GENERIC_FUNCTION_ARGUMENTS), fc.constantFrom(...GENERIC_PADDING))
  .map(
    ([fn, arg, pad]) => `${fn}(${pad}${arg}${pad})`,
    (value) => {
      const m = typeof value === 'string' ? /^([A-Za-z]+)\(( |\/\*\*\/|)([-A-Za-z]+)\2\)$/.exec(value) : null
      if (!m) throw new Error('not a generic() entry')
      return [m[1], m[3], m[2]]
    },
  )

// Custom property names, one escaped (`--\66 ` is `--f`) and one after a
// comment (review R3).
const VAR_PROPERTIES = ['--f', '--brand-font', '--a1', '--\\66 ', '/**/--f'] as const
// Fallbacks that exercise each part of a well-formed var(): nesting, strings,
// escapes, and comments that hide a parenthesis, and white space or a comment
// before the comma.
const VAR_FALLBACKS = ['', ', serif', ", 'Lato', serif", ',', ', calc(1)', ", 'a)b'", ', \\)', ' , serif', ', /*)*/ serif', '/**/', ", '</style>'", ', a<b',
  // CSS tokens a <declaration-value> fallback may or may not hold (prep-pr
  // review A1/A2): blocks, unmatched openers and closers, url tokens, and a
  // top-level ";" or "!" (probe 11 checks each against Chrome).
  ', {a}', ', [a]', ', {)', ', [)', ', }', ', ]', ', a;b', ', a !important', ', {a;b}', ', url(x)', ", url('a)b')", ', url(x"y)")', ', url(a b)',
  // One witness for each part of the tokenizer (gap check, design grammar
  // card): white space around a url, a block, an escape, a control
  // character, or a "(" inside one, an escaped quote in a string, a name run
  // ending in "url", an escaped line break, and quoted url() forms.
  ', url( x )', ', url(a{b)', ', url(a\\)b)', ', url(a\u0001b)', ", 'a\\'b'", ', xurl(a b)', ', url(a\\\nb)', ', url( "a" )', ', url(a(b)', ', url("a" b)',
  // An escaped "<" (review T1), and an escaped backslash before one.
  ", '\\<'", ', a\\<b', ", '\\\\<'"] as const
// Text after the var() in the same entry: a font-family list continues it, as
// #307 allowed ("var(--sans), sans-serif"; engineer decision 2026-11-12, no
// breaking changes). Some tails continue the list, and some make the entry a
// name: a CSS-wide word, default, a generic() function, an empty item, a
// number, or a second token in the item.
const VAR_TAILS = ['', ' ', '/**/', ', serif', ", 'Lato', sans-serif", ', Open Sans', ', var(--b)', ', var(--b, x), serif', ' , monospace', ', <a', ", '</style>'", ', "a\\"b"',
  ', inherit', ', Default', ', generic(kai)', ',', ', , serif', ', 12px', ', calc(1)', ' x', ', a;b', ', {a', ", 'a"] as const
const varReference = fc
  .tuple(casedWord(['var']), fc.constantFrom(...VAR_PROPERTIES), fc.constantFrom(...VAR_FALLBACKS), fc.constantFrom(...VAR_TAILS))
  .map(
    ([fn, property, fallback, tail]) => `${fn}(${property}${fallback})${tail}`,
    (value) => {
      // The inverse: a listed tail, the function name, then the longest
      // listed property name and a listed fallback that rebuild the value.
      if (typeof value !== 'string' || !/^[A-Za-z]{3}\(/.test(value)) throw new Error('not a var() entry')
      for (const tail of [...VAR_TAILS].sort((a, b) => b.length - a.length)) {
        if (!value.endsWith(tail)) continue
        const head = value.slice(0, value.length - tail.length)
        if (!head.endsWith(')')) continue
        const inner = head.slice(4, -1)
        for (const property of [...VAR_PROPERTIES].sort((a, b) => b.length - a.length))
          if (inner.startsWith(property) && (VAR_FALLBACKS as ReadonlyArray<string>).includes(inner.slice(property.length)))
            return [head.slice(0, 3), property, inner.slice(property.length), tail]
      }
      throw new Error('not a var() entry')
    },
  )
// Near misses: a family name each, since none starts a well-formed var() list.
const MALFORMED_VAR = ['var(', 'var(--f', 'var(--f /*', 'var(--f /*)', 'var(--f, /*)', 'var(--f, ")', 'var(--f, url(x)', 'var(f)', 'var(--)', 'var(--f) x', ' var(--f)', '/**/var(--f)', 'var(--f x)', 'var(--f) x)', "var(--f, 'x)", "var(--f, 'a\nb')", 'var(--f, "a\nb")', 'xyz(--f)', 'env(--f)',
  // A comment ends at its first "*/": an "x" sits between these two (review T1 sibling).
  'var(/**/x/**/--f)'] as const
const malformedVar = fc.constantFrom(...MALFORMED_VAR)

const validEntry: fc.Arbitrary<string> = fc.oneof(
  { weight: 6, arbitrary: familyName },
  { weight: 3, arbitrary: casedWord(GENERIC_KEYWORDS) },
  { weight: 1, arbitrary: genericFunction },
  { weight: 2, arbitrary: casedWord([...CSS_WIDE_KEYWORDS, 'default']) },
  { weight: 2, arbitrary: varReference },
  { weight: 1, arbitrary: malformedVar },
  { weight: 1, arbitrary: fc.constantFrom('-apple-system', 'BlinkMacSystemFont') },
)
// Entries outside "an array of strings" (README, Configuration).
const nonString = fc.constantFrom<Entry>(42, true, null, undefined)

// Mostly valid stacks; some empty or holding a non-string entry (L5). A
// non-array stack is outside the domain and never generated (the exclusion
// control of ORC-004: `bodyFontFamily: 'Georgia'` is rejected by the grammar).
export const MAX_STACK = 12
export function historyArbitrary(): fc.Arbitrary<History> {
  const stack = fc.oneof(
    { weight: 8, arbitrary: fc.array(validEntry, { minLength: 1, maxLength: MAX_STACK }) },
    { weight: 1, arbitrary: fc.array(fc.oneof(validEntry, nonString), { maxLength: MAX_STACK }) },
    { weight: 1, arbitrary: fc.constant(undefined) },
  )
  return fc.record({ body: stack, header: stack })
}

/** README, Configuration: an omitted stack is the default one. */
export function resolve(history: History): Plan {
  return {
    body: history.body ?? README_DEFAULTS.body,
    header: history.header ?? README_DEFAULTS.header,
    given: history,
  }
}

// ---------------------------------------------------------------------------
// The model: from the plan alone, what a browser should read.
// ---------------------------------------------------------------------------

export type Expected =
  | { throws: Array<'bodyFontFamily' | 'headerFontFamily'> }
  | { body: Array<Slot>; header: Array<Slot>; options: { body: Array<Entry>; header: Array<Entry> } }

const isValidStack = (s: Array<Entry>): s is Array<string> =>
  s.length > 0 && s.every((e) => typeof e === 'string')

// CSS Syntax 3 §3.3 and §4.3.7: no CSS text can carry NUL or a lone
// surrogate, raw or escaped; a browser reads U+FFFD instead.
const representable = (name: string) =>
  Array.from(name, (ch) => {
    const cp = ch.codePointAt(0)!
    return cp === 0 || (cp >= 0xd800 && cp <= 0xdfff) ? '�' : ch
  }).join('')

// L3: an entry that starts with `var(` and, with each `<` escaped as `\3c `,
// reads as a font-family list whose first item is that var(): its items. A
// generic() item makes it a name, as R1 makes generic() a name elsewhere.
// L3 (law delta S1, review T1): each "<", written raw or as the escape "\<",
// becomes "\3c ", which CSS reads as the same character. After an escaped
// backslash ("\\") the "<" is raw, so it is escaped.
export const escapeLessThan = (text: string) =>
  text.replace(/(\\*)</g, (_, slashes: string) =>
    slashes.length % 2 === 1 ? `${slashes.slice(1)}\\3c ` : `${slashes}\\3c `,
  )
// L3 (law deltas S1 and 2026-11-12, "pass through raw"): an entry that
// starts with a well-formed var() and, with each "<" escaped, is a
// <declaration-value> (no top-level ";" or "!", nothing left open) passes
// through as that text. CSS reads it only after substitution, so the text is
// the promise.
const varRawEntry = (entry: string) =>
  /^var\(/i.test(entry) && startsWithVarDeclaration(escapeLessThan(entry))

// A slot of the expected list: one item, or a var() entry's text.
export type Slot = FamilyItem | { raw: string }

/** One entry's item. Each branch is one sentence of the law. */
export function expectedItem(entry: string, stackLength: number): FamilyItem {
  const word = asciiLower(entry)
  // L4: a CSS-wide word is a keyword only as the whole value.
  if (stackLength === 1 && CSS_WIDE_KEYWORDS.includes(word)) return { keyword: word }
  // L2: the keyword table, in any ASCII case.
  if (GENERIC_KEYWORDS.includes(word)) return { generic: word }
  // L1, L2 (generic(...), law delta R1), and L4: everything else, `default`
  // and CSS-wide words in a list included, is a family name.
  return { name: representable(entry) }
}

/** One entry's slot: a var() entry's text (L3), or its one item. */
export function expectedSlot(entry: string, stackLength: number): Slot {
  return varRawEntry(entry) ? { raw: escapeLessThan(entry) } : expectedItem(entry, stackLength)
}

export function model(plan: Plan): Expected {
  const invalid = (
    [
      ['bodyFontFamily', plan.body],
      ['headerFontFamily', plan.header],
    ] as const
  )
    .filter(([, s]) => !isValidStack(s))
    .map(([option]) => option)
  if (invalid.length) return { throws: invalid }
  const items = (s: Array<string>) => s.map((e) => expectedSlot(e, s.length))
  return {
    body: items(plan.body as Array<string>),
    header: items(plan.header as Array<string>),
    options: { body: plan.body, header: plan.header },
  }
}

/** The law an item's mismatch breaks. */
export function lawOfItem(entry: Entry, item: Slot | undefined): string {
  if (typeof entry === 'string' && varRawEntry(entry)) return L3
  if (!item) return L1
  if ('keyword' in item) return L4
  if ('generic' in item) return L2
  if ('var' in item) return L3
  const word = typeof entry === 'string' ? asciiLower(entry) : ''
  if (word === 'default' || CSS_WIDE_KEYWORDS.includes(word)) return L4
  return typeof entry === 'string' && looksLikeGenericFunction(entry) ? L2 : L1
}

/** An entry that CSS would read as generic(...): a family name by law delta R1. */
const looksLikeGenericFunction = (entry: string) => {
  const alone = readFamilyList(entry)
  return alone.ok && alone.items.length === 1 && 'generic' in alone.items[0] && alone.items[0].generic.startsWith('generic(')
}

// ---------------------------------------------------------------------------
// The driver: the real entry point, and only public results.
// ---------------------------------------------------------------------------

export const BASE_FONT = new Set(['font', 'fontFamily', 'fontSize', 'lineHeight'])
export const thrown = (e: unknown) => ({
  threw: true,
  name: String((e as { name?: unknown })?.name),
  message: String((e as { message?: unknown })?.message),
})

// ---------------------------------------------------------------------------
// The check: production's text, read by the independent reader, against the
// model's items.
// ---------------------------------------------------------------------------

const valueAt = (observations: ReadonlyArray<Observation>, checkpoint: string) =>
  observations.find((o) => o.checkpoint === checkpoint)?.value

// The list, piece by top-level piece: a var() entry's pieces must be its
// text, and every other piece must read, alone, as its entry's one item.
function compareList(
  checkpoint: string,
  text: unknown,
  expected: Array<Slot>,
  entries: Array<string>,
  context: 'property' | 'shorthand',
): Verdict | undefined {
  const pieces = typeof text === 'string' ? splitTopLevel(text) : undefined
  if (!pieces)
    return violation(checkpoint, 'not a valid font-family list (a string, comment, or block does not close); a browser drops it', lawOfItem(entries[0], expected[0]), { actual: text, expected })
  let p = 0
  for (let k = 0; k < expected.length; k++) {
    const slot = expected[k]
    const law = lawOfItem(entries[k], slot)
    if ('raw' in slot) {
      const own = splitTopLevel(slot.raw)!.map((piece) => piece.trim())
      const got = pieces.slice(p, p + own.length).map((piece) => piece.trim())
      p += own.length
      const d = differs(checkpoint, law, got, own, `item ${k + 1}, a var() entry, is not passed through as written`)
      if (d) return d
      continue
    }
    const piece = pieces[p++]
    const read = piece === undefined ? undefined : readFamilyList(piece, context)
    if (!read?.ok || read.items.length !== 1)
      return violation(checkpoint, `item ${k + 1} is not one valid list item (${read && !read.ok ? read.error : 'missing'}); a browser drops it`, law, { actual: text, expected })
    const d = differs(checkpoint, law, read.items[0], slot, `item ${k + 1} reads back differently`)
    if (d) return d
  }
  return p === pieces.length
    ? undefined
    : violation(checkpoint, 'the list has items no entry gave', lawOfItem(entries[entries.length - 1], expected[expected.length - 1]), { actual: text, expected })
}
export function check(plan: Plan, observations: ReadonlyArray<Observation>, expected: Expected): Verdict {
  const reference = valueAt(observations, 'reference') as { message?: string } | undefined
  if (reference) return violation('reference', `typography() threw on the plain stack ['serif']: ${reference.message}`, NO_THROW)
  const call = valueAt(observations, 'typography()') as { threw: boolean; message?: string } | undefined
  if ('throws' in expected) {
    if (!call?.threw)
      return violation('typography()', `typography() returned for an invalid ${expected.throws.join(' and ')}`, L5)
    if (!expected.throws.every((option) => call.message?.includes(option)))
      return violation('typography()', 'the error does not name every invalid option', L5, {
        actual: call.message,
        expected: expected.throws,
      })
    return pass
  }
  if (call?.threw) return violation('typography()', `typography() threw on valid stacks: ${call.message}`, NO_THROW)
  // The stylesheet call that a driver reads: toJSON() in Node, toString() in Chrome.
  for (const call of ['toJSON()', 'toString()']) {
    const late = valueAt(observations, call) as { message?: string } | undefined
    if (late) return violation(call, `${call} threw on valid stacks: ${late.message}`, NO_THROW)
  }

  const body = plan.body as Array<string>
  const header = plan.header as Array<string>
  // No entry puts a `<` in the stylesheet, so it can sit in a <style>
  // element: names (L1, law delta R10) and var() entries (L3, law delta S1)
  // alike. The law broken is L3 when only a var() entry holds a `<`.
  const sheet = valueAt(observations, 'stylesheet') as { lessThan: boolean } | undefined
  if (sheet?.lessThan) {
    const items = [...expected.body, ...expected.header]
    const nameHasIt = items.some((item) => 'name' in item && item.name.includes('<'))
    const varHasIt = [...body, ...header].some((e) => varRawEntry(e) && e.includes('<'))
    return violation('stylesheet', 'the stylesheet holds a "<", so it can close its <style> element', varHasIt && !nameHasIt ? L3 : L1)
  }
  // L1 (decision Q6): `-apple-system` stays an unquoted identifier, the form
  // WebKit treats as its system font. Only raw text shows quoting; a CSSOM
  // serialization prints the name bare either way.
  for (const [checkpoint, entries] of [
    ['body.fontFamily', body],
    ...[1, 2, 3, 4, 5, 6].map((level) => [`h${level}.fontFamily`, header] as const),
  ] as const) {
    const text = String(valueAt(observations, checkpoint))
    if (entries.includes('-apple-system') && !/(^|,)[ \t\n]*-apple-system[ \t\n]*(,|$)/.test(text))
      return violation(checkpoint, '-apple-system is not an unquoted identifier', L1, { actual: text, expected: '-apple-system, unquoted' })
  }
  const bodyText = valueAt(observations, 'body.fontFamily')
  const verdict =
    differs('options', L0, valueAt(observations, 'options'), expected.options) ??
    compareList('body.fontFamily', bodyText, expected.body, body, 'property') ??
    checkHtml(observations, expected.body, body) ??
    [1, 2, 3, 4, 5, 6]
      .map((level) => {
        const text = valueAt(observations, `h${level}.fontFamily`)
        return compareList(`h${level}.fontFamily`, text, expected.header, header, 'property')
      })
      .find(Boolean)
  return verdict ?? pass
}

// `html` carries the body stack (L1), and keeps the reference's base size and
// line height, which the stack must not change (L1; L4 when the stack is a
// lone CSS-wide keyword and needs longhands).
function checkHtml(observations: ReadonlyArray<Observation>, expected: Array<Slot>, entries: Array<string>) {
  const html = readBaseFont(valueAt(observations, 'html') as Array<[string, unknown]>)
  const reference = readBaseFont(valueAt(observations, 'reference html') as Array<[string, unknown]>)
  const law = expected.length === 1 && 'keyword' in expected[0] ? L4 : L1
  return (
    (html.familyText === undefined
      ? violation('html', `not a valid font-family list (${html.family && !html.family.ok ? html.family.error : 'missing'}); a browser drops it`, law, { actual: valueAt(observations, 'html'), expected })
      : compareList('html', html.familyText, expected, entries, html.familyContext ?? 'property')) ??
    differs('html', law, { fontSize: html.fontSize, lineHeight: html.lineHeight }, { fontSize: reference.fontSize, lineHeight: reference.lineHeight }, 'the base font size or line height changed')
  )
}

// ---------------------------------------------------------------------------
// Reach: the states each law needs, from the plan.
// ---------------------------------------------------------------------------

export const STATES = {
  apostrophe: 'a name with an apostrophe',
  backslash: 'a name with a backslash',
  lineBreak: 'a name with a line break (LF, CR, or FF)',
  unrepresentable: 'a name with NUL or a lone surrogate',
  emptyName: 'an empty name',
  casedGeneric: 'a generic not in lower case',
  fonts4Generic: 'a CSS Fonts 4 generic (system-ui, math, ui-*)',
  genericFunction: 'a generic() entry (a name)',
  lessThan: 'a name with <',
  varLessThan: 'a var() with <',
  varReference: 'a var() reference',
  malformedVar: 'a malformed var()',
  wordInList: 'a CSS-wide word or default in a longer stack',
  loneBody: 'a lone CSS-wide keyword as the body stack',
  loneHeader: 'a lone CSS-wide keyword as the header stack',
  appleSystem: 'the -apple-system vendor name',
  emptyStack: 'an empty stack',
  nonString: 'a non-string entry',
  bothInvalid: 'both stacks invalid',
  omitted: 'an omitted (undefined) stack',
  varList: 'a var() entry that continues as a list',
  varText: 'a var() entry with text that is not a list',
} as const

export function reached(plan: Plan): Array<string> {
  const states = new Set<string>()
  if (plan.given.body === undefined || plan.given.header === undefined) states.add(STATES.omitted)
  const bodyOk = isValidStack(plan.body)
  const headerOk = isValidStack(plan.header)
  for (const s of [plan.body, plan.header]) {
    if (s.length === 0) states.add(STATES.emptyStack)
    if (s.some((e) => typeof e !== 'string')) states.add(STATES.nonString)
  }
  if (!bodyOk && !headerOk) states.add(STATES.bothInvalid)
  if (!bodyOk || !headerOk) return [...states]
  for (const [s, lone] of [
    [plan.body as Array<string>, STATES.loneBody],
    [plan.header as Array<string>, STATES.loneHeader],
  ] as const) {
    for (const e of s) {
      if (varRawEntry(e)) {
        states.add(STATES.varReference)
        const text = escapeLessThan(e)
        if (!readFamilyList(text).ok) states.add(STATES.varText)
        else if (splitTopLevel(text)!.length > 1) states.add(STATES.varList)
        if (e.includes('<')) states.add(STATES.varLessThan)
        continue
      }
      const item = expectedItem(e, s.length)
      const word = asciiLower(e)
      if ('keyword' in item) states.add(lone)
      else if ('generic' in item) {
        if (e !== word) states.add(STATES.casedGeneric)
        if (['system-ui', 'math'].includes(word) || word.startsWith('ui-')) states.add(STATES.fonts4Generic)
      } else {
        if ((MALFORMED_VAR as ReadonlyArray<string>).includes(e)) states.add(STATES.malformedVar)
        if ((word === 'default' || CSS_WIDE_KEYWORDS.includes(word)) && s.length > 1) states.add(STATES.wordInList)
        if (e === '-apple-system') states.add(STATES.appleSystem)
        if (looksLikeGenericFunction(e)) states.add(STATES.genericFunction)
        if (e.includes('<')) states.add(STATES.lessThan)
        if (e.includes("'")) states.add(STATES.apostrophe)
        if (e.includes('\\')) states.add(STATES.backslash)
        if (/[\n\r\f]/.test(e)) states.add(STATES.lineBreak)
        if (representable(e) !== e) states.add(STATES.unrepresentable)
        if (e === '') states.add(STATES.emptyName)
      }
    }
  }
  return [...states]
}

// Constructed histories put one entry in front of a valid body stack, keeping
// the generated rest of it, and keep the header valid.
export const strings = (s: Array<Entry> | undefined) => (s ?? []).filter((e): e is string => typeof e === 'string')
const validHeader = (h: History) => (strings(h.header).length ? strings(h.header) : ['serif'])
const withBodyEntry = (entry: string) => (h: History): History => ({
  body: [entry, ...strings(h.body)].slice(0, MAX_STACK).length >= 2
    ? [entry, ...strings(h.body)].slice(0, MAX_STACK)
    : [entry, 'serif'],
  header: validHeader(h),
})

// The default stacks (README, Configuration) and every shipped theme's
// stacks: the known valid examples the grammar must reconstruct (ORC-004).
export const README_DEFAULTS: { body: Array<string>; header: Array<string> } = {
  body: ['georgia', 'serif'],
  header: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
}
const packagesDir = fileURLToPath(new URL('../packages', import.meta.url))
const themes = readdirSync(packagesDir).filter((p) => p.startsWith('typography-theme-'))
const themeHistories = await Promise.all(
  themes.map(async (name) => {
    const theme = (await import(`../packages/${name}/src/index.js`)).default
    return {
      name: `theme ${name.replace('typography-theme-', '')}`,
      history: {
        body: theme.bodyFontFamily ?? README_DEFAULTS.body,
        header: theme.headerFontFamily ?? README_DEFAULTS.header,
      },
    }
  }),
)

export function declaredStates(): Array<string> {
  return Object.values(STATES)
}

export function constructedHistories(): Array<ConstructedHistory<History>> {
  return [
      { name: "Font's Name", enters: [STATES.apostrophe], build: withBodyEntry("Font's Name") },
      { name: 'a backslash', enters: [STATES.backslash], build: withBodyEntry('Back\\slash') },
      { name: 'LF, CR, and FF', enters: [STATES.lineBreak], build: (h) => ({ ...withBodyEntry('Line\nBreak')(h), header: ['Car\rriage', 'Form\ffeed', 'serif'] }) },
      { name: 'NUL and a lone surrogate', enters: [STATES.unrepresentable], build: (h) => ({ ...withBodyEntry('Nul\0')(h), header: ['Half \uD800', 'serif'] }) },
      { name: 'an empty name', enters: [STATES.emptyName], build: withBodyEntry('') },
      { name: 'Sans-Serif (wordpress-kubrick)', enters: [STATES.casedGeneric], build: withBodyEntry('Sans-Serif') },
      { name: 'system-ui', enters: [STATES.fonts4Generic], build: withBodyEntry('system-ui') },
      { name: 'GENERIC( Kai )', enters: [STATES.genericFunction], build: withBodyEntry('GENERIC( Kai )') },
      { name: 'a name with </style>', enters: [STATES.lessThan], build: withBodyEntry('</style>') },
      { name: "var(--f, '</style>')", enters: [STATES.varReference, STATES.varLessThan], build: withBodyEntry("var(--f, '</style>')") },
      { name: 'a var() entry that continues as a list', enters: [STATES.varReference, STATES.varList], build: withBodyEntry("var(--brand-font), 'Lato', sans-serif") },
      { name: 'a var() entry with text that is not a list', enters: [STATES.varReference, STATES.varText], build: withBodyEntry('var(--f) x') },
      { name: 'var(--brand-font)', enters: [STATES.varReference], build: withBodyEntry('var(--brand-font)') },
      { name: 'var(--f', enters: [STATES.malformedVar], build: withBodyEntry('var(--f') },
      { name: 'default and inherit in a list', enters: [STATES.wordInList], build: (h) => ({ ...withBodyEntry('default')(h), header: ['Lato', 'Inherit'] }) },
      { name: 'inherit alone (body)', enters: [STATES.loneBody], build: (h) => ({ body: ['inherit'], header: validHeader(h) }) },
      { name: 'UNSET alone (header)', enters: [STATES.loneHeader], build: (h) => ({ body: strings(h.body).length ? strings(h.body) : ['serif'], header: ['UNSET'] }) },
      { name: '-apple-system', enters: [STATES.appleSystem], build: withBodyEntry('-apple-system') },
      { name: 'an empty body stack', enters: [STATES.emptyStack], build: (h) => ({ body: [], header: validHeader(h) }) },
      { name: 'a number in the header stack', enters: [STATES.nonString], build: (h) => ({ body: ['serif'], header: [...strings(h.header).slice(0, MAX_STACK - 1), 42] }) },
      { name: 'an omitted body stack', enters: [STATES.omitted], build: (h) => ({ body: undefined, header: h.header }) },
      { name: 'both stacks invalid', enters: [STATES.bothInvalid, STATES.emptyStack, STATES.nonString], build: () => ({ body: [], header: [null, 'serif'] }) },
  ]
}

export const FIXED_HISTORIES: Array<FixedHistory<History>> = [
      { name: 'README defaults', history: README_DEFAULTS },
      { name: 'R5: both stacks undefined', history: { body: undefined, header: undefined } },
      { name: "T1: an escaped < in a var() fallback", history: { body: ["var(--f, '\\<')", 'serif'], header: ['serif'] } },
      { name: 'T1 sibling: two comments around a stray token in var()', history: { body: ['var(/**/x/**/--f)', 'serif'], header: ['serif'] } },
      { name: 'V6: var() text that is not a list passes through', history: { body: ['var(--f) x', 'serif'], header: ['var(--f), , serif'] } },
      { name: 'V6 sibling: a NUL in a custom property name', history: { body: ['var(--\u0000)', 'serif'], header: ['serif'] } },
      { name: 'restored #307: a whole list in one var() entry', history: { body: ["var(--brand-font), 'Lato', sans-serif"], header: ['var(--f) ', 'serif'] } },
      { name: 'R5: an undefined header beside an invalid body', history: { body: [], header: undefined } },
      // The var() recognizer's parts, one witness each (design grammar card).
      {
        name: 'var() parts',
        history: {
          body: ['VAR(--f)', 'var(--f, calc(1))', "var(--f, 'a)b')", 'var(--f, \\))', 'var(--f , serif)', 'var(f)', 'var(--)', 'var(--f x)', 'var(--f) x)', "var(--f, 'x)", 'xyz(--f)', 'serif'],
          header: ["var(--f, 'a\nb')", 'env(--f)', 'var(--f', 'serif'],
        },
      },
      // One law each, so a RED on old code names that law first (review R5).
      { name: 'L4: inherit in a list', history: { body: ['Lato', 'inherit'], header: ['serif'] } },
      { name: 'L4: default first', history: { body: ['default', 'serif'], header: ['serif'] } },
      { name: 'L5: an empty body stack', history: { body: [], header: ['serif'] } },
      { name: 'L5: a number in the header', history: { body: ['serif'], header: ['Lato', 42] } },
      // The review's witnesses (ledger R1, R2, R3, R7, R10).
      { name: 'R1/R2: generic() spellings', history: { body: ['generic(kai)', 'GENERIC( Kai )', 'generic(/**/fangsong/**/)', 'serif'], header: ['serif'] } },
      { name: 'R3: var() with a comment or an escape', history: { body: ['var(--f, /*)*/ serif)', 'var(--\\66 )', 'var(/**/--f)', 'serif'], header: ['serif'] } },
      { name: 'R7: both stacks empty', history: { body: [], header: [] } },
      { name: 'R10: </style> in a name', history: { body: ['</style><script>', 'serif'], header: ['serif'] } },
      // The second review's witnesses (ledger S1, S2, S3).
      { name: 'S1: < in var() fallbacks', history: { body: ["var(--f, '</style>')", 'var(--f, a<b)', 'serif'], header: ['serif'] } },
      { name: 'S2: a < name beside a var() in the other stack', history: { body: ['</style>', 'serif'], header: ['var(--f)', 'serif'] } },
      // The prep-pr review's witnesses (A1, A2): each would swallow the rest of
      // the stylesheet if passed through.
      { name: 'A1/A2: blocks and url() in var() fallbacks', history: { body: ['var(--f, {)', 'var(--f, [)', 'var(--f, })', 'var(--f, url(x"y)"))', 'var(--f, url(a b))', 'var(--f, a;b)', 'serif'], header: ['var(--f, {a;b})', "var(--f, url('a)b'))", 'var(--f, /*)', 'var(--f, ")', 'serif'] } },
      { name: 'S3: text before var() makes a name, text after it continues the list', history: { body: ['/**/var(--f)', 'var(--f)/**/', ' var(--f)', 'var(--f) ', 'serif'], header: ['serif'] } },
      ...themeHistories,
]

export const LAW = {
  statement:
    'For every bodyFontFamily and headerFontFamily stack: an empty stack or a non-string entry makes typography() throw an error naming every invalid option, an undefined stack is the README default, and every other stack returns (L5). options keeps the entries as given (L0). Each entry reaches body, html, and h1–h6 font-family as one list item that a CSS reader reads as: the same family name, with NUL and lone surrogates as U+FFFD, and with no "<" in the stylesheet (L1); the generic family, for a CSS Fonts 4 generic keyword in any ASCII case, while a generic(...) entry is a family name (L2); the items of the entry, unchanged except that each "<" (raw or \\<) becomes the escape \\3c, for an entry that starts with a well-formed var() and continues as a font-family list (L3); a family name, for a CSS-wide word or default in a stack of two or more, and the keyword, for a CSS-wide word alone (L4); -apple-system stays an unquoted identifier (L1). The list is valid CSS, html carries the body list, and html keeps the base size and line height of a plain stack.',
  authority:
    'README, Configuration (bodyFontFamily, headerFontFamily: "an array of strings specifying the font family stack"). CSS Fonts 4 (W3C WD 4 Nov 2026) §2.1, §2.1.1, §2.1.2. CSS Syntax 3 (W3C CRD 1 Oct 2026) §3.3, §4.3, §4.3.5, §4.3.7. CSS Values 4 (W3C WD 12 Mar 2024) §2.1, §4.1, §9. CSS 2.1 §15.3. #307 (var() support). Maintainer decisions 2026-11-11 (oracles/SKETCHES.md S1, Decisions and Law delta): follow the spec; lone CSS-wide keyword is the keyword with html longhands; empty or non-string stacks are errors naming every invalid option; generic(...) is a family name until browsers implement it; no entry puts "<" in the stylesheet (var() included); an entry with text around var() is a family name.',
}

// An entry as its expected items, written back as CSS.
const written = (e: string, n: number) => serialize(expectedSlot(e, n))

export const calibrations: Array<Calibration<History, Plan>> = [
    {
      // The code before the fix: names in single quotes, nothing escaped.
      name: 'names quoted without escaping',
      law: L1,
      corrupt: (trace, plan) => {
        const names = strings(plan.body).filter((e) => lawOfItem(e, expectedItem(e, plan.body.length)) === L1 && 'name' in expectedItem(e, plan.body.length))
        if (strings(plan.body).some((e) => varRawEntry(e) && /['\\\n\r\f]/.test(e))) return undefined
        if (!isValidStack(plan.header) || !names.some((n) => /['\\\n\r\f]/.test(n))) return undefined
        const naive = strings(plan.body)
          .map((e) => (lawOfItem(e, expectedItem(e, plan.body.length)) === L1 && 'name' in expectedItem(e, plan.body.length) ? `'${e}'` : written(e, plan.body.length)))
          .join(',')
        return replace(trace, 'body.fontFamily', naive)
      },
    },
    {
      // The code before the fix: only lower-case CSS 2.1 keywords stay unquoted.
      name: 'generics matched case-sensitively',
      law: L2,
      corrupt: (trace, plan) => {
        if (!isValidStack(plan.body) || !isValidStack(plan.header)) return undefined
        if (!plan.body.some((e) => 'generic' in expectedItem(e, plan.body.length) && e !== asciiLower(e))) return undefined
        return replace(trace, 'body.fontFamily', plan.body.map((e) => {
          const item = expectedItem(e, plan.body.length)
          return 'generic' in item && e !== asciiLower(e) && !varRawEntry(e) ? `'${e}'` : written(e, plan.body.length)
        }).join(','))
      },
    },
    {
      name: 'var() quoted as a name',
      law: L3,
      corrupt: (trace, plan) => {
        if (!isValidStack(plan.body) || !isValidStack(plan.header)) return undefined
        if (!plan.body.some((e) => varRawEntry(e))) return undefined
        return replace(trace, 'body.fontFamily', plan.body.map((e) => (varRawEntry(e) ? serialize({ name: e }) : written(e, plan.body.length))).join(','))
      },
    },
    {
      // The code before the fix: inherit and default stay unquoted in a list.
      name: 'inherit left unquoted in a list',
      law: L4,
      corrupt: (trace, plan) => {
        if (!isValidStack(plan.body) || !isValidStack(plan.header) || plan.body.length < 2) return undefined
        const isWord = (e: string) => e === 'default' || e === 'inherit'
        if (!plan.body.some(isWord)) return undefined
        return replace(trace, 'body.fontFamily', plan.body.map((e) => (isWord(e) ? e : written(e, plan.body.length))).join(','))
      },
    },
    {
      name: 'a lone keyword in the font shorthand',
      law: L4,
      corrupt: (trace, plan) =>
        plan.body.length === 1 && isValidStack(plan.header) && 'keyword' in expectedItem(String(plan.body[0]), 1)
          ? replace(trace, 'html', [['font', `100%/1.45 ${String(plan.body[0])}`]])
          : undefined,
    },
    {
      // The code before the fix: an empty stack gives an empty font-family.
      name: 'an empty stack accepted',
      law: L5,
      corrupt: (trace, plan) =>
        plan.body.length === 0 || plan.header.length === 0 ? replace(trace, 'typography()', { threw: false }) : undefined,
    },
    {
      // The code before review R7: the error names only the first invalid option.
      name: 'only the first invalid option named',
      law: L5,
      corrupt: (trace, plan) =>
        !isValidStack(plan.body) && !isValidStack(plan.header)
          ? replace(trace, 'typography()', { threw: true, name: 'TypeError', message: 'typography: a font stack must be a non-empty array of strings (invalid: bodyFontFamily)' })
          : undefined,
    },
    {
      // The code before review R10: a "<" in a name reaches the stylesheet.
      name: 'a < left raw in a name',
      law: L1,
      corrupt: (trace, plan) => {
        const expected = model(plan)
        if ('throws' in expected) return undefined
        const hasLessThan = [...expected.body, ...expected.header].some((item) => 'name' in item && item.name.includes('<'))
        return hasLessThan ? replace(trace, 'stylesheet', { lessThan: true }) : undefined
      },
    },
    {
      // The check before the second review's S2: one var() anywhere turned the
      // "<" rule off. This wrong answer only applies beside a var().
      name: 'a < left raw in a name, beside a var()',
      law: L1,
      corrupt: (trace, plan) => {
        const expected = model(plan)
        if ('throws' in expected) return undefined
        const items = [...expected.body, ...expected.header]
        const nameHasIt = items.some((item) => 'name' in item && item.name.includes('<'))
        const varHasIt = strings([...plan.body, ...plan.header]).some((e) => varRawEntry(e) && e.includes('<'))
        return nameHasIt && !varHasIt && items.some((item) => 'raw' in item) ? replace(trace, 'stylesheet', { lessThan: true }) : undefined
      },
    },
    {
      // The code before the second review's S1: var() passed through with its "<".
      name: 'a < left raw in a var()',
      law: L3,
      corrupt: (trace, plan) => {
        const expected = model(plan)
        if ('throws' in expected) return undefined
        if ([...expected.body, ...expected.header].some((item) => 'name' in item && item.name.includes('<'))) return undefined
        const varHasIt = strings([...plan.body, ...plan.header]).some((e) => varRawEntry(e) && e.includes('<'))
        return varHasIt ? replace(trace, 'stylesheet', { lessThan: true }) : undefined
      },
    },
    {
      // The code before review R1: generic(...) emitted unquoted, as a generic.
      name: 'generic() emitted unquoted',
      law: L2,
      corrupt: (trace, plan) => {
        if (!isValidStack(plan.body) || !isValidStack(plan.header)) return undefined
        if (!plan.body.some((e) => looksLikeGenericFunction(e))) return undefined
        return replace(trace, 'body.fontFamily', plan.body.map((e) => (looksLikeGenericFunction(e) ? e : written(e, plan.body.length))).join(','))
      },
    },
    {
      // A wrong design the gap check found (mutant M44): -apple-system quoted.
      name: '-apple-system quoted',
      law: L1,
      corrupt: (trace, plan) =>
        strings(plan.body).includes('-apple-system') && isValidStack(plan.header) && isValidStack(plan.body)
          ? replace(trace, 'body.fontFamily', String(trace.find((o) => o.checkpoint === 'body.fontFamily')?.value).replace('-apple-system', "'-apple-system'"))
          : undefined,
    },
    {
      name: 'options trimmed',
      law: L0,
      corrupt: (trace, plan) => {
        if (!isValidStack(plan.body) || !isValidStack(plan.header)) return undefined
        if (!plan.body.some((e) => e !== e.trim())) return undefined
        return replace(trace, 'options', { body: plan.body.map((e) => e.trim()), header: plan.header })
      },
    },
]

// A correct serialization, for calibrations only: every name double-quoted
// with CSS escapes.
export function serialize(item: Slot): string {
  if ('raw' in item) return item.raw
  if ('name' in item)
    return `"${Array.from(item.name, (c) => {
      const cp = c.codePointAt(0)!
      return c === '"' || c === '\\' ? `\\${c}` : cp < 0x20 || cp === 0x7f ? `\\${cp.toString(16)} ` : c
    }).join('')}"`
  return 'generic' in item ? item.generic : 'var' in item ? item.var : item.keyword
}

export function replace(trace: ReadonlyArray<Observation>, checkpoint: string, value: unknown) {
  return trace.map((o) => (o.checkpoint === checkpoint ? { ...o, value } : o))
}
