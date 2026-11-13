# Numerical typography: frozen contract

2026-11-11. `oracles-design` step 2. Authority: approved S3 in
`oracles/SKETCHES.md`, including the engineer's signed-position and invalid-input
decisions. This records the adopted contract without changing it. The oracle
draft still exposes production failures; this is not a passing-coverage claim.

Repository HEAD: `497b7128fa4d00b2a9db3a473b8096d11f3fa85f`.
Oracle: `oracles/numeric-typography.oracle.ts`.
Frozen oracle SHA-256:
`58febe66e67574eb2ff5476730938f1e965e31105b59a39147d196dc0f000e1d`.

## Laws and checkpoints

The sentences below retain S3's adopted promises. The sampled ranges later in
this record limit the evidence, not the adopted API domain.

| Law | Promise | Public checkpoint | Authority |
| --- | --- | --- | --- |
| N1 | For every supported positive pixel base `b` and positive ratio `r` with a representable result, the returned root size is `b` and the generated h1 size is `b * r`, without integer truncation of `b`. | The root-size prefix of `toJSON().html.font` (or equivalent `fontSize`) and `toJSON().h1.fontSize`. | README Configuration, `baseFontSize` and `scaleRatio`; `docs/what.md`, “Only set the base” and “Pick font sizes from a scale”. |
| N2 | For every supported `b`, `r`, and finite position `s` with a representable target, `scale(s).fontSize` represents `b * r**s` pixels, and an omitted position means zero. | Returned `scale(s).fontSize`. | Engineer decision 2026-11-11, S3 Q1; documented scale relationship and existing direct examples. |
| N3 | For every supported base `b`, line height `h`, and finite line count `n` with a representable result, `rhythm(n)` represents `b * h * n` pixels. | Returned `rhythm(n)` length. | `docs/what.md`, “One rhythm equals one line-height”; README's signed/fractional rhythm calls. |
| N4 | For every input admitted to the numerical API or explicitly exercised as an invalid boundary, the call rejects an unsupported input or nonfinite result, and every successful numerical CSS value is valid for its destination property; it never returns NaN/infinity strings or a malformed measurement. | Construction/call error, or returned helper and root/heading numerical declarations. | Engineer decisions 2026-11-11: no invalid CSS and throw on invalid values, S3 Q2. |
| N5 | For every supported configuration, h1–h6 use `headerLineHeight` as a unitless multiplier, defaulting to 1.1, independently of the line-height value returned by the scale helper. | h1–h6 line-height declarations from `toJSON()`. | Maintainer commit `22d8ec8`, 2017-08-03; approved S3 N5. |

N1–N3 and N5 require valid calls to return. Rejecting all calls cannot satisfy
N4. Positive finite pixel bases, ratios, and unitless base/heading line heights
are admitted. Positions and rhythm counts may be signed and fractional; zero
position and zero/negative spacing are valid. Valid underflow-to-zero is not
invalid merely because the result is zero. Unsupported configuration, nonfinite
arguments, and overflow must throw rather than silently substitute defaults.

The planned serialized-CSS and browser witnesses retain these laws but have not
been implemented. The present oracle observes the JavaScript numerical results.

## Owned code

Both registered properties own these files:

| File | SHA-256 at freeze |
| --- | --- |
| `packages/typography/src/index.js` | `1afbb12693d5fe173a0889bd14c053b8983cdef97b4da23e3a6f4c566c6b58d0` |
| `packages/typography/src/utils/createStyles.js` | `271146732382b8739f2808a85a80c2ab9e43537d2be48554058ef8864a99431b` |

Their Git diffs are empty and the hashes match the original probes. The
numerical defaults, scale wrapper, baseline effects, and heading measurements
serve these laws. Whole-file ownership also includes other behavior that this
oracle does not judge. Future mutation reports must keep those gaps visible;
the limits here do not close them. External modular-scale, vertical-rhythm, and
unit-conversion implementations are exercised through the public API but are
not owned source.

## Freedoms and comparison precision

N1–N3 constrain semantic lengths, so valid equivalent numeric units and
spellings are allowed. Root percentages are interpreted relative to a controlled
initial 16px size; heading/helper rem values use the configured root, and em or
percent values use their relevant font context. The current reader supports
px/rem/em/percent and CSS absolute units with the fixed 96px-per-inch relation.
It does not define a preferred serialization.

N5 specifically requires a unitless multiplier. A unitless number may have
equivalent numeric spellings, but a fixed pixel line height is not the same
promise: it can inherit differently. The general length-representation freedom
does not erase this distinction.

The current numerical comparison uses an absolute pixel tolerance
`T = configuredBase * 0.000011`, corresponding to 0.000011rem at that root.
This accommodates the documented five-decimal scale output; it is an oracle
measurement choice, not an API rounding policy. At base 16px, the documented
`scale(1.333)` gives 40.30816px, while the formula predicts approximately
40.308153786px: their difference is about 0.000006214px, below T = 0.000176px.
For the fractional-base defect, 33px versus 31.999935px differs by 1.000065px,
well above T = 0.0001815px. T is not permission to truncate a base.

The precise helper line-height algorithm is free within valid, finite,
nonnegative CSS. The oracle must not enforce that algorithm on generated
headings. Error class, error message, object key order, and rejection timing
within the exercised numerical operation are not asserted. Option storage,
plugins/overrides, alternate base/rhythm units, and exact h2–h6 scale positions
remain the limits already stated in S3.

## Model parts and rules

There is no mutable model state or transition system. One history supplies
configuration and explicit helper arguments. Its plan resolves omitted
configuration before observations; it contains no production-derived expected
values. The actions configure the main source API, read `toJSON()`, call
`scale(position)`, and call `rhythm(lines)`. Invalid histories select one such
operation or an unsupported option.

| Model part | Job and authority |
| --- | --- |
| `base` → `baseFontSize` | Positive pixel base; predicts root, heading, scale, and rhythm lengths under N1–N3. Omission resolves to 16px, documented in README. |
| `ratio` → `scaleRatio` | Predicts h1/base and the geometric step under N1/N2. Omission resolves to two, documented in `docs/what.md`. |
| `lineHeight` → `baseLineHeight` | Predicts one rhythm under N3. Omission resolves to 1.45, documented in README and adopted by `22d8ec8`. |
| `headerLineHeight` | Predicts the independent heading multiplier under N5. Omission resolves to 1.1, explicitly adopted by `22d8ec8`. |
| `position` | Signed/fractional geometric coordinate under N2; omission resolves to zero, reconstructed from the existing `scale()` example and adopted S3. |
| `lines` | Explicit signed/fractional rhythm count under N3; omitted-count behavior remains outside this boundary. |
| `effective` | Model-only bundle of resolved caller inputs. It combines the five numeric coordinates above and never reads returned `options`. |
| Invalid `kind` / `value` | Input grammar names the API operation or unsupported option; every generated invalid history predicts an error under N4. |

The pure model rules are direct law sentences: the root retains the input
base (N1); h1 multiplies it by the ratio (N1); scale raises the ratio to the
position and applies the base (N2); rhythm multiplies the base line height by
the count and base (N3); heading line height retains the configured unitless
multiplier (N5); invalid histories owe rejection (N4). The general signed scale
rule and the rejection policy were added by the engineer's dated decisions,
rather than inferred from production. No further product rule is introduced.

The driver observes `root` (HTML font declaration), `headings` (six returned
heading measurements), `scale` (font-size and line-height pair), `rhythm`
(spacing length), and caught `production error`. The rejection driver records
`result` as returned data or a caught error. These are public observations,
not model state. Expected values come from caller inputs; a separate reader
interprets actual CSS. Helpers that predict values do not import production
converters or reproduce its rounding machinery.

## Reconstruction and current implementation gaps

The actual registered resolver/model and history grammars reproduced 32 selected
known examples and approved boundaries: 25 valid cases and seven rejection
cases. Every case was accepted by its arbitrary. The scratch reconstruction
blocks production loading and calls no driver, so agreement cannot be borrowed
from production output. README example calls with no supplied numerical answer
were reconstructed at an explicitly chosen default configuration; those
predictions are consequences of N2/N3, not quotations of documented numbers.

Exact helper line-height examples in the Jest suite were deliberately not
reconstructed as model requirements: their exact values are outside S3.
The older concept prose about rhythm-grid rounding and the later unitless
heading decision concern different checkpoints. Their predictions therefore
do not conflict once helper and generated-heading observations are separated.

Two checker limitations remain visible at freeze:

1. The current N5 check compares line heights after conversion to pixels. It
   checks the magnitude but can accept a fixed length equal to the expected
   multiplier's current pixel result. Strengthen that check and its calibration
   to enforce the adopted unitless distinction; do not weaken N5 to match it.
2. Unrecognized CSS syntax produces a reader/harness error. That avoids claiming
   a law violation for a valid representation the reader does not support, but
   does not establish complete malformed-CSS detection. Preserve the proposed
   serialized-CSS/browser validity witnesses as unfinished work.

The ordinary grammar samples base 0.125–256px, ratio 0.5–4, base line height
0.5–3, heading multiplier 0.5–2, and positions/counts -4–4, with omitted
defaults. Invalid classes use explicit choices and default-ratio overflow
positions 1024–2048. Extremes outside those ranges remain untested. Generated
campaigns stop at known production violations, so complete passing campaign
reach and mutation coverage remain unestablished.

Neither the executable oracle nor production changed during this step. No
failure was cleared by changing a law, history, model, check, or tolerance.
There is no unresolved authority conflict or new product-policy question.

Reconstruction, replay script, and the output copy of this record:
`/Users/kyle.mathews/Documents/Codex/2026-11-11/work/outputs/oracles-scale-rhythm/`.
