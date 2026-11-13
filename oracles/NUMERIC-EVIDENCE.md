# Numerical oracle: validation before production repair

2026-11-11. Approved contract: S3 in `SKETCHES.md`, frozen in
`NUMERIC-CONTRACT.md`. This record extends the first implementation evidence.
Production remains unchanged and the numerical baseline remains RED. No claim
of completed mutation coverage or bug-class closure is made.

## Model choice and distinctions

The first model style in `oracles-design` step 3 fits: every expected
measurement is a pure function of caller inputs. No lifecycle state, transition
table, reference data structure, or production output is needed. The resolver's
default coordinates and the model's equations remain unchanged from the frozen
contract. Only the measurement reader, N5 check, explanatory prose, and one
calibration changed in this validation pass.

Each retained coordinate changes an owed observation while other coordinates
stay fixed:

| Input pair, with other defaults held fixed | Distinguishing observation |
| --- | --- |
| Base 16px / 16.5px | N1 root 16px / 16.5px, h1 32px / 33px. |
| Ratio 2 / 2.25 | N1 h1 32px / 36px. |
| Base line height 1.45 / 1.6 | N3 `rhythm(1)` 23.2px / 25.6px. |
| Heading multiplier 1.1 / 1.3 | N5 default h1 line height 35.2px / 41.6px, retaining unitless values. |
| Position 0 / -0.5 | N2 scale 16px / approximately 11.313708499px. |
| Rhythm count 1 / -0.25 | N3 spacing 23.2px / -5.8px. |

The invalid grammar's `kind` chooses the exercised public operation; it is not
model state or a branch in the constant rejection model. Its `value` selects an
unsupported input. `effective` is a model-only bundle of resolved inputs,
described in the contract freeze. Optional-input branches preserve documented
defaults, while invalid null inputs belong to the separate rejection grammar.

The existing calibrations distinguish the laws without changing unrelated
observations: corrupt only h1 size for N1; only helper font size for N2; only
spacing for N3; helper/secondary-heading validity or rejection outcome for N4;
and only heading line height for N5. A fixed length equal to the correct current
pixel height is valid CSS and preserves every size, scale, spacing, and helper
observation, but violates N5's unitless promise. That is the new calibration.

## Strengthening N5

The original check compared heading line heights after converting them to
pixels. Replacing each unitless multiplier with its exact current pixel result
therefore passed. The added calibration first failed with:

> corrupted the trace of "fixed history: existing fractional scale example",
> but the check passed it. It must report law "N5 independent heading line height".

The check now requires a finite unitless multiplier as well as the existing
numeric comparison. The reader accepts equivalent signed/exponent CSS number
spellings, avoiding a new restriction to one spelling. Negative or nonfinite
line heights still fail validity checks. The model, input ranges, fixed seed,
constructed histories, tolerance, ownership, and adopted laws were not weakened.

This closes the specific checker gap recorded at freeze. It does not close the
independent reader's limitation for unrecognized CSS syntax. The serialized-CSS
and browser witnesses remain pending.

## Verification

The strengthened focused command is:

```sh
pnpm test:oracles oracles/numeric-typography.oracle.ts --reporter=verbose
```

It reports **17 passed / 8 failed, 25 checks total**. All nine calibrations,
both determinism checks, the two existing scale regressions, and the four signed
scale/spacing controls pass. The eight assertion failures preserve the same
production defects: fixed/random campaigns and the fractional-base regression
expose N1 truncation; rejection campaigns and fixed NaN/infinity/overflow inputs
expose N4's missing rejection. No setup/reader failure appears in this run.

Oracle lint passes with no reports. The actual model/resolver still reconstruct
all 32 selected known examples and approved boundaries, with production loading
blocked and every input accepted by its arbitrary. Those examples validate the
model; they are not substitute production tests or campaign reach.

The ordinary and invalid grammars retain their frozen ranges and explicit
constructed boundaries. Zero base and nonfinite positions are excluded from the
ordinary grammar and included in rejection histories. Bases beyond 256px,
positions beyond -4–4 outside explicit overflow cases, complete wrong-type
grammars, and other stated limits are not covered by the current evidence.

No design-grammar trigger fired: there are five adopted laws, each predicts a
new case, the mathematical model is unchanged and has no dispatch, and no
mutation gap report exists. The change strengthens an existing law's check;
it does not change or simplify a model.

## Remaining boundary

The gap runner requires a passing production baseline. The installed setup
skill suggests making a scratch production repair before that run, but the
user's original instruction prohibits production changes unless requested.
That rule also prevents treating a scratch repair as implicitly authorized.
No production patch, mutation run, or complete passing campaign reach is claimed.

The concrete production work is to preserve fractional pixel bases in scale
calculation and validate numerical configuration/arguments/results so unsupported
or nonfinite cases throw. After that work is authorized, rerun the unchanged
oracle, the existing Jest suite, and mutation checks. Serialized-CSS and browser
witnesses can then extend the observations over the same adopted laws.

The saved output copies, before/after calibration evidence, full focused-run
log, reconstruction output, and source-hash manifest are in:
`/Users/kyle.mathews/Documents/Codex/2026-11-11/work/outputs/oracles-scale-rhythm/`.
