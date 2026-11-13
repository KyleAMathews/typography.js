# Numerical oracle review and repair

Two independent subagents used the installed `oracles-review` skill, checklist and glossary. Both completed final targeted verification with no remaining confirmed blocker in their review scopes. Their original and follow-up reports are preserved. No adopted numerical law changed and no maintainer decision is pending from these findings.

Seven distinct confirmed defects were repaired: two in production and five in oracle enforcement or allowed-representation handling. One root-validity finding was reported by both reviewers and remains linked as a duplicate. The two original redundant validation guards were removed with producer analysis and before/after evidence.

This is a review of an uncommitted working tree at HEAD `497b7128fa4d00b2a9db3a473b8096d11f3fa85f`, using @tanstack/oracles preview `cf64491`. Nothing was committed, pushed or published. Concurrent font-family edits were preserved. No dependency-install override was needed in this phase.

## Production results

- `typography({ baseFontSize: '1e-7px' }).rhythm(1)` formerly returned `0e-7px`; it now returns `1.45rem`, preserving the N3 proportional result.
- At base `1.23e308px`, base line-height 1 and count `1.461539134034403`, rounding formerly returned `1.46154rem` whose configured-root physical value is infinite. The call now rejects. Nearby count `1.46153` still returns a finite result.
- Standard implicit/explicit rem rhythm computes from numerical inputs and validates the final rounded physical result. Non-rem requests retain the dependency producer with input/result validation.
- Guard removal retained the same numerical laws. The parent compared 2,000 histories and the independent mechanics reviewer compared 8,505 histories without a result or return-versus-throw difference. These are bounded refactor experiments with pinned-producer reasoning.

## Laws, distinguishing evidence and limits

| Law | What this review checked | Decisive evidence | Remaining limit |
| --- | --- | --- | --- |
| N1 base and heading ratio | Fractional/small base remains input-derived at root/h1. | All prior kills preserved; original fractional-truncation mutant killed. | Sampled evidence does not enumerate all positive finite configurations. |
| N2 geometric scale | Signed/fractional ordinary scale equation retained. | Unchanged ordinary campaigns and both guard-removal comparisons. | Extreme property checks returned-value validity and permits throws; it does not establish the scale equation or required success over every finite position. |
| N3 proportional rhythm | Scientific and decimal small bases with signed/fractional/zero counts, implicit and explicit rem. | Extended oracle RED before production repair; generated/constructed neighbors GREEN; original small-base parser mutant killed. | Exact generic unit conversion/rounding semantics and undocumented options are not established. |
| N4 valid numerical CSS | Root explicit height, complete number syntax, missing tokens and final rounded physical representability. | Accepting corrupted traces and crash calibration before checker repair; rounding RED before production repair; malformed/root and rounding mutants killed. | Reader has a stated supported syntax boundary; no full CSS/browser-layout claim. Generic extreme rhythm may throw or return finite signed spacing. |
| N5 unitless heading multiplier | Declared multiplier compared directly, independently of free secondary heading sizes. | Zero-size/wrong-multiplier corrupted trace rejected; valid optional-root forms reach the intended N5 violation. | Exact secondary heading sizes and exact scale-helper line-height algorithm remain free. |

`review-extended-before-corrected-calibrations.log` preserves checker negative controls and the small-base RED. The first draft calibration accidentally changed root size; only the corrected log counts. `review-rounding-and-root-before.log` preserves the later rounding RED and optional-root false rejection. `review-final-green.log` records the same extended properties GREEN, with 47 registered numerical checks and required fixed/random reach. Checker defects use accepting corrupted traces as their negative evidence; they do not imply that baseline production emitted those corruptions.

## Lossless review ledger

The raw reports, initial ledger and append-only events remain separate. `oracle-review-ledger-final.json` consolidates every item without deleting original claims, proposed fixes, unique duplicate witnesses or evidence. Totals: **12 = 7 fixed-now + 4 accepted-design + 1 duplicate**. No confirmed reviewer defect remains open. Accepted-design records support for scoped refactor/evidence decisions; it does not accept wrong product behavior or close mutation gaps.

| ID | Disposition | Action |
| --- | --- | --- |
| C1 | fixed-now | Extended ordinary bases to 1e-10px with scientific/decimal neighbors and explicit/implicit rem; repaired rem producer. |
| C2 | fixed-now | Validate explicit root shorthand/longhand numerical height and retain optional omission. |
| C3 | fixed-now | Require digits after a decimal point; preserve valid numeric spellings. |
| C4 | fixed-now | Compare the unitless multiplier directly to the configured multiplier. |
| C5 | accepted-design | Retain simplified numerical checks and exact producer assumptions. |
| C6 | accepted-design | Keep bounded formula evidence and validity-only extreme evidence explicit. |
| M1 | duplicate | Resolved through C2 while preserving all unique witnesses. |
| M2 | accepted-design | Retain explicit larger-domain success/formula limitation. |
| M3 | accepted-design | Preserve guard removal with bounded evidence and producer reasoning. |
| N1 | fixed-now | Classify missing known-unit numerical tokens as invalid and add calibration. |
| N2 | fixed-now | Accept fontSize-only longhands and no-slash shorthand; reject malformed explicit slash. |
| N3 | fixed-now | Check rounded coefficient times base before returning; generate large-base/count boundary families and finite controls. |

## Exact verification

`pnpm test` passed build, repository lint, 6 Jest suites / 58 tests / 44 snapshots, and 3 oracle files / 163 checks. The numerical oracle contributes 47 checks; concurrent font-family work accounts for the other oracle checks. Oracle ESLint 9, changed-source legacy ESLint and `git diff --check` passed. Chrome ran outside the sandbox as required by the existing browser witness. `review-final-full-test.log` and the lint logs preserve results.

Final gap command:

```sh
pnpm exec oracle-gaps --package . \
  --source packages/typography/src/index.js,packages/typography/src/utils/createStyles.js \
  --seed 64491 --contexts 4 --pool threads \
  --config vitest.numeric.config.mts \
  --mutants oracles/mutants/numerical \
  --out .oracle-gaps/numeric-reviewed-verified
```

Run **5dcb48d97c73**: **236 mutants, 100 reproducible law kills, zero crashes, 136 open gaps** (106 survived, 30 unreached). All 90 keys killed in `numeric-survivors-fixed` remain present and killed. All five authored defects are killed through registered fixed-seed routes: invalid root line-height (N4), fractional-base truncation (N1), partial CSS parsing (N4), small-base rhythm parser (N3), and unvalidated rounded rhythm (N4).

Raw results, the CLI summary and all 136 complete open-gap records are retained in `review-final-gap-results.json`, `review-final-gap-summary.md` and `review-final-gap-audit.json`. One remaining mutant routes non-rem requests through rem; the current generic property observes validity rather than exact unit/rounding semantics, so the gap remains open. Other open gaps cover defaults, styles, plugins, injection and font-family collateral behavior in the wholly owned files. Their limits do not close them. This is not a zero-gap, whole-domain-closure or PR-readiness claim.

## Reviewer assessment

Both reviewers are recommended for further oracle review. The contract reviewer supplied four reproducible original findings, distinguished production bugs from checker bugs, preserved representation freedom and independently verified the final repairs. Its follow-up also caught optional-root overconstraint. The mechanics reviewer independently reproduced the root observation omission, challenged the numerical boundary rather than only the diff, and found final-rounding overflow during follow-up. Proposed repairs were small, testable and tied to adopted laws. The duplicate root finding is useful independent corroboration. Both kept sampled evidence and unresolved scope separate from confirmed defects; their final reports provide exact source identities and replay artifacts.

## Artifacts and source identity

Start with `oracle-review-contract-final.md` and `oracle-review-mechanics-final.md` for independent final judgments; original and follow-up reports remain alongside them. `review-final-manifest.json` identifies exact source, contract, config, reports and verification artifacts by SHA-256. Final source snapshots and `numeric-production-reviewed.patch` preserve the numerical implementation separately from concurrent work. The patch starts at the saved pre-numerical-repair index snapshot; it is not a complete repository patch.

## Prep-pr review (2026-11-11, font-family session)

A code review of the whole branch gave numeric findings A3, A4, A5, A7, A8,
and A10. The engineer decided each one (oracles/SKETCHES.md S3, "A3", "A4",
"A7"). Ledger: `/tmp/typography-prep-eval/ledger.md`.

- **A3 (fixed, law delta):** v0.16's modularscale ratio names (`'golden'`, …)
  are accepted again, by exact name. Every other string, and any non-string
  that stringifies to a name, throws. RED: 4 failures ("valid numerical input
  threw"). One fixed history per name, plus witnesses `['golden']` and
  `{ toString }`, close the 2 gaps that the first gap check found on the new
  lines.
- **A4 (fixed, law delta):** a pixel `baseLineHeight` (`'24px'`) is accepted,
  as in v0.16. N3 now also checks that `html` carries the base line height,
  and that a unitless one stays unitless. RED: 4 failures. New calibrations:
  "root line height is not the base line height" and "unitless root line
  height written as a length".
- **A5 (accepted design):** `rhythm(null)` and `scale(null)` keep throwing
  under Q2.
- **A7 (fixed, law delta N6 and owed results):** compass-vertical-rhythm reads
  `1.88e+22px` as 1.88 with the unit `e+22px`. `scale(70)` threw, and a base of
  `1e-7px` gave `scale(1).lineHeight` `0e-7px`. Production now gives compass a
  pixel line height, and in rem mode `scale()` takes its line height from the
  rem rhythm.
  - N6: scale's line height is at least its font size.
  - `numerical-result-validity` now requires a return for font sizes up to
    1e300px with a line height of 0.5 or more.
  - `numerical-generic-rhythm-validity` now also checks `scale(1)` in
    px/em/rem.
  - RED on the pre-A7 `index.js`: 7 failures.
  - An exponent-free number formatter was tried and removed: the gap check
    showed that it changed nothing.
- **A8 (fixed in design-tools):** react-number-editor gives strings. The line
  height is now parsed, and a try/catch keeps the last styles while a field
  is invalid. Verified by build and lint only (there is no harness).
- **A10 (fixed):** the dead `src/client.js` and the `modularscale` dependency
  are removed.
- **Check precision:** a random seed found an N3 failure of one ulp with a px
  line height at base 1e-10. The tolerance was base-scaled, so the line height
  and rhythm now also allow 1e-12 relative error. 40 random runs pass.

Final numeric gap check (`index.js` only, numeric config, seed 64491): **129
mutants, 96 killed, 33 gaps**. This is the same open set as before these
changes. The only new name is the older "rem rhythm for every unit" mutant,
now spelled `remRhythm`. No new law-relevant gap remains open on the new
lines, except the positive-flag mutant on the px branch, the same class as
the base-size and ratio flag gaps. Final `pnpm test-ci`: Jest 58/58 with 44
snapshots, oracles 205/205.

## Second prep-pr review (2026-11-12)

A fresh `/code-review high` of PR #313 (head 4ff9705) gave 10 findings
(ledger `/tmp/typography-review2-eval/ledger.md`). The engineer decided L1,
L2, and L3 (`oracles/SKETCHES.md` S3).

- **RED on 4ff9705 (13 failing tests) from the extended oracles:**
  - N4 over every font size and line height in `toJSON()`: `table` at bases
    from about 5e20px gives `1.45e+22e+22px` (R1).
  - The owed `scale()` result in em and px: `scale(80)` throws (R3).
  - The Q2 error message: `16 × 1e308` names "rhythm result" (R4).
  - The explicit-undefined dimension: valid input threw (L1).
  - Stylesheet N6: `code` gets `0e-7px` at a 1e-7px base (L2).
  - N7: compass writes lengths it cannot read, for example an offset of
    5e-324 (L3).
  - Invalid `rhythmUnit` values returned instead of throwing.
- **Production:** compass-vertical-rhythm is inlined into `index.js`
  (`linesForFontSize`, `rhythm`, `adjustFontSizeTo`, `establishBaseline`),
  with one length parser and one CSS Values 4 px-per-unit table. The
  dependency is removed from `typography`. Its test suite is ported to
  `__test__/vertical-rhythm.test.js` (17 tests). One fixture changes on
  purpose: an em line height is relative to the element's own size.
- **Chrome probe** (`/tmp/typography-review2-eval/probe/em-line-height.mjs`):
  v0.16's em line heights render 45.6px, 72px, and 43.2px where the rhythm
  owes 28.8px. The new values render 28.8px.
- **No breaking changes:** the README examples pass. The 44 theme snapshots
  are byte-identical. Over 384 configurations, every rem and px result is
  identical to v0.16, and the only differences are em-mode adjusted line
  heights (`/tmp/typography-review2-eval/readme-check.cjs`).
- **Gap check** (`index.js` and `createStyles.js`, numeric config, seed
  64491): 310 mutants, 172 killed, 138 gaps. Every mutant in the new helper
  code is killed. The first run left 3 in `linesForFontSize`: minLinePadding,
  roundToNearestHalfLine, and the `<` boundary. They were closed by modeling
  Compass's `lines-for-font-size` exactly, with an exact-boundary history.
  The open gaps are older: theme defaults, `createStyles` rules that no
  numeric law owns, `injectStyles`, and the `checkFontStacks` call (judged
  only by the font-family oracle).
- **Final `pnpm test-ci`:** Jest 75/75 (44 snapshots), oracles 229/229
  including Chrome. Font-family gap check: 116/116.

## Third prep-pr review (2026-11-12)

A third `/code-review high` (head 60984de) gave 10 findings (T1–T10, ledger
`/tmp/typography-review3-eval/ledger.md`). The engineer also restored three
v0.16 behaviors (S3 decisions).

- **Production:** the helpers move to `packages/typography/src/utils/verticalRhythm.js`
  (now owned by every numeric property). It has one number reader (numeric
  strings allowed), one length reader (a unitless 0 is a length), and one
  CSS Values 4 table. It reads compass's options once and throws for negative
  sizes and line counts. An em or ex length relative to a zero size is
  written in px (T6). `null` arguments are defaults. The themes no longer
  import compass-vertical-rhythm, and no package depends on it.
- **RED on 60984de**, by fixed or generated history:
  - T2: a unitless zero padding threw.
  - T4: an unrounded px font size (`18.700000000000003px`).
  - T5: falsy rounding gave half lines.
  - T6: an owed em `scale(-1024)` threw (random seed).
  - T7: `rhythmUnit: ['rem']` was accepted.
  - T8: `rhythm(null)` threw.
  - The numeric strings, length line heights, and em/px heading line
    heights threw.
- **Gap check** (`index.js`, `verticalRhythm.js`, `createStyles.js`): 369
  mutants, 232 killed, 137 gaps. None of them is in `verticalRhythm.js`. The
  open gaps are the older defaults, `createStyles`, and `injectStyles` set.
- **Precision:** a random seed found that T4's px rounding exceeded the
  extreme oracle's base-scaled tolerance. It now allows 5e-6px of rounding.
- **Parity with v0.16:** rem output is identical. em-mode adjusted line
  heights change (spec). px font sizes change by at most 5e-6px (T4).
- **Final `pnpm test-ci`:** Jest 75/75 (44 snapshots), oracles 239/239
  including Chrome.

## Review round 6 and coverage (2026-11-12)

A sixth `/code-review high` (head 66f851e) gave W1–W10. The ledger, with a
verdict and evidence for each, is `/tmp/typography-review6-eval/ledger.md`.

- **RED on 66f851e** (production unchanged, extended oracles):
  - W2/W3/W6, `numerical-heading-line-height-math`: `sibling-index(0)` threw;
    `calc(2px * 1em / 1px)`, `sqrt(3deg / 1deg)`, and `1 /**/ + /**/ 1`
    threw.
  - W8, `numerical-helper-units`: `linesForFontSize('-5e-324px')` returned a
    line count.
  - W1/W5, font stacks and stylesheet: `var(--f), {b}` and `var(--f) {b}`
    passed through; `color: a {b}` and `color: a\` were written.
  - S8, `react-typography`: `Font & Co` was written unencoded; a font
    without `styles` threw; `googleFonts: null` threw.
  - Q4b, `typography-declarations-chrome`: de-young's `text-transformation`.
- **Model corrections found on the way:** `pi-var(` and `e-sin(` are each
  one function token (CSS Syntax 3 §4.3.4). Each math function and each of
  its arguments resolves to one CSS type (CSS Values 4 §10.9, §10.6), so
  `sign(1px * 1px)` and `calc(abs(1px * 1px) / 1px)` are invalid.
- **Chrome calibration:** 2968 of 2982 sampled trees agree. Each of the 14
  others is Chrome accepting `exp()`, `sqrt()`, or `round()` of an em or %
  value, which the spec rejects.
- **Gap checks:** `css.js`, `index.js`, `verticalRhythm.js`,
  `compileStyles.js`, and the react-typography components: 631 mutants, 629
  killed, 0 crashes. The two survivors are the components' `propTypes`
  (React development warnings, which no law states). Two pieces of code no
  legal history can observe were removed: the `if (!m)` in the math
  tokenizer (every character starts a token), and the check for a group's
  `)` (`isLineHeight` types only balanced text, and every token must be
  read). `injectStyles()` keeps its `appendChild` branch for an empty head,
  although `insertBefore` with no first child appends in a real DOM: a v0.16
  Jest test pins it (engineer rule: no broken tests), so its mutant stays
  open with that reason.
- **Gap check, the rules and themes** (`createStyles.js`, the code plugin,
  de-young, `fontFamily.js`): 288 mutants, 162 killed, 126 open. They are the
  rules' design values (grays, borders, the code size) and the theme's data,
  which the snapshots pin (decision Q4b). A calibration that only corrupted
  `code`'s line height now corrupts the first line height outside h1–h6.

## Review round 7 (2026-11-12)

A seventh `/code-review high` (head 573b24d) gave X1–X10 (ledger
`/tmp/typography-review7-eval/ledger.md`).

- **RED on 573b24d:** `blockMarginBottom: 'auto'` wrote `calc(auto - 1px)`
  (stylesheet); `rhythm(0, '-5e-324px')` and `adjustFontSizeTo(…, '-16px'
  fromSize)` returned lengths (helpers); a root of
  `6.2500000000072106e-10%` (numeric); with the code plugin, a negative
  block margin wrote `pre { padding: -0.5rem }` (Chrome witness). The probe
  also reproduced property names with `</style>` and `;}`, selectors with an
  open comment, string, or bracket, an empty custom property that threw, and
  plugins as a string or an object.
- **Fixes:** property names must be one identifier; selectors must be whole
  text; every font size, context, and fromSize must be nonnegative; the root
  percentage has 15 significant digits; `plugins` must be a list of
  functions and each override a function (TypeError); `blockMarginBottom` is
  rhythm units or a CSS length (RangeError); an empty value is allowed for a
  custom property; the code plugin pads with 0 for a negative block margin.
- **X4** restates law V6 (pass through raw); the README now says so. **X7**
  is declined: the stylesheet oracle checks that the plugin's padding is the
  core's block margin.
- **Gap check** (`css.js`, `index.js`, `verticalRhythm.js`,
  `compileStyles.js`, the code plugin): 698 mutants, 671 killed. Of the 27
  open, 25 are the code plugin's design values (Q4b) and one is the
  `appendChild` branch (a v0.16 test). Three more were closed with
  constructed histories (NaN alone, NaN on a custom property, a selector
  with a top-level block), and one unused default argument was removed.

## Review round 8 (2026-11-12)

An eighth `/code-review high` (head 6cec13d) gave Y1–Y10 (ledger
`/tmp/typography-review8-eval/ledger.md`).

- **RED on 6cec13d:** S7: a first `injectStyles()` whose `toString()` threw
  left an empty `style#typography.js` in the head (red-chrome.txt). S4: a
  value `'"</p>"'` threw (red-stylesheet.txt). The Chrome witness rejected
  `blockMarginBottom: 'auto'` at `typography()`.
- **Fixes:** `injectStyles()` reads `toString()` first; the compiler escapes
  `<` before `/`; arrays are not values; `null` plugins and overrides are
  none; margin keywords skip the calc() margins; the code plugin reads the
  core's `pre` margin (no second number reader) and pads with 0 for a
  negative or `auto` one; `Types.js` makes `styles` optional.
- **Oracle repairs:** the constructed stylesheet histories now start from a
  clean history, because a generated base could throw first and hide the
  change. The stylesheet oracle owns `css.js` (the margin keyword).

## Review round 9 (2026-11-12)

A ninth `/code-review high` (head ff36b27) gave Z1–Z10 (ledger
`/tmp/typography-review9-eval/ledger.md`).

- **RED on ff36b27** (red.txt): `codePlugin()(vr, options)` threw (it needed
  the styles argument added in round 8); `rgb(1, 2, 3)` and
  `calc(rgb(1) * 1)` were written as heading line heights.
- **Fixes:** the code plugin reads the margin through `rhythm()` again,
  with no second number reader and no styles argument, and pads with 0 for
  every margin keyword; `rgb()`, `url()`, gradients, and other functions CSS
  types as non-numeric are invalid math; a non-finite `blockMarginBottom`
  throws at `typography()`; a function value throws; `!important` may have
  comments around it; the plugin's unused lodash dependency is gone.
- **Repo hygiene:** round 8's commit took 17 gap-check temp files; they are
  removed, and `.gitignore` covers them.
- **Gap checks:** `css.js`, `index.js`, `compileStyles.js`, the plugin: 580
  mutants, 554 killed; after the driver guard and two dead branches in the
  plugin (`value == null`, the rethrow), the open ones are the plugin's
  design values and the `appendChild` branch.

## Review round 10 (2026-11-12)

A tenth `/code-review high` (head d22610c) gave R1–R10 (ledger
`/tmp/typography-review10-eval/ledger.md`).

- **RED on d22610c:** a sparse stack `[, 'serif']` passed (red-font.txt);
  with a var() entry, html's computed size at an 18px base was 16px, because
  an undefined variable dropped the whole `font` shorthand
  (red-chrome-font.txt); `'Open+Sans'` asked Google for "Open+Sans"; `f(a;b)`
  threw (red-r6.txt); `src/client.js` did not exist (red-ss-react.txt).
- **Fixes:** html gets longhands for a stack with a var() entry; sparse
  stacks throw; a "+" in a Google font name is a space; ";" and "!" are
  rejected only at the top level or at a var() fallback's top level;
  `src/client.js` is back; the code plugin also works with typography
  0.16's helpers (a stub of compass-vertical-rhythm's rhythm() drives it).
- **Gap check** (`css.js`, `fontFamily.js`, `client.js`, `GoogleFont.js`,
  the plugin): 459 mutants, 435 killed. Open: the plugin's design values,
  the `propTypes`, and one dead escape in `baseFont`, now removed.

## Review round 11 (2026-11-12)

An eleventh `/code-review high` (head b58ab0a) gave Q1–Q10 (ledger
`/tmp/typography-review11-eval/ledger.md`).

- **RED on b58ab0a** (red.txt): `styles: [700]` made GoogleFont throw;
  `bodyColor: ''` made `toString()` throw.
- **Fixes:** numeric Google font styles; `false` and `''` style values and
  falsy plugins or overrides are none (engineer decision); `utils/configure.js`
  holds what `typography()` and `src/client.js` share, so the client entry no
  longer loads the stylesheet code; one `isVarEntry` question per entry.
- **Found on the way:** the computed html check fails for a lone `monospace`
  stack, which browsers size against their monospace default; excluded.
- **Gap check** (`index.js`, `configure.js`, `client.js`, `compileStyles.js`,
  `GoogleFont.js`, `fontFamily.js`): 282 mutants, 278 killed. One unused
  return value was removed and one history added; the open ones are the
  `appendChild` branch and the `propTypes`.
