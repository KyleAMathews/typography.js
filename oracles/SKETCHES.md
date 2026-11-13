# Oracle sketches

The repository's list of candidate oracles. Mark a sketch **built** once its
oracle exists.

Probes for these sketches live outside the repository, in
`/tmp/typography-oracle-probes/` (see its `README.md`; run each with `node`).
Probe numbers below (P1–P6) refer to those files.

Spec versions cited:

- **CSS Fonts 4**: W3C Working Draft, 4 November 2026,
  <https://www.w3.org/TR/css-fonts-4/>, §2.1 "Font family: the font-family
  property", §2.1.2 "Syntax of `<generic-font-family>`".
- **CSS Values 4**: W3C Working Draft, 12 March 2024, §2.1 "Component Value Types" (CSS-wide keywords), §4.1 "Pre-defined Keywords", §9 "Functional Notations".
- **CSS Syntax 3**: W3C Candidate Recommendation Draft, 1 October 2026, §3.3 "Preprocessing the input stream" (surrogates become U+FFFD) and §4.3.5.
- **CSS 2.1 §15.3**: <https://www.w3.org/TR/CSS2/fonts.html#font-family-prop>
  (the link in the `createStyles.js` comment).
- **CSS Syntax 3 §4.3.5**: consume a string token (escapes, and newline in a
  string makes a bad-string).

---

## S1. A font stack is emitted as the same stack (font-family serialization)

Status: **built** 2026-11-11 as `oracles/font-family.oracle.ts` (reader: `oracles/css-font-family-reader.ts`). It was RED on unchanged production (L1, L2, L3). The fix is applied as `packages/typography/src/utils/fontFamily.js` (engineer's approval, 2026-11-11), with a Chrome witness `oracles/font-family.chrome.oracle.ts`. Evidence: `oracles/FONT-FAMILY-EVIDENCE.md`.

**The promise.** Each entry of `bodyFontFamily` and `headerFontFamily` reaches
the stylesheet as the same family. A family name stays that name, a generic
family stays a generic, and the browser never drops the declaration that
carries the stack. The oracle owns `wrapFontFamily` and the three places that
join its output into `html.font`, `body.fontFamily`, and `h1`–`h6.fontFamily`.

**The contract.** Each result is what `toJSON()` gives for `body.fontFamily`
(and the same list in `html.font`).

<!-- prettier-ignore -->
```js
typography({ bodyFontFamily: ['Open Sans', 'sans-serif'] }) // → 'Open Sans', then the generic sans-serif
typography({ bodyFontFamily: ["Font's Name", 'serif'] })    // → the family Font's Name, then serif; the declaration still applies
typography({ bodyFontFamily: ['Lato', 'System-UI'] })       // → Lato, then the generic system-ui (any ASCII case)
typography({ bodyFontFamily: ['var(--brand-font)', 'serif'] }) // → var(--brand-font), serif, unchanged
typography({ bodyFontFamily: ['default', 'inherit'] })      // → the families "default" and "inherit", quoted
typography({ bodyFontFamily: [] })                          // → throws, naming bodyFontFamily
```

### Boundary

| Question                           | Answer                                                                                                                                                                                                                                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What promise belongs together?     | One option entry → one font-family list item that a CSS reader reads back as the same family or generic. The stack stays valid, so it is never dropped.                                                                                                                                      |
| Where is it observed?              | `typography(opts).toJSON()`: `html.font` (after the `size/line-height` prefix), `body.fontFamily`, `h1`–`h6.fontFamily`. `toString()` carries the same text. Checkpoint: after each `typography(opts)` call (pure function, one call).                                                       |
| What does it assume?               | `bodyFontFamily` and `headerFontFamily` are arrays of strings (README, Configuration). The reader is a CSS-Syntax-3 tokenizer, plus the CSS Fonts 4 grammar.                                                                                                                                 |
| What else witnesses it?            | End-to-end: headless Chrome reads computed `font-family`, `font-size`, and `line-height` (P3 already does this). Integration: `react-typography`'s `TypographyStyle` renders `toString()` (same text, no extra law).                                                                         |
| Where does another contract begin? | Raw `fontFamily` strings inside `overrideStyles` / `overrideThemeStyles` (the user writes CSS: not wrapped, e.g. wordpress-2010 `blockquote`). `typography-plugin-code`'s fixed stack. `GoogleFont`'s URL `family=` names (URL encoding, a different authority). Theme content is sketch S2. |
| Which source implements it?        | `owns: packages/typography/src/utils/createStyles.js#wrapFontFamily`, `#genericFontFamilies`, and the three `.map(wrapFontFamily).join(",")` call sites in the same file.                                                                                                                    |
| What public state does it expose?  | `options.bodyFontFamily` / `options.headerFontFamily` on the returned object: law L0 (passed through unchanged). Every `fontFamily`/`font` field above: L1–L4. No other state.                                                                                                               |

### L0 Options are kept as given

- Examples: `typography({ bodyFontFamily: ['  Spaced  ','Lato'] }).options.bodyFontFamily` is `['  Spaced  ','Lato']` (P6, last line).
- What varies, what stays: any array; the returned `options` field is the input array's content.
- Law: For every `bodyFontFamily`/`headerFontFamily` array, `typography(opts).options` holds the same entries in the same order.
- Domain edges: arrays of strings; the default stacks when the key is omitted.
- New case: `['  Spaced  ']` → `options.bodyFontFamily[0] === '  Spaced  '`.
- Rebuilt examples: P6's last line agrees.
- Dynamics: none: one call.
- Constraints: `options` never aliases a different stack than the one emitted.
- Boundary conditions: key omitted → README defaults (`['georgia','serif']`, system UI stack).
- Authority: README, Configuration ("All configuration keys are optional", defaults listed).
- Status: adopted
- Rival: entries are normalized (trimmed, lowercased) in `options`.
- Witness: `['  Spaced  ']`: the law keeps the spaces, the rival trims.
- Checkpoint: the returned object's `options`.

### L1 A family name round-trips

- Examples: `'Open Sans'` → `'Open Sans'` (default-stack style, README); `"Font's Name"` → today `'Font's Name'`, which does not parse (P2). In Chrome the whole `html{font:…}` declaration is dropped: line-height `normal`, family Times (P3). `Back\slash` → read back as `Backslash` (P2/P3). `"Line\nBreak"` → bad-string, the declaration is dropped (P3).
- What varies, what stays: the code points of the name can be anything. The answer depends only on the reader decoding the item to exactly the input string.
- Law: For every string `n` (including the empty string) that is not a keyword handled by L2–L4, the list item emitted for `n` is read by a CSS Syntax 3 reader as the `<font-family-name>` `n`: a `<string>` with value `n`, or (for `-apple-system`, Q6) the `<custom-ident>` sequence that the spec joins to `n`. Lone surrogates in `n` read back as U+FFFD.
- Domain edges: any Unicode string: quotes `'` and `"`, backslash, newline/CR/FF, control characters, empty string, leading/trailing spaces, commas, digits first, CJK, astral characters. Lone surrogates: read back as U+FFFD (CSS Syntax 3 §3.3; Q4, decided).
- New case: `"Rock \\ 'n' Roll"` → reads back as exactly `Rock \ 'n' Roll`.
- Rebuilt examples: `Open Sans` ✓, `A, B` ✓ (quoted, the comma is inside the string), `Say "Hi"` ✓, `Font's Name` ✓ (the law predicts it reads back, which is a correct prediction: today's code breaks it), `Back\slash` ✓ (same).
- Dynamics: none: one call. The variation is in the domain.
- Constraints: every emitted stack parses as `[ <font-family-name> | <generic-font-family> ]#`, so it is never invalid. The same list text appears in `html.font` and in `body.fontFamily`.
- Boundary conditions: `''`; a single `'`; a trailing `\`; `\n`; a name equal to a generic but written quoted by intent (cannot be expressed; see Q3).
- Authority: README, Configuration ("an array of strings specifying the font family stack"); CSS Fonts 4 §2.1 (a family name may be a quoted string); CSS Syntax 3 §4.3.5. The engineer confirmed on 2026-11-11 that the apostrophe/backslash behavior is an unintended bug.
- Status: adopted
- Rival: names are wrapped in `'…'` verbatim (today's code), and the caller must pre-escape.
- Witness: `"Font's Name"`: the law reads back `Font's Name`. The rival yields an unparseable list.
- Checkpoint: each `fontFamily` / `font` field of `toJSON()`.

### L2 A generic family stays generic

- Examples: `'serif'` and `'sans-serif'` unquoted (P1, the default stacks); `'Sans-Serif'` in `wordpress-kubrick` → today `'Sans-Serif'`, quoted, so Chrome reads it as a family name and the theme loses its fallback (P1, P3, P4). `'system-ui'` → today `'system-ui'`, quoted (P1), and Chrome reports `"system-ui"` as a family name (P3).
- What varies, what stays: the ASCII case of the keyword and its position in the stack. The answer depends on the keyword being in CSS Fonts 4's `<generic-font-family>`.
- Law: For every keyword `g` in CSS Fonts 4 `<generic-font-complete>` (`serif`, `sans-serif`, `system-ui`, `cursive`, `fantasy`, `math`, `monospace`), `<generic-font-incomplete>` (`ui-serif`, `ui-sans-serif`, `ui-monospace`, `ui-rounded`), or `<generic-font-script-specific>` (`generic(fangsong)`, `generic(kai)`, `generic(khmer-mul)`, `generic(nastaliq)`), written in any ASCII case, the emitted item is read as that unquoted generic.
- Domain edges: every keyword × {lower, UPPER, Title, mixed} case. Not in the domain: `emoji` (dropped from CSS Fonts 4) and bare `fangsong`, which are family names under L1.
- New case: `'UI-Monospace'` → read back as the generic `ui-monospace`.
- Rebuilt examples: `serif` ✓, `sans-serif` ✓, `Sans-Serif` ✓ (the law predicts a generic: correct; today's output is wrong), `system-ui` ✓ (same).
- Dynamics: none: one call.
- Constraints: there is no input whose item reads back as a quoted generic name (`"serif"`). That is only possible by intent, see Q3.
- Boundary conditions: `generic(FANGSONG)`; whitespace inside `generic( kai )`; `emoji` and `fangsong` as names.
- Authority: CSS Fonts 4 (WD 4 Nov 2026) §2.1.2; CSS Values 4 (WD 12 March 2024) §4.1: keywords "are interpreted ASCII case-insensitively". Engineer decision 2026-11-11: "update from the spec clearly".
- Status: adopted
- Rival: only the CSS 2.1 list, lowercase only (today's code: `createStyles.js` keyword list, from 99350b1).
- Witness: `['Lato','system-ui']`: the law reads a generic, the rival reads a family named `system-ui` (Chrome shows `"system-ui"`, P3).
- Checkpoint: each `fontFamily` / `font` field.

### L3 `var()` references pass through

- Examples: `['var(--f)','serif']` → `var(--f),serif`, and Chrome resolves it to `Georgia, serif` (P2, P3). Added in #307 (2023-07-08).
- What varies, what stays: the custom property name and an optional fallback. The answer depends on the item being a `var()` function.
- Law: For every entry that is a well-formed `var(<custom-property-name> [, <fallback>]?)`, with `var` in any ASCII case, the item is emitted unchanged. Every other entry, including a malformed `var(`, is a family name under L1.
- Domain edges: with or without a fallback; a fallback that itself holds quotes or commas; ASCII case of `var` (CSS Values 4 §9: "Like keywords, function names are ASCII case-insensitive").
- New case: `"var(--a, 'Lato', serif)"` → emitted unchanged.
- Rebuilt examples: `var(--f)` ✓; `var(--a, 'Lato')` ✓ (P2).
- Dynamics: none: one call.
- Constraints: the emitted stack is valid (L1's constraint) whenever the `var()` text is well formed.
- Boundary conditions: unterminated `var(` is not well formed (P2: emitted as `var(`, which is invalid). See Q2. `VAR(--x)` today becomes the quoted name `'VAR(--x)'` (P2).
- Authority: maintainer merge of #307 ("Add CSS Variable Support", closes #306). It is not in the README. Case rule: CSS Values 4 §9.
- Status: adopted. Q2 was decided 2026-11-11: "spec makes rules". `VAR(--x)` passes through, and a malformed `var(` is quoted as a name.
- Rival: every entry not in the generic list is quoted (the behavior before #307).
- Witness: `['var(--f)','serif']`: the law gives Georgia in Chrome; the rival gives a family named `var(--f)`.
- Checkpoint: each `fontFamily` / `font` field.

### L4 Reserved and CSS-wide words

- Examples: `['default','serif']` and `['Lato','inherit']` → emitted unquoted, and Chrome drops the whole `html{font}` and the body `font-family` (P3). `initial`, `unset`, `revert`, `revert-layer` are quoted today (P1).
- What varies, what stays: which word, its case, and whether it is the only entry. The answer depends on whether the spec accepts the word as a keyword in that position.
- Law: For every CSS-wide keyword (`inherit`, `initial`, `unset`, `revert`, `revert-layer`) and `default`, in any case, in a stack with more than one entry, the item is read back as the family name with that text (quoted). `default` is a family name even when it is the only entry.
- Domain edges: a CSS-wide keyword as the only entry (`['inherit']`, any case): it is emitted as that keyword in `body`/`h1`–`h6` `font-family`, and `html` uses longhands, because the `font` shorthand cannot hold it (Q1a). Checked by both drivers: the declared `font-family` is the keyword, and `html` keeps the reference's size and line height. The Chrome witness reads CSSOM declared values, not computed style.
- New case: `['Lato','Initial']` → Lato, then the family named `Initial`.
- Rebuilt examples: `['default','serif']` → the family `default`, then serif (today's code is wrong: P3 shows the declaration is dropped); `['Lato','inherit']` → Lato, then the family `inherit`.
- Dynamics: none: one call.
- Constraints: L1's constraint (the stack is valid).
- Boundary conditions: `['inherit']`; `['INHERIT']`; `['default']`.
- Authority: CSS Values 4 §2.1: "All CSS properties also accept the CSS-wide keyword values as the sole component of their property value", so inside a list they cannot be keywords. CSS Fonts 4 §2.1.1: names that match "the CSS-wide keywords … must be quoted". CSS 2.1 §15.3: "'initial' and 'default' are reserved … and must also be quoted when used as font names". Engineer decision 2026-11-11: "follow spec always". History: `inherit` and `default` entered the unquoted list in 99350b1 (2017-09-04), citing the same CSS 2.1 page, which lists them as words that must be quoted.
- Status: adopted. A lone CSS-wide keyword is the keyword itself (Q1a).
- Rival: today's code. `inherit` and `default` are unquoted wherever they appear.
- Witness: `['Lato','inherit']`: the law gives a valid stack (Chrome applies it), the rival gives an invalid one (Chrome drops it, P3).
- Checkpoint: each `fontFamily` / `font` field.

### L5 An empty stack is an error

- Examples: `[]` → today `html.font = "100%/1.45 "` and `body.fontFamily = ""`, both invalid CSS (P6).
- What varies, what stays: which option (`bodyFontFamily` or `headerFontFamily`). The answer depends on the array being empty.
- Law: For `bodyFontFamily` or `headerFontFamily` that is empty or holds a non-string entry, `typography(opts)` throws an error that names the option, and never returns a stylesheet with an empty or broken font list.
- Domain edges: the key omitted (README defaults, not an error); `[]` in a theme; `[42]`, `[null]`, `[undefined]`, `['Lato', {}]` (Q5a).
- New case: `typography({ headerFontFamily: [] })` throws, naming `headerFontFamily`.
- Rebuilt examples: P6 `[]` → error (today's code returns invalid CSS).
- Dynamics: none: one call.
- Constraints: no returned stylesheet contains an empty `font-family`.
- Boundary conditions: `[]` for body only, for header only, for both.
- Authority: CSS Fonts 4 §2.1: `font-family` is `[ <font-family-name> | <generic-font-family> ]#`, and `#` means one or more. Engineer decision 2026-11-11: "empty stack should be an error".
- Status: adopted. The exact error type and message are the builder's choice.
- Rival: fall back to the README default stack.
- Witness: `[]`: the law throws, the rival returns the georgia/serif stack.
- Checkpoint: the `typography(opts)` call.

### What the probes found

- **Constraints:** ordinary names round-trip (spaces, commas, digits first, `"`, CJK, emoji, empty string) (P2). `html.font` always carries the same list as `body.fontFamily` (P2). With the corrected check, every theme except `wordpress-kubrick` has an unquoted generic (P4).
- **Dynamics:** none. It is a pure function of the options. The variation is the domain of entries.
- **Boundaries:** `'`, `\`, newline (P2, P3); keyword case (P1); CSS Fonts 4 keywords and `generic(…)` (P1, 28 of 33 bare spellings and all 4 `generic()` forms emitted as quoted names); `default`/`inherit` (P3); `[]` gives `html.font = "100%/1.45 "` and `body.fontFamily = ""`, both invalid (P6); `[42]`/`[null]` throw `TypeError` from `startsWith`, added in #307 (P6).

### Laws people forget

- **No throw on valid input:** for every non-empty array of strings, `typography(opts)` returns and `toJSON()`/`toString()` return. P6 shows this holds for strings. Empty arrays and non-string entries are errors by L5.
- **The laws of the kind of function:** a serializer and a reader round-trip (L1–L3 are that law, split by token kind). Idempotence and symmetry do not apply.

### Decisions (2026-11-11)

- **Q1 (L4): `default`, `inherit`, and the other CSS-wide words.** "Follow spec always." In a stack with more than one entry, they are family names and are quoted. `default` is always a name.
- **Q2 (L3): `var()` edge cases.** "Again spec makes rules." Function names are case-insensitive, so `VAR(--x)` passes through. A malformed `var(` is not a `var()`, so it is a name under L1.
- **Q4 (L1): lone surrogates.** Decided by CSS Syntax 3 §3.3: the browser replaces them with U+FFFD, so the reader does too. A lone surrogate is half of a UTF-16 pair (for example `"\uD800"` alone); it is not a Unicode character, and only appears from broken string slicing. The engineer asked "what are lone surrogates?" and, after this explanation, agreed with all the answers on 2026-11-11 ("agreed except on fallback").
- **Q5 (L5): empty stack.** "Should be an error."
- **Q6: `-apple-system`.** No spec names it. But it is a valid `<custom-ident>`, and CSS Fonts 4 §2.1.1 allows a family name "unquoted as a sequence of one or more `<custom-ident>`". So emitting it unquoted is the spec's family name `-apple-system`, the same family as the quoted form. Unquoted is also what the code did before this change (99350b1). The claim that WebKit treats the quoted form differently was not probed. Keep it unquoted. `BlinkMacSystemFont` stays quoted (same family per spec). Whether Chrome still matches the quoted form was not probed: a limit. The engineer asked "spec?" and agreed with this answer on 2026-11-11 ("agreed except on fallback").

- **Q1a (L4): a lone CSS-wide keyword (`bodyFontFamily: ['inherit']`).** "Follow spec always". The engineer agreed with this reading on 2026-11-11 ("agreed except on fallback"). The only entry is the keyword: `font-family: inherit`, the same rule that makes an unquoted `'serif'` the generic. The `html{font: 100%/1.45 …}` shorthand cannot hold it, so `html` gets `font-size`, `line-height`, and `font-family` longhands in that case.
- **Q3: a family literally named `serif`.** There is no way to ask for one. It is stated as a limit, because the spec calls such names "unusual". Every entry is unquoted text, so an entry that starts and ends with a quote is a name that contains quote characters (L1). Engineer, 2026-11-11: "agreed except on fallback" (it agreed with this recommendation).
- **Q5a (L5): non-string entries (`[42]`, `[null]`).** The engineer agreed on 2026-11-11 ("agreed except on fallback"): they are also an error that names the option, and replace today's accidental `TypeError` from `startsWith`.

### Law delta, 2026-11-11 (review R1, R7, R9, R10)

The engineer decided these after an independent review (ledger:
`/tmp/typography-review-eval/ledger.md`).

- **L2, generic().** Old: "`generic(fangsong)`, `generic(kai)`,
  `generic(khmer-mul)`, `generic(nastaliq)`, in any case, read back as that
  generic." New: every `generic(...)` entry, in any spelling, is a family name
  under L1 (quoted), until browsers implement CSS Fonts 4's functional
  generics. Why: Chrome 157 drops the whole declaration, `html` line height
  included, when the entry is unquoted (probe 7; review R1). The code before
  this work quoted it, so the stack survived. Engineer: "b".
- **L1, embedding.** New clause: an emitted family name contains no `<`, so
  the stylesheet can sit inside a `<style>` element (probe 10:
  `renderToStaticMarkup(<TypographyStyle>)` emitted a live
  `</style><script>`). `var()` entries pass through unchanged, so a `<` in a
  fallback is a limit, left to the `toString()` contract. Engineer: "add the
  escape".
- **L5, the error.** Old: "throws an error that names the option". New:
  "names every invalid option" (review R7: both empty named only
  `bodyFontFamily`). Engineer: "yes better error".
- **Limits (R9).** When the body stack is a lone CSS-wide keyword, `html` gets
  longhands. These do not reset `font-style`, `font-weight`, `font-variant`, or
  `font-stretch` as the shorthand does. `html` is the root and no shipped
  theme sets them, so nothing observable changes. Engineer: "fine yeah".

### Law delta, 2026-11-11 (second review, S1 and S3)

The engineer agreed to these on 2026-11-11 ("agreed").

- **L3, `<`.** Old: "the entry unchanged". New: "the entry unchanged, except
  that each `<` becomes the escape `\3c `". Inside a quoted fallback the escape
  is the same string. Outside one, a `<` was never valid in a font list. Why:
  `var(--f, '</style>…')` reached server-rendered HTML raw (second review S1;
  probe 12 shows Chrome keeps the escape in the declared text). With this,
  L1's "no `<` in the stylesheet" holds for every stack, with no `var()`
  exemption (second review S2).
- **L3, what counts as `var()`.** An entry is a `var()` reference only when
  it starts with `var(` (any case) and ends with its closing `)`. Text around
  it, white space or a comment (`/**/var(--f)`, `var(--f)/**/`), makes it a
  family name (second review S3). This was already the rule for white space.
- **Tripwire for L2's generic() delta.** Probe 12 checks
  `CSS.supports('font-family', 'generic(kai)')`. Chrome 157 says `false`. When a
  browser says `true`, revisit the R1 delta.

### Law delta, 2026-11-12 (second prep-pr review, R5)

- **L5, an omitted stack.** Old: an undefined stack was not an array, which
  was outside the domain, and it threw. New: an undefined stack is an omitted
  one, so it is the README default stack. Engineer: "falling back to defaults
  works" (it applies to every option, see S3). An empty stack and a
  non-string entry still throw.

### Law delta, 2026-11-12 (third prep-pr review: no breaking changes)

- **L3, a var() list.** Old: an entry is a `var()` only when it is exactly
  one `var(...)`. New: an entry that starts with a well-formed `var()` and
  continues as a font-family list is passed through. Its items are the
  entry's (#307 passed `'var(--sans), sans-serif'` raw). The test reads the
  entry as it sits in the stylesheet, with more list after it, so a string or
  comment left open at its end makes it a name. Text before `var(` still
  makes it a name, as in v0.16. A `<`, raw or written `\<`, becomes `\3c `.

### Law delta, 2026-11-12 (fifth prep-pr review, V6: pass through raw)

- **L3.** Old: an entry that starts with a well-formed `var()` and reads as a
  list passes through, and other text after the `var()` makes it a name. New:
  an entry that starts with a well-formed `var()` and is a
  <declaration-value> passes through as written. CSS reads it only after
  substitution, so the text is the promise (`'var(--a) var(--b)'`,
  `'var(--a), generic(kai)'`). An open string or block, or a top-level `;` or
  `!`, still makes it a name. The check compares each `var()` entry's
  top-level pieces with production's text, and reads every other piece alone
  as its entry's one item.

---

## S2. Every shipped theme's stacks end in a matching generic (theme content): not an oracle

Status: **declined as an oracle** 2026-11-11. The engineer: "there's not a 'law' here per se. We'll just spot check the themes and fix them as needed." Kept as the list of known spots to check: `wordpress-kubrick` (fixed by S1 L2), `st-annes` and `ocean-beach` headers, `parnassus` body. Q7 is moot. The sections below are kept for reference.

**The promise.** Each `typography-theme-*` package gives a body and header
stack that falls back to a generic family of the same kind as its primary
face. Once S1 holds, that generic is emitted as a generic. The oracle owns the
theme packages' `bodyFontFamily` and `headerFontFamily`.

**The contract.**

```js
typography(stAnnesTheme).toJSON().h1.fontFamily
// → 'Source Serif Pro', …, then a serif generic
typography(kubrickTheme).toJSON().body.fontFamily
// → 'Lucida Grande', 'Verdana', 'Arial', then the generic sans-serif
typography(anyTheme).toJSON().body.fontFamily
// → contains an unquoted generic of the primary face's class
```

### Boundary

| Question                           | Answer                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| What promise belongs together?     | A theme's stack falls back to the right generic.                                                                        |
| Where is it observed?              | `typography(theme).toJSON()` font fields, for every `packages/typography-theme-*` (35 today).                           |
| What does it assume?               | S1 holds. A classification of each primary face (serif, sans-serif, monospace, …) from an outside source (Q7).          |
| What else witnesses it?            | Chrome computed `font-family` (P3 style). The existing snapshot tests, which today lock in kubrick's `'Sans-Serif'`.    |
| Where does another contract begin? | How a stack is serialized (S1). Raw `fontFamily` strings in theme `overrideThemeStyles`, which are the theme's own CSS. |
| Which source implements it?        | `owns: packages/typography-theme-*/src/index.js` (`bodyFontFamily`, `headerFontFamily`).                                |
| What public state does it expose?  | The theme object's `bodyFontFamily`/`headerFontFamily`: T1 and T2. Other theme fields: none (out of scope).             |

### T1 Every theme stack has a generic fallback

- Examples: 34 of 35 themes (P4, corrected check); `github` and `wordpress-2010/2011` put emoji fonts after `sans-serif`, which is fine (P4b). Kubrick fails today because of S1 L2.
- What varies, what stays: the theme and its fonts. The answer depends on whether some entry is a generic.
- Law: For every theme package, every emitted body and header stack contains at least one item read as a generic family.
- Domain edges: themes that override `fontFamily` in `overrideThemeStyles` (checked as raw CSS, read by the same reader).
- New case: a new theme `['Inter']` with no generic → fails.
- Rebuilt examples: kubrick ✓ once S1 L2 holds.
- Dynamics: none.
- Constraints: same as the law.
- Boundary conditions: stack of one generic (`wikipedia` body `['sans-serif']`).
- Authority: CSS Fonts 4 §2.1 ("authors are encouraged to append a generic font family as a last alternative"); #175 (maintainer fix of two theme fallbacks).
- Status: adopted
- Rival: a generic is optional.
- Witness: kubrick: the law needs a generic; the rival accepts `'Sans-Serif'` as a name.
- Checkpoint: each theme's `toJSON()` font fields.

### T2 The fallback matches the face

- Examples: #175 changed `Quattrocento Sans` and `Source Sans Pro` from `serif` to `sans-serif`. Today `st-annes` headers `Source Serif Pro` → `sans-serif` and `ocean-beach` headers `Roboto Slab` → `sans-serif` (P5, a name heuristic that only catches names containing Serif/Sans/Slab).
- What varies, what stays: the face. The answer depends on the face's class in the classification source.
- Law: For every theme stack, the first generic after the primary face is the generic of that face's class.
- Domain edges: faces outside the classification source (system fonts such as `Lucida Grande`, `Georgia`). Multi-face stacks whose faces disagree.
- New case: a theme `['Lora', 'sans-serif']` → fails (Lora is a serif).
- Rebuilt examples: #175's two fixes ✓; `Merriweather → serif` ✓ in most themes, but `parnassus` body has `Merriweather → sans-serif`, which the name heuristic misses.
- Dynamics: none.
- Constraints: T1.
- Boundary conditions: display or slab faces (`Roboto Slab`, `Arvo`, `Patua One`), handwriting faces (`cursive`?), faces with no class in the source.
- Authority: #175 (maintainer fix); engineer decision 2026-11-11: "we should cleanup fallbacks". The classification source is open (Q7).
- Status: adopted in direction; the classification source is open (Q7).
- Rival: the fallback is the theme author's free choice.
- Witness: `st-annes` headers: the law needs `serif`, the rival accepts `sans-serif`.
- Checkpoint: each theme's `toJSON()` font fields.

### What the probes found

- 35 themes, 282 font lists (P4). One theme without a working generic (kubrick, 8 lists). Two name/fallback contradictions found by a name-only heuristic (P5). Real mismatches without "Serif/Sans/Slab" in the name (for example `Arvo`, `Domine`, `Neuton`, `Lato → serif`) need the classification source and were not probed.

### Laws people forget

- **No throw on valid input:** every theme already returns from `typography(theme)` (P4).
- **The laws of the kind of function:** none apply. This is data, not a function.

### Open questions

- **Q7: Classification source.** T2 needs an outside answer to "is this face a serif or a sans-serif?" The oracle cannot tell from the name (`Arvo` and `Domine` are serifs, `Lato` is a sans), and production can't be the authority either. Reading A: Google Fonts' category metadata for Google faces, plus a short hand-written table for system faces (Georgia, Lucida Grande, …). Reading B: a hand-written table for every face the themes use, reviewed once. S2 is a data check over a finite, growing set, so the cheaper reading may be better. It may also be better as a plain test than as an oracle.

---

## S3. Numerical typography follows the configured base size and rhythm

Status: **approved; oracle draft implemented, baseline RED** (2026-11-11).
The engineer accepted negative/fractional scale positions and throwing on invalid
values. Q1 and Q2 are settled below. The numerical oracle is written and lint
passes; its first run exposes fractional-base truncation and missing invalid-input
rejection. Step 2 records the frozen contract in `oracles/NUMERIC-CONTRACT.md`;
32 model-only reconstructions pass. The unitless heading-line-height check has
been strengthened with a before/after calibration; all nine calibrations pass.
`oracles/NUMERIC-EVIDENCE.md` records validation. Full passing campaign reach,
browser/serialized-CSS witnesses, and mutation checks remain pending. Production
changes still require a separate user request.

**The promise.** Configured base size, scale ratio, and line height retain their
documented numerical relationships in the public helpers and generated heading
styles. Fractional pixel sizes retain their fractions, and successful calls
return usable CSS measurements.

The scale and rhythm probes for S3 are separate from S1/S2's P1–P6. They live at
`/Users/kyle.mathews/Documents/Codex/2026-11-11/work/outputs/oracles-scale-rhythm/`:

- [Probe runner](/Users/kyle.mathews/Documents/Codex/2026-11-11/work/outputs/oracles-scale-rhythm/probe.cjs) — run the absolute path above with `node probe.cjs all` from that directory.
- [Heading grid](/Users/kyle.mathews/Documents/Codex/2026-11-11/work/outputs/oracles-scale-rhythm/fractional.json): 64 fractional-base failures and 64 integer-base controls.
- [Rhythm grid](/Users/kyle.mathews/Documents/Codex/2026-11-11/work/outputs/oracles-scale-rhythm/rhythm.json): 770 proportionality checks and 770 stability checks passed.
- [Line-height comparisons](/Users/kyle.mathews/Documents/Codex/2026-11-11/work/outputs/oracles-scale-rhythm/line-height.json): four configurations distinguish utility and heading checkpoints.
- [Boundary observations](/Users/kyle.mathews/Documents/Codex/2026-11-11/work/outputs/oracles-scale-rhythm/boundaries.json): 21 cases, including nonfinite values and overflow.
- [Rounding history replay](/Users/kyle.mathews/Documents/Codex/2026-11-11/work/outputs/oracles-scale-rhythm/rounding-history.cjs) and [output](/Users/kyle.mathews/Documents/Codex/2026-11-11/work/outputs/oracles-scale-rhythm/rounding-history.json): unchanged main/client source entries and commit `94ce29c`.

Both the repository copy and the task-output copy link to the same saved evidence.

### Contract

```js
typography({ baseFontSize: '16.5px', scaleRatio: 2 }).toJSON() // → root size 16.5px and h1 size 33px
typography({ baseFontSize: '12px', scaleRatio: 2 }).scale(-0.5) // → font size 12 / sqrt(2) px (Q1 adopted)
typography({ baseFontSize: '20px', baseLineHeight: 1.6 }).rhythm(-0.25) // → spacing -8px
typography({ baseLineHeight: 1.45 }).toJSON() // → heading line-height 1.1, independent of the helper's rounded line-height
typography().scale(NaN) // → throws; never NaNpx (Q2 decided)
```

Lengths above are semantic values. Equivalent valid CSS units and spellings are
allowed. Unit conversion uses the configured root size; a browser witness fixes
its initial root size at 16px, matching the documented baseline convention.

### Boundary

| Question | Answer |
| --- | --- |
| What promise belongs together? | The numerical relationships between configured base typography and the lengths returned to callers. This includes validity of those generated measurements. |
| Where is it observed? | After construction and after `scale(position)`, `rhythm(lines)`, or `toJSON()`: helper `fontSize`/`lineHeight`, the numerical prefix of `html.font`, heading font sizes and heading line heights. A serialized-CSS witness should inspect the same numerical declarations from `toString()`. |
| What does it assume? | Default/safe font stacks; no plugins or user overrides; pixel base sizes; numeric ratios and unitless line heights; default rhythm units. Positive finite configuration values and rejection of invalid/overflow inputs are decided under Q2. The independent measurement reader must not call production converters. |
| What else witnesses it? | A browser driver can apply generated CSS and read root/heading computed sizes and applied spacing. The existing Jest suite supplies regression examples, not a mathematical model. The companion client source is historical corroboration; its status as a supported package entry is not assumed. |
| Where does another contract begin? | Font-stack encoding belongs to S1. Plugin/override composition, style injection, theme-specific media queries, Google Fonts URLs, and React rendering have different boundaries. Exact padding/rounding policy inside the external vertical-rhythm helper is outside S3. |
| Which source implements it? | Proposed `owns`: `packages/typography/src/index.js` and `packages/typography/src/utils/createStyles.js`. Relevant regions are numerical defaults, scale construction, baseline setup, and generated heading measurements. Other regions of these files are explicit limits; their mutants remain open unless another oracle judges them. External dependency implementation is not owned here. |
| What public state does it expose? | The returned `options` object and all its readable fields are explicit limits: S3 judges configuration effects from the CSS measurements, not option storage or identity. The model reads caller inputs, not returned options; mutations of returned options are outside the supported histories. Exact h2–h6 font-size positions, non-heading declarations, `adjustFontSizeTo`, `linesForFontSize`, injection, and normalization are limits. N4 checks helper line-height validity, but not its precise value. |

### N1 The configured root and heading retain the base-to-heading ratio

- Examples: 16px × 2 → 32px and 16px × 2.25 → 36px (README `scaleRatio`; `docs/what.md`, scale-ratio section). Base 16.5px, ratio 2 → emitted root 16.5px but heading approximately 32px today (heading-grid probe).
- What varies, what stays: positive pixel base and positive ratio vary; the root retains the base and the heading/base quotient retains the ratio. Line height does not choose font size.
- Law: For every supported positive pixel base `b` and positive ratio `r` with a representable result, the returned root size is `b` and the generated h1 size is `b * r`, without integer truncation of `b`.
- Domain edges: fractional bases, bases below 1px, ratio 1, omitted options, and representability boundaries. Unsupported/overflow cases follow Q2; overrides are excluded.
- New case: base 12.75px and ratio 1.6 predict root 12.75px and h1 20.4px, including when line height changes. This case is not in the probe grids or documented examples.
- Rebuilt examples: 16 × 2 = 32; 16 × 2.25 = 36; 16.5 × 2 = 33. The third prediction conflicts with current output and exposes truncation; it does not change the law.
- Dynamics: none: one configuration and observation. Variation is in the input domain, including paired configurations that change only line height.
- Constraints: the quotient stays `r`; positive supported inputs return without throwing. Equivalent CSS lengths are accepted rather than matching output spelling.
- Boundary conditions: omitted options construct defaults; `b` just below/at/above an integer; `0 < b < 1`; `r = 1`; very small/large representable products; zero/negative/nonfinite configuration under Q2.
- Authority: README API `baseFontSize`/`scaleRatio`; `docs/what.md` “Only set the base” and “Pick font sizes from a scale.” Neither restricts pixel sizes to integers. Commit `94ce29c` supplies historical evidence, not authority for truncation.
- Status: adopted from the documented numerical relationship. Input admission policy is decided under Q2.
- Rival: truncate the base before computing the heading, while retaining fractions for the root.
- Witness: 16.5px with ratio 2: this law predicts 33px; the rival predicts 32px. Both agree on the 16px control.
- Checkpoint: the root-size prefix of `toJSON().html.font` and `toJSON().h1.fontSize`, interpreted as lengths; the browser witness checks their applied values.

### N2 A scale position uses a single geometric ratio

- Examples: default `scale()` → 1rem, `scale(2)` → 4rem, `scale(1.333)` → 2.51926rem (existing direct tests); `scale(1)` and h1 share the documented one-scale-unit relation. The engineer adopted the general exponent law after the negative-position explanation on 2026-11-11.
- What varies, what stays: base `b`, positive ratio `r`, and signed/fractional position `s` vary; one scale step multiplies font size by `r`.
- Law: For every supported `b`, `r`, and finite position `s` with a representable target, `scale(s).fontSize` represents `b * r**s` pixels, and an omitted position means zero.
- Domain edges: negative and fractional positions; `s = 0`/`-0`; `r = 1`; ratios below 1; underflow/overflow. Positive finite ratios, including ratios below one, and rejection on overflow follow Q2.
- New case: base 12px, ratio 2, position -0.5 predicts approximately 8.485281374px. This combines a negative fractional position with a non-default base; it is not merely a renamed example.
- Rebuilt examples: 16 × 2**0 = 16px → 1rem; 16 × 2**2 = 64px → 4rem; 2**1.333 ≈ 2.519259611 → the test's rounded 2.51926rem. All three are explained by the proposed law.
- Dynamics: none: one call. Generated pairs can advance a position by one and predict a multiplication by `r`.
- Constraints: no throw in the supported domain; `scale(0)` is the base; increasing position increases size for `r > 1`, preserves it for `r = 1`, and decreases it for `0 < r < 1` as admitted by Q2.
- Boundary conditions: omitted position, zero, -0, negative fractions, fractional bases, unity ratio, nearest representable overflow/underflow cases. Each needs a constructed history.
- Authority: the README/concept docs describe scale positions and ratios, and direct tests provide examples. The engineer adopted the proposed generalization in Q1 on 2026-11-11 after asking what negative positions mean.
- Status: adopted by engineer decision, 2026-11-11 (Q1).
- Rival: round positions to integral steps before applying the ratio.
- Witness: default base/ratio with position 0.5: this law predicts about 22.627417px; the rival predicts either 16px or 32px, depending on rounding direction.
- Checkpoint: `scale(s).fontSize`; its line height is checked for validity by N4, not predicted by this law.

### N3 Rhythm spacing is proportional to the base line height

- Examples: `rhythm(1)` and `rhythm(1.5)` are documented spacing calls (`docs/what.md`); negative spacing appears in the README's override example. The rhythm probe at base 16.5px and line height 1.45 gives `rhythm(-0.5) = -0.725rem` and `rhythm(1.5) = 2.175rem`.
- What varies, what stays: base size `b`, positive unitless line height `h`, and signed line count `n` vary; one rhythm remains one base line height.
- Law: For every supported base `b`, line height `h`, and finite line count `n` with a representable result, `rhythm(n)` represents `b * h * n` pixels.
- Domain edges: zero and -0, negative counts, fractional counts/bases/line heights, non-default bases, and representability boundaries. Omitted-count behavior was observed but lacks a cited promise and remains a limit.
- New case: base 13.25px, line height 1.6, count -0.75 predicts -15.9px; none of those base/count combinations appears in the rhythm grid.
- Rebuilt examples: at 16.5px/1.45, half a negative line is -11.9625px = -0.725rem; 1.5 lines is 35.8875px = 2.175rem. Zero and -0 both represent zero spacing.
- Dynamics: none: one call. Histories can repeat a call around `scale()`/`toJSON()` observations; N3 judges its numerical result at each call. The probe also observed identical strings, but exact spelling stability is not a separate adopted promise.
- Constraints: proportionality and base-unit consistency hold within declared measurement precision; valid signed spacing returns without throwing.
- Boundary conditions: counts 0, -0, smallest sampled fractions, negative margins, positive/negative representable limits, and invalid/nonfinite inputs under Q2.
- Authority: `docs/what.md` “Base all other spacings off the rhythm unit” (“One rhythm equals one line-height”); README override example uses `rhythm(-1)`.
- Status: adopted for explicit finite counts in the supported domain. Repeated calls owe the same numerical law; exact string stability remains an observed fact, not an expected-result rule.
- Rival: round counts to whole rhythms, or compute spacings from a fixed default line height.
- Witness: base 20px, line height 1.6, count -0.25: law → -8px; whole-count rounding → 0 or -32px, and a fixed 1.45 height → -7.25px.
- Checkpoint: the CSS length returned by `rhythm(n)`; a browser witness applies it as margin, where negative lengths are valid.

### N4 Successful numerical output never contains invalid CSS

- Examples: current `scale(NaN)` returns `NaNpx`/`NaNNaNpx`; `scale(1024)` returns infinity strings; base `0px` produces NaN measurements (boundary probe). The engineer subsequently required “no invalid css should be allowed.”
- What varies, what stays: numeric options and helper inputs vary; successful observations remain valid, finite, property-appropriate CSS measurements.
- Law: For every input admitted to the numerical API or explicitly exercised as an invalid boundary, the call rejects an unsupported input or nonfinite result, and every successful numerical CSS value is valid for its destination property; it never returns NaN/infinity strings or a malformed measurement.
- Domain edges: NaN, infinities, zero/negative base sizes, malformed/empty pixel strings, zero/negative ratios and line heights, numeric overflow, and wrong input types. Admission/rejection policy is decided in Q2; these cases must not disappear from the grammar after that choice.
- New case: `scale(2048)` cannot return an infinity measurement: it must throw rather than return an infinity measurement. This outcome is predicted without assuming the current serialization spelling.
- Rebuilt examples: existing NaN/infinity outputs fail the adopted invariant; the law does not bless those outputs or require their specific strings. A negative rhythm length is valid as spacing and must not be rejected merely for its sign.
- Dynamics: none: one call. For construction failures the checkpoint is the thrown error; otherwise it is the helper or generated style observation.
- Constraints: validity and finiteness are unconditional for successful observations. Valid ordinary inputs cannot be made to pass by rejecting every call: N1–N3 and N5 require their returns.
- Boundary conditions: each invalid/nonfinite class in the saved probe; finite overflow; zero configuration distinguished from zero scale position or zero spacing; negative spacing distinguished from negative font size.
- Authority: direct engineer decision on 2026-11-11: “no invalid css should be allowed.” The engineer subsequently chose throwing on invalid values (Q2). Property acceptance should be checked by an independent CSS reader and, for constructed witnesses, a browser.
- Status: adopted output invariant and rejection policy, engineer decisions 2026-11-11 (Q2).
- Rival: propagate JavaScript NaN/infinity into CSS and leave the browser to drop it.
- Witness: `scale(NaN)`: this law requires an error; the rival successfully returns `NaNpx`.
- Checkpoint: returned `scale()` fontSize/lineHeight, `rhythm()` length, and generated root/heading numerical declarations (plus their serialized-CSS witness). Other font-family/style validity is a separate boundary, including S1.

### N5 Generated heading line height is independent of rhythm-rounded helper line height

- Examples: defaults give `scale(1).lineHeight = '2.9rem'` and h1 `lineHeight = 1.1`; a configuration with `headerLineHeight: 1.3` gives h1 line height 1.3 (line-height probe).
- What varies, what stays: base size, base line height, and scale ratio can change; generated heading line height retains its configured unitless multiplier, default 1.1.
- Law: For every supported configuration, h1–h6 use `headerLineHeight` as a unitless multiplier, defaulting to 1.1, independently of the line-height value returned by the scale helper.
- Domain edges: omitted headerLineHeight, positive fractional multipliers, different base line heights, all six headings; invalid multipliers follow Q2.
- New case: base 13.25px, ratio 1.6, base line height 2, header line height 1.25 predicts h1 font size 21.2px and line height 26.5px, while leaving utility line-height policy outside this law.
- Rebuilt examples: default 32px heading × 1.1 = 35.2px; explicit multiplier 1.3 gives 41.6px for that heading. A helper's 46.4px line height does not override either prediction.
- Dynamics: none: one configuration and style observation. Paired histories vary baseLineHeight while holding headerLineHeight fixed.
- Constraints: no rhythm-grid constraint is imposed on generated headings; valid configurations return and expose the chosen multiplier.
- Boundary conditions: omitted multiplier; configured 1 versus a fraction; all headings; invalid/nonfinite/zero multipliers under Q2.
- Authority: maintainer commit `22d8ec8` (2017-08-03) explicitly adopts separate heading line height, default 1.1. The engineer acknowledged on 2026-11-11 that the older docs may be stale; that acknowledgment is not used to invent a new default.
- Status: adopted from the explicit maintainer decision, with invalid-value rejection decided under Q2.
- Rival: reuse the helper's rhythm-rounded line-height measurement for every heading.
- Witness: default h1: law → 35.2px; rival → 46.4px, as the saved probe demonstrates.
- Checkpoint: h1–h6 line-height declarations from `toJSON()` and the corresponding browser-computed values in a witness driver.

### Model, histories, and limits

The candidate model reads only the caller's configuration and call arguments.
It multiplies the base by the heading ratio, multiplies rhythm line counts by
the base line height, and uses the adopted geometric scale formula. A separate measurement reader interprets actual CSS values. It must
not call `modularscale`, `compass-vertical-rhythm`, `convert-css-length`, or the
production helpers to predict expected results.

Generated histories vary more than the existing example sets: integer and
fractional bases, subpixel bases, signed/fractional positions and spacing,
unity ratios, positive ratios on either side of one, and positive unitless
line heights. Constructed histories retain every observed failure and boundary,
including fractional truncation and finite-index overflow. Sampling weights
are implementation choices, not a reason to narrow the adopted contract.

The probe's `0.000011rem` tolerance is a proposed measurement allowance for
conversion precision, not permission to truncate the base or match a faulty
production answer. The builder must state and calibrate the final comparison
precision. Equivalent units are allowed. A browser witness and its controlled
font/root environment are proposed, not already executed numerical evidence.

Limits: no exact law yet for helper-generated line heights, `linesForFontSize`,
`adjustFontSizeTo`, omitted rhythm counts, mutation of returned options, alternate
rhythm units, named ratios, CSS variables/calc as base sizes, plugin overrides,
or exact h2–h6 scale positions. These remain gaps rather than silently becoming
expected behavior. Client-entry parity is historical evidence, not a new adopted
public-entry contract.

### What the probes found

- **Constraints:** 770 sampled rhythm relationships held; integer-base heading
  controls held; fractional bases violated N1; all observed successful numeric
  NaN/infinity outputs violate the engineer's subsequently adopted N4.
- **Dynamics:** no mutable application lifecycle is needed. Input variation is
  the main history dimension; 770 repeated rhythm calls also stayed stable
  around other reads. A repeated-call history checks N3 at each observation; it does not enforce
  identical output spelling from observed behavior alone.
- **Boundaries:** preserve the sampled 0.5px failure, the practical 16.5px failure,
  zero/-0 positions and spacing, negative/fractional spacing, NaN/infinity, empty
  or zero base strings, and finite overflow at scale position 1024. Q2 decides
  their expected rejection behavior.

### Laws people forget

- **No throw on valid input:** the return promises in N1–N3/N5 require successful
  construction and observation for supported, representable configurations.
  N4 cannot be satisfied merely by throwing for ordinary valid values.
- **Laws of the kind of function:** N2 proposes a scale identity at zero and
  one-step multiplicative relation; N3 expresses linear spacing, including zero
  and sign. Equality symmetry and setter idempotence do not apply. A CSS reader
  is an independent observer, not an inverse API that production promises.

### Decisions (all settled)

Decisions already recorded:

- 2026-11-11: the engineer selected scale/rhythm as the area to explore.
- 2026-11-11: “no invalid css should be allowed” adopts N4. The later Q2 answer selects rejection rather than fallback and adopts the
  recommended numeric ranges; the error class/message remains an implementation choice.
- 2026-11-11: the engineer noted docs may be out of date and accepted continuing
  after the history explanation. No production fix has been requested.

**Q1 — All scale positions: adopted.** The engineer asked “negative positions?”
and, after the explanation that a negative position steps below the base,
answered “oh yes negative positions” on 2026-11-11. Adopt the proposed geometric
relationship `base × ratio^position`, including signed/fractional positions and
positive ratios below one. With base 16px and ratio 2, positions 1, 0, -1, and
-0.5 predict 32px, 16px, 8px, and about 11.313708499px respectively.

**Q2 — Invalid numeric inputs and overflow: throw.** The engineer answered
“yes through [throw] on invalid values” on 2026-11-11. Adopt positive finite
pixel base sizes, positive finite ratios, and positive finite unitless
base/heading line heights; allow signed finite scale positions and rhythm
counts where the calculation returns a finite usable measurement. Unsupported
configuration, nonfinite inputs, and overflow throw rather than silently
substitute defaults or return invalid CSS. Zero position and zero/negative
spacing remain valid. Valid zero measurements caused by numerical underflow do
not themselves violate CSS validity. The exact error class/message is an
implementation choice; errors should identify the invalid argument/result.

The engineer has answered both questions. Proceed with the existing oracle
setup and `oracles-design`; no production fix has been requested.

**A3 — Named ratios (prep-pr review, 2026-11-11): accept them.** Through
v0.16, `scaleRatio` went through modularscale 1.0.2, which accepted 17 named
ratios (`'golden'`, `'minor third'`, …), and design-tools still offers them.
Q2 made every non-number throw. Asked whether to keep throwing or accept the
old names, the engineer chose "b" (accept them). Law delta: a `scaleRatio`
that is exactly one of modularscale's names means that name's number (N1, N2),
and any other value throws under Q2. That includes other spellings
(`'Golden'`), numeric strings (`'2'`), inherited keys (`'constructor'`), and
non-strings that stringify to a name (`['golden']`). modularscale's fallback,
where an unknown name means golden, is not kept.

**A4: pixel base line heights (prep-pr review, 2026-11-11): accept them.**
v0.16 accepted `baseLineHeight: '24px'` through compass-vertical-rhythm and
gave `html { font: 100%/24px … }` and `rhythm(1) = 1.5rem`. Q2 made it throw.
The engineer chose "b": accept them. Law delta: a base line height is a
positive finite unitless number or a positive finite pixel length. N3 now
reads: html carries the base line height (base × the multiplier, or the
pixel length), and `rhythm(n)` is that height × n. Other units (`'1.5em'`)
and bare numeric strings (`'24'`) throw under Q2. v0.16 converted other units,
so that break goes in the changelog.

**A7: exponents and extreme scale positions (prep-pr review, 2026-11-11):
fix them, and add N6.** compass-vertical-rhythm reads `1e-7` as the number 1e-7
with the unit `e-7`. So a unitless base line height with an exponent, and every
length its own `rhythm` writes past 1e21 or below 1e-6, came out wrong:
`scale(70)` threw, and with `baseFontSize: '1e-7px'`, `scale(1)` gave
`lineHeight: 0e-7px`. The engineer chose "a". Law delta:
- **N6:** the line height that `scale()` gives is at least its font size.
  It is checked for rem output. px output is floored by the dependency.
- **Owed results:** `scale()` with a font size up to 1e300px and a base line
  height of 0.5 or more returns base × ratio^position (N2). Before this, the
  extreme-input oracle allowed any throw.
- **N3:** a unitless base line height reaches `html` as that multiplier.

Production: compass gets the line height in pixels, and in rem mode `scale()`
takes its line height from typography's own rem rhythm.

**Second prep-pr review (2026-11-12): the engineer's decisions.**
- **L1, explicit undefined: "falling back to defaults works".** An option set
  to `undefined` is omitted, so it takes its default. That includes the font
  stacks: an undefined stack is the README default (S1 L5 delta). `null`
  stays invalid under Q2.
- **L2, N6 for adjustFontSizeTo: "a".** With lines `auto`, the line height of
  `adjustFontSizeTo`, and of every rule typography writes outside h1–h6
  (N5 owns those), covers the font size. Explicit lines may give less:
  compass's own fixture allows it.
- **L3, N7, helper units: "a".** Then, on the authority: "spec is always
  the law (and browsers) so if compass is causing bugs we need to fix it
  (perhaps by vendoring)". The API, 5-decimal rounding, the px floor, and
  the auto line count stay compass-vertical-rhythm 1.4.5's, now inlined
  (the dependency is dropped and its test suite is ported to Jest).
  Conversions follow CSS Values 4:
  - rem is the base; em and % are the parent size; ex is 0.5em (§6.1.1);
    absolute units are exact (§5.2);
  - an em line height is relative to the element's own size. Chrome
    confirms it: compass's `2.4em` rendered 45.6px where the rhythm owes
    28.8px.
  - A `rhythmUnit` that does not convert from px (`%`, `vw`, a non-string)
    is invalid configuration and throws (Q2).
- **Q2 enforcement (review R4):** an invalid option's error names it, and an
  overflowing or underflowing line-height product is invalid `baseLineHeight`.
- **"No breaking changes" (2026-11-12):** the README and the existing tests
  must not break. The README examples pass. The 44 theme snapshots are
  byte-identical. Over a parity sweep, every rem output matches v0.16. em-mode
  adjusted line heights change (the spec fix above). After the third review,
  px-mode font sizes are rounded to 5 decimals, which changes them by at most
  5e-6px (T4). The engineer approved this on 2026-11-12: "rounding is fine".

**Third prep-pr review (2026-11-12): restorations and decisions.**
- **No breaking changes, restored** (engineer's choice of three; unknown
  scaleRatio names keep throwing):
  - A `var()` entry may continue as a font-family list
    (`'var(--sans), sans-serif'`, as #307 passed it). S1 L3 delta.
  - Numeric strings for numbers (`scaleRatio: '2'`, `baseLineHeight: '1.5'`,
    `headerLineHeight: '1.2'`, and helper arguments). A base line height may
    be any CSS length that converts to px (`'1.5em'`, `'150%'`). A heading
    line height may be a length, which is kept as given (N5).
  - `null` for `rhythm` lines and the `scale` position means the default.
- **Review findings under adopted laws:** an escaped `\<` stays one character
  (T1); a unitless `0` is a length (T2); a negative font size or line count
  in `adjustFontSizeTo` throws (T3, N4); px results round to 5 decimals (T4);
  `roundToNearestHalfLine` is read for truthiness (T5); `rhythmUnit` must be
  a string unit that converts from px (T7, Q2); compass's options are read
  once, at construction (T9).
- **T6 (engineer: "line height in px"):** an em or ex length relative to a
  zero (or underflowing) size cannot hold the value, so it is written in px.
  This keeps A7's owed results for em.
- **T10 (engineer: switch the themes):** the themes used compass only for
  `establishBaseline()`, which gives two values. They now write those values
  directly. compass-vertical-rhythm is gone from every package, and the 44
  theme snapshots are byte-identical.

**Fourth prep-pr review (2026-11-12).** These fall under "inputs that worked
in v0.16.24 keep working" and "spec is the law":
- `baseFontSize` may be a number (px), a numeric string, or any CSS length
  that converts. em, rem, and % are of the browser's initial 16px, and `12pt`
  is exactly 16px. v0.16 read `12pt` as 12px.
- `headerLineHeight` is any CSS `line-height`, kept as given: a number or
  length of 0 or more, `normal`, a CSS-wide keyword, or a math or `var()`
  function that is safe CSS (N5). It throws only for values CSS rejects.
- A plain number or numeric string where a length is expected
  (`minLinePadding`, helper font sizes) is px, as compass read it.
- White space around a number or a length is ignored.
- `blockMarginBottom` as a numeric string is rhythm units (README), like a
  number. v0.16 wrote it raw as an invalid unitless margin.
- U5, the engineer: "Golden was just it ignoring the input and falling back
  to a default? In which case that's definitely a bug." `scaleRatio: '2'` is
  2, listed as a fix.
- U7, the engineer: keep whole-entry quoting for a var() list with a bad item.

**Fifth prep-pr review (2026-11-12).**
- **V7 (engineer: "reject ex, like ch"):** ex has no px factor. rhythmUnit
  'ex', baseLineHeight '1.5ex', and ex helper lengths throw. headerLineHeight
  '1.2ex' is written as given and never computed, so it stays valid.
- **V6 (engineer: "pass through raw"):** a font-stack entry that starts with
  a well-formed var() and is a <declaration-value> passes through as written
  (S1 L3 delta). This replaces U7's whole-entry quoting for safe text.
  'var(--a) !important' still becomes a name: a top-level "!" would make the
  whole declaration important, or invalid if an entry follows.
- **Math scope (engineer: "full: build the grammar"):** headerLineHeight may
  be any CSS Values 4 math function that line-height accepts (N5). The
  grammar types a value by CSS Values 4 §10: operands and operators, white
  space around + and -, each function's arguments, and type combination. A
  value with a var() or env() reference is checked only after substitution.
  The model is calibrated against Chrome 157 CSS.supports on 1500 sampled
  values, and 1495 agree. Chrome also accepts exp() and sqrt() of a length
  and typed division, which the spec rejects; the spec decides.
- **V1 (fixed):** the helpers' default font size is the computed base. Under
  a relative baseFontSize, adjustFontSizeTo(options.baseFontSize) meant 150%
  of the base, so createStyles' table rule and 21 theme calls now use "100%".
  Their output is identical, and the 44 snapshots are unchanged.
- **V2 (fixed):** the rhythm reads baseFontSize and baseLineHeight once, at
  construction.

---

## S4. toString() is the stylesheet that toJSON() describes (stylesheet serialization)

- Promise: `typography(options).toString()` is CSS that a browser parses into
  exactly the rules and declarations of `toJSON()`, with normalize.css first
  when `includeNormalize` is true. Owns `utils/compileStyles.js`.
- Contract: `toJSON().h1.fontSize` → the `h1` rule's `font-size`; a nested
  object (`'@media (max-width:480px)': { html: {...} }`) → a nested rule;
  `MozFontFeatureSettings` → `-moz-font-feature-settings`; `--brandColor`
  → `--brandColor`.
- Probes (2026-11-12):
  - custom property names are mangled: `--brandColor` is written
    `--brand-color`, a different property (CSS Variables 1 §2: custom
    property names are case-sensitive);
  - a `}` in an option value closes the rule early and corrupts the rest;
  - a `<` in any option value (`bodyColor: 'red</style>…'`) reaches the
    stylesheet, and `TypographyStyle` writes it raw into server-rendered HTML
    (the class of review R10, beyond font stacks);
  - `bodyColor: null` writes `color:null`.
- Laws: every rule and declaration of toJSON() reaches the stylesheet as
  written (camelCase to kebab-case, vendor prefixes, custom properties kept);
  the stylesheet holds no `<`; every declaration is one CSS parses.
- Checkpoint: Chrome's CSSOM (the second judge), plus an independent text
  reader for declarations Chrome drops on purpose (other engines' prefixes).
- Open: what to do with an option or override value that is not CSS (Q4a).

## S5. Documented options reach their elements (createStyles)

- Promise (README, Configuration): `headerColor`, `headerWeight` → h1–h6;
  `bodyColor`, `bodyWeight` → body; `boldWeight` → b, strong, dt, th;
  `blockMarginBottom` → every block element's bottom margin, in rhythm
  units; `includeNormalize` → normalize.css first.
- Laws: each option's value appears on its elements, as given; spacing that
  the stylesheet derives from the rhythm (block margins, list indents,
  blockquote margins, table cell padding) is that many rhythm units.
- Scope question (Q4b): the other default rules (hr colors, abbr borders,
  and so on) have no documented authority. Snapshots pin them today.

## S6. Plugins and overrides merge in order (createStyles)

- Promise (README, Themes & Plugins; overrideStyles; overrideThemeStyles):
  plugins run in order, each with the styles so far; then overrideStyles;
  then overrideThemeStyles, so a user's theme overrides win over the theme's.
- Probe: `overrideThemeStyles` wins over `overrideStyles` (blue over red); a
  plugin's result is visible to overrideStyles (`greenx`).
- Law: each layer is deep-merged over the previous; a later layer's value for
  a selector and property replaces the earlier one; everything else stays.

## S7. injectStyles() puts one style element first in <head>

- Promise (README, Javascript usage: "insert styles directly into the
  <head>"; index.js comment "Replace existing"): after `injectStyles()`,
  `document.head` holds exactly one `<style id="typography.js">` whose text
  is `toString()`, as its first child; calling it again replaces the text.
- Checkpoint: a real document in Chrome (the built UMD bundle).

## S8. react-typography renders the stylesheet and the Google Fonts link

- Promise (README, React.js helper components): `TypographyStyle` renders
  `<style id="typography.js">` holding `toString()`; `GoogleFont` renders a
  stylesheet link that requests each `googleFonts` family with its styles.
- Probes: a family name with `&` is not URL-encoded (`family=Font+&+Co`, so
  the browser splits the query); a font without `styles` crashes rendering;
  an empty list renders nothing.
- Laws: the link's URL, parsed by the URL Standard, has one `family` query
  value listing every family (spaces as `+`) with its styles; a font
  without styles requests the family alone (the Google Fonts API default).

## S9. The code plugin follows blockMarginBottom like the core (typography-plugin-code)

- Probe: `blockMarginBottom: '1'` writes `pre { padding: 1 }`, an invalid
  unitless length, where the core reads `'1'` as one rhythm unit (review U8).
- Law: the plugin's spacing reads `blockMarginBottom` exactly as the core
  does.

## Not oracles

- typography-design-tools: an interactive editor (React UI), not a contract
  with laws to state.
- Themes: option data. The 44 snapshots pin their output, and their font
  stacks run through the S1 histories.
- typography-normalize and typography-breakpoint-constants: constants.

### Decisions (2026-11-12)

- The engineer: "let's just keep going finishing coverage in this PR".
  S4–S9 are adopted, with these answers:
- **Q4a: "Throw; null drops the property".** When toString() writes a value
  or selector that is not safe CSS, it throws a RangeError naming the
  selector and property. Unsafe means a `<`, a stray `}`, `;`, or `!` (a
  trailing `!important` is CSS), an open string, a nonfinite number, or a
  value that is not a string or number. A `null` value removes that
  declaration. An `undefined` one leaves it as it was, as an omitted key does
  (decision L1).
- **Q4b: "Documented effects + spacing".** The laws are each README option's
  effect, the rhythm-derived spacing (block margins, list indents,
  blockquote margins, table cell padding, as that many rhythm units), and
  valid CSS for every declaration typography.js writes. Design values, such
  as the exact grays, stay pinned by the snapshots.

### Decisions (round 6, 2026-11-12)

A sixth `/code-review high` (head 66f851e) gave 10 findings (W1–W10, ledger
`/tmp/typography-review6-eval/ledger.md`).

- **W6: "Keep grammar, update it".** headerLineHeight math follows the CSS
  Values 4 Editor's Draft (24 Aug 2026): typed arithmetic (`*` multiplies
  types, `/` divides them), comments between tokens, and each math function
  and each of its arguments resolving to one CSS type. A function the
  grammar does not know is the browser's to judge, as a `var()` is, once the
  text is safe CSS. Invalid math such as `calc(foo)` still throws. Law N5
  changes with it.
- **W10: "Keep the preview for now".** `@tanstack/oracles` stays on the
  pkg.pr.new build; the PR notes it.
- **Coverage (S7, S8, Q4b).** S7 (`injectStyles()`) and Q4b (every
  declaration valid in Chrome) are in `stylesheet.chrome.oracle.ts`; S8 in
  `react-typography.oracle.ts`. S8 also states that
  `typography().options.googleFonts` is `[]` when not given (v0.16), because
  plugins read it. Q4b found that the de-young theme wrote
  `textTransformation`, which is not a CSS property: its h4–h6 were never
  uppercase. The theme now writes `textTransform` (README rule: an input
  that v0.16 ignored is a bug).
- **propTypes: "Keep, open gap".** The components keep their `propTypes`.
  Their two mutants stay open: React development warnings, which no law
  states.
- **de-young: "Keep the fix".** The theme writes `textTransform`.

### Decisions (round 8, 2026-11-12)

- **Y2/Y9: "Escape as \3c".** A `<` no longer makes `toString()` throw
  (this replaces that part of Q4a). Each `<` before `/` in a value or
  selector is written `\3c `, which CSS reads as the same character, so no
  `</style` can end the element. A `<` elsewhere stays, because
  `@media (width < 600px)` needs it raw. Font stacks keep escaping every `<`
  (S1 L3); both use one function.
- **Y6: "Accept, skip calc()".** `blockMarginBottom: 'auto'` and the CSS-wide
  words set the block elements' margin (hr included). The list item margins
  derived from it with calc() are left out, as browsers dropped v0.16's
  `calc(auto / 2)`. The code plugin pads with 0 for `auto`.
- **Y3 (my call, under the v0.16 rule):** `null` plugins and overrides are
  none, as in v0.16. Other non-function values still throw.
