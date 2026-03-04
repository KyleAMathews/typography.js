---
name: typography-core
description: >
  Core mental model for typography.js: vertical rhythm (baseFontSize times
  baseLineHeight = rhythm unit), modular scale (scaleRatio drives h1-h6 sizing
  via scale()), CSS generation pipeline, theme composition, plugin pipeline.
  Use when user asks "how does typography.js work", "explain vertical rhythm",
  "what is a rhythm unit", "how are header sizes calculated", "what does
  scaleRatio do", or needs conceptual understanding of Typography() constructor,
  rhythm(), scale(), adjustFontSizeTo(), the CSS generation flow, theme/plugin
  architecture, or overrideStyles vs overrideThemeStyles execution order.
type: core
library: typography
library_version: "0.16.24"
sources:
  - "KyleAMathews/typography.js:packages/typography/src/index.js"
  - "KyleAMathews/typography.js:packages/typography/src/utils/createStyles.js"
  - "KyleAMathews/typography.js:packages/typography/src/utils/compileStyles.js"
  - "KyleAMathews/typography.js:README.md"
---

# Typography.js — Core Concepts

Typography.js generates a complete set of CSS typography styles from a small
configuration object. Two values — `baseFontSize` and `baseLineHeight` — drive
all spacing through vertical rhythm math. A third value — `scaleRatio` — drives
all heading sizes through modular scale math. Everything else (themes, plugins,
overrides) layers on top of this foundation.

## Sub-Skills

| Need to...                        | Read                                  |
| --------------------------------- | ------------------------------------- |
| Install and get running           | typography-setup/SKILL.md             |
| Use the full API (options, rhythm, scale, themes, plugins, output, React) | typography-core/usage/SKILL.md |

## Quick Decision Tree

- Setting up for the first time? → typography-setup
- Need API reference or usage patterns? → typography-core/usage
- Debugging spacing or sizing? → Read Vertical Rhythm and Modular Scale below
- Styles not applying? → Common Mistakes below

---

## Vertical Rhythm

All vertical spacing in typography.js derives from one value: the **rhythm unit**.

```
rhythm unit = baseFontSize × baseLineHeight
```

With defaults (`baseFontSize: "16px"`, `baseLineHeight: 1.45`):

```
rhythm unit = 16 × 1.45 = 23.2px
```

The `rhythm(n)` function returns spacing as multiples of this unit:

- `rhythm(1)` → `"23.2px"`
- `rhythm(0.5)` → `"11.6px"`
- `rhythm(2)` → `"46.4px"`

Every block element gets `marginBottom: rhythm(blockMarginBottom)` where
`blockMarginBottom` defaults to `1` (one rhythm unit). This creates a
consistent vertical grid where all spacing snaps to the same baseline.

### Key rhythm utilities

All methods come from the `compass-vertical-rhythm` dependency:

- **`rhythm(value)`** — Returns a CSS pixel string for `value` rhythm units.
- **`adjustFontSizeTo(size)`** — Given a CSS font size string (e.g. `"24px"`,
  `"85%"`), returns `{ fontSize, lineHeight }` where `lineHeight` is calculated
  to maintain the baseline grid.
- **`linesForFontSize(size)`** — Returns how many rhythm lines a given font
  size occupies. Used internally by `adjustFontSizeTo`.
- **`establishBaseline()`** — Returns `{ fontSize, lineHeight }` for the root
  `<html>` element based on `baseFontSize` and `baseLineHeight`.

`rhythm()` returns a **string with units** (e.g. `"23.2px"`), not a number.
`adjustFontSizeTo()` and `scale()` return **objects** (`{ fontSize, lineHeight }`),
not scalar values.

---

## Modular Scale

Header sizes are derived mathematically from `scaleRatio` (default: `2`) using
the `modularscale` library. The `scale(n)` function computes:

```
fontSize = baseFontSize × scaleRatio^n
```

Then `adjustFontSizeTo` calculates the matching `lineHeight` to maintain rhythm.

### Header scale values (hardcoded in createStyles.js)

```
h1 = scale(5/5)  = scale(1)    → ratio^1     e.g. 32px   with defaults
h2 = scale(3/5)  = scale(0.6)  → ratio^0.6   e.g. 24.3px
h3 = scale(2/5)  = scale(0.4)  → ratio^0.4   e.g. 21.1px
h4 = scale(0/5)  = scale(0)    → ratio^0     e.g. 16px   (same as body)
h5 = scale(-1/5) = scale(-0.2) → ratio^-0.2  e.g. 13.9px
h6 = scale(-1.5/5) = scale(-0.3) → ratio^-0.3 e.g. 13px
```

Headers use `headerLineHeight` (default: `1.1`) instead of the rhythm-aligned
line height that `scale()` would compute. This is set directly in `createStyles.js`.

### Scale ratio effects

| scaleRatio | Feel | h1 size (16px base) |
|------------|------|---------------------|
| 1.2        | Tight, minimal contrast | ~19px |
| 1.618      | Golden ratio, classic | ~26px |
| 2          | Default, clear hierarchy | 32px |
| 2.5        | Dramatic, editorial | ~40px |
| 3          | Very dramatic | 48px |

---

## CSS Generation Pipeline

```
Typography(options)
    │
    ▼
Merge options with defaults (object-assign)
    │
    ▼
Create vertical rhythm object (compass-vertical-rhythm)
Attach scale() method using modularscale
    │
    ▼
createStyles(vr, options) builds a nested JS object:
    ├─ html: font shorthand, box-sizing, overflow-y
    ├─ *, *:before, *:after: box-sizing inherit
    ├─ body: color, font-family, weight, kerning, font-feature-settings
    ├─ img: max-width 100%
    ├─ Block elements (h1-h6, p, ul, ol, etc.): margin reset + blockMarginBottom
    ├─ blockquote: left/right margin of rhythm(1)
    ├─ b, strong, dt, th: boldWeight
    ├─ hr: 1px gray line
    ├─ ol, ul: margin-left rhythm(1), list-style-position outside
    ├─ li: half blockMarginBottom
    ├─ code, kbd, pre, samp: adjustFontSizeTo("85%")
    ├─ abbr, acronym: dotted border
    ├─ table: full width, border-collapse, tabular nums
    ├─ h1-h6: headerColor, headerFontFamily, headerWeight, textRendering
    ├─ h1-h6 font sizes: scale(5/5) through scale(-1.5/5)
    │
    ├─ PLUGINS (called in array order, each merged via lodash.merge)
    ├─ overrideStyles(vr, options, styles) — merged via lodash.merge
    └─ overrideThemeStyles(vr, options, styles) — merged via lodash.merge (LAST)
    │
    ▼
compileStyles(vr, options, stylesObj) converts to CSS string:
    ├─ Recursively traverse object
    ├─ Convert camelCase to kebab-case (decamelize)
    ├─ Add dash prefix for vendor properties (Webkit, ms, Moz, O)
    └─ Prepend normalize.css v4.1.1 if includeNormalize: true
    │
    ▼
Final CSS string (toString) or JS object (toJSON)
```

### Style execution order matters

The merge order in `createStyles.js` is:

1. Base styles (html, body, block elements, headers)
2. Plugins (in array order)
3. `overrideStyles`
4. `overrideThemeStyles`

Each step uses `lodash.merge()`, so later steps override earlier ones for
the same CSS properties. `overrideThemeStyles` has final say — it runs after
`overrideStyles`.

---

## Theme Composition

For practical theme usage (applying, customizing, overrideThemeStyles code
examples), see typography-core/usage/SKILL.md § Themes. For setup with a theme,
see typography-setup/SKILL.md § Setup with a theme.

Themes are plain JavaScript objects conforming to the same `OptionsType` that
`Typography()` accepts. A theme is just a preset configuration:

```javascript
// typography-theme-funston/src/index.js
const theme = {
  title: "Funston",
  baseFontSize: "20px",
  baseLineHeight: 1.4,
  googleFonts: [
    { name: "Patua One", styles: ["400"] },
    { name: "Cabin Condensed", styles: ["400", "700"] },
  ],
  headerFontFamily: ["Patua One", "sans-serif"],
  bodyFontFamily: ["Cabin Condensed", "georgia", "sans-serif"],
  headerWeight: "400",
  bodyWeight: 400,
  boldWeight: 700,
  overrideStyles: ({ scale, rhythm }) => ({
    blockquote: { ...scale(1 / 5), paddingLeft: rhythm(13 / 16) },
  }),
}
export default theme
```

Themes can include their own `overrideStyles` and `overrideThemeStyles`. When a
user passes a theme to `Typography()`, the theme's properties merge with defaults
via `object-assign`. Theme properties override defaults; user properties override
theme properties.

30+ themes are available as separate npm packages: `typography-theme-funston`,
`typography-theme-bootstrap`, `typography-theme-github`, `typography-theme-wikipedia`,
`typography-theme-wordpress-2016`, etc.

---

## Plugin Pipeline

For practical plugin usage (using typography-plugin-code, creating custom plugins,
code examples), see typography-core/usage/SKILL.md § Plugins.

Plugins are factory functions that return a style-generating function:

```javascript
const MyPlugin = () =>
  (vr, options, currentStyles) => {
    return {
      "selector": { property: "value" }
    }
  }
```

The outer function is the factory (called with `new MyPlugin()` or `MyPlugin()`).
The inner function receives:

1. **`vr`** — vertical rhythm object with `rhythm()`, `scale()`, `adjustFontSizeTo()`
2. **`options`** — the merged configuration options
3. **`currentStyles`** — the style object as built so far (read-only reference)

The returned object is merged into styles via `lodash.merge()`. Plugins are
called in array order, so later plugins can override earlier ones.

Only one official plugin exists: `typography-plugin-code` (styles for `code`,
`pre`, `tt` elements).

---

## Font Family Handling

Font names in `headerFontFamily` and `bodyFontFamily` arrays are automatically
wrapped in quotes when compiled to CSS, **except**:

- Generic CSS families: `inherit`, `default`, `serif`, `sans-serif`, `monospace`,
  `fantasy`, `cursive`, `-apple-system`
- CSS custom properties: values starting with `var(` (e.g. `var(--font-body)`)

This means `["Avenir Next", "sans-serif"]` compiles to
`'Avenir Next',sans-serif` in the CSS output.

---

## Common Mistakes

### HIGH scale() returns an object, not a number

Wrong:

```javascript
const typography = new Typography({
  overrideStyles: ({ scale }) => ({
    h1: { fontSize: scale(1) },
  }),
})
```

Correct:

```javascript
const typography = new Typography({
  overrideStyles: ({ scale }) => ({
    h1: { ...scale(1) },
  }),
})
```

`scale()` returns `{ fontSize, lineHeight }`. Using it as a direct value
assigns `[object Object]` to `fontSize`. Spread it to apply both properties.

Source: packages/typography/src/index.js:47-54

### HIGH overrideThemeStyles runs after overrideStyles

Wrong:

```javascript
import theme from "typography-theme-funston"

const typography = new Typography({
  ...theme,
  overrideStyles: ({ rhythm }) => ({
    blockquote: { marginLeft: rhythm(2) },
  }),
})
// Expects marginLeft to be rhythm(2), but theme's overrideThemeStyles
// may set it back to something else
```

Correct:

```javascript
import theme from "typography-theme-funston"

const typography = new Typography({
  ...theme,
  overrideThemeStyles: ({ rhythm }) => ({
    blockquote: { marginLeft: rhythm(2) },
  }),
})
```

The execution order is: base styles → plugins → `overrideStyles` → `overrideThemeStyles`.
To override a theme's styles, use `overrideThemeStyles` which runs last. Using
`overrideStyles` works only if the theme doesn't set `overrideThemeStyles` for
the same properties.

Source: packages/typography/src/utils/createStyles.js:272-280

### HIGH Mutating an imported theme affects all consumers

Wrong:

```javascript
import theme from "typography-theme-funston"
theme.baseFontSize = "22px"
const typography = new Typography(theme)
// The theme module's export is now permanently modified
```

Correct:

```javascript
import theme from "typography-theme-funston"
const typography = new Typography({
  ...theme,
  baseFontSize: "22px",
})
```

Theme modules export a single object. Mutating it directly changes the module's
cached export, which affects any other file that imports the same theme. Spread
the theme into a new object or pass overrides as additional properties.

Source: packages/typography/src/index.js:40 (object-assign merge)

### MEDIUM rhythm() returns a string, not a number

Wrong:

```javascript
overrideStyles: ({ rhythm }) => ({
  h1: { marginTop: rhythm(1) + rhythm(0.5) },
})
// Results in "23.2px11.6px" (string concatenation)
```

Correct:

```javascript
overrideStyles: ({ rhythm }) => ({
  h1: { marginTop: rhythm(1.5) },
})
```

`rhythm()` returns a string like `"23.2px"`. Arithmetic on rhythm values
requires using `rhythm()` with the combined value, or using `calc()` in CSS.

Source: compass-vertical-rhythm dependency

### MEDIUM injectStyles() is client-only

Wrong:

```javascript
// In a Node.js/SSR context
const typography = new Typography(theme)
typography.injectStyles() // Silently does nothing — no document object
```

Correct:

```javascript
// Client-side
typography.injectStyles()

// Server-side — use toString() and include in HTML
const css = typography.toString()
// Or use react-typography's TypographyStyle component
```

`injectStyles()` checks `typeof document !== "undefined"` and silently no-ops
in server environments. Use `toString()` for SSR, or the `TypographyStyle`
React component from `react-typography`.

Source: packages/typography/src/index.js:69-86

## Version

Targets typography v0.16.24.
