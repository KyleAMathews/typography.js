/*
Two promises that only a browser can judge: what `injectStyles()` does to a
document (S7), and whether the browser keeps every declaration typography.js
writes (Q4b). Both run in Chrome through playwright-core.

```js
typography(options).injectStyles()
  // → document.head holds one <style id="typography.js"> with toString(), first
typography(other).injectStyles()
  // → the same element, now holding other's toString(); nothing else moves
typography(deYoung).toJSON()['h4,h5,h6'].textTransformation
  // → was written as "text-transformation: uppercase", which no browser reads
```

S7. `injectStyles()` (README, Javascript usage: "insert styles directly into
the <head>"; index.js: "Replace existing") leaves `document.head` with exactly
one element with id typography.js, a style element whose text is
`toString()`. When none exists, it is inserted as the head's first child.
When one exists, its text is replaced and it stays where it is. The head's
other children stay as they were, in order. When `toString()` throws,
`injectStyles()` throws the same error and leaves the document as it was
(review Y1). Without a document (server rendering), `injectStyles()` does
nothing and does not throw.
Q4b. Every declaration in `toJSON()`, for the default options, every theme in
this repository, and the code plugin, is valid CSS in Chrome:
`CSS.supports(property, value)` holds. Every rule's selector list and every
@media prelude parses. A vendor prefix of another engine (-moz-, -ms-, -o-)
is that engine's to judge (engineer decision 2026-11-12, Q4b).

The S7 driver runs production's `injectStyles()` in Node against a bridge
to Chrome's document: each read it makes (`getElementById`, `head`,
`firstChild`) is answered from the page, and each write (`createElement`, a
property set, `insertBefore`, `appendChild`) is replayed in the page, which
then holds the real result. Any other read throws, so a change to what the
method touches fails loudly. The S7 model predicts the head's children from the plan alone. The Q4b
check reads `toJSON()` and asks Chrome about each declaration.

Limits: one browser (Chrome). normalize.css (typography-normalize), which
typography.js includes as written, is not judged. S7 heads hold meta, link,
and title elements and at most one earlier typography.js style.
*/
import fc from 'fast-check'
import { readdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
import { afterAll } from 'vitest'
import { differs, oracleProperty, pass, violation } from '@tanstack/oracles'
import type { Observation } from '@tanstack/oracles'
import typography from '../packages/typography/src/index.js'
import codePlugin from '../packages/typography-plugin-code/src/index.js'

const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage()
afterAll(() => browser.close())

const valueAt = (trace: ReadonlyArray<Observation>, checkpoint: string) => trace.find((o) => o.checkpoint === checkpoint)?.value

// ---------------------------------------------------------------------------
// S7: injectStyles().
// ---------------------------------------------------------------------------

const S7 = 'S7 injectStyles() keeps one typography.js style in the head'
// The last option set's toString() throws (a ";" in a color; review Y1).
const OPTIONS = [{}, { baseFontSize: '18px' }, { includeNormalize: false, bodyColor: '#333' }, { overrideStyles: () => ({ p: { color: 'a;b' } }) }]
const FAILS = 3
type Call = 0 | 1 | 2 | 3
type Child = 'meta' | 'link' | 'title' | 'stale'
type InjectHistory = { head: Array<Child>; calls: Array<Call> }
type HeadChild = { tag: string; id: string; text: string | undefined }

const CHILD_HTML: Record<Child, string> = {
  meta: '<meta charset="utf-8">',
  link: '<link rel="icon" href="data:,">',
  title: '<title>t</title>',
  stale: '<style id="typography.js">h1{color:red}</style>',
}
const summary = (child: Child, text?: string): HeadChild =>
  child === 'stale' ? { tag: 'style', id: 'typography.js', text } : { tag: child, id: '', text: undefined }

const injectArbitrary: fc.Arbitrary<InjectHistory> = fc
  .record({
    others: fc.array(fc.constantFrom<Child>('meta', 'link', 'title'), { maxLength: 3 }),
    stale: fc.option(fc.nat({ max: 3 }), { nil: undefined }),
    calls: fc.array(fc.constantFrom<Call>(0, 1, 2, 3), { minLength: 1, maxLength: 3 }),
  })
  .map(
    ({ others, stale, calls }) => ({
      head: stale === undefined ? others : [...others.slice(0, stale), 'stale' as const, ...others.slice(stale)],
      calls,
    }),
    (value) => {
      const { head, calls } = value as InjectHistory
      const at = head.indexOf('stale')
      return { others: head.filter((c) => c !== 'stale'), stale: at < 0 ? undefined : at, calls }
    },
  )

// The head after each call: the earlier typography.js style keeps its place
// with the new text, or a new one comes first. A call whose toString()
// throws throws, and leaves the head as it was. A text is named by the option
// set whose toString() it is.
const STALE = 'h1{color:red}'
const injectModel = (plan: InjectHistory) => {
  let head: Array<HeadChild> = plan.head.map((c) => summary(c, STALE))
  return {
    steps: plan.calls.map((n) => {
      if (n === FAILS) return { threw: true, head }
      const text = `options ${n}`
      head = head.some((c) => c.id === 'typography.js')
        ? head.map((c) => (c.id === 'typography.js' ? { ...c, text } : c))
        : [{ tag: 'style', id: 'typography.js', text }, ...head]
      return { threw: false, head }
    }),
  }
}

// A node the bridge names: the document, the head, a child of the head by
// index (as it was before the call), or the k-th element the call created.
type Ref = 'document' | 'head' | `child ${number}` | `new ${number}`
type Op = { on: Ref; call: string; args: Array<unknown> } | { on: Ref; set: string; value: unknown }
type Snapshot = { byId: Record<string, number | null>; firstChild: number | null }

// In the page: what the bridge may read.
function snapshotInPage(): Snapshot {
  const children = [...document.head.childNodes]
  const at = (node: Node | null) => (node ? children.indexOf(node as ChildNode) : null)
  return { byId: { 'typography.js': at(document.getElementById('typography.js')) }, firstChild: at(document.head.firstChild) }
}

// In Node: a document whose reads come from the snapshot and whose writes are
// recorded.
function bridge(snapshot: Snapshot, ops: Array<Op>) {
  let created = 0
  const node = (ref: Ref): object =>
    new Proxy(
      {},
      {
        get(_, key) {
          if (typeof key !== 'string') return undefined
          const call = (...args: Array<unknown>) => {
            ops.push({ on: ref, call: key, args: args.map((a) => (a && typeof a === 'object' && refOf.has(a) ? { ref: refOf.get(a) } : a)) })
            if (key === 'createElement') return named(`new ${created++}`)
            return args[0]
          }
          if (ref === 'document') {
            if (key === 'head') return named('head')
            if (key === 'getElementById') return (id: string) => (snapshot.byId[id] == null ? null : named(`child ${snapshot.byId[id]}`))
            if (key === 'createElement') return call
          }
          if (ref === 'head') {
            if (key === 'firstChild') return snapshot.firstChild === null ? null : named(`child ${snapshot.firstChild}`)
            if (key === 'insertBefore' || key === 'appendChild') return call
          }
          throw new Error(`the bridge does not read ${ref}.${key}`)
        },
        set(_, key, value) {
          ops.push({ on: ref, set: String(key), value })
          return true
        },
      },
    )
  const refOf = new Map<object, Ref>()
  const cache = new Map<Ref, object>()
  const named = (ref: Ref) => {
    if (!cache.has(ref)) {
      const proxy = node(ref)
      cache.set(ref, proxy)
      refOf.set(proxy, ref)
    }
    return cache.get(ref)
  }
  return named('document')
}

// In the page: replay the writes, and read the head.
function replayInPage(ops: Array<Op>): Array<HeadChild> {
  const children = [...document.head.childNodes]
  const made: Array<Element> = []
  const resolve = (ref: string): unknown =>
    ref === 'document' ? document : ref === 'head' ? document.head : ref.startsWith('child ') ? children[Number(ref.slice(6))] : made[Number(ref.slice(4))]
  for (const op of ops) {
    const target = resolve(op.on) as Record<string, unknown>
    if ('set' in op) target[op.set] = op.value
    else {
      const args = op.args.map((a) => (a && typeof a === 'object' && 'ref' in a ? resolve((a as { ref: string }).ref) : a))
      const result = (target[op.call] as (...a: Array<unknown>) => unknown).apply(target, args)
      if (op.call === 'createElement') made.push(result as Element)
    }
  }
  return [...document.head.children].map((c) => ({
    tag: c.tagName.toLowerCase(),
    id: c.id,
    text: c.id === 'typography.js' ? (c.textContent ?? '') : undefined,
  }))
}

async function injectDriver(plan: InjectHistory, observe: (checkpoint: string, value: unknown) => void) {
  const instances = OPTIONS.map((o) => typography({ ...o }))
  const texts = instances.map((t) => {
    try {
      return t.toString()
    } catch {
      return undefined
    }
  })
  // Server rendering: no document in Node.
  try {
    observe('injectStyles() without a document', instances[0].injectStyles() ?? null)
  } catch (error) {
    observe('injectStyles() without a document', { threw: String(error) })
  }
  await page.setContent(`<!doctype html><html><head>${plan.head.map((c) => CHILD_HTML[c]).join('')}</head><body></body></html>`)
  for (const [k, n] of plan.calls.entries()) {
    const ops: Array<Op> = []
    const g = globalThis as { document?: unknown }
    g.document = bridge(await page.evaluate(snapshotInPage), ops)
    let threw = false
    try {
      instances[n].injectStyles()
    } catch {
      threw = true
    } finally {
      delete g.document
    }
    // What the call did to the document, thrown or not.
    let head: unknown
    try {
      head = (await page.evaluate(replayInPage, ops)).map((c) => {
        const i = c.text === undefined ? -1 : texts.indexOf(c.text)
        return i < 0 ? c : { ...c, text: `options ${i}` }
      })
    } catch (error) {
      head = { replay: String(error) }
    }
    observe(`head after call ${k}`, { threw, head })
  }
}

function injectCheck(_plan: InjectHistory, trace: ReadonlyArray<Observation>, expected: ReturnType<typeof injectModel>) {
  const server = differs('injectStyles() without a document', S7, valueAt(trace, 'injectStyles() without a document'), null, 'injectStyles() did something without a document')
  if (server) return server
  for (const [k, step] of expected.steps.entries()) {
    const d = differs(`head after call ${k}`, S7, valueAt(trace, `head after call ${k}`), step)
    if (d) return d
  }
  return pass
}

oracleProperty<InjectHistory, ReturnType<typeof injectModel>>({
  id: 'typography-inject-styles',
  owns: ['packages/typography/src/index.js'],
  law: {
    statement: `${S7}: after injectStyles(), document.head has exactly one element with id typography.js, a style whose text is toString(); a new one comes first; an existing one keeps its place with the new text; other children stay in order; when toString() throws, it throws and the head is unchanged. Without a document it does nothing.`,
    authority: 'README (Javascript usage: insert styles directly into the <head>); index.js ("Replace existing"); engineer decisions 2026-11-12 (S7 sketch; coverage in this PR).',
    limits: 'Chrome only. Heads of meta, link, and title elements and at most one earlier typography.js style; up to 3 calls with 3 option sets.',
  },
  histories: {
    arbitrary: injectArbitrary,
    runs: 25,
    fixedSeeds: [20261112],
    states: ['an empty head', 'an earlier typography.js style', 'a second call', 'a head with other children', 'a call that throws'],
    constructed: [
      { name: 'replace an earlier style in place', enters: ['an earlier typography.js style', 'a head with other children'], build: () => ({ head: ['meta', 'stale', 'title'], calls: [1] }) },
      { name: 'two calls into an empty head', enters: ['an empty head', 'a second call'], build: () => ({ head: [], calls: [0, 2] }) },
      { name: 'a first call that throws (Y1)', enters: ['an empty head', 'a call that throws'], build: () => ({ head: [], calls: [3] }) },
    ],
  },
  model: injectModel,
  reached: (plan) => [
    ...(plan.head.length === 0 ? ['an empty head'] : []),
    ...(plan.head.includes('stale') ? ['an earlier typography.js style'] : []),
    ...(plan.calls.length > 1 ? ['a second call'] : []),
    ...(plan.head.some((c) => c !== 'stale') ? ['a head with other children'] : []),
    ...(plan.calls.includes(FAILS) ? ['a call that throws'] : []),
  ],
  driver: injectDriver,
  check: injectCheck,
  calibrations: [
    {
      name: 'appended last instead of first',
      law: S7,
      corrupt: (trace, plan) =>
        plan.head.length === 0 || plan.head.includes('stale') || plan.calls[0] === FAILS
          ? undefined
          : trace.map((o) => {
              if (o.checkpoint !== 'head after call 0') return o
              const { head } = o.value as { head: Array<HeadChild> }
              return { ...o, value: { threw: false, head: [...head.slice(1), head[0]] } }
            }),
    },
    {
      name: 'an empty style left by a call that threw',
      law: S7,
      corrupt: (trace, plan) =>
        plan.calls[0] !== FAILS || plan.head.includes('stale')
          ? undefined
          : trace.map((o) =>
              o.checkpoint === 'head after call 0'
                ? { ...o, value: { threw: true, head: [{ tag: 'style', id: 'typography.js', text: '' }, ...(o.value as { head: Array<HeadChild> }).head] } }
                : o,
            ),
    },
  ],
})

// ---------------------------------------------------------------------------
// Q4b: every declaration is valid CSS in Chrome.
// ---------------------------------------------------------------------------

const Q4B = 'Q4b every declaration typography.js writes is valid CSS'
const THEMES = readdirSync('packages').filter((p) => p.startsWith('typography-theme-')).sort()
const themes = new Map<string, Record<string, unknown>>(
  await Promise.all(THEMES.map(async (name) => [name, (await import(`../packages/${name}/src/index.js`)).default] as [string, Record<string, unknown>])),
)
// blockMarginBottom goes into calc() in the margins: each valid form must
// make CSS that Chrome keeps (review X6).
const BLOCK_MARGINS = [undefined, 2, '0.5', '1.5rem', '20px', '5%', '-0.5rem', 'calc(1rem + 2px)', 'var(--m)', ' -1rem', 'auto', 'inherit'] as const
type ValidityHistory = { theme: string | undefined; codePlugin: boolean; blockMarginBottom: (typeof BLOCK_MARGINS)[number] }

// A property name in CSS, read independently: kebab case; Webkit, Moz, O
// gain their dash from the capital, ms gets one.
const cssName = (property: string) => {
  if (property.startsWith('--')) return property
  const k = property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
  return k.startsWith('ms-') ? `-${k}` : k
}
const OTHER_ENGINE = /^-(?:moz|ms|o)-/
type Declaration = { scope: Array<string>; selector: string; property: string; value: string }
const declarations = (json: Record<string, unknown>, scope: Array<string> = []): Array<Declaration> =>
  Object.entries(json).flatMap(([selector, body]) =>
    Object.entries(body as Record<string, unknown>).flatMap(([property, value]) =>
      value !== null && typeof value === 'object'
        ? declarations({ [property]: value }, [...scope, selector])
        : value === null || value === undefined
          ? []
          : [{ scope, selector, property: cssName(property), value: String(value) }],
    ),
  )

// In the page: whether each declaration is supported, and its selector list
// and @media prelude parse (an invalid media query reads as "not all").
function judgeInPage(items: Array<Declaration>) {
  const parses = (selector: string) => {
    try {
      document.querySelectorAll(selector)
      return true
    } catch {
      return false
    }
  }
  return items.map(({ scope, selector, property, value }) =>
    [
      ...(CSS.supports(property, value) ? [] : [`${selector} { ${property}: ${value} }`]),
      ...(parses(selector) ? [] : [`selector ${selector}`]),
      ...scope.filter((prelude) => window.matchMedia(prelude.replace(/^@media/, '').trim()).media === 'not all').map((prelude) => `prelude ${prelude}`),
    ],
  )
}

async function validityDriver(plan: ValidityHistory, observe: (checkpoint: string, value: unknown) => void) {
  const theme = plan.theme === undefined ? {} : (themes.get(plan.theme) ?? {})
  const plugins = [...((theme.plugins as Array<unknown>) ?? []), ...(plan.codePlugin ? [codePlugin()] : [])]
  let json: Record<string, unknown>
  try {
    json = typography({ ...theme, plugins, ...(plan.blockMarginBottom === undefined ? {} : { blockMarginBottom: plan.blockMarginBottom }) }).toJSON() as Record<string, unknown>
  } catch (error) {
    observe('Chrome rejects', [`typography() or toJSON() threw: ${String(error)}`])
    return
  }
  const items = declarations(json).filter((d) => !OTHER_ENGINE.test(d.property))
  observe('Chrome rejects', [...new Set((await page.evaluate(judgeInPage, items)).flat())])
}

oracleProperty<ValidityHistory, { rejects: Array<string> }>({
  id: 'typography-declarations-chrome',
  owns: [
    'packages/typography/src/utils/createStyles.js',
    'packages/typography-plugin-code/src/index.js',
    'packages/typography-theme-alton/src/index.js',
    'packages/typography-theme-bootstrap/src/index.js',
    'packages/typography-theme-de-young/src/index.js',
    'packages/typography-theme-doelger/src/index.js',
    'packages/typography-theme-elk-glen/src/index.js',
    'packages/typography-theme-fairy-gates/src/index.js',
    'packages/typography-theme-funston/src/index.js',
    'packages/typography-theme-github/src/index.js',
    'packages/typography-theme-grand-view/src/index.js',
    'packages/typography-theme-irving/src/index.js',
    'packages/typography-theme-judah/src/index.js',
    'packages/typography-theme-kirkham/src/index.js',
    'packages/typography-theme-lawton/src/index.js',
    'packages/typography-theme-legible/src/index.js',
    'packages/typography-theme-lincoln/src/index.js',
    'packages/typography-theme-moraga/src/index.js',
    'packages/typography-theme-noriega/src/index.js',
    'packages/typography-theme-ocean-beach/src/index.js',
    'packages/typography-theme-parnassus/src/index.js',
    'packages/typography-theme-st-annes/src/index.js',
    'packages/typography-theme-stardust/src/index.js',
    'packages/typography-theme-stern-grove/src/index.js',
    'packages/typography-theme-stow-lake/src/index.js',
    'packages/typography-theme-sutro/src/index.js',
    'packages/typography-theme-twin-peaks/src/index.js',
    'packages/typography-theme-us-web-design-standards/src/index.js',
    'packages/typography-theme-wikipedia/src/index.js',
    'packages/typography-theme-wordpress-2010/src/index.js',
    'packages/typography-theme-wordpress-2011/src/index.js',
    'packages/typography-theme-wordpress-2012/src/index.js',
    'packages/typography-theme-wordpress-2013/src/index.js',
    'packages/typography-theme-wordpress-2014/src/index.js',
    'packages/typography-theme-wordpress-2015/src/index.js',
    'packages/typography-theme-wordpress-2016/src/index.js',
    'packages/typography-theme-wordpress-kubrick/src/index.js',
  ],
  law: {
    statement: `${Q4B}: for the defaults, every theme, the code plugin, and each valid blockMarginBottom form, Chrome's CSS.supports(property, value) holds for each toJSON() declaration, and each selector list and @media prelude parses; -moz-, -ms-, and -o- declarations are other engines'.`,
    authority: 'CSS Syntax 3; each property\'s specification as Chrome implements it; engineer decisions 2026-11-12 (Q4b: valid CSS for every declaration typography.js writes).',
    limits: 'Chrome only. normalize.css is not judged. Themes with their own options as shipped; the blockMarginBottom forms with the default options only.',
  },
  histories: {
    // Themes as shipped (some, such as lawton, read their own numeric
    // blockMarginBottom); the margin forms with the default options.
    arbitrary: fc.oneof(
      fc.record({ theme: fc.constantFrom<string | undefined>(...THEMES), codePlugin: fc.boolean(), blockMarginBottom: fc.constant(undefined) }),
      fc.record({ theme: fc.constant(undefined), codePlugin: fc.boolean(), blockMarginBottom: fc.constantFrom(...BLOCK_MARGINS) }),
    ),
    runs: 10,
    fixedSeeds: [20261112],
    states: ['the defaults', 'a theme', 'the code plugin', 'a CSS length block margin'],
    constructed: [
      { name: 'the defaults', enters: ['the defaults'], build: () => ({ theme: undefined, codePlugin: false, blockMarginBottom: undefined }) },
      { name: 'a theme with the code plugin', enters: ['a theme', 'the code plugin'], build: () => ({ theme: THEMES[0], codePlugin: true, blockMarginBottom: undefined }) },
      { name: 'a calc() block margin with the code plugin', enters: ['the defaults', 'the code plugin', 'a CSS length block margin'], build: () => ({ theme: undefined, codePlugin: true, blockMarginBottom: 'calc(1rem + 2px)' }) },
    ],
    // Every theme, every run.
    fixed: [{ name: 'the defaults with the code plugin', history: { theme: undefined, codePlugin: true, blockMarginBottom: undefined } }, ...THEMES.map((theme) => ({ name: theme, history: { theme, codePlugin: false, blockMarginBottom: undefined } }))],
  },
  model: () => ({ rejects: [] }),
  reached: (plan) => [plan.theme === undefined ? 'the defaults' : 'a theme', ...(plan.codePlugin ? ['the code plugin'] : []), ...(typeof plan.blockMarginBottom === 'string' && /[a-z%(]/.test(plan.blockMarginBottom) ? ['a CSS length block margin'] : [])],
  driver: validityDriver,
  check: (_plan, trace, expected) => {
    const rejects = valueAt(trace, 'Chrome rejects')
    return Array.isArray(rejects) && rejects.length > 0
      ? violation('Chrome rejects', `Chrome drops ${rejects.length} declaration(s) or selector(s)`, Q4B, { actual: rejects })
      : (differs('Chrome rejects', Q4B, rejects, expected.rejects) ?? pass)
  },
  calibrations: [
    { name: 'a misspelled property kept', law: Q4B, corrupt: (trace) => trace.map((o) => (o.checkpoint === 'Chrome rejects' ? { ...o, value: ['h4 { text-transformation: uppercase }'] } : o)) },
  ],
})
