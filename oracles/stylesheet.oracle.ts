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
A `null`, `false`, or `''` value is no declaration, as in `cond && value`
(engineer decision 2026-11-12, review Q2), except that `''` is a custom
property's empty value. normalize.css comes first exactly when
`includeNormalize` is not false. The text holds no "</": each "<" before
"/" is written "\3c ", which CSS reads as the same character, so a value
cannot end the `<style>` element (engineer decision 2026-11-12, reviews Y2
and Y9; this replaces Q4a's throw on "<"). A value or selector that is not
safe CSS (a stray `}`, `;`, or `!`, where a trailing `!important` is CSS; an open
string, comment, or bracket; a lone backslash; a nonfinite number; anything
but a string or number, an array included), or a property name that is not one CSS identifier,
makes `toString()` throw a RangeError naming the selector and the property
(engineer decisions 2026-11-12, Q4a; reviews X1, X2). An empty value is a
custom property's only (CSS Variables 1 §2, review X8).
S5. `headerColor` and `headerWeight` reach h1–h6, `bodyColor` and
`bodyWeight` reach body, and `boldWeight` reaches b, strong, dt, and th, as
given (README, Configuration). Spacing is in rhythm units: every block
element's bottom margin is `blockMarginBottom` (a number or numeric string is
rhythm units, a CSS length is used as is), blockquote side margins and list
indents are one rhythm, list items and their nested lists half the block
margin, and table cells two thirds (sides) and one half (top) of a rhythm
(engineer decision 2026-11-12, Q4b). The code plugin's `pre` padding is the
block margin too, or 0 when the block margin is negative or a keyword (a
negative or `auto` padding is not CSS, and the browser keeps the reset's 0;
`inherit` would take the parent's padding). Called directly with
`(vr, options)`, as v0.16 allowed, the plugin pads the same (review Z1),
and with typography 0.16's helpers too (review R1). A `blockMarginBottom` string that is not a CSS length,
which the margins put in calc(), makes typography() throw a RangeError
naming it (review X6). `auto` and the CSS-wide words go on the block
elements as given, and the margins derived from them with calc() are left
out, as browsers dropped v0.16's `calc(auto - 1px)` (engineer decision
2026-11-12, review Y6).
S6. Plugins run in order, then `overrideStyles`, then `overrideThemeStyles`
(README). Each layer is deep-merged over the styles before it: its value for
a rule and property replaces the earlier one, a `null` removes it, and
everything it does not name stays. `plugins` that are not a list of
functions, or an override that is not a function, make typography() throw a
TypeError naming the option (review X5: v0.16 ignored them, an ignored input
being a bug by the engineer's rule). `null`, `false`, `''`, and `0` are no plugins or
override, as in v0.16 (reviews Y3 and Q3).

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
import { isAbsent, isSafeText } from './css-value-safety'
import type { Rule } from './css-rule-reader'

const S4 = 'S4 toString() is the stylesheet toJSON() describes'
const S5 = 'S5 documented options and rhythm spacing'
const S6 = 'S6 plugins and overrides merge in order'

// ---------------------------------------------------------------------------
// Grammar: options, and style layers built from entries.
// ---------------------------------------------------------------------------

type Value = string | number | boolean | null | undefined | Array<string> | (() => number)
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
  // A plugins or override option that is not a list of functions or a
  // function (review X5): named here, built in the driver.
  malformed: { option: 'plugins' | 'overrideStyles' | 'overrideThemeStyles'; as: Malformed } | undefined
}
// null, false, '' and 0 are none (v0.16 skipped them; engineer decision
// 2026-11-12, reviews Y3 and Q3); the others are mistakes.
type Malformed = 'a string' | 'null' | 'false' | 'an empty string' | 'zero' | 'an object' | 'a list with a string' | 'a sparse list'
const NONE: Array<Malformed> = ['null', 'false', 'an empty string', 'zero']

const MEDIA = '@media (max-width:480px)'
// Safe CSS values, including a string that holds ";" and "}", and a trailing
// !important. Unsafe ones break the rule, the stylesheet, or the <style>.
// 'a {b}' and '' are safe for a custom property only (reviews W5, X8); '\\(a' holds an
// escaped "(" that opens no block.
const SAFE_VALUES: Array<Value> = ['red', '#123456', '1.5rem', 0, 12, 'calc(1em + 2px)', 'var(--x)', "'a;b}'", 'url(a.png)', 'red !important', 'inherit', 'var(--x, {a})', 'a {b}', '\\(a', '', 'red</style>', '"</p>"', '"<"', 'a\\</b', 'red !important /* x */', 'red ! /**/ important', '{a:b; c:d}', 'f(a;b)', '*/ !important', 'red !important /* ! */', ' ', 'url(a;b)', 'url( a )', '\\110000x']
// 'a\\': a lone backslash at the end escapes the ";" after it (review W1).
// An array or a function is not a CSS value (reviews Y5, Z5).
const ARRAY_VALUE = ['a', 'b']
const FUNCTION_VALUE = () => 1
// Review T1: a comment that ends at its first "*/", and one that never
// ends; T2: a bad url, in any spelling of "url(".
const UNSAFE_VALUES: Array<Value> = [ARRAY_VALUE, FUNCTION_VALUE, 'var(--x, a;b)', '/**/ !important', 'red /* a */ } h1{color:blue} */ !important', 'red /*/ !important', '\\75 rl(a b "x)" )', 'u\\rl(a b)', 'url(a b)', 'url(a\\\nb)', 'url(a', 'red}', 'a;b', 'red !importan', "'open", NaN, true, '!important', 'a\\', 'a /* b']
// Names that are not one CSS identifier break the rule or the <style>
// (review X1).
const UNSAFE_PROPERTIES = ['</style>', 'color;}body{background', '--x}', 'a b']
const PROPERTIES = ['color', 'marginTop', 'fontSize', 'WebkitFontSmoothing', 'MozOsxFontSmoothing', 'msTextSizeAdjust', 'OTransition', '--brandColor', '--x-y']
const SELECTORS = ['h1', 'p', 'body', '.post', ':root', 'a:hover', 'ul li', 'h2,h3', 'blockquote', 'a[title="{;}"]', 'p:not(.x)', 'h1</style>', 'q[title="<"]']
// A selector with an open comment, string, or bracket, or a lone backslash,
// swallows the rules after it (review X2); one with "{" inside a string does
// not.
const UNSAFE_SELECTORS = ['p{', 'p;', 'a /*', 'a\\', 'a[title="x]', 'p:not(a', 'p {x}']

const value = fc.oneof(
  { weight: 8, arbitrary: fc.constantFrom(...SAFE_VALUES, false) },
  { weight: 1, arbitrary: fc.constantFrom(...UNSAFE_VALUES) },
  { weight: 1, arbitrary: fc.constantFrom(null, undefined) },
)
const entry = fc.record({
  media: fc.boolean(),
  selector: fc.oneof({ weight: 12, arbitrary: fc.constantFrom(...SELECTORS) }, { weight: 1, arbitrary: fc.constantFrom(...UNSAFE_SELECTORS) }),
  property: fc.oneof({ weight: 12, arbitrary: fc.constantFrom(...PROPERTIES) }, { weight: 1, arbitrary: fc.constantFrom(...UNSAFE_PROPERTIES) }),
  value,
})
const layer = fc.array(entry, { maxLength: 5 })
const color = fc.oneof(
  { weight: 6, arbitrary: fc.constantFrom<Value>(undefined, 'red', '#333', 'hsla(0,0%,0%,0.8)', 'var(--fg)', 'inherit', '', false, 'red !important /* ! */') },
  { weight: 1, arbitrary: fc.constantFrom<Value>('red</style>', 'red}', '"</p>"', null, 'red /* a */ } h1{color:blue} */ !important', '\\75 rl(a b "x)" )') },
)
const weight = fc.constantFrom<Value>(undefined, 400, 700, 'bold', 'normal', '600')
const arbitrary: fc.Arbitrary<History> = fc.record({
  options: fc.record({
    headerColor: color,
    bodyColor: color,
    headerWeight: weight,
    bodyWeight: weight,
    boldWeight: weight,
    // null, false, '', and white space are one rhythm, as v0.16 read them
    // (review U2: the falsy rule). A string is a CSS length, which
    // calc() takes (review X6); any other string throws.
    blockMarginBottom: fc.oneof(
      { weight: 6, arbitrary: fc.constantFrom<Value>(undefined, null, false, '', ' ', 0.5, 1, 2, -1, '1', '1.5rem', '20px', '5%', '-0.5rem', ' -1rem', 'calc(1rem + 2px)', 'var(--m)', 'auto', 'inherit', 'INITIAL', '-webkit-calc(2rem)') },
      // '1e400px' overflows to an infinite length (review T6).
      { weight: 1, arbitrary: fc.constantFrom<Value>('1rem !important', 'red', 'calc(1)', '1rem;', 'x', NaN, Infinity, 'rgb(1,2,3)', 'url(x)', '1e400px') },
    ),
    includeNormalize: fc.constantFrom(undefined, true, false),
  }),
  plugins: fc.array(layer, { maxLength: 2 }),
  codePlugin: fc.boolean(),
  overrideStyles: fc.option(layer, { nil: undefined }),
  overrideThemeStyles: fc.option(layer, { nil: undefined }),
  malformed: fc.oneof(
    { weight: 12, arbitrary: fc.constant(undefined) },
    {
      weight: 1,
      arbitrary: fc.record({
        option: fc.constantFrom('plugins' as const, 'overrideStyles' as const, 'overrideThemeStyles' as const),
        as: fc.constantFrom<Malformed>('a string', 'null', 'false', 'an empty string', 'zero', 'an object', 'a list with a string', 'a sparse list'),
      }),
    },
  ),
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

const isSafeValue = (v: Value, property: string) =>
  isAbsent(v, property) || (typeof v === 'number' && Number.isFinite(v)) || (typeof v === 'string' && isSafeText(v, property.startsWith('--')))
// A selector (or @media prelude) is safe text with something in it.
const isSafeSelector = (s: string) => s.trim() !== '' && isSafeText(s, false)
// A property name is one CSS identifier: a custom property's "--" and name
// characters, or a camel- or kebab-case name.
// S4 (engineer decision 2026-11-12, reviews Y2 and Y9): HTML ends a <style>
// at "</style", so each "<" before "/" is written as the escape "\3c ",
// which CSS reads as the same character; an escaped "\<" loses its
// backslash. Any other "<", such as the one in @media (width < 600px),
// stays.
const htmlSafe = (text: string) =>
  text.replace(/(\\*)<(?=\/)/g, (_, slashes: string) => (slashes.length % 2 === 1 ? `${slashes.slice(1)}\\3c ` : `${slashes}\\3c `))
const isSafeProperty = (p: string) => /^--[-\w]+$/.test(p) || /^-?[A-Za-z][-A-Za-z0-9]*$/.test(p)

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

// The generated blockMarginBottom strings that are CSS lengths calc() takes
// (the Chrome witness checks the calc() they make); the others are not.
const MARGIN_LENGTHS = ['1.5rem', '20px', '5%', '-0.5rem', ' -1rem', 'calc(1rem + 2px)', 'var(--m)', '-webkit-calc(2rem)']
// auto and the CSS-wide words go on the block elements as given; the margins
// derived from them with calc() are left out, as browsers dropped v0.16's
// calc(auto - 1px) (engineer decision 2026-11-12, review Y6).
const MARGIN_KEYWORDS = ['auto', 'inherit', 'INITIAL']

/** What each named declaration must be: a literal, a rhythm count, or a block-margin form. */
type Owed = { literal: Value } | { rhythm: number } | { block: 'whole' | 'half' | 'less1px' | 'padding' } | { cellBottom: true }
type Expected = { rejects: 'TypeError' | 'RangeError'; option: string } | { throws: true } | { owed: Map<Key, Owed>; normalize: boolean }
function model(plan: History): Expected {
  const owed = new Map<Key, Owed>()
  const o = plan.options
  // typography() rejects plugins that are not a list of functions and an
  // override that is not a function (review X5: v0.16 ignored them); null is
  // none, as in v0.16 (review Y3). It rejects a blockMarginBottom string that
  // is not a CSS length or a margin keyword (X6, Y6).
  if (plan.malformed && !NONE.includes(plan.malformed.as)) return { rejects: 'TypeError', option: plan.malformed.option }
  if (plan.malformed) return model({ ...plan, malformed: undefined, ...(plan.malformed.option === 'plugins' ? { plugins: [], codePlugin: false } : { [plan.malformed.option]: undefined }) })
  // A number must be finite (review Z3); rgb() and url() are not lengths (Z4).
  if (
    (typeof o.blockMarginBottom === 'number' && !Number.isFinite(o.blockMarginBottom)) ||
    (typeof o.blockMarginBottom === 'string' && o.blockMarginBottom.trim() !== '' && !isNumeric(o.blockMarginBottom) && !MARGIN_LENGTHS.includes(o.blockMarginBottom) && !MARGIN_KEYWORDS.includes(o.blockMarginBottom))
  )
    return { rejects: 'RangeError', option: 'blockMarginBottom' }
  const keyword = typeof o.blockMarginBottom === 'string' && MARGIN_KEYWORDS.includes(o.blockMarginBottom)
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
  // hr is a block element too: it keeps the block margin.
  if (keyword) set(['li', 'li > p', 'li > ol', 'li > ul'], 'marginBottom', { literal: null })
  if (keyword) set(['hr'], 'marginBottom', { block: 'whole' })
  if (keyword) set(['li > ol', 'li > ul'], 'marginTop', { literal: null })
  // S9: the code plugin runs first among the plugins.
  // A negative padding, or auto, is not CSS, and the browser keeps the
  // reset's 0: such a block margin pads with 0 (Q4b; the Chrome witness).
  // A CSS-wide word means another thing on padding (inherit takes the
  // parent's padding): it pads with 0 too (review Z8).
  if (plan.codePlugin) set(['pre'], 'padding', { block: 'padding' })
  // S6: then each layer, in order, over what is there.
  for (const layer of [...plan.plugins, ...(plan.overrideStyles ? [plan.overrideStyles] : []), ...(plan.overrideThemeStyles ? [plan.overrideThemeStyles] : [])])
    for (const e of layer) if (e.value !== undefined) owed.set(key(e.media ? MEDIA : '', e.selector, e.property), { literal: e.value })
  // S4 (Q4a): an unsafe final value (an option's included) throws, and so
  // does an unsafe selector in any layer: its rule is written even when its
  // values are null or undefined (an empty "p;{}" still breaks the stylesheet).
  const layers = [...plan.plugins, ...(plan.overrideStyles ? [plan.overrideStyles] : []), ...(plan.overrideThemeStyles ? [plan.overrideThemeStyles] : [])]
  const unsafe =
    layers.some((l) => l.some((e) => !isSafeSelector(e.selector))) ||
    [...owed].some(([k, v]) => 'literal' in v && !isAbsent(v.literal, JSON.parse(k)[2]) && (!isSafeProperty(JSON.parse(k)[2]) || !isSafeValue(v.literal, JSON.parse(k)[2])))
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
  const malformed = plan.malformed && {
    [plan.malformed.option]: {
      'a string': 'x',
      null: null,
      false: false,
      'an empty string': '',
      zero: 0,
      'an object': plan.malformed.option === 'plugins' ? { a: () => ({}) } : {},
      'a list with a string': plan.malformed.option === 'plugins' ? ['x'] : [() => ({})],
      // A hole is not a function (review P4).
      'a sparse list': [, () => ({})],
    }[plan.malformed.as],
  }
  try {
    t = typography({
      ...options,
      plugins: [...(plan.codePlugin ? [codePlugin()] : []), ...plan.plugins.map(fixed)],
      ...(plan.overrideStyles ? { overrideStyles: fixed(plan.overrideStyles) } : {}),
      ...(plan.overrideThemeStyles ? { overrideThemeStyles: fixed(plan.overrideThemeStyles) } : {}),
      ...malformed,
    })
  } catch (error) {
    observe('typography()', error)
    return
  }
  observe('options', Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k, (t.options as Record<string, unknown>)[k]])))
  const block = plan.options.blockMarginBottom
  try {
    observe('rhythm', {
      one: t.rhythm(1),
      twoThirds: t.rhythm(2 / 3),
      half: t.rhythm(1 / 2),
      block: isNumeric(block) ? t.rhythm(block as number) : typeof block === 'string' && block.trim() !== '' ? block : t.rhythm(1),
    })
  } catch (error) {
    observe('toJSON() error', error)
    return
  }
  let json: unknown
  try {
    json = t.toJSON()
  } catch (error) {
    observe('toJSON() error', error)
    return
  }
  // toJSON() is a stylesheet object.
  if (json === null || typeof json !== 'object') {
    observe('toJSON() error', new TypeError(`toJSON() returned ${String(json)}`))
    return
  }
  // A function value is recorded as a marker: an observation is data.
  observe('toJSON()', JSON.parse(JSON.stringify(json, (_, v) => (typeof v === 'function' ? '[a function]' : v))))
  try {
    const text = t.toString()
    observe('toString()', text)
    // createStyles() is kept for v0.16 callers: the same text.
    observe('createStyles() is toString()', t.createStyles() === text)
    // The code plugin called directly, as v0.16 allowed: (vr, options); and
    // with v0.16's helpers, whose rhythm() (compass-vertical-rhythm 1.4.5)
    // multiplies its argument, so a CSS length gives NaN text, null gives 0,
    // and undefined is one line (review R1).
    const v016 = {
      rhythm: (lines: unknown = 1) => {
        const n = (lines as number) * 1
        return Number.isFinite(n) ? t.rhythm(n) : 'NaNNaNpx'
      },
    }
    for (const [name, vr] of [['codePlugin()(vr, options).pre.padding', t], ['codePlugin() with v0.16 helpers', v016]] as const) {
      try {
        observe(name, (codePlugin()(vr, t.options) as { pre: { padding: unknown } }).pre.padding)
      } catch (error) {
        observe(name, { threw: String(error) })
      }
    }
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
    const rule: Rule = { prelude: htmlSafe(prelude), declarations: [], rules: [] }
    for (const [property, v] of Object.entries(body as Record<string, unknown>)) {
      if (v !== null && typeof v === 'object') rule.rules.push(...expectedRules({ [property]: v }))
      // CSS ignores the white space around a value, as the reader does.
      else if (!isAbsent(v, property)) rule.declarations.push([kebab(property), htmlSafe(String(v)).replace(/^[ \t\n\r\f]+|[ \t\n\r\f]+$/g, '')])
    }
    return rule
  })

const valueAt = (trace: ReadonlyArray<Observation>, checkpoint: string) => trace.find((o) => o.checkpoint === checkpoint)?.value

function check(plan: History, trace: ReadonlyArray<Observation>, expected: Expected) {
  const construction = valueAt(trace, 'typography()') ?? valueAt(trace, 'toJSON() error')
  if ('rejects' in expected) {
    const thrown = valueAt(trace, 'typography()')
    return thrown instanceof Error && thrown.name === expected.rejects && thrown.message.includes(expected.option)
      ? pass
      : violation('typography()', `typography() did not throw a ${expected.rejects} naming ${expected.option}`, expected.option === 'blockMarginBottom' ? S5 : S6, { actual: thrown ?? 'no error' })
  }
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
  if (text.includes('</')) return violation('toString()', 'the stylesheet holds "</", which can end the <style> element', S4)
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
  // S9: the plugin's pre padding, called directly, is the block margin, or 0
  // for a negative one or a keyword (review Z1).
  // A negative length starts "-" then a digit: -webkit-calc() is a function
  // (review T3).
  const padding = /^\s*-[\d.]/.test(r.block) || MARGIN_KEYWORDS.includes(r.block) ? '0' : r.block
  const direct = valueAt(trace, 'codePlugin()(vr, options).pre.padding')
  const directDiff = differs('codePlugin()(vr, options).pre.padding', S5, String(direct).trim(), padding.trim(), 'the code plugin called directly pads otherwise')
  if (directDiff) return directDiff
  const old = valueAt(trace, 'codePlugin() with v0.16 helpers')
  const oldDiff = differs('codePlugin() with v0.16 helpers', S5, String(old).trim(), padding.trim(), 'the code plugin pads otherwise with typography 0.16')
  if (oldDiff) return oldDiff
  for (const [k, owed] of expected.owed) {
    const [scope, selector, property] = JSON.parse(k) as [string, string, string]
    const want =
      'literal' in owed
        ? isAbsent(owed.literal, property) ? undefined : htmlSafe(String(owed.literal))
        : 'rhythm' in owed
        ? rhythmOf(owed.rhythm)
        : 'cellBottom' in owed
        ? `calc(${r.half} - 1px)`
        : owed.block === 'padding'
        ? padding
        : owed.block === 'whole'
        ? r.block
        : owed.block === 'half'
        ? `calc(${r.block} / 2)`
        : `calc(${r.block} - 1px)`
    const law = 'literal' in owed && [...plan.plugins, plan.overrideStyles ?? [], plan.overrideThemeStyles ?? []].some((l) => l.some((e) => key(e.media ? MEDIA : '', e.selector, e.property) === k)) ? S6 : S5
    const d = differs('toString()', law, declared.get(key(htmlSafe(scope), htmlSafe(selector), kebab(property))), want?.replace(/^[ \t\n\r\f]+|[ \t\n\r\f]+$/g, ''), `${scope ? `${scope} ` : ''}${selector} ${property}`)
    if (d) return d
  }
  return pass
}

const replaceText = (trace: ReadonlyArray<Observation>, f: (text: string) => string) =>
  trace.map((o) => (o.checkpoint === 'toString()' ? { ...o, value: f(String(o.value)) } : o))

// A history with nothing else in it, for constructed histories whose one
// change must decide the outcome.
const CLEAN: History = {
  options: { headerColor: undefined, bodyColor: undefined, headerWeight: undefined, bodyWeight: undefined, boldWeight: undefined, blockMarginBottom: undefined, includeNormalize: undefined },
  plugins: [],
  codePlugin: false,
  overrideStyles: undefined,
  overrideThemeStyles: undefined,
  malformed: undefined,
}

oracleProperty<History, ReturnType<typeof model>>({
  id: 'typography-stylesheet',
  owns: [
    'packages/typography/src/index.js',
    'packages/typography/src/utils/css.js',
    'packages/typography/src/utils/compileStyles.js',
    'packages/typography/src/utils/createStyles.js',
    'packages/typography-plugin-code/src/index.js',
  ],
  law: {
    statement: `${S4}: rule by rule, kebab-case names, vendor prefixes, custom properties as written, values as given with each "<" before "/" written \\3c (no "</" in the text), null, false, and '' (outside a custom property) dropped, normalize first unless includeNormalize is false, createStyles() the same text (v0.16); an unsafe value, selector, or property name throws a RangeError (an empty value is a custom property's only). ${S5}: typography().options holds each given option or its README default; headerColor/headerWeight on h1–h6, bodyColor/bodyWeight on body, boldWeight on b/strong/dt/th; block margins, list indents, blockquote margins, and cell padding in rhythm units; the code plugin's pre padding is the block margin; a blockMarginBottom string that is not a CSS length or a margin keyword throws a RangeError naming it; a keyword leaves out the calc() margins. ${S6}: plugins, then overrideStyles, then overrideThemeStyles, each deep-merged, null removing; plugins that are not a list of functions, or an override that is not a function, throw a TypeError naming the option; null, false, '', and 0 are none.`,
    authority: 'README (Configuration; Themes & Plugins; overrideStyles; overrideThemeStyles); CSS Variables 1 §2 (custom property names are case-sensitive); CSS Syntax 3 §4.3.7 (escapes), §5 and §8.2; HTML (a style element ends at "</style"); engineer decisions 2026-11-12 (Q4a, Q4b; coverage in this PR; Y2 escape "<"; Y6 margin keywords).',
    limits: 'Design values of the default rules are pinned by snapshots. Up to 2 plugins, 5 entries per layer, selectors and properties from fixed lists, one @media scope. Property names with two capitals in a row are not generated. Browser acceptance of each declaration is the Chrome witness.',
  },
  histories: {
    arbitrary,
    runs: 100,
    fixedSeeds: [20261112],
    states: ['an unsafe value', 'an unsafe selector', 'a null value', 'a custom property', 'a vendor prefix', 'a media rule', 'an override over an option', 'the code plugin', 'normalize off', 'a numeric-string block margin', 'an unsafe property', 'an empty value', 'a malformed plugin option', 'an invalid block margin', 'a "</" in the text', 'null plugins or overrides', 'a keyword block margin', 'a null block margin', 'a falsy value', 'a falsy block margin'],
    constructed: [
      { name: 'an unsafe value', enters: ['an unsafe value'], build: (h) => ({ ...h, overrideStyles: [{ media: false, selector: 'body', property: 'color', value: 'red}' }], overrideThemeStyles: undefined }) },
      { name: 'a "</" in a string (Y2)', enters: ['a "</" in the text'], build: () => ({ ...CLEAN, overrideStyles: [{ media: false, selector: 'p', property: 'color', value: '"</p>"' }], overrideThemeStyles: undefined }) },
      { name: 'an array value (Y5)', enters: ['an unsafe value'], build: () => ({ ...CLEAN, overrideStyles: [{ media: false, selector: 'p', property: 'color', value: ARRAY_VALUE }], overrideThemeStyles: undefined }) },
      { name: 'null plugins (Y3)', enters: ['null plugins or overrides'], build: () => ({ ...CLEAN, malformed: { option: 'plugins', as: 'null' } }) },
      { name: 'a sparse plugins list (P4)', enters: ['a malformed plugin option'], build: () => ({ ...CLEAN, malformed: { option: 'plugins', as: 'a sparse list' } }) },
      { name: 'plugins with a string in the list', enters: ['a malformed plugin option'], build: () => ({ ...CLEAN, malformed: { option: 'plugins', as: 'a list with a string' } }) },
      { name: 'false overrideStyles (Q3)', enters: ['null plugins or overrides'], build: () => ({ ...CLEAN, malformed: { option: 'overrideStyles', as: 'false' } }) },
      { name: 'a false value and an empty bodyColor (Q2)', enters: ['a falsy value'], build: () => ({ ...CLEAN, options: { ...CLEAN.options, bodyColor: '' }, overrideStyles: [{ media: false, selector: 'h1', property: 'color', value: false }] }) },
      { name: 'blockMarginBottom auto with the code plugin (Y6)', enters: ['a keyword block margin', 'the code plugin'], build: () => ({ ...CLEAN, codePlugin: true, options: { ...CLEAN.options, blockMarginBottom: 'auto' } }) },
      { name: 'an unsafe selector', enters: ['an unsafe selector'], build: (h) => ({ ...h, overrideStyles: [{ media: false, selector: 'p{', property: 'color', value: 'red' }], overrideThemeStyles: undefined }) },
      { name: 'a null removes a default', enters: ['a null value', 'an override over an option'], build: (h) => ({ ...h, overrideStyles: [{ media: false, selector: 'body', property: 'color', value: null }], overrideThemeStyles: undefined }) },
      { name: 'a custom property', enters: ['a custom property'], build: (h) => ({ ...h, overrideStyles: [{ media: false, selector: ':root', property: '--brandColor', value: 'red' }], overrideThemeStyles: undefined }) },
      { name: 'a vendor prefix in a media rule', enters: ['a vendor prefix', 'a media rule'], build: (h) => ({ ...h, overrideStyles: [{ media: true, selector: 'p', property: 'msTextSizeAdjust', value: 'red' }], overrideThemeStyles: undefined }) },
      { name: 'the code plugin with a numeric-string margin', enters: ['the code plugin', 'a numeric-string block margin'], build: (h) => ({ ...h, codePlugin: true, options: { ...h.options, blockMarginBottom: '1' } }) },
      { name: 'normalize off', enters: ['normalize off'], build: (h) => ({ ...h, options: { ...h.options, includeNormalize: false } }) },
      { name: 'an unsafe property name (X1)', enters: ['an unsafe property'], build: () => ({ ...CLEAN, overrideStyles: [{ media: false, selector: 'p', property: '</style>', value: 'red' }], overrideThemeStyles: undefined }) },
      { name: 'a selector with an open comment (X2)', enters: ['an unsafe selector'], build: () => ({ ...CLEAN, overrideStyles: [{ media: false, selector: 'a /*', property: 'color', value: 'red' }], overrideThemeStyles: undefined }) },
      { name: 'an empty custom property (X8)', enters: ['a custom property', 'an empty value'], build: () => ({ ...CLEAN, overrideStyles: [{ media: false, selector: ':root', property: '--x-y', value: '' }], overrideThemeStyles: undefined }) },
      // Gap check (round 7): NaN alone, on a property and on a custom property.
      { name: 'NaN alone', enters: ['an unsafe value'], build: () => ({ ...CLEAN, overrideStyles: [{ media: false, selector: 'p', property: 'color', value: NaN }], overrideThemeStyles: undefined }) },
      { name: 'a "*/" that closes no trailing comment (T1)', enters: ['an unsafe value'], build: () => ({ ...CLEAN, options: { ...CLEAN.options, bodyColor: 'red /* a */ } h1{color:blue} */ !important' } }) },
      { name: 'a url( that never closes', enters: ['an unsafe value'], build: () => ({ ...CLEAN, overrideStyles: [{ media: false, selector: 'p', property: 'color', value: 'url(a' }] }) },
      { name: 'an escaped bad url (T2)', enters: ['an unsafe value'], build: () => ({ ...CLEAN, options: { ...CLEAN.options, bodyColor: '\\75 rl(a b "x)" )' } }) },
      { name: 'a "!" in a trailing comment (T4)', enters: [], build: () => ({ ...CLEAN, options: { ...CLEAN.options, bodyColor: 'red !important /* ! */' } }) },
      { name: 'white space alone (T5)', enters: ['a falsy value'], build: () => ({ ...CLEAN, overrideStyles: [{ media: false, selector: 'h1', property: 'color', value: ' ' }] }) },
      { name: 'a comment and no value before !important', enters: ['an unsafe value'], build: () => ({ ...CLEAN, overrideStyles: [{ media: false, selector: 'p', property: 'color', value: '/**/ !important' }] }) },
      { name: 'a stray */ in a custom property', enters: ['a custom property'], build: () => ({ ...CLEAN, overrideStyles: [{ media: false, selector: ':root', property: '--x-y', value: '*/ !important' }] }) },
      { name: 'an empty custom property that is important', enters: ['a custom property'], build: () => ({ ...CLEAN, overrideStyles: [{ media: false, selector: ':root', property: '--x-y', value: '!important' }] }) },
      { name: 'NaN on a custom property', enters: ['an unsafe value', 'a custom property'], build: () => ({ ...CLEAN, overrideStyles: [{ media: false, selector: ':root', property: '--x-y', value: NaN }], overrideThemeStyles: undefined }) },
      { name: 'a selector with a top-level {} block', enters: ['an unsafe selector'], build: () => ({ ...CLEAN, overrideStyles: [{ media: false, selector: 'p {x}', property: 'color', value: 'red' }], overrideThemeStyles: undefined }) },
      { name: 'plugins as a string (X5)', enters: ['a malformed plugin option'], build: () => ({ ...CLEAN, malformed: { option: 'plugins', as: 'a string' } }) },
      { name: 'a false block margin is one rhythm (U2)', enters: ['a falsy block margin'], build: () => ({ ...CLEAN, codePlugin: true, options: { ...CLEAN.options, blockMarginBottom: false } }) },
      { name: 'a null block margin is one rhythm', enters: ['a null block margin'], build: () => ({ ...CLEAN, options: { ...CLEAN.options, blockMarginBottom: null } }) },
      { name: 'blockMarginBottom x (X6)', enters: ['an invalid block margin'], build: () => ({ ...CLEAN, options: { ...CLEAN.options, blockMarginBottom: 'x' } }) },
    ],
    fixed: [
      { name: 'S6: overrideThemeStyles after overrideStyles', history: { options: { headerColor: undefined, bodyColor: undefined, headerWeight: undefined, bodyWeight: undefined, boldWeight: undefined, blockMarginBottom: undefined, includeNormalize: undefined }, plugins: [[{ media: false, selector: 'h1', property: 'color', value: 'red' }]], codePlugin: false, overrideStyles: [{ media: false, selector: 'h1', property: 'color', value: '#123456' }], overrideThemeStyles: [{ media: false, selector: 'h1', property: 'color', value: 'inherit' }], malformed: undefined } },
    ],
  },
  model,
  reached: (plan) => {
    const states = new Set<string>()
    const all = [...plan.plugins.flat(), ...(plan.overrideStyles ?? []), ...(plan.overrideThemeStyles ?? [])]
    if (all.some((e) => !isSafeValue(e.value, e.property)) || [plan.options.headerColor, plan.options.bodyColor].some((v) => !isSafeValue(v, 'color'))) states.add('an unsafe value')
    if (all.some((e) => !isSafeSelector(e.selector))) states.add('an unsafe selector')
    if (all.some((e) => e.value === null)) states.add('a null value')
    if (all.some((e) => e.property.startsWith('--'))) states.add('a custom property')
    if (all.some((e) => /^(Webkit|Moz|ms|O)[A-Z]/.test(e.property))) states.add('a vendor prefix')
    if (all.some((e) => e.media)) states.add('a media rule')
    if (all.some((e) => !e.media && ((HEADINGS.includes(e.selector) && e.property === 'color') || (e.selector === 'body' && e.property === 'color')))) states.add('an override over an option')
    if (plan.codePlugin) states.add('the code plugin')
    if (all.some((e) => !isSafeProperty(e.property))) states.add('an unsafe property')
    if (all.some((e) => e.value === '')) states.add('an empty value')
    if (plan.malformed && !NONE.includes(plan.malformed.as)) states.add('a malformed plugin option')
    if (plan.malformed && NONE.includes(plan.malformed.as)) states.add('null plugins or overrides')
    if (plan.options.blockMarginBottom === null) states.add('a null block margin')
    if ([...all.map((e) => e.value), plan.options.headerColor, plan.options.bodyColor].some((v) => v === false || (typeof v === 'string' && /^[ \t\n\r\f]*$/.test(v)))) states.add('a falsy value')
    if (typeof plan.options.blockMarginBottom === 'string' && MARGIN_KEYWORDS.includes(plan.options.blockMarginBottom)) states.add('a keyword block margin')
    if ([...all.map((e) => e.selector), ...all.map((e) => String(e.value)), String(plan.options.headerColor), String(plan.options.bodyColor)].some((t) => t.includes('</'))) states.add('a "</" in the text')
    if (typeof plan.options.blockMarginBottom === 'string' && plan.options.blockMarginBottom.trim() !== '' && !isNumeric(plan.options.blockMarginBottom) && !MARGIN_LENGTHS.includes(plan.options.blockMarginBottom) && !MARGIN_KEYWORDS.includes(plan.options.blockMarginBottom)) states.add('an invalid block margin')
    if (plan.options.blockMarginBottom === false || (typeof plan.options.blockMarginBottom === 'string' && plan.options.blockMarginBottom.trim() === '')) states.add('a falsy block margin')
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
        if (!json?.body || typeof plan.options.bodyColor !== 'string' || isAbsent(plan.options.bodyColor, 'color') || !isSafeValue(plan.options.bodyColor, 'color') || valueAt(trace, 'toString()') === undefined) return undefined
        if ([...plan.plugins.flat(), ...(plan.overrideStyles ?? []), ...(plan.overrideThemeStyles ?? [])].some((e) => e.selector === 'body' && e.property === 'color')) return undefined
        const text = String(valueAt(trace, 'toString()')).replace(`body{color:${plan.options.bodyColor};`, 'body{color:black;')
        return trace.map((o) =>
          o.checkpoint === 'toJSON()' ? { ...o, value: { ...json, body: { ...json.body, color: 'black' } } } : o.checkpoint === 'toString()' ? { ...o, value: text } : o,
        )
      },
    },
  ],
})
