/*
This oracle owns typography.js's promise that a font stack reaches the
stylesheet as the same stack: each entry of `bodyFontFamily` and
`headerFontFamily` comes out as the same family, a generic family stays
generic, and no browser drops the declaration that carries it. It is checked
on `typography(options)` and on its `toJSON()` (`html`, `body`, `h1`–`h6`), and
owns `packages/typography/src/utils/fontFamily.js`.

```js
typography({ bodyFontFamily: ["Font's Name", 'serif'] }) // → the family Font's Name, then serif; the declaration applies
typography({ bodyFontFamily: ['Lato', 'System-UI'] })    // → Lato, then the generic system-ui
typography({ bodyFontFamily: ['generic(kai)', 'serif'] }) // → the family named generic(kai), then serif
typography({ bodyFontFamily: ['var(--brand)', 'serif'] }) // → var(--brand), serif, unchanged
typography({ bodyFontFamily: ["var(--f, '</style>')"] }) // → var(--f, '\3c /style>'): the same string, no "<"
typography({ bodyFontFamily: ['Lato', 'inherit'] })      // → Lato, then the family named "inherit"
typography({ bodyFontFamily: ['inherit'] })              // → font-family: inherit, and html keeps its size and line height
typography({ bodyFontFamily: [], headerFontFamily: [] }) // → throws, naming both options
```

Why does `"Font's Name"` matter? Wrapping each name in quotes looks right and
passes every snapshot, but `'Font's Name'` is not a CSS string: the browser
reads `'Font'`, then a stray identifier, and drops the whole
`html { font: 100%/1.45 … }` declaration. The page loses its family and its
line height together.

An entry is one of four things, and its spelling decides which. The *keyword
table* is CSS Fonts 4's generic keywords (`serif` … `ui-rounded`), matched in
any ASCII case. CSS Fonts 4's functional `generic(fangsong)` and its siblings
are family names until browsers implement them: Chrome 157 drops a whole
declaration that holds one unquoted. The
*CSS-wide words* (`inherit`, `initial`, `unset`, `revert`, `revert-layer`) are
keywords only when they are the whole stack. An entry that is exactly one
well-formed `var()` is passed through, with each `<` escaped. Everything else is a *family name*, including `default` and a
CSS-wide word inside a longer stack, and it must come back as exactly that
string.

L0. For every stack, `typography(options).options` keeps the entries as given.
L1. For every family name, the emitted list item reads back as that name
(CSS Syntax 3 strings, CSS Fonts 4 §2.1.1). NUL and lone surrogates read back
as U+FFFD, since no CSS text can carry them (§3.3, §4.3.7). A name never puts
a `<` in the stylesheet, which must fit in a `<style>` element. That holds
for every stack, `var()` entries included. The list is
valid CSS, and `html` carries the same list as `body`.
L2. For every keyword in the table, in any case, the item reads back as that
generic family (CSS Fonts 4 §2.1.2; CSS Values 4 §4.1). Every `generic(...)`
entry reads back as a family name (maintainer decision 2026-11-11).
L3. For every entry that is exactly one well-formed `var(--name[, fallback])`,
in any case, the item is the entry unchanged, except that each `<` becomes
`\3c ` (#307; maintainer decision 2026-11-11). Text around the `var()`, such
as a comment or a space, makes the entry a family name.
L4. A CSS-wide word or `default` in a stack of two or more reads back as a
family name. A CSS-wide word alone is that keyword, and then `html` still has
the base size and line height that a plain stack gives (CSS Values 4 §2.1;
CSS 2.1 §15.3; maintainer decision 2026-11-11).
L5. An empty stack, or one with a non-string entry, makes `typography()` throw
an error that names every invalid option (CSS Fonts 4 §2.1: one or more families;
maintainer decision 2026-11-11). An undefined stack is an omitted one: the
README default (maintainer decision 2026-11-12). Every other stack returns.

The model reads the plan alone: it classifies each entry by the rules above
and predicts the list of items a browser should read. The check reads
production's text with an independent CSS reader (`css-font-family-reader.ts`,
calibrated against Chrome 157 on 115 values) and compares items, so any
quoting or escaping that a browser reads the same way passes. Histories vary
both stacks, with names drawn from characters that break CSS strings,
keywords in random case, and `var()` forms.

Limits: for a lone CSS-wide keyword, `html`'s longhands do not
reset font-style, -weight, -variant, or -stretch as the shorthand would. The
stack checks are called from `index.js`, which this oracle does not own: the
gap check never mutates that call or the `options` passthrough (L0). The `font` shorthand is read
only in the `<size>/<line-height> <family>` form typography.js writes. A
non-array stack is outside the domain. A family literally named like a
generic cannot be requested. `toString()` is not read: it copies these values
into rules, which is another contract.
*/
import { oracleProperty } from '@tanstack/oracles'
import typography from '../packages/typography/src/index.js'
import {
  BASE_FONT,
  FIXED_HISTORIES,
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

// ---------------------------------------------------------------------------
// The driver: the real entry point, and only public results. The grammar,
// model, and check are in font-family-law.ts.
// ---------------------------------------------------------------------------

function driver(plan: Plan, observe: (checkpoint: string, value: unknown) => void) {
  // The reference: the same call with a plain stack. Its `html` base size and
  // line height are what the stack must not change (L4).
  try {
    const reference = typography({ bodyFontFamily: ['serif'], headerFontFamily: ['serif'] }).toJSON()
    observe('reference html', Object.entries(reference.html).filter(([p]) => BASE_FONT.has(p)))
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
  let json: Record<string, Record<string, unknown>>
  try {
    json = t.toJSON()
  } catch (e) {
    observe('toJSON()', thrown(e))
    return
  }
  // The stylesheet text, for L1's "<" rule (a <style> element must hold it).
  try {
    observe('stylesheet', { lessThan: t.toString().includes('<') })
  } catch (e) {
    observe('toString()', thrown(e))
    return
  }
  observe('html', Object.entries(json.html).filter(([p]) => BASE_FONT.has(p)))
  observe('body.fontFamily', json.body.fontFamily)
  for (let level = 1; level <= 6; level++) observe(`h${level}.fontFamily`, json[`h${level}`].fontFamily)
}

oracleProperty<History, Expected, Plan>({
  id: 'typography-font-family',
  owns: ['packages/typography/src/utils/fontFamily.js'],
  law: {
    ...LAW,
    limits:
      'For a lone CSS-wide keyword, html longhands do not reset font-style, -weight, -variant, or -stretch. The index.js call to the stack checks and the options passthrough (L0) are not owned, so the gap check never mutates them. The font shorthand is read only as "<size>/<line-height> <family list>". Non-array stacks, and stacks longer than 12 entries, are not generated. Names are at most 20 code units, drawn mostly from characters that break CSS strings. A family literally named like a generic keyword cannot be requested. toString() is read only by the Chrome witness (font-family.chrome.oracle.ts), and other options (baseFontSize, themes\' overrideStyles) are not varied.',
  },
  histories: {
    arbitrary: historyArbitrary(),
    runs: 100,
    fixedSeeds: [20261111],
    states: declaredStates(),
    constructed: constructedHistories(),
    fixed: FIXED_HISTORIES,
  },
  resolve,
  model,
  driver,
  check,
  reached,
  calibrations,
})
