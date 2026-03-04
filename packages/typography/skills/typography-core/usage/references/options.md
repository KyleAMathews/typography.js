# Typography.js — Complete Options Reference

## All options with defaults

```javascript
{
  title: undefined,                    // Theme name string (informational only)
  baseFontSize: "16px",               // Root font size — all rhythm derives from this
  baseLineHeight: 1.45,               // Unitless multiplier — rhythm unit = baseFontSize × this
  headerLineHeight: 1.1,              // Line height for h1-h6 (overrides rhythm-calculated value)
  scaleRatio: 2,                      // Modular scale ratio for heading sizes
  googleFonts: [],                    // Array of { name: string, styles: string[] }
  headerFontFamily: ["-apple-system", "BlinkMacSystemFont", "Segoe UI",
    "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans",
    "Droid Sans", "Helvetica Neue", "sans-serif"],
  bodyFontFamily: ["georgia", "serif"],
  headerColor: "inherit",
  bodyColor: "hsla(0,0%,0%,0.8)",
  headerWeight: "bold",               // h1-h6 font-weight
  bodyWeight: "normal",               // body font-weight
  boldWeight: "bold",                 // b, strong, dt, th font-weight
  includeNormalize: true,             // Prepend normalize.css v4.1.1 to output
  blockMarginBottom: 1,               // Bottom margin in rhythm units (number) or CSS string
  overrideStyles: undefined,          // (vr, options, styles) => styleObject
  overrideThemeStyles: undefined,     // (vr, options, styles) => styleObject — runs LAST
  plugins: undefined,                 // Array of plugin instances
}
```

## Option details

### baseFontSize

String with unit. Parsed to integer internally for scale calculations.
Default: `"16px"`.

### baseLineHeight

Unitless number. The rhythm unit is `parseInt(baseFontSize) × baseLineHeight`.
Default: `1.45`.

### headerLineHeight

Unitless number. Applied directly to h1-h6 elements, overriding the line height
that `scale()` would calculate. Default: `1.1`.

### scaleRatio

Number. Controls the modular scale for heading sizes. Formula:
`fontSize = baseFontSize × scaleRatio^n`. Default: `2`.

| scaleRatio | Feel | h1 size (16px base) |
|------------|------|---------------------|
| 1.2        | Tight, minimal contrast | ~19px |
| 1.618      | Golden ratio, classic | ~26px |
| 2          | Default, clear hierarchy | 32px |
| 2.5        | Dramatic, editorial | ~40px |
| 3          | Very dramatic | 48px |

### googleFonts

Array of `{ name: string, styles: string[] }`. The `GoogleFont` React component
uses this to generate a Google Fonts API URL. Example:

```javascript
googleFonts: [
  { name: "Montserrat", styles: ["400", "700"] },
  { name: "Merriweather", styles: ["400", "400i", "700"] },
]
// URL: //fonts.googleapis.com/css?family=Montserrat:400,700|Merriweather:400,400i,700
```

### headerFontFamily / bodyFontFamily

Arrays of font name strings. Automatically quoted in CSS output except for
generic families (`serif`, `sans-serif`, `monospace`, `fantasy`, `cursive`,
`inherit`, `default`, `-apple-system`) and CSS variables (`var(...)`).

### headerColor / bodyColor

CSS color strings. `headerColor` defaults to `"inherit"` (inherits from body).
`bodyColor` defaults to `"hsla(0,0%,0%,0.8)"` (slightly transparent black).

### headerWeight / bodyWeight / boldWeight

Font weight values (number or string). `headerWeight` is applied to h1-h6,
`bodyWeight` to body, `boldWeight` to `b`, `strong`, `dt`, `th`.

### includeNormalize

Boolean. When true, normalize.css v4.1.1 is prepended to the CSS string output
from `toString()`. Does not affect `toJSON()`. Default: `true`.

### blockMarginBottom

Number (rhythm units) or string (CSS value). Applied as `marginBottom` to all
block elements: h1-h6, p, ul, ol, dl, dd, figure, pre, table, fieldset,
blockquote, form, noscript, iframe, img, hr, address.

When a number: `rhythm(blockMarginBottom)` is used.
When a string: used as-is as the CSS value.
Default: `1`.

### overrideStyles

Function `(vr, options, styles) => styleObject`. Called after plugins.
The returned object is merged via `lodash.merge()`.

### overrideThemeStyles

Function `(vr, options, styles) => styleObject`. Called last — after plugins
and overrideStyles. Has final say for any overlapping properties.

### plugins

Array of plugin instances. Each plugin is called in order with
`(vr, options, currentStyles)` and its return value is merged via
`lodash.merge()`.

## Breakpoint constants

From the `typography-breakpoint-constants` package:

```
MOBILE_WIDTH:  "480px"   MOBILE_MEDIA_QUERY:  "@media only screen and (max-width:480px)"
TABLET_WIDTH:  "768px"   TABLET_MEDIA_QUERY:  "@media only screen and (max-width:768px)"
DEFAULT_WIDTH: "980px"   DEFAULT_MEDIA_QUERY: "@media only screen and (max-width:980px)"
LARGE_DISPLAY_WIDTH:  "1280px"  LARGE_DISPLAY_MEDIA_QUERY:  "@media only screen and (max-width:1280px)"
LARGER_DISPLAY_WIDTH: "1600px"  LARGER_DISPLAY_MEDIA_QUERY: "@media only screen and (max-width:1600px)"

MIN_ variants use min-width:
MIN_MOBILE_MEDIA_QUERY:  "@media (min-width:480px)"
MIN_TABLET_MEDIA_QUERY:  "@media (min-width:768px)"
MIN_DEFAULT_MEDIA_QUERY: "@media (min-width:980px)"
MIN_LARGE_DISPLAY_MEDIA_QUERY:  "@media (min-width:1280px)"
MIN_LARGER_DISPLAY_MEDIA_QUERY: "@media (min-width:1600px)"
```
