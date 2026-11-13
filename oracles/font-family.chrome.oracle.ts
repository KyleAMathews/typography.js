/*
This is the Chrome witness of typography.js's font-stack promise. It owns the
same promise, law, model, histories, and check as `font-family.oracle.ts`
(whose opening states the law), on another driver: production's whole
stylesheet, `typography(options).toString()`, parsed by Chrome, and read back
through the CSS Object Model. It owns `packages/typography/src/utils/fontFamily.js`.

```js
typography({ bodyFontFamily: ["Font's Name", 'serif'] }).toString()
  // → in Chrome, body's declared font-family is the family Font's Name, then serif
typography({ headerFontFamily: ["''"] }).toString()
  // → no broken string ends a rule early, so every later rule survives
```

Why a second judge? The Node driver reads production's text with a reader
that this repository wrote, and the model uses the same reader to recognize
`var()`. A mistake in that reader could hide the same mistake in production.
Here Chrome does the hard reading: it tokenizes production's CSS, drops what is
invalid, and serializes what survives in canonical form. The reader then only
parses Chrome's own serialization. Chrome also sees what reading one value at
a time cannot: a string that never closes eats the rules after it (probe 8),
so a broken `h1` stack can take every later rule with it.

Chrome reports a dropped declaration, or a rule that a broken string
swallowed, as an empty value, and the check reads an empty value as an
invalid list. For `html`, Chrome expands the `font` shorthand into longhands,
which the check reads as the cascade would. A declaration that holds `var()`
stays unparsed until computed-value time, so Chrome returns its text, and the
reader reads that text as in the Node driver.

Limits: for a stack
with `var()`, Chrome only shows that the declaration survives; the list
itself is read by the reader. One browser: Safari's and Firefox's readings are
not checked. The other limits are those of `font-family.oracle.ts`.
*/
import { chromium } from 'playwright-core'
import { afterAll } from 'vitest'
import { differs, oracleProperty, pass } from '@tanstack/oracles'
import type { Observation } from '@tanstack/oracles'
import typography from '../packages/typography/src/index.js'
import {
  FIXED_HISTORIES,
  L1,
  LAW,
  calibrations,
  check,
  constructedHistories,
  declaredStates,
  historyArbitrary,
  model,
  reached,
  resolve,
  thrown,
} from './font-family-law'
import type { Expected, History, Plan } from './font-family-law'

// One browser and one page for the whole file; each history replaces the
// stylesheet under test. Chrome must be installed: a missing browser fails
// here, loudly, instead of skipping the witness.
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage()
await page.setContent('<!doctype html><html><head><style id="under-test"></style></head><body></body></html>')
afterAll(() => browser.close())

type Read = { html: Array<[string, string]>; body: string; headers: Array<string> }

/**
 * In the page: parse `css` as the stylesheet, and return the declared values
 * of the last `html`, `body`, and `h1`–`h6` rules, as Chrome serializes them.
 * A missing rule or a dropped declaration is "".
 */
function readInChrome(css: string): Read {
  const style = document.getElementById('under-test') as HTMLStyleElement
  style.textContent = css
  const rules = [...(style.sheet as CSSStyleSheet).cssRules].filter(
    (r): r is CSSStyleRule => r instanceof CSSStyleRule,
  )
  const declared = (selector: string) => rules.findLast((r) => r.selectorText === selector)?.style
  const value = (selector: string, property: string) => declared(selector)?.getPropertyValue(property) ?? ''
  const html: Array<[string, string]> = []
  const family = value('html', 'font-family')
  // A `font` shorthand with var() keeps its longhands pending: read its text.
  if (family) html.push(['fontFamily', family])
  else if (value('html', 'font')) html.push(['font', value('html', 'font')])
  for (const [key, property] of [
    ['fontSize', 'font-size'],
    ['lineHeight', 'line-height'],
  ] as const)
    if (value('html', property)) html.push([key, value('html', property)])
  return {
    html,
    body: value('body', 'font-family'),
    headers: [1, 2, 3, 4, 5, 6].map((level) => value(`h${level}`, 'font-family')),
  }
}

// In the page: html's computed font size and line height under `css`.
// An earlier html rule sets the font longhands that the `font` shorthand
// resets (engineer decision 2026-11-13, review P6).
const EARLIER = 'html{font-style:italic;font-weight:300;font-stretch:condensed;font-variant:small-caps}'
function computedRoot(css: string) {
  ;(document.getElementById('under-test') as HTMLStyleElement).textContent = css
  const style = getComputedStyle(document.documentElement)
  return {
    fontSize: style.fontSize,
    lineHeight: style.lineHeight,
    resets: { fontStyle: style.fontStyle, fontWeight: style.fontWeight, fontStretch: style.fontStretch, fontVariant: style.fontVariant },
  }
}

async function driver(plan: Plan, observe: (checkpoint: string, value: unknown) => void) {
  // The reference: the same call with a plain stack (see the Node driver).
  try {
    const reference = typography({ bodyFontFamily: ['serif'], headerFontFamily: ['serif'] }).toString()
    observe('reference html', (await page.evaluate(readInChrome, reference)).html)
  } catch (e) {
    observe('reference', thrown(e))
  }

  let t: ReturnType<typeof typography>
  try {
    // As the caller gave them: an omitted stack is passed as undefined.
    t = typography({ bodyFontFamily: plan.given.body, headerFontFamily: plan.given.header })
  } catch (e) {
    observe('typography()', thrown(e))
    return
  }
  observe('typography()', { threw: false })
  observe('options', { body: t.options.bodyFontFamily, header: t.options.headerFontFamily })
  let css: string
  try {
    css = t.toString()
  } catch (e) {
    observe('toString()', thrown(e))
    return
  }
  observe('stylesheet', { lessThan: css.includes('<') })
  const read = await page.evaluate(readInChrome, css)
  observe('html', read.html)
  // L1 at computed-value time (review R4): at an 18px base, html computes to
  // 18px with line height 1.45 whatever the stack, with every var() in it
  // undefined, as a page that has not set its variable yet.
  const at18 = typography({ bodyFontFamily: plan.given.body, headerFontFamily: plan.given.header, baseFontSize: '18px' }).toString()
  observe('html computed at 18px', await page.evaluate(computedRoot, EARLIER + at18))
  observe('body.fontFamily', read.body)
  read.headers.forEach((family, k) => observe(`h${k + 1}.fontFamily`, family))
}

oracleProperty<History, Expected, Plan>({
  id: 'typography-font-family-chrome',
  owns: ['packages/typography/src/index.js', 'packages/typography/src/utils/fontFamily.js', 'packages/typography/src/utils/css.js', 'packages/typography/src/utils/createStyles.js'],
  law: {
    ...LAW,
    limits:
      'Read by Chrome (installed Chrome, via playwright-core). For a stack with var(), Chrome only shows that the declaration survives; the list is read by the reader. The computed base size is not judged for a lone monospace stack, which browsers size against their monospace default. Safari and Firefox are not checked. Otherwise the limits of typography-font-family (font-family.oracle.ts).',
  },
  histories: {
    arbitrary: historyArbitrary(),
    // A browser round trip per history: a smaller budget than the Node driver.
    runs: 25,
    fixedSeeds: [20261111],
    states: declaredStates(),
    constructed: constructedHistories(),
    fixed: FIXED_HISTORIES,
  },
  resolve,
  model,
  driver,
  check: (plan: Plan, trace: ReadonlyArray<Observation>, expected: Expected) => {
    const judged = check(plan, trace, expected)
    if (judged !== pass || 'throws' in expected) return judged
    // A stack that is the generic monospace alone sizes against the
    // browser's monospace default (13px in Chrome), not 16px: a browser
    // behavior, the same in v0.16, and outside this law.
    // Every stack resets the font longhands that an earlier html rule set
    // (P6), and keeps the base size and line height.
    const computed = trace.find((o) => o.checkpoint === 'html computed at 18px')?.value as { fontSize: string; lineHeight: string; resets: object }
    const resets = differs('html computed at 18px', L1, computed?.resets, { fontStyle: 'normal', fontWeight: '400', fontStretch: '100%', fontVariant: 'normal' }, 'an earlier html rule shows through')
    if (resets) return resets
    const body = expected.body
    if (body.length === 1 && 'generic' in body[0] && body[0].generic === 'monospace') return pass
    return differs('html computed at 18px', L1, { fontSize: computed?.fontSize, lineHeight: computed?.lineHeight }, { fontSize: '18px', lineHeight: '26.1px' }, 'the stack changed the computed base size or line height') ?? pass
  },
  reached,
  calibrations,
})
