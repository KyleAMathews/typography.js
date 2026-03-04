---
name: typography-core/usage
description: >
  Complete API guide for typography.js. Use when user asks "how do I configure
  typography.js", "what options does Typography accept", "how do I use a theme",
  "how do I create a plugin", "how do I override styles", "how do I add responsive
  typography", "how do I use rhythm()", "how do I use scale()", or needs practical
  guidance on OptionsType (baseFontSize, baseLineHeight, scaleRatio, font families,
  colors, weights), CSS output (toString, toJSON, injectStyles), themes, plugins,
  overrideStyles/overrideThemeStyles, CSS variables, breakpoint constants, or
  React TypographyStyle/GoogleFont components.
type: sub-skill
library: typography
library_version: "0.16.24"
requires:
  - typography-core
sources:
  - "KyleAMathews/typography.js:packages/typography/src/index.js"
  - "KyleAMathews/typography.js:packages/typography/src/utils/createStyles.js"
  - "KyleAMathews/typography.js:packages/typography/src/utils/compileStyles.js"
  - "KyleAMathews/typography.js:packages/react-typography/src/TypographyStyle.js"
  - "KyleAMathews/typography.js:packages/react-typography/src/GoogleFont.js"
  - "KyleAMathews/typography.js:packages/typography-plugin-code/src/index.js"
  - "KyleAMathews/typography.js:packages/typography-breakpoint-constants/src/index.js"
---

This skill builds on typography-core. Read it first for vertical rhythm math,
modular scale, the CSS generation pipeline, and theme/plugin mental models.

# Typography.js — Usage & API Guide

## Setup

For installation and getting started (npm install, first setup, React SSR
wiring), see typography-setup/SKILL.md.

```javascript
import Typography from "typography"

const typography = new Typography({
  baseFontSize: "18px",
  baseLineHeight: 1.45,
  scaleRatio: 2,
  headerFontFamily: ["Avenir Next", "Helvetica Neue", "sans-serif"],
  bodyFontFamily: ["Georgia", "serif"],
})
```

## Configuration Options

Key options (see [references/options.md](references/options.md) for the complete
list with defaults):

- **`baseFontSize`** (`"16px"`) — Root font size. All rhythm derives from this.
- **`baseLineHeight`** (`1.45`) — Unitless multiplier. Rhythm unit = baseFontSize × this.
- **`scaleRatio`** (`2`) — Modular scale ratio for heading sizes.
- **`headerFontFamily`** / **`bodyFontFamily`** — Font name arrays. Automatically
  quoted except generic families and `var()` values.
- **`googleFonts`** — Array of `{ name, styles }` for Google Fonts loading.
- **`headerColor`**, **`bodyColor`**, **`headerWeight`**, **`bodyWeight`**, **`boldWeight`** — Styling defaults.
- **`blockMarginBottom`** (`1`) — Bottom margin in rhythm units (number) or CSS string.
- **`includeNormalize`** (`true`) — Prepend normalize.css v4.1.1 to output.
- **`overrideStyles`** — `(vr, options, styles) => styleObject`. Runs after plugins.
- **`overrideThemeStyles`** — Same signature. Runs last (after overrideStyles).
- **`plugins`** — Array of plugin instances.

## Vertical Rhythm Methods

For the underlying math (how rhythm units and modular scale are calculated),
see typography-core/SKILL.md § Vertical Rhythm and § Modular Scale.

### rhythm(value)

Returns a CSS pixel string for vertical spacing:

```javascript
const typography = new Typography({ baseFontSize: "16px", baseLineHeight: 1.45 })

typography.rhythm(1)    // "23.2px"
typography.rhythm(0.5)  // "11.6px"
typography.rhythm(2)    // "46.4px"
```

### scale(value)

Returns `{ fontSize, lineHeight }` for a modular scale step:

```javascript
const typography = new Typography({ baseFontSize: "16px", scaleRatio: 2 })

typography.scale(1)     // { fontSize: "32px", lineHeight: ... }
typography.scale(0.5)   // { fontSize: "22.627px", lineHeight: ... }
typography.scale(0)     // { fontSize: "16px", lineHeight: ... }
typography.scale(-0.5)  // { fontSize: "11.314px", lineHeight: ... }
```

Use spread to apply both properties:

```javascript
const heroStyle = {
  ...typography.scale(1.5),
  fontFamily: "Georgia, serif",
}
```

### adjustFontSizeTo(size)

Given a CSS size string, returns `{ fontSize, lineHeight }` where the line
height preserves the baseline grid:

```javascript
typography.adjustFontSizeTo("24px")  // { fontSize: "1.5rem", lineHeight: ... }
typography.adjustFontSizeTo("85%")   // Used internally for code/pre elements
```

### linesForFontSize(size)

Returns the number of rhythm lines a font size spans:

```javascript
typography.linesForFontSize("32px")  // e.g. 2 (needs 2 rhythm lines)
```

### establishBaseline()

Returns `{ fontSize, lineHeight }` for the root `<html>` element. Used
internally to set the document baseline.

## CSS Output

### toString()

Returns the complete CSS as a string, including normalize.css if enabled:

```javascript
const css = typography.toString()
// normalize.css + all typography rules as a CSS string
```

### toJSON()

Returns the styles as a nested JavaScript object (useful for CSS-in-JS):

```javascript
const styles = typography.toJSON()
// { html: { font: "...", boxSizing: "..." }, body: { ... }, h1: { ... }, ... }
```

Keys are CSS selectors, values are objects of camelCase CSS properties.

### injectStyles()

Client-side only. Inserts or replaces a `<style id="typography.js">` tag
as the first child of `<head>`:

```javascript
typography.injectStyles()
```

Silently does nothing if `document` is undefined (SSR environments).

### createStyles()

Deprecated alias for `toString()`. Will be removed in a future breaking release.

## Themes

### Using a theme

```javascript
import Typography from "typography"
import sternGroveTheme from "typography-theme-stern-grove"

const typography = new Typography(sternGroveTheme)
```

### Customizing a theme

Spread the theme and override specific properties:

```javascript
import Typography from "typography"
import sternGroveTheme from "typography-theme-stern-grove"

const typography = new Typography({
  ...sternGroveTheme,
  baseFontSize: "20px",
  scaleRatio: 2.5,
})
```

### overrideThemeStyles

Add or replace CSS rules after the theme's own styles. This function runs
last in the pipeline (after plugins and overrideStyles):

```javascript
import Typography from "typography"
import sternGroveTheme from "typography-theme-stern-grove"

const typography = new Typography({
  ...sternGroveTheme,
  overrideThemeStyles: ({ rhythm, scale }, options, styles) => ({
    "h2,h3": {
      marginBottom: rhythm(0.5),
      marginTop: rhythm(2),
    },
    a: {
      color: "#007acc",
      textDecoration: "none",
    },
  }),
})
```

The function receives:
- **`vr`** (first arg) — object with `rhythm()`, `scale()`, `adjustFontSizeTo()`
- **`options`** — the merged configuration
- **`styles`** — current style object (read-only reference)

Returns a style object that is merged via `lodash.merge()`.

## Plugins

### Using a plugin

```javascript
import Typography from "typography"
import CodePlugin from "typography-plugin-code"
import sternGroveTheme from "typography-theme-stern-grove"

const typography = new Typography({
  ...sternGroveTheme,
  plugins: [new CodePlugin()],
})
```

### Creating a custom plugin

A plugin is a factory that returns a function:

```javascript
const HighlightPlugin = (highlightColor = "#ffffcc") =>
  ({ rhythm }, options) => ({
    mark: {
      backgroundColor: highlightColor,
      padding: `${rhythm(1 / 8)} ${rhythm(1 / 4)}`,
      borderRadius: "2px",
    },
    ".highlighted": {
      backgroundColor: highlightColor,
    },
  })

const typography = new Typography({
  plugins: [HighlightPlugin("#e0f7fa")],
})
```

The inner function receives `(vr, options, currentStyles)` and returns a
style object merged into the output via `lodash.merge()`.

### Plugin execution order

Plugins run in array order. If two plugins set the same property, the later
one wins. After all plugins, `overrideStyles` runs, then `overrideThemeStyles`.

## Responsive Typography

### Breakpoint constants

Import from `typography-breakpoint-constants` (see
[references/options.md](references/options.md) for the full list):

```javascript
import {
  MOBILE_MEDIA_QUERY,
  TABLET_MEDIA_QUERY,
  MIN_TABLET_MEDIA_QUERY,
} from "typography-breakpoint-constants"
```

### Responsive overrides

Use media query strings as keys in `overrideStyles`:

```javascript
import { MOBILE_MEDIA_QUERY } from "typography-breakpoint-constants"

const typography = new Typography({
  baseFontSize: "18px",
  overrideStyles: ({ rhythm }) => ({
    [MOBILE_MEDIA_QUERY]: {
      html: { fontSize: "14px" },
      blockquote: { marginLeft: rhythm(0.5), marginRight: rhythm(0.5) },
    },
  }),
})
```

The media query string becomes a CSS selector in the compiled output, and
`compileStyles` handles the nesting correctly.

## React Components

### TypographyStyle

Renders a `<style id="typography.js">` tag containing `typography.toString()`:

```javascript
import { TypographyStyle } from "react-typography"
import typography from "../utils/typography"

function Head() {
  return (
    <head>
      <TypographyStyle typography={typography} />
    </head>
  )
}
```

Props: `{ typography: Typography }` (required)

### GoogleFont

Renders a `<link>` to the Google Fonts API based on the `googleFonts` option.
Returns `null` if no Google Fonts are configured:

```javascript
import { GoogleFont } from "react-typography"
import typography from "../utils/typography"

function Head() {
  return (
    <head>
      <GoogleFont typography={typography} />
    </head>
  )
}
```

Props: `{ typography: Typography }` (required)

The component constructs the URL by joining font names (spaces replaced
with `+`) and styles with commas, separated by `|`:

```
//fonts.googleapis.com/css?family=Montserrat:400,700|Merriweather:400,400i
```

## Common Mistakes

### HIGH Using overrideStyles when overrideThemeStyles is needed

Wrong:

```javascript
import theme from "typography-theme-funston"

const typography = new Typography({
  ...theme,
  overrideStyles: ({ rhythm }) => ({
    blockquote: { marginLeft: rhythm(2) },
  }),
})
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

Execution order: plugins → `overrideStyles` → `overrideThemeStyles`. If a theme
defines `overrideThemeStyles`, those run after `overrideStyles` and win for
overlapping properties. Use `overrideThemeStyles` for final control.

Source: packages/typography/src/utils/createStyles.js:263-280

### HIGH Using scale() as a value instead of spreading it

Wrong:

```javascript
overrideStyles: ({ scale }) => ({
  ".hero-text": { fontSize: scale(1.5) },
})
```

Correct:

```javascript
overrideStyles: ({ scale }) => ({
  ".hero-text": { ...scale(1.5) },
})
```

`scale()` returns `{ fontSize, lineHeight }`. Assigning the object directly
to a single property produces `[object Object]` in CSS. Spread to apply both
properties, or destructure to use only `fontSize`.

Source: packages/typography/src/index.js:47-54

### HIGH Plugin factory not called

Wrong:

```javascript
import CodePlugin from "typography-plugin-code"

const typography = new Typography({
  plugins: [CodePlugin],
})
```

Correct:

```javascript
import CodePlugin from "typography-plugin-code"

const typography = new Typography({
  plugins: [new CodePlugin()],
})
```

`CodePlugin` is a factory function that returns the actual plugin function.
Passing the factory directly means the plugin pipeline receives a function
that returns a function, not a style object. Call the factory first.

Source: packages/typography-plugin-code/src/index.js:7-50

### MEDIUM Arithmetic on rhythm() return values

Wrong:

```javascript
overrideStyles: ({ rhythm }) => ({
  section: { padding: rhythm(1) + " " + rhythm(2) },
})
// Results in "23.2px 46.4px" — works but fragile
// This fails: rhythm(1) * 2 → NaN (string × number)
```

Correct:

```javascript
overrideStyles: ({ rhythm }) => ({
  section: { padding: `${rhythm(1)} ${rhythm(2)}` },
})
// Or for computed values:
overrideStyles: ({ rhythm }) => ({
  section: { paddingTop: rhythm(1), paddingBottom: rhythm(2) },
})
```

`rhythm()` returns a string (`"23.2px"`). Use template literals for compound
values. For computed spacing, pass the math to `rhythm()` directly:
`rhythm(1.5)` instead of trying to add `rhythm(1)` and `rhythm(0.5)`.

Source: compass-vertical-rhythm dependency

## References

- [Complete option reference and breakpoint constants](references/options.md)

## Version

Targets typography v0.16.24.
