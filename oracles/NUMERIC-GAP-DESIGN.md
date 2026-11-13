# Numerical mutation gaps: design grammar

The first full mutation run, `b5dfbeaff307`, reports 222 mutants, 55 law kills,
and 167 open gaps. More than three occur in `typography`, `setStyles`, and the
style-generator default function, firing the `oracles-design` design-grammar
trigger. This parts list is recorded before extending histories or checks.

The preservation relation is the five approved S3 laws at the frozen numerical
checkpoints. The model equations, default inputs, and numerical tolerance remain
fixed. Widening coverage of those laws does not adopt laws for colors, weights,
Google Fonts, style injection, plugin composition, or all other CSS declarations.
The full-file gaps for those contracts stay open in the report.

| Part of `typography` | Job and distinguishing witness |
| --- | --- |
| Numerical defaults | Omitted options must reproduce the documented root, scale, rhythm, and heading defaults. |
| Pixel-base parser | A malformed string must throw, while 16.5px retains its fraction. |
| Positive configuration validation | Zero, negative, nonfinite, and wrong-type options must throw; small positive fractional options must return. |
| Rhythm wrapper | Finite signed counts preserve N3; nonfinite inputs and finite arithmetic overflow reject under N4. |
| Scale wrapper | Signed/fractional positions preserve N2; input/result overflow rejects under N4. |
| Public numerical methods | Calls expose the measurements that N1–N5 judge. |
| Other defaults/methods | Their effects belong to other contracts; preserve them, record gaps, and do not invent numerical laws to kill them. |

`setStyles` maps one or several selectors into the returned style object. The
numerical contract observes the resulting root and six headings. Missing
selector measurements violate that contract and must become check violations,
not unchecked JavaScript dereferences. The other selector declarations need
their own adopted laws; a sampled survivor does not prove that code dead.

The style generator reads the baseline, sets root/headings, and applies unrelated
styles, plugins, and overrides. Its numerical job is preserving the input base,
h1 ratio, and six unitless heading multipliers. Missing root/heading fields need
an explicit structured observation check. Layout/reset declarations, plugin
ordering, and overrides cannot be inferred from those five laws.

The rejection model remains the constant owed outcome `throws`; it does not
need new state or branches. Histories can explicitly construct zero/negative
and wrong-type options separately, rather than relying on random selection of
an option and value to reach each combination. A finite rhythm-overflow case
also follows the existing N4 promise.

The immediate forms considered are keeping the pure input-derived model while
strengthening constructed input coverage and structural measurement checks, or
adding a separate specification of every generated CSS declaration. The first
serves the already adopted numerical laws. The second would need additional
authorities and approval and is not adopted by this task. No mathematical model
state, transition, or contract rule changes in the first form.

Coverage extensions will retain before/after mutation evidence. Output-shape
checks will classify missing numerical measurements through N1/N4. Exact error
messages remain free; differences in caught errors alone do not justify a new
message-format law. The next gap report must distinguish these allowed error
alternatives and other-contract gaps from numerical omissions.

## Follow-up: the two numerical guard survivors

The user requested fixing the two unresolved guard survivors before independent
oracles-review subagent reviews. The preservation relation remains N1–N5 at the
same checkpoints, including freedom in exception class/message/timing. No model,
grammar, budget, ownership or tolerated numerical error changes are planned.

The exact survivors in run 6343ca2110e3 are checkLength's finite-number call
(index.js:M17) and the scale fontSize validation call (index.js:M60). Their
jobs must be checked against the actual producers before deleting either.

The returned lengths are constructed by compass-vertical-rhythm and
convert-css-length from JavaScript numbers. The syntax guard rejects NaN,
Infinity and malformed doubled exponents. A matching numeric token emitted
from a finite JavaScript number cannot have an exponent large enough for
Number(token) to overflow. The dependency never copies an arbitrary caller CSS
literal into these observed return positions: rhythm computes a number before
serializing; scale starts from the checked finite numerical target. Therefore
the extra Number(match[1]) finiteness test has no additional contract outcome
once the complete syntax test passed. Replace exec/capture/dereference with a
single full-length test rather than retaining an unused parsed number.

Scale's fontSize is either its checked finite pixel target (the converter's
same-unit/unknown-unit paths) or a conversion of that target into rem/em/ex.
The latter uses the same positive base/context as its lineHeight. The helper's
ceil-to-line calculation makes the line height at least the target size; its
padding adjustment only adds space. Relative conversion overflow in fontSize
therefore also makes lineHeight nonfinite, which the retained lineHeight guard
rejects. Pixel rounding can reduce height by less than a pixel but does not
convert a finite font size to infinity. Scientific notation misparsed as a unit
returns the original finite target for fontSize; malformed lineHeight remains
caught by its full syntax check. Removing the separate fontSize guard preserves
return-versus-throw and every supported measurement; it can only change the
permitted error message/timing on rejected inputs.

This producer analysis supplies the reason to remove the redundant checks;
the six-history survivor probe alone was only sampled evidence. The alternative
is keeping independent defensive checks for hypothetical dependency outputs,
which retains the same open mutation gaps at this concrete dependency boundary.
No dependency mock or new public API will be introduced just to force a kill.
The refactor will run the unchanged 32-check oracle before/after and compare
shared mutant keys. Both original authored defects must still be rejected.

## Review repair: numerical reader and small-base rhythm

C1–C4 and duplicate M1 are enforcement findings under unchanged N3/N4/N5.
The extended oracle first showed N3 RED on scientific small positive bases,
and six added wrong-answer calibrations first failed because the original
checker accepted them. Correcting the checker leaves only the product N3 RED.

The ordinary base floor extends to 1e-10px, with constructed scientific and
adjacent decimal forms, while every older bound/history/seed/budget remains.
This strengthens the already positive-finite adopted domain. Root line-height
validity adds no exact height equation. N5 compares the caller's unitless
multiplier directly, since no arithmetic/rounding is owed on that declaration.

For the product repair, normalizing only the input base spelling is insufficient:
the dependency itself constructs intermediate small pixel lengths in scientific
notation and parse-unit misclassifies the exponent as a unit. The two forms
considered are reimplementing all of the dependency's unit/context/offset API,
or computing the documented no-extra-argument default-rem operation directly
and retaining the dependency for its other options. The second is bounded to
the approved public numerical relation and preserves the existing extended API.
The standard path computes checked physical spacing, divides by the positive
base for rem, and preserves five-decimal output precision. Both physical and
relative overflow must reject; a separate constructed finite-argument case
will distinguish physical overflow with a finite rem coefficient. The generic
unit/context/offset path keeps its existing count and complete-length validation.

The repaired gap run f8171c35bd5d exposed a reader crash on the unmistakably
invalid token undefinedrem, plus two previously killed generic-rhythm wrapper
mutants made unreached by the new standard path. Before further changes, the
parts account is extended: distinguish implicit/explicit rem configuration in
ordinary N3 histories, and exercise the existing generic px/em rhythm branch
under N4 successful-output validity (signed spacing remains allowed). This adds
no exact generic conversion/rounding law. Default-rem offset/context arguments
can share the numerical producer because rem uses the root base, while other
units retain the original producer. The missing-token reader case gets a
calibration before repair. Old killed generic-wrapper keys must be killed again,
not dismissed as an older or out-of-scope regression.
