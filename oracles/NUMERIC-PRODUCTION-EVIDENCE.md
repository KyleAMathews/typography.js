# Numerical typography: production repair and gap evidence

2026-11-11. The user authorized production repair with “ok go”. All changes remain uncommitted. No push or publication was performed. This record supersedes the pending-work status of the earlier numerical evidence records while preserving their RED logs.

## Result

The main source entry now preserves fractional pixel bases, computes signed/fractional geometric scale positions, and throws for unsupported numeric configuration, nonfinite helper arguments/results, or malformed returned CSS lengths. The existing heading line-height multiplier is preserved. Both API READMEs now explain the approved numerical behavior.

The source repair is in `packages/typography/src/index.js`. The independently maintained font-family imports/checks and style-generator changes were preserved. `numeric-production-only.patch` compares this task's saved production-start source to the final source; final source snapshots also contain the concurrent font-family work.

The adopted S3 laws N1–N5 are reused unchanged. The model is still an input-derived function: root = base, h1 = base × ratio, scale = base × ratio^position, rhythm = base × lineHeight × count, and heading multiplier = headerLineHeight. The rejection model requires throwing. The extreme N4 property allows rejection or finite nonnegative returned measurements; it does not prescribe an exact helper line-height algorithm.

## RED and GREEN

1. `production-before.log`: original numerical implementation, 8 failed / 17 passed. The failures expose fractional-base truncation and missing numeric rejection.
2. `production-first-fix.log`: first source repair, 25/25 numerical checks pass. Existing Jest tests and then-current oracle suite also pass.
3. The first gap run exposed checker shape crashes and missing history coverage. `oracles/NUMERIC-GAP-DESIGN.md` records the parts analysis before strengthening the reader, shape checks and constructed histories.
4. Wider finite boundaries found a new real defect: at base 0.125px, line height 1e-200 and position 69.76048999263462, the helper returned line-height `1.0000000000000059e+21e+21rem`. Partial `parseFloat` validation accepted it. `extreme-fixed-before.log` preserves N4 RED before the full-length repair.
5. `production-final-numeric.log`: all 32 numerical checks pass, including the new fixed regression and calibrations. No law, tolerance or domain was weakened to clear either RED.

## Validation

- `pnpm test`: passed the full build, repository ESLint, 6 Jest suites / 58 tests / 44 snapshots, and 3 oracle files / 126 checks. See `production-final-pnpm-test.log`.
- Oracle/production ESLint 9 and legacy ESLint 3 checks passed. See `production-final-oracle-lint.log` and `production-final-legacy-lint.log`.
- Chrome 157 consumer witness: five serialized stylesheet/helper cases match the independent numerical formulas, including fractional bases, negative/fractional positions, ratios below one, signed/zero spacing, and custom heading line heights. A half-sized descendant inherits the unitless heading multiplier correctly. Chrome rejects the malformed exponent literal and the repaired helper throws for its originating input. See `production-browser-witness.json` and its replay script.
- `git diff --check` passed. No dependency-install recovery override was needed in this repair phase.

Chrome required execution outside the filesystem sandbox. The first full-suite attempt also overlapped a gap run and discovered the CLI's temporary oracle wrapper files; a sequential rerun passed. These are harness/environment failures, not law RED evidence. The numerical scoped config avoids loading the unrelated browser witness during numerical mutation checking.

## Mutation evidence

| Run | Mutants | Reproducible law kills | Production/checker crashes | Open gaps |
| --- | ---: | ---: | ---: | ---: |
| Initial b5dfbeaff307 | 222 | 55 | 25 | 167 |
| Strengthened 70f7f504e026 | 228 | 89 | 0 | 139 |
| Final 6343ca2110e3, both authored regressions | 229 | 90 | 0 | 139 |

The initial crash count is included in its open-gap count. Counts across changed source revisions are not a mutation-score comparison. All 52 shared keys killed in the initial run remain killed; all 25 initial crashes become intended law kills.

Both authored original defects fail on a fixed reproducible route:

- `original-fractional-base-truncation`: restoring parseInt is rejected by N1 base and heading ratio, seed 64491.
- `original-partial-css-length-parse`: restoring prefix-only length validation is rejected by N4 valid numerical CSS, seed 64491.

The final command was:

```sh
pnpm exec oracle-gaps --package . \
  --source packages/typography/src/index.js,packages/typography/src/utils/createStyles.js \
  --seed 64491 --contexts 4 --pool threads \
  --config vitest.numeric.config.mts \
  --mutants oracles/mutants/numerical \
  --out .oracle-gaps/numeric-final-with-regressions
```

Exit 0 means the gap check completed. It does not mean the 139 remaining gaps are closed. The lossless gap results and the per-gap audit are saved beside this report. Three selected numerical survivors change only the error message/class/timing on the exercised rejection histories, freedoms left by the adopted contract. Two individual validation guards have no distinguishing actual-dependency witness in the six additional probe histories; they remain unresolved. Other gaps concern defaults/styles, font-family semantics, plugins/overrides, and unexercised public methods. They remain open; no unrelated code was deleted or new contract adopted to clear them.

## Reach

These counts come from the final full pipeline, not mutation instrumentation. Every required numerical state was reached by construction in both campaigns.

| Property | Campaign | State | Histories |
| --- | --- | --- | ---: |
| numerical-typography | fixed seed 64491 | custom heading line height | 46 |
| numerical-typography | fixed seed 64491 | defaults | 9 |
| numerical-typography | fixed seed 64491 | fractional base | 66 |
| numerical-typography | fixed seed 64491 | negative fractional position | 25 |
| numerical-typography | fixed seed 64491 | negative spacing | 53 |
| numerical-typography | fixed seed 64491 | ratio below one | 28 |
| numerical-typography | fixed seed 64491 | subpixel base | 21 |
| numerical-typography | fixed seed 64491 | unity ratio | 9 |
| numerical-typography | fixed seed 64491 | zero position | 61 |
| numerical-typography | fixed seed 64491 | zero spacing | 8 |
| numerical-typography | random seed | custom heading line height | 59 |
| numerical-typography | random seed | defaults | 11 |
| numerical-typography | random seed | fractional base | 56 |
| numerical-typography | random seed | negative fractional position | 28 |
| numerical-typography | random seed | negative spacing | 55 |
| numerical-typography | random seed | ratio below one | 32 |
| numerical-typography | random seed | subpixel base | 23 |
| numerical-typography | random seed | unity ratio | 8 |
| numerical-typography | random seed | zero position | 61 |
| numerical-typography | random seed | zero spacing | 6 |
| numerical-input-rejection | fixed seed 64491 | finite overflow | 16 |
| numerical-input-rejection | fixed seed 64491 | invalid configuration | 90 |
| numerical-input-rejection | fixed seed 64491 | invalid rhythm argument | 26 |
| numerical-input-rejection | fixed seed 64491 | invalid scale argument | 19 |
| numerical-input-rejection | random seed | finite overflow | 16 |
| numerical-input-rejection | random seed | invalid configuration | 90 |
| numerical-input-rejection | random seed | invalid rhythm argument | 21 |
| numerical-input-rejection | random seed | invalid scale argument | 24 |
| numerical-result-validity | fixed seed 64491 | negative extreme position | 26 |
| numerical-result-validity | fixed seed 64491 | tiny line height with large position | 29 |
| numerical-result-validity | random seed | negative extreme position | 21 |
| numerical-result-validity | random seed | tiny line height with large position | 32 |

## Review controls and limits

ORC-001/003/005: approved S3 authority, checkpoints and freedoms remain in the frozen contract and literate oracle. ORC-002: the mathematical model does not read production outputs or import its converters; the driver alone invokes production. ORC-004: ordinary bounds and invalid-value grammars are explicit, fixed/constructed histories are admitted by their arbitraries, each axis has a distinguishing job, and invalid numeric inputs are excluded from the ordinary grammar and exercised by rejection histories. The earlier model-only reconstruction preserves 32 examples. ORC-006: calibrations and both authored defect mutants reject at intended law checkpoints. ORC-007/015: fixed seed 64491, random campaigns, direct replay, and required reach all pass. ORC-009: the `effective` input bundle and other model-only vocabulary are mapped in the contract. ORC-010: pure numerical drivers require no resource cleanup; Chrome closes in finally, and failures remain distinct. ORC-011: the Chrome witness supplies an independent consumer reading for five selected cases, not another generated campaign. ORC-012/013: original, nearby, signed, fractional, rejection and extreme witnesses plus complete open-gap accounting are retained here. ORC-016: fixed regressions remain inputs to the same model/driver/check; the oracle file contains no ordinary tests.

ORC-008 stateful minimality does not apply to the pure input-derived model. ORC-014's controlled-provider premise is not used by the numerical oracle; the extra Chrome witness is explicitly limited to a real local Chrome consumer. No formal model-checker claim or fully audited/bug-class-closure claim is made.

Ordinary generated bounds remain base 0.125–256px, ratio 0.5–4, base line height 0.5–3, heading multiplier 0.5–2, and positions/counts −4–4. The extreme property covers base 0.125–256px, line height 1e-200–3, ratio two, and positions −1024–1024. Additional explicit invalid/overflow histories do not establish every JavaScript input or every dependency option. The reader handles the documented numerical units; browser layout, unknown representation syntax, exact helper line-height rounding, options mutation, plugins/overrides, h2–h6 font-size equations and the separate legacy client entry are not generated claims. Chrome coverage is five selected cases in one browser. The existing Vite CommonJS/native-loader warning remains a tooling papercut.

`production-final-manifest.json` ties this uncommitted evidence to repository HEAD and exact final source/config SHA-256 hashes. The original no-commit rule prevents a reviewed commit from being created in this session.
