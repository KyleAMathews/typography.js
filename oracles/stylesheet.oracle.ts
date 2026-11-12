/*
This oracle owns typography.js's promise that `toString()` is the stylesheet
`toJSON()` describes, and that the documented options, plugins, and overrides
shape it as the README says. It is checked on `typography(options)`: its
`toJSON()`, its `toString()`, and its rhythm. It owns
`packages/typography/src/utils/compileStyles.js`, the rules in
`createStyles.js`, and `typography-plugin-code`.

```js
typography({ bodyColor: '#333' }).toString()              // → body { color: #333 }
typography({ overrideStyles: () => ({ ':root': { '--brandColor': 'red' } }) }).toString()
                                                          // → :root { --brandColor: red } (the name as written)
typography({ overrideStyles: () => ({ h1: { color: 'red' } }), overrideThemeStyles: () => ({ h1: { color: 'blue' } }) })
                                                          // → h1 { color: blue }: overrideThemeStyles comes last
typography({ blockMarginBottom: 2 }).toJSON().p.marginBottom // → rhythm(2)
typography({ bodyColor: 'red</style><script>' }).toString() // → throws, naming body and color
```

Why does the serialization need a law of its own? `toJSON()` is plain data,
so every snapshot of it can look right while `toString()`, the text a browser
reads, is wrong. A custom property `--brandColor` was written `--brand-color`,
a different property: custom property names are case-sensitive (CSS Variables
1 §2). A value with `}` closed its rule early and turned the rest of the
stylesheet into garbage, and a value with `<` closed the `<style>` element
that `TypographyStyle` renders on the server.

S4. For every stylesheet typography.js builds, `toString()` reads, rule by
rule, as `toJSON()`: each key a rule (an object value a nested rule, such as
`@media`), each property in kebab case, a vendor prefix (Webkit, Moz, ms, O)
with its leading dash, a custom property as written, and each value as given.
A `null` value is no declaration. normalize.css comes first exactly when
`includeNormalize` is not false. A value or selector that is not safe CSS
(`<`; a stray `}`, `;`, or `!`, where a trailing `!important` is CSS; an open
string; a nonfinite number; anything but a string or number) makes
`toString()` throw a RangeError naming the selector and the property
(engineer decisions 2026-11-12, Q4a).
S5. `headerColor` and `headerWeight` reach h1–h6, `bodyColor` and
`bodyWeight` reach body, and `boldWeight` reaches b, strong, dt, and th, as
given (README, Configuration). Spacing is in rhythm units: every block
element's bottom margin is `blockMarginBottom` (a number or numeric string is
rhythm units, a CSS length is used as is), blockquote side margins and list
indents are one rhythm, list items and their nested lists half the block
margin, and table cells two thirds (sides) and one half (top) of a rhythm
(engineer decision 2026-11-12, Q4b). The code plugin's `pre` padding is the
block margin too.
S6. Plugins run in order, then `overrideStyles`, then `overrideThemeStyles`
(README). Each layer is deep-merged over the styles before it: its value for
a rule and property replaces the earlier one, a `null` removes it, and
everything it does not name stays.

The model reads the plan alone. It layers the generated style objects and
the options to predict each named declaration. Spacing is checked against
the rhythm that `typography.rhythm()` returns for the same options, a
relation, since the numeric oracles judge the rhythm itself. The check reads
`toString()` with an independent CSS reader (`css-rule-reader.ts`) and
compares it with `toJSON()` and with the model.

Limits: the default rules' design values (grays, borders, the code size) are
pinned by the theme snapshots, not by this law. Property names with two
capitals in a row are not generated. Whether a browser keeps each default
declaration is the Chrome witness's question (`stylesheet.chrome.oracle.ts`).
*/
import fc from 'fast-check'
import { differs, oracleProperty, pass, violation } from '@tanstack/oracles'
import type { Observation } from '@tanstack/oracles'
import typography from '../packages/typography/src/index.js'
import codePlugin from '../packages/typography-plugin-code/src/index.js'
import normalize from '../packages/typography-normalize/src/index.js'
import { readStylesheet, StylesheetError } from './css-rule-reader'
import type { Rule } from './css-rule-reader'

const S4 = 'S4 toString() is the stylesheet toJSON() describes'
const S5 = 'S5 documented options and rhythm spacing'
const S6 = 'S6 plugins and overrides merge in order'

// ---------------------------------------------------------------------------
// Grammar: options, and style layers built from entries.
// ---------------------------------------------------------------------------

type Value = string | number | boolean | null | undefined
type Entry = { media: boolean; selector: string; property: string; value: Value }
type History = {
  options: {
    headerColor: Value
    bodyColor: Value
    headerWeight: Value
    bodyWeight: Value
    boldWeight: Value
    blockMarginBottom: Value
    includeNormalize: boolean | undefined
  }
  plugins: Array<Array<Entry>>
  codePlugin: boolean
  overrideStyles: Array<Entry> | undefined
  overrideThemeStyles: Array<Entry> | undefined
}

const MEDIA = '@media (max-width:480px)'
// Safe CSS values, including a string that holds ";" and "}", and a trailing
// !important. Unsafe ones break the rule, the stylesheet, or the <style>.
// 'a {b}' is safe for a custom property only (review W5); '\\(a' holds an
// escaped "(" that opens no block.
const SAFE_VALUES: Array<Value> = ['red', '#123456', '1.5rem', 0, 12, 'calc(1em + 2px)', 'var(--x)', "'a;b}'", 'url(a.png)', 'red !important', 'inherit', 'var(--x, {a})', 'a {b}', '\\(a']
// 'a\\': a lone backslash at the end escapes the ";" after it (review W1).
const UNSAFE_VALUES: Array<Value> = ['red</style>', 'red}', 'a;b', 'red !importan', "'open", NaN, true, '!important', 'a\\']
const PROPERTIES = ['color', 'marginTop', 'fontSize', 'WebkitFontSmoothing', 'MozOsxFontSmoothing', 'msTextSizeAdjust', 'OTransition', '--brandColor', '--x-y']
const SELECTORS = ['h1', 'p', 'body', '.post', ':root', 'a:hover', 'ul li', 'h2,h3', 'blockquote']
const UNSAFE_SELECTORS = ['h1</style>', 'p{', 'p;']

const value = fc.oneof(
  { weight: 8, arbitrary: fc.constantFrom(...SAFE_VALUES) },
  { weight: 1, arbitrary: fc.constantFrom(...UNSAFE_VALUES) },
  { weight: 1, arbitrary: fc.constantFrom(null, undefined) },
)
const entry = fc.record({
  media: fc.boolean(),
  selector: fc.oneof({ weight: 12, arbitrary: fc.constantFrom(...SELECTORS) }, { weight: 1, arbitrary: fc.constantFrom(...UNSAFE_SELECTORS) }),
  property: fc.constantFrom(...PROPERTIES),
  value,
})
const layer = fc.array(entry, { maxLength: 5 })
const color = fc.oneof(
  { weight: 6, arbitrary: fc.constantFrom<Value>(undefined, 'red', '#333', 'hsla(0,0%,0%,0.8)', 'var(--fg)', 'inherit') },
  { weight: 1, arbitrary: fc.constantFrom<Value>('red</style>', 'red}', null) },
)
const weight = fc.constantFrom<Value>(undefined, 400, 700, 'bold', 'normal', '600')
const arbitrary: fc.Arbitrary<History> = fc.record({
  options: fc.record({
    headerColor: color,
    bodyColor: color,
    headerWeight: weight,
    bodyWeight: weight,
    boldWeight: weight,
    // null is one rhythm, as v0.16 read it.
    blockMarginBottom: fc.constantFrom<Value>(undefined, null, 0.5, 1, 2, '1', '1.5rem', '20px'),
    includeNormalize: fc.constantFrom(undefined, true, false),
  }),
  plugins: fc.array(layer, { maxLength: 2 }),
  codePlugin: fc.boolean(),
  overrideStyles: fc.option(layer, { nil: undefined }),
  overrideThemeStyles: fc.option(layer, { nil: undefined }),
})

const toObject = (entries: Array<Entry>) => {
  const out: Record<string, Record<string, unknown>> = {}
  for (const e of entries) {
    const scope = e.media ? ((out[MEDIA] ??= {}) as Record<string, Record<string, unknown>>) : out
    scope[e.selector] = { ...(scope[e.selector] as object), [e.property]: e.value }
  }
  return out
}

// ---------------------------------------------------------------------------
// The model: the layered value of each named declaration, and safety.
// ---------------------------------------------------------------------------

// CSS Syntax 3 §5.4.6: a top-level {} block is a custom property's only; a
// non-custom declaration with one and any other value is dropped.
const isSafeText = (v: string, custom: boolean) => {
  if (v.includes('<')) return false
  // A trailing !important is CSS, but only after a value.
  const body = v.replace(/\s*!\s*important\s*$/i, '')
  if (body.trim() === '') return false
  let quote: string | undefined
  let depth = 0
  for (let k = 0; k < body.length; k++) {
    const c = body[k]
    if (quote) {
      if (c === '\\') k++
      else if (c === quote) quote = undefined
      continue
    }
    if (c === '\\') {
      // An escape: a backslash, then a character other than a line break.
      if (k + 1 >= body.length || /[\n\r\f]/.test(body[k + 1])) return false
      k++
    } else if (c === '"' || c === "'") quote = c
    else if (c === '{' && depth === 0 && !custom) return false
    else if (c === '(' || c === '{' || c === '[') depth++
    else if (c === ')' || c === '}' || c === ']') depth--
    // At the top, or a function's top (a var() fallback's top, CSS Variables 1).
    else if ((c === ';' || c === '!') && depth <= 1) return false
    if (depth < 0) return false
  }
  return !quote && depth === 0
}
const isSafeValue = (v: Value, property: string) =>
  v === null || v === undefined || (typeof v === 'number' && Number.isFinite(v)) || (typeof v === 'string' && isSafeText(v, property.startsWith('--')))
const isSafeSelector = (s: string) => !/[<{};]/.test(s)

// Keys: scope ("" or MEDIA), selector, property.
type Key = string
const key = (scope: string, selector: string, property: string): Key => JSON.stringify([scope, selector, property])
// The documented option effects (S5), before any layer.
const BLOCKS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hgroup', 'ul', 'ol', 'dl', 'dd', 'p', 'figure', 'pre', 'table', 'fieldset', 'blockquote', 'form', 'noscript', 'iframe', 'img', 'hr', 'address']
const HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
// The README's defaults (Configuration), as typography().options holds them
// when an option is not given (or is undefined, decision L1).
const DEFAULTS: Record<keyof History['options'], Value> = {
  headerColor: 'inherit',
  bodyColor: 'hsla(0,0%,0%,0.8)',
  headerWeight: 'bold',
  bodyWeight: 'normal',
  boldWeight: 'bold',
  blockMarginBottom: 1,
  includeNormalize: true,
}
const isNumeric = (v: Value) => typeof v === 'number' || (typeof v === 'string' && /^\s*[+-]?(\d*\.\d+|\d+)(e[+-]?\d+)?\s*$/i.test(v))

/** What each named declaration must be: a literal, a rhythm count, or a block-margin form. */
type Owed = { literal: Value } | { rhythm: number } | { block: 'whole' | 'half' | 'less1px' } | { cellBottom: true }
function model(plan: History): { throws: true } | { owed: Map<Key, Owed>; normalize: boolean } {
  const owed = new Map<Key, Owed>()
  const o = plan.options
  // undefined is the default (decision L1); null removes the declaration (Q4a).
  const given = (k: keyof History['options']) => (o[k] === undefined ? DEFAULTS[k] : o[k])
  const set = (selectors: Array<string>, property: string, v: Owed) => selectors.forEach((s) => owed.set(key('', s, property), v))
  set(HEADINGS, 'color', { literal: given('headerColor') })
  set(HEADINGS, 'fontWeight', { literal: given('headerWeight') })
  set(['body'], 'color', { literal: given('bodyColor') })
  set(['body'], 'fontWeight', { literal: given('bodyWeight') })
  set(['b', 'strong', 'dt', 'th'], 'fontWeight', { literal: given('boldWeight') })
  set(BLOCKS, 'marginBottom', { block: 'whole' })
  set(['blockquote'], 'marginLeft', { rhythm: 1 })
  set(['blockquote'], 'marginRight', { rhythm: 1 })
  set(['ol', 'ul'], 'marginLeft', { rhythm: 1 })
  set(['li', 'li > p'], 'marginBottom', { block: 'half' })
  set(['li > ol', 'li > ul'], 'marginLeft', { rhythm: 1 })
  set(['li > ol', 'li > ul'], 'marginBottom', { block: 'half' })
  set(['li > ol', 'li > ul'], 'marginTop', { block: 'half' })
  set(['hr'], 'marginBottom', { block: 'less1px' })
  set(['td,th'], 'paddingLeft', { rhythm: 2 / 3 })
  set(['td,th'], 'paddingRight', { rhythm: 2 / 3 })
  set(['td,th'], 'paddingTop', { rhythm: 1 / 2 })
  set(['td,th'], 'paddingBottom', { cellBottom: true })
  // S9: the code plugin runs first among the plugins.
  if (plan.codePlugin) set(['pre'], 'padding', { block: 'whole' })
  // S6: then each layer, in order, over what is there.
  for (const layer of [...plan.plugins, ...(plan.overrideStyles ? [plan.overrideStyles] : []), ...(plan.overrideThemeStyles ? [plan.overrideThemeStyles] : [])])
    for (const e of layer) if (e.value !== undefined) owed.set(key(e.media ? MEDIA : '', e.selector, e.property), { literal: e.value })
  // S4 (Q4a): an unsafe final value (an option's included) throws, and so
  // does an unsafe selector in any layer: its rule is written even when its
  // values are null or undefined (an empty "h1</style>{}" still holds the "<").
  const layers = [...plan.plugins, ...(plan.overrideStyles ? [plan.overrideStyles] : []), ...(plan.overrideThemeStyles ? [plan.overrideThemeStyles] : [])]
  const unsafe =
    layers.some((l) => l.some((e) => !isSafeSelector(e.selector))) ||
    [...owed].some(([k, v]) => 'literal' in v && v.literal !== null && !isSafeValue(v.literal, JSON.parse(k)[2]))
  if (unsafe) return { throws: true }
  return { owed, normalize: o.includeNormalize !== false }
}

// ---------------------------------------------------------------------------
// The driver and the check.
// ---------------------------------------------------------------------------

function driver(plan: History, observe: (checkpoint: string, value: unknown) => void) {
  const fixed = (entries: Array<Entry>) => () => toObject(entries)
  const options = Object.fromEntries(Object.entries(plan.options).filter(([, v]) => v !== undefined))
  let t: ReturnType<typeof typography>
  try {
    t = typography({
      ...options,
      plugins: [...(plan.codePlugin ? [codePlugin()] : []), ...plan.plugins.map(fixed)],
      ...(plan.overrideStyles ? { overrideStyles: fixed(plan.overrideStyles) } : {}),
      ...(plan.overrideThemeStyles ? { overrideThemeStyles: fixed(plan.overrideThemeStyles) } : {}),
    })
  } catch (error) {
    observe('typography()', error)
    return
  }
  observe('options', Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k, (t.options as Record<string, unknown>)[k]])))
  const block = plan.options.blockMarginBottom
  observe('rhythm', {
    one: t.rhythm(1),
    twoThirds: t.rhythm(2 / 3),
    half: t.rhythm(1 / 2),
    block: isNumeric(block) ? t.rhythm(block as number) : typeof block === 'string' ? block : t.rhythm(1),
  })
  let json: unknown
  try {
    json = t.toJSON()
  } catch (error) {
    observe('toJSON() error', error)
    return
  }
  observe('toJSON()', json)
  try {
    const text = t.toString()
    observe('toString()', text)
    // createStyles() is kept for v0.16 callers: the same text.
    observe('createStyles() is toString()', t.createStyles() === text)
  } catch (error) {
    observe('toString() error', error)
  }
}

const kebab = (property: string) => {
  if (property.startsWith('--')) return property
  const k = property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
  return /^ms[A-Z]/.test(property) ? `-${k}` : k
}
// toJSON() as the rules its text must read as (S4).
const expectedRules = (json: Record<string, unknown>): Array<Rule> =>
  Object.entries(json).map(([prelude, body]) => {
    const rule: Rule = { prelude, declarations: [], rules: [] }
    for (const [property, v] of Object.entries(body as Record<string, unknown>)) {
      if (v !== null && typeof v === 'object') rule.rules.push(...expectedRules({ [property]: v }))
      else if (v !== null && v !== undefined) rule.declarations.push([kebab(property), String(v)])
    }
    return rule
  })

const valueAt = (trace: ReadonlyArray<Observation>, checkpoint: string) => trace.find((o) => o.checkpoint === checkpoint)?.value

function check(plan: History, trace: ReadonlyArray<Observation>, expected: ReturnType<typeof model>) {
  const construction = valueAt(trace, 'typography()') ?? valueAt(trace, 'toJSON() error')
  if (construction) return violation('typography()', 'typography() or toJSON() threw on valid options', S5, { actual: construction })
  const error = valueAt(trace, 'toString() error')
  if ('throws' in expected) {
    if (!error) return violation('toString()', 'an unsafe value or selector was written', S4, { actual: valueAt(trace, 'toString()') })
    return error instanceof RangeError ? pass : violation('toString() error', 'the error is not a RangeError', S4, { actual: error })
  }
  if (error) return violation('toString() error', 'toString() threw on safe styles', S4, { actual: error })
  const options = differs('options', S5, valueAt(trace, 'options'), Object.fromEntries(Object.entries(DEFAULTS).map(([k, d]) => [k, plan.options[k as keyof History['options']] === undefined ? d : plan.options[k as keyof History['options']]])), 'options are not the given values over the README defaults')
  if (options) return options
  if (valueAt(trace, 'createStyles() is toString()') !== true) return violation('createStyles() is toString()', 'createStyles() is not the stylesheet', S4)
  const text = String(valueAt(trace, 'toString()'))
  // normalize.css first, exactly when includeNormalize is not false.
  if (text.startsWith(normalize) !== expected.normalize)
    return violation('toString()', expected.normalize ? 'normalize.css is missing' : 'normalize.css is included', S4)
  let rules: Array<Rule>
  try {
    rules = readStylesheet(expected.normalize ? text.slice(normalize.length) : text)
  } catch (e) {
    if (e instanceof StylesheetError) return violation('toString()', `the stylesheet does not read as CSS: ${e.message}`, S4)
    throw e
  }
  const json = valueAt(trace, 'toJSON()') as Record<string, unknown>
  const roundTrip = differs('toString()', S4, rules, expectedRules(json), 'the text does not read as toJSON()')
  if (roundTrip) return roundTrip
  // S5 and S6: each named declaration, in the text.
  const declared = new Map<Key, string>()
  const collect = (list: Array<Rule>, scope: string) => {
    for (const r of list) {
      for (const [p, v] of r.declarations) declared.set(key(scope, r.prelude, p), v)
      collect(r.rules, r.prelude)
    }
  }
  collect(rules, '')
  const r = valueAt(trace, 'rhythm') as { one: string; twoThirds: string; half: string; block: string }
  const rhythmOf = (count: number) => (count === 1 ? r.one : count === 2 / 3 ? r.twoThirds : r.half)
  for (const [k, owed] of expected.owed) {
    const [scope, selector, property] = JSON.parse(k) as [string, string, string]
    const want =
      'literal' in owed
        ? owed.literal === null ? undefined : String(owed.literal)
        : 'rhythm' in owed
        ? rhythmOf(owed.rhythm)
        : 'cellBottom' in owed
        ? `calc(${r.half} - 1px)`
        : owed.block === 'whole'
        ? r.block
        : owed.block === 'half'
        ? `calc(${r.block} / 2)`
        : `calc(${r.block} - 1px)`
    const law = 'literal' in owed && [...plan.plugins, plan.overrideStyles ?? [], plan.overrideThemeStyles ?? []].some((l) => l.some((e) => key(e.media ? MEDIA : '', e.selector, e.property) === k)) ? S6 : S5
    const d = differs('toString()', law, declared.get(key(scope, selector, kebab(property))), want, `${scope ? `${scope} ` : ''}${selector} ${property}`)
    if (d) return d
  }
  return pass
}

const replaceText = (trace: ReadonlyArray<Observation>, f: (text: string) => string) =>
  trace.map((o) => (o.checkpoint === 'toString()' ? { ...o, value: f(String(o.value)) } : o))

oracleProperty<History, ReturnType<typeof model>>({
  id: 'typography-stylesheet',
  owns: [
    'packages/typography/src/index.js',
    'packages/typography/src/utils/compileStyles.js',
    'packages/typography/src/utils/createStyles.js',
    'packages/typography-plugin-code/src/index.js',
  ],
  law: {
    statement: `${S4}: rule by rule, kebab-case names, vendor prefixes, custom properties as written, values as given, null dropped, normalize first unless includeNormalize is false, createStyles() the same text (v0.16); an unsafe value or selector throws a RangeError. ${S5}: typography().options holds each given option or its README default; headerColor/headerWeight on h1–h6, bodyColor/bodyWeight on body, boldWeight on b/strong/dt/th; block margins, list indents, blockquote margins, and cell padding in rhythm units; the code plugin's pre padding is the block margin. ${S6}: plugins, then overrideStyles, then overrideThemeStyles, each deep-merged, null removing.`,
    authority: 'README (Configuration; Themes & Plugins; overrideStyles; overrideThemeStyles); CSS Variables 1 §2 (custom property names are case-sensitive); CSS Syntax 3 §5 and §8.2; engineer decisions 2026-11-12 (Q4a, Q4b; coverage in this PR).',
    limits: 'Design values of the default rules are pinned by snapshots. Up to 2 plugins, 5 entries per layer, selectors and properties from fixed lists, one @media scope. Property names with two capitals in a row are not generated. Browser acceptance of each declaration is the Chrome witness.',
  },
  histories: {
    arbitrary,
    runs: 100,
    fixedSeeds: [20261112],
    states: ['an unsafe value', 'an unsafe selector', 'a null value', 'a custom property', 'a vendor prefix', 'a media rule', 'an override over an option', 'the code plugin', 'normalize off', 'a numeric-string block margin'],
    constructed: [
      { name: 'an unsafe value', enters: ['an unsafe value'], build: (h) => ({ ...h, overrideStyles: [{ media: false, selector: 'body', property: 'color', value: 'red</style>' }], overrideThemeStyles: undefined }) },
      { name: 'an unsafe selector', enters: ['an unsafe selector'], build: (h) => ({ ...h, overrideStyles: [{ media: false, selector: 'p{', property: 'color', value: 'red' }], overrideThemeStyles: undefined }) },
      { name: 'a null removes a default', enters: ['a null value', 'an override over an option'], build: (h) => ({ ...h, overrideStyles: [{ media: false, selector: 'body', property: 'color', value: null }], overrideThemeStyles: undefined }) },
      { name: 'a custom property', enters: ['a custom property'], build: (h) => ({ ...h, overrideStyles: [{ media: false, selector: ':root', property: '--brandColor', value: 'red' }], overrideThemeStyles: undefined }) },
      { name: 'a vendor prefix in a media rule', enters: ['a vendor prefix', 'a media rule'], build: (h) => ({ ...h, overrideStyles: [{ media: true, selector: 'p', property: 'msTextSizeAdjust', value: 'red' }], overrideThemeStyles: undefined }) },
      { name: 'the code plugin with a numeric-string margin', enters: ['the code plugin', 'a numeric-string block margin'], build: (h) => ({ ...h, codePlugin: true, options: { ...h.options, blockMarginBottom: '1' } }) },
      { name: 'normalize off', enters: ['normalize off'], build: (h) => ({ ...h, options: { ...h.options, includeNormalize: false } }) },
    ],
    fixed: [
      { name: 'S6: overrideThemeStyles after overrideStyles', history: { options: { headerColor: undefined, bodyColor: undefined, headerWeight: undefined, bodyWeight: undefined, boldWeight: undefined, blockMarginBottom: undefined, includeNormalize: undefined }, plugins: [[{ media: false, selector: 'h1', property: 'color', value: 'red' }]], codePlugin: false, overrideStyles: [{ media: false, selector: 'h1', property: 'color', value: '#123456' }], overrideThemeStyles: [{ media: false, selector: 'h1', property: 'color', value: 'inherit' }] } },
    ],
  },
  model,
  reached: (plan) => {
    const states = new Set<string>()
    const all = [...plan.plugins.flat(), ...(plan.overrideStyles ?? []), ...(plan.overrideThemeStyles ?? [])]
    if (all.some((e) => !isSafeValue(e.value, e.property))) states.add('an unsafe value')
    if (all.some((e) => !isSafeSelector(e.selector))) states.add('an unsafe selector')
    if (all.some((e) => e.value === null)) states.add('a null value')
    if (all.some((e) => e.property.startsWith('--'))) states.add('a custom property')
    if (all.some((e) => /^(Webkit|Moz|ms|O)[A-Z]/.test(e.property))) states.add('a vendor prefix')
    if (all.some((e) => e.media)) states.add('a media rule')
    if (all.some((e) => !e.media && ((HEADINGS.includes(e.selector) && e.property === 'color') || (e.selector === 'body' && e.property === 'color')))) states.add('an override over an option')
    if (plan.codePlugin) states.add('the code plugin')
    if (plan.options.includeNormalize === false) states.add('normalize off')
    if (typeof plan.options.blockMarginBottom === 'string' && isNumeric(plan.options.blockMarginBottom)) states.add('a numeric-string block margin')
    return [...states]
  },
  driver,
  check,
  calibrations: [
    { name: 'a custom property name kebab-cased', law: S4, corrupt: (trace) => (String(valueAt(trace, 'toString()')).includes('--brandColor') ? replaceText(trace, (t) => t.replaceAll('--brandColor', '--brand-color')) : undefined) },
    { name: 'normalize dropped', law: S4, corrupt: (trace, plan) => (plan.options.includeNormalize !== false && valueAt(trace, 'toString()') !== undefined ? replaceText(trace, (t) => t.slice(normalize.length)) : undefined) },
    {
      // A builder that ignores bodyColor: toJSON() and its text both say black.
      name: 'the body color option ignored',
      law: S5,
      corrupt: (trace, plan) => {
        const json = valueAt(trace, 'toJSON()') as Record<string, Record<string, unknown>> | undefined
        if (!json?.body || typeof plan.options.bodyColor !== 'string' || !isSafeValue(plan.options.bodyColor, 'color') || valueAt(trace, 'toString()') === undefined) return undefined
        if ([...plan.plugins.flat(), ...(plan.overrideStyles ?? []), ...(plan.overrideThemeStyles ?? [])].some((e) => e.selector === 'body' && e.property === 'color')) return undefined
        const text = String(valueAt(trace, 'toString()')).replace(`body{color:${plan.options.bodyColor};`, 'body{color:black;')
        return trace.map((o) =>
          o.checkpoint === 'toJSON()' ? { ...o, value: { ...json, body: { ...json.body, color: 'black' } } } : o.checkpoint === 'toString()' ? { ...o, value: text } : o,
        )
      },
    },
  ],
})
