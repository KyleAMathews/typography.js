# Evidence: font-family oracle (sketch S1)

Oracles: `typography-font-family` (`oracles/font-family.oracle.ts`, Node
driver over `toJSON()`) and `typography-font-family-chrome`
(`oracles/font-family.chrome.oracle.ts`, Chrome 157 reading `toString()`).
They share `oracles/font-family-law.ts`. The judge is
`oracles/css-font-family-reader.ts`.

Kind of work: **fix a defect** (oracles-design step 7). Base commit `497b712`
(v0.16.24), plus an uncommitted working tree. This record is versioned only once
the change is committed. Record the commit here when it is.

## Law

New. Law S1 is L0–L5 in `oracles/SKETCHES.md`, approved by the maintainer on
2026-11-11 ("follow spec always"). Authority: README, Configuration; CSS
Fonts 4 (W3C WD 4 Nov 2026) §2.1, §2.1.1, §2.1.2; CSS Syntax 3 (W3C CRD
1 Oct 2026) §3.3, §4.3.5, §4.3.7; CSS Values 4 (W3C WD 12 Mar 2024) §2.1,
§4.1, §9; CSS 2.1 §15.3; #307.

## Before and after

- **RED on unchanged production** (`git show HEAD:` versions of `index.js`
  and `createStyles.js`). Both drivers fail with the same laws:
  - L1: an apostrophe name. The fixed seed `20261111` shrinks to
    `{"body":["'","var(--f)"],"header":[""]}`, and the random seed to
    `{"body":["'",""],"header":[""]}`. The output starts `''',`, which is
    invalid, and a browser drops it.
  - L2: fixed history `theme wordpress-kubrick`. `'Sans-Serif'` is a quoted
    family name, so the theme has no generic fallback.
  - L3: fixed history `var() parts` (for example `VAR(--f)` quoted).
  - All 7 calibrations fail too: no history's clean trace passes.
- **GREEN after the fix** (`fontFamily.js` new; `createStyles.js` and
  `index.js` call it): 47/47 tests per driver, 94/94 in all.
- **Neighbors:** Jest 58/58 and 44/44 snapshots. One snapshot is updated
  on purpose, `wordpress-kubrick`: `'Sans-Serif'` → `sans-serif`, in 8 font
  lists. Build, ESLint 3 lint, and the oracle lint are clean.

## Reach (fixed seed 20261111, after review round 1)

| Declared state | Node | Chrome |
| --- | ---: | ---: |
| a name with an apostrophe | 34 | 19 |
| a name with a backslash | 25 | 8 |
| a name with a line break (LF, CR, or FF) | 58 | 23 |
| a name with NUL or a lone surrogate | 55 | 25 |
| a name with < | 21 | 5 |
| an empty name | 30 | 9 |
| a generic not in lower case | 62 | 23 |
| a CSS Fonts 4 generic (system-ui, math, ui-*) | 50 | 18 |
| a generic() entry (a name) | 48 | 18 |
| a var() reference | 67 | 24 |
| a malformed var() | 44 | 17 |
| a CSS-wide word or default in a longer stack | 69 | 23 |
| a lone CSS-wide keyword as the body stack | 3 | 1 |
| a lone CSS-wide keyword as the header stack | 8 | 2 |
| the -apple-system vendor name | 18 | 6 |
| an empty stack | 8 | 3 |
| a non-string entry | 13 | 5 |
| both stacks invalid | 1 | 1 |

Fixed histories: the README defaults, `var() parts`, one per law that the pre-fix code breaks (L4 ×2, L5 ×2), one per review witness (R1/R2, R3, R7, R10), and all 35 theme stacks.

## Calibrations (ORC-006)

Each one rejects with its law on the fixed code: names quoted without
escaping (L1), generics matched case-sensitively (L2), var() quoted as a name
(L3), inherit left unquoted in a list (L4), a lone keyword in the font
shorthand (L4), an empty stack accepted (L5), options trimmed (L0). The first
six are pre-fix behavior (the third for an upper-case `VAR(`). The last is
invented.

## Gap check

`pnpm exec oracle-gaps --package . --source packages/typography/src/utils/fontFamily.js --seed 20261111 --out .oracle-gaps/out`

| Run | Owners | Mutants | Killed | Gaps |
| --- | --- | ---: | ---: | ---: |
| 1, first fix | Node | 85 | 70 | 15 |
| 2, after the design-grammar parts list for `isVarReference`, the reference call recorded, and `quote`'s branch removed | Node | 64 | 64 | 0 |
| 3, Chrome witness added | Node + Chrome | 64 | 64 | 0 |

First law to reject (run 3, 64 mutants): L3 19, L1 15, L4 10, L2 9, "L5 every
other stack returns" 7, "L5 … throws" 4. After review round 1 (69 mutants): see
that section. L0 kills none, because it judges `index.js`,
which no oracle here owns. Its calibration shows it can fail.

The gap check ran on a scratch copy whose owned and oracle files are
byte-identical to the working tree, because the baseline in the working
tree fails on another session's RED oracle (`numeric-typography`) and
`--only` doesn't narrow the baseline.

## Judge calibration

Over 115 values (probe 7, `/tmp/typography-oracle-probes/07-reader-vs-chrome.mjs`),
223 checks are comparable, and the reader agrees with Chrome 157 on 219 of them.
The 4 others are `generic()`, which CSS Fonts 4 defines and Chrome 157 does not
implement. 7 more checks (a `var()` inside the `font` shorthand) are not
comparable, because Chrome leaves those longhands pending. An earlier version of
this record counted them as agreement, which was wrong (review round 2, S4).

## Limits

- A `var()` entry passes through unchanged except that each `<` becomes
  `\3c ` (review round 2). An entry that is not exactly one well-formed
  `var()` becomes a quoted name.
- For a lone CSS-wide keyword, `html` longhands do not reset font-style,
  -weight, -variant, or -stretch (review R9, accepted).
- For a stack with `var()`, the Chrome driver only shows that the
  declaration survives. The reader reads the list.
- The `font` shorthand is read only as `<size>/<line-height> <family list>`.
- The `html` size and line height are checked against a plain-stack
  reference call (a relation), not a prediction.
- Not generated: non-array stacks, stacks over 12 entries, names over 20
  code units. Not varied: other options (`baseFontSize`, themes'
  `overrideStyles`).
- One browser. Safari and Firefox are not checked.
- L0, and the `index.js` call to `checkFontStacks`, are unowned. The
  oracle judges them (review R4: removing the call fails L5, trimming
  options fails L0), but the gap check never mutates them.

## Review round 1 (2026-11-11)

An independent reviewer (fresh agent, `oracles-review`) gave 12 items. Ledger:
`/tmp/typography-review-eval/ledger.md`. Law changes approved by the
maintainer: generic(...) is a family name (R1), the error names every invalid
option (R7), names escape `<` (R10), and lone-keyword longhands are accepted (R9).

- **RED on the first fix's production**, with the extended oracle (both
  drivers): `R1/R2: generic() spellings` → L2, `R3: var() with a comment or an
  escape` → L3, `R7: both stacks empty` → L5, `R10: </style> in a name` → L1.
- **RED per law on pre-fix production** (R5): `L4: inherit in a list` and
  `L4: default first` → L4; `L5: an empty body stack` and `L5: a number in
  the header` → L5.
- **Judge calibration for R3** (probe 11, `/tmp/typography-oracle-probes/11-var-computed-vs-reader.mjs`):
  the reader's var() recognition agrees with Chrome's computed value on 16 of
  16 spellings, including comments and escapes. Probe 7 is unchanged at 219 of
  223 comparable checks.
- **GREEN:** 58/58 per driver, 116/116 in all. Jest 58/58, snapshots unchanged.
- **Gap check (round 1):** 69 mutants, 69 killed, 0 gaps (scratch copy, both drivers). Superseded by round 2.
  First law to reject: L3 23, L1 20, L2 7, L4 7, "L5 every other stack
  returns" 7, "L5 … throws" 5. No generated mutant touches the escape
  class in `quote()` (a regex literal), so the `<` escape is covered by a
  calibration, not a mutant (review round 2, S2).
- New calibrations: "only the first invalid option named" (L5), "a < left raw
  in a name" (L1), "generic() emitted unquoted" (L2).
- R10 is older than this work: `react-typography`'s SSR emitted a live
  `</style><script>` for such a name (probe 10). Names are now escaped. Other
  `toString()` values are the next candidate oracle's contract.

## Review round 2 (2026-11-11)

A second fresh reviewer gave 6 items (ledger `/tmp/typography-review-eval/ledger.md`,
S1–S6). Law delta approved ("agreed"): `<` inside `var()` is escaped as `\3c `,
an entry is a `var()` only when it is exactly the `var(...)`, and a tripwire
watches `generic()` support (probe 12: `CSS.supports('font-family',
'generic(kai)')` is `false` in Chrome 157).

- **RED on round 1's production:** `S1: < in var() fallbacks` → L3 at the
  stylesheet. Calibration "a < left raw in a var()" found no clean trace.
- **The check fix (S2):** with today's production and round 1's check (the
  `var()` exemption), the calibrations "a < left raw in a name, beside a var()"
  and "a < left raw in a var()" fail. The old check passed both corrupted traces.
  With the new check, both reject (L1, L3).
- **S3:** the model now treats text around `var()` as a family name, as
  production does. Witness: `S3: text around var()`.
- **Gap check with authored mutants** (`--mutants oracles/font-family-mutants`,
  7 mutants on the escape class and the `var()` escape): the first run gave 77
  mutants, 75 killed, and 2 gaps:
  - `-apple-system` quoted: decision Q6 was adopted but not enforced. Now L1
    checks the raw text, with calibration "-apple-system quoted".
  - U+007F unescaped: no law needs control characters other than LF, CR, and
    FF escaped. The class is narrowed to the quote, the backslash, `<`, LF,
    CR, and FF, and the mutants are rewritten to match.

  Final run: **78 mutants, 78 killed, 0 gaps**. First law to reject: L1 29,
  L3 23, L2 8, L4 7, "L5 every other stack returns" 7, "L5 … throws" 5.
- **GREEN:** 64/64 per driver, 128/128 in all. Jest 58/58, snapshots unchanged.
- **Evidence numbers corrected (S4):** probe 7 is 219 of 223 comparable checks.
  The first-law tables are updated.

## Prep-pr review (2026-11-11)

A code review (`/code-review`, high) and a simplifier pass reviewed the whole
branch. Ledger: `/tmp/typography-prep-eval/ledger.md`. Font-family items:

- **A1, A2 (fixed):** the `var()` check and the reader both balanced only
  parentheses. `var(--a, {)`, `var(--a, [)`, and a bad `url(` token in a
  fallback passed through, and in Chrome they swallowed the rest of the
  stylesheet (88 rules → 38). Both now follow CSS Syntax 3 §8.2
  `<declaration-value>`: no unmatched `)`/`]`/`}`, no bad string or bad url
  (§4.3.5, §4.3.6), and no top-level `;` or `!`. New grammar dimension: CSS
  tokens in fallbacks (`VAR_FALLBACKS`, `MALFORMED_VAR`).
  - Judge calibration (probe 11): the reader agrees with Chrome on 40 of 42
    spellings. The 2 others are `var(--f /*` and `var(--f, url(x)`, which
    Chrome's `setProperty` closes at the end of the value. In a stylesheet
    they would swallow later rules, so rejecting them is the safe reading.
    Chrome also showed that the first reader was too strict on `url("a" b)`.
  - RED on the round-2 production: both drivers fail `A1/A2: blocks and url()
    in var() fallbacks` (L1). The Chrome driver also fails at `h1`, because
    the stylesheet is swallowed.
  - GREEN: 65/65 per driver, 130/130 in all.
  - Gap check, with 5 more authored mutants (`var-tokens.json`): 204 mutants
    with 46 gaps, then 112/4, 112/2, and 117/1, as witnesses were added and
    `isVarReference` became one token regular expression. Final: **117
    mutants, 117 killed, 0 gaps**.
- **A6 (accepted design):** a whole list in one entry,
  `'var(--font-sans), sans-serif'`, or `'var(--f) '`, is now a quoted name.
  This follows L3 ("exactly one `var()`", round 2, approved). Changelog note.
- **A9 (accepted, engineer: "everyone has chrome installed"):** the Chrome
  witness stays in `pnpm test`. AGENTS.md and the README say Chrome is
  needed.
- **B2, B3 (applied):** the law module imports `asciiLower` and the keyword
  lists from the reader, and its aliases are gone. Oracle code only.
  130/130, and the gap check is unchanged at 117/117.

## Second prep-pr review (2026-11-12)

- **L5 delta (R5):** an undefined stack is the README default. The grammar
  now generates undefined stacks, `resolve` gives the plan the default, and
  both drivers pass the caller's `undefined` through. RED on 4ff9705: the
  fixed seed (`{ body: undefined, header: [""] }`) and `R5: both stacks
  undefined` threw. GREEN: 67/67 per driver.
- **R10 cleanup:** the lone CSS-wide check runs once per stack in
  `fontFamilyList`. Gap check: 116 mutants, 116 killed, 0 gaps.
