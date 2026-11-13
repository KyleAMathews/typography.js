/*
This oracle owns react-typography's promise (README, React.js helper
components): `TypographyStyle` renders the generated CSS in a style element,
and `GoogleFont` renders the link that loads the theme's Google Fonts and
weights. It renders both components to static markup with react-dom/server.

```js
<TypographyStyle typography={t} />   // → <style id="typography.js">{t.toString()}</style>
<GoogleFont typography={typography({ googleFonts: [{ name: 'Open Sans', styles: ['400', '700'] }] })} />
                                     // → <link href="//fonts.googleapis.com/css?family=Open+Sans:400,700" …/>
<GoogleFont typography={typography({ googleFonts: [{ name: 'Roboto', styles: ['400', '700&display=swap'] }] })} />
                                     // → family=Roboto:400,700&display=swap (as v0.16 wrote it)
```

Why does this need a law? A font without `styles` crashed rendering, a
numeric style crashed it, and a `googleFonts` of null rendered nothing React
accepts. The URL itself is v0.16's text: sites put query parameters such as
`&display=swap` into a style, and no Google family name holds "&", "=",
"#", or "%" (engineer decision 2026-11-12, review P1, which replaced round
6's encoding).

S8a. `TypographyStyle` renders exactly `<style id="typography.js">` holding
`toString()`, unescaped (the style element is raw text, and S4 keeps "<" out
of the stylesheet).
S8b. `typography().options.googleFonts` is the option as given, or [] when it
is not given (v0.16), as plugins that build their own links read it.
`GoogleFont` renders nothing when `googleFonts` is empty, null, or not given.
Otherwise it renders one `<link rel="stylesheet" type="text/css">` whose
href is `//fonts.googleapis.com/css?family=` and then each font in order,
separated by "|": the name with its spaces as "+", then ":" and its styles
(numbers as written) separated by "," when it has any. A font without
styles requests the name alone, which the Google Fonts CSS API serves in its
default weight. The href parses, by the URL Standard, as the Google Fonts
CSS API.

The model reads the plan alone. The check reads the markup with an
attribute reader of its own and the href with the WHATWG URL parser.

Limits: what Google Fonts serves for a name is not checked. The stylesheet's
content is S4's (stylesheet.oracle.ts); here it is only embedded.
*/
import fc from 'fast-check'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { differs, oracleProperty, pass, violation } from '@tanstack/oracles'
import type { Observation } from '@tanstack/oracles'
import { GoogleFont, TypographyStyle } from '../packages/react-typography/src/index.js'
import typography from '../packages/typography/src/index.js'

const S8a = 'S8a TypographyStyle embeds toString()'
const S8b = 'S8b GoogleFont requests each family with its styles'

type Font = { name: string; styles: Array<string | number> | undefined }
type History = {
  googleFonts: Array<Font> | null | undefined
  includeNormalize: boolean
  baseFontSize: string
}

// Names as Google Fonts lists them, and names that a raw query would change:
// "&" and "#" end the value, "+" reads as a space, "%" starts an escape.
const NAMES = ['Open Sans', 'Open+Sans', 'Roboto', 'Montserrat', 'Source Code Pro', 'Font & Co', 'A+B Sans', 'Hash #1', '100% Sans', 'Ünïcödé', "O'Reilly", 'Fira  Sans', 'Name=Value']
// A number is a style too, as design-tools writes it (review Q1).
const STYLES = ['400', '700', '400italic', '700i', '300', 'bold', '100;200', 700, 400, '700&display=swap']
const font = fc.record({
  name: fc.constantFrom(...NAMES),
  styles: fc.oneof(
    { weight: 4, arbitrary: fc.array(fc.constantFrom<string | number>(...STYLES), { minLength: 1, maxLength: 3 }) },
    { weight: 1, arbitrary: fc.constantFrom<Array<string> | undefined>(undefined, []) },
  ),
})
const arbitrary: fc.Arbitrary<History> = fc.record({
  googleFonts: fc.oneof(
    { weight: 6, arbitrary: fc.array(font, { maxLength: 3 }) },
    { weight: 1, arbitrary: fc.constantFrom<null | undefined>(null, undefined) },
  ),
  includeNormalize: fc.boolean(),
  baseFontSize: fc.constantFrom('16px', '18px', '1.25rem'),
})

type Expected = { href: string | undefined }
const model = (plan: History): Expected => {
  const fonts = plan.googleFonts ?? []
  if (fonts.length === 0) return { href: undefined }
  const name = (f: Font) => f.name.split(' ').join('+')
  return { href: `//fonts.googleapis.com/css?family=${fonts.map((f) => (f.styles && f.styles.length > 0 ? `${name(f)}:${f.styles.join(',')}` : name(f))).join('|')}` }
}

function driver(plan: History, observe: (checkpoint: string, value: unknown) => void) {
  let t: ReturnType<typeof typography>
  try {
    t = typography({
      includeNormalize: plan.includeNormalize,
      baseFontSize: plan.baseFontSize,
      ...(plan.googleFonts !== undefined ? { googleFonts: plan.googleFonts } : {}),
    })
    observe('toString()', t.toString())
    observe('options.googleFonts', t.options.googleFonts)
    observe('TypographyStyle', renderToStaticMarkup(createElement(TypographyStyle, { typography: t })))
  } catch (error) {
    observe('error', error)
    return
  }
  try {
    observe('GoogleFont', renderToStaticMarkup(createElement(GoogleFont, { typography: t })))
  } catch (error) {
    observe('GoogleFont error', error)
  }
}

// HTML attribute text as the HTML Standard decodes the entities React writes.
const decodeAttribute = (text: string) =>
  text.replace(/&(amp|quot|#x27|#39|lt|gt);/g, (_, e: string) => ({ amp: '&', quot: '"', '#x27': "'", '#39': "'", lt: '<', gt: '>' })[e] ?? '')
const valueAt = (trace: ReadonlyArray<Observation>, checkpoint: string) => trace.find((o) => o.checkpoint === checkpoint)?.value

function check(plan: History, trace: ReadonlyArray<Observation>, expected: Expected) {
  const failed = valueAt(trace, 'error')
  if (failed) return violation('error', 'typography(), toString(), or TypographyStyle threw on valid options', S8a, { actual: failed })
  const style = differs('TypographyStyle', S8a, valueAt(trace, 'TypographyStyle'), `<style id="typography.js">${String(valueAt(trace, 'toString()'))}</style>`)
  if (style) return style
  // The option as given, or [] (README, Configuration; v0.16), which plugins read.
  const option = differs('options.googleFonts', S8b, valueAt(trace, 'options.googleFonts'), plan.googleFonts === undefined ? [] : plan.googleFonts)
  if (option) return option
  const error = valueAt(trace, 'GoogleFont error')
  if (error) return violation('GoogleFont error', 'GoogleFont threw', S8b, { actual: error })
  const markup = String(valueAt(trace, 'GoogleFont'))
  if (expected.href === undefined) return differs('GoogleFont', S8b, markup, '') ?? pass
  const link = /^<link href="([^"]*)" rel="stylesheet" type="text\/css"\/>$/.exec(markup)
  if (!link) return violation('GoogleFont', 'the markup is not one stylesheet link', S8b, { actual: markup })
  const href = decodeAttribute(link[1])
  const url = new URL(href, 'https://example.invalid/')
  const where = differs('GoogleFont', S8b, `${url.host}${url.pathname}`, 'fonts.googleapis.com/css', 'the link is not the Google Fonts CSS API')
  if (where) return where
  return differs('GoogleFont', S8b, href, expected.href, 'the href is not the families as v0.16 wrote them') ?? pass
}

const withMarkup = (trace: ReadonlyArray<Observation>, f: (markup: string) => string) =>
  trace.map((o) => (o.checkpoint === 'GoogleFont' ? { ...o, value: f(String(o.value)) } : o))

oracleProperty<History, Expected>({
  id: 'react-typography',
  owns: ['packages/react-typography/src/GoogleFont.js', 'packages/react-typography/src/TypographyStyle.js', 'packages/typography/src/index.js', 'packages/typography/src/utils/configure.js'],
  law: {
    statement: `${S8a}: <style id="typography.js"> holding toString() as is. ${S8b}: options.googleFonts as given, or [] when not given; nothing without fonts; otherwise one stylesheet link whose href is //fonts.googleapis.com/css?family= and each name (spaces as +) with ":" and its styles joined by ",", fonts joined by "|", as v0.16 wrote it; a font without styles is its name alone.`,
    authority: 'README (React.js helper components); URL Standard (URL parsing); Google Fonts CSS API v1 (family=Name:styles|Name); v0.16 GoogleFont; engineer decisions 2026-11-12 (S8 sketch; coverage in this PR; review P1: v0.16 passthrough).',
    limits: 'Names and styles from fixed lists. Up to 3 fonts. What Google Fonts serves is not checked. The stylesheet content is S4\'s; here it is only embedded.',
  },
  histories: {
    arbitrary,
    runs: 100,
    fixedSeeds: [20261112],
    states: ['no fonts', 'a name a raw query changes', 'a font without styles', 'null googleFonts', 'several fonts', 'a numeric style'],
    constructed: [
      { name: 'a name with "&"', enters: ['a name a raw query changes'], build: (h) => ({ ...h, googleFonts: [{ name: 'Font & Co', styles: ['400'] }] }) },
      { name: 'a font without styles', enters: ['a font without styles'], build: (h) => ({ ...h, googleFonts: [{ name: 'Roboto', styles: undefined }] }) },
      { name: 'null googleFonts', enters: ['null googleFonts', 'no fonts'], build: (h) => ({ ...h, googleFonts: null }) },
      { name: 'a query parameter in a style (P1)', enters: ['a name a raw query changes'], build: (h) => ({ ...h, googleFonts: [{ name: 'Roboto', styles: ['400', '700&display=swap'] }] }) },
      { name: 'a numeric style (Q1)', enters: ['a numeric style'], build: (h) => ({ ...h, googleFonts: [{ name: 'Open Sans', styles: [700] }] }) },
      { name: 'two fonts', enters: ['several fonts'], build: (h) => ({ ...h, googleFonts: [{ name: 'Open Sans', styles: ['400', '700'] }, { name: 'Montserrat', styles: ['700'] }] }) },
    ],
    fixed: [
      { name: 'the README example', history: { googleFonts: [{ name: 'Montserrat', styles: ['700'] }], includeNormalize: true, baseFontSize: '16px' } },
      { name: 'no googleFonts option', history: { googleFonts: undefined, includeNormalize: false, baseFontSize: '16px' } },
    ],
  },
  model,
  reached: (plan) => {
    const fonts = plan.googleFonts ?? []
    return [
      ...(fonts.length === 0 ? ['no fonts'] : []),
      ...(fonts.some((f) => /[&#+%=]/.test(f.name) || f.styles?.some((s) => /[&#+%=;]/.test(String(s)))) ? ['a name a raw query changes'] : []),
      ...(fonts.some((f) => f.styles?.some((s) => typeof s === 'number')) ? ['a numeric style'] : []),
      ...(fonts.some((f) => !f.styles || f.styles.length === 0) ? ['a font without styles'] : []),
      ...(plan.googleFonts === null ? ['null googleFonts'] : []),
      ...(fonts.length > 1 ? ['several fonts'] : []),
    ]
  },
  driver,
  check,
  calibrations: [
    { name: 'spaces as %20 kept literal in the value', law: S8b, corrupt: (trace, plan) => (plan.googleFonts?.some((f) => f.name.includes(' ')) ? withMarkup(trace, (m) => m.replace(/\+/g, '%2B')) : undefined) },
    { name: 'a query parameter in a style encoded (round 6)', law: S8b, corrupt: (trace, plan) => (plan.googleFonts?.some((f) => f.styles?.some((st) => String(st).includes('&'))) ? withMarkup(trace, (m) => m.replace(/&amp;display=/g, '%26display%3D')) : undefined) },
    { name: 'the last font dropped', law: S8b, corrupt: (trace, plan) => ((plan.googleFonts?.length ?? 0) > 1 ? withMarkup(trace, (m) => m.replace(/(%7C|\|)[^|"]*"/, '"')) : undefined) },
    { name: 'the style element escaped', law: S8a, corrupt: (trace) => trace.map((o) => (o.checkpoint === 'TypographyStyle' ? { ...o, value: String(o.value).replace(/"/g, '&quot;').replace('id=&quot;typography.js&quot;', 'id="typography.js"') } : o)) },
  ],
})
