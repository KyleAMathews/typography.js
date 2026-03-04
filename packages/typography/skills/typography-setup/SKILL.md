---
name: typography-setup
description: >
  Getting started with typography.js: installing packages, creating a Typography
  instance, injecting styles. Use when user says "set up typography.js", "install
  typography", "get started with typography.js", "add typography to my project",
  "how do I use typography.js with React", or "server-side render typography".
  Covers npm/pnpm/yarn install, Typography() with options or themes, client-side
  injectStyles(), and React SSR with TypographyStyle and GoogleFont components.
type: lifecycle
library: typography
library_version: "0.16.24"
sources:
  - "KyleAMathews/typography.js:README.md"
  - "KyleAMathews/typography.js:packages/typography/src/index.js"
  - "KyleAMathews/typography.js:packages/react-typography/src/index.js"
  - "KyleAMathews/typography.js:packages/react-typography/src/TypographyStyle.js"
  - "KyleAMathews/typography.js:packages/react-typography/src/GoogleFont.js"
---

# Typography.js — Setup & Installation

For the conceptual foundations (vertical rhythm, modular scale, CSS generation
pipeline), see typography-core/SKILL.md. For the full API reference (all options,
rhythm/scale methods, themes, plugins, responsive), see typography-core/usage/SKILL.md.

## Setup

### Install core package

```bash
npm install typography
```

### Minimum client-side setup

```javascript
import Typography from "typography"

const typography = new Typography({
  baseFontSize: "18px",
  baseLineHeight: 1.45,
  headerFontFamily: ["Avenir Next", "Helvetica Neue", "sans-serif"],
  bodyFontFamily: ["Georgia", "serif"],
})

typography.injectStyles()
```

This inserts a `<style id="typography.js">` tag as the first child of
`<head>`. Calling `injectStyles()` again replaces the existing styles
(it checks for the existing element by ID).

### Setup with a theme

```bash
npm install typography typography-theme-funston
```

```javascript
import Typography from "typography"
import funstonTheme from "typography-theme-funston"

const typography = new Typography(funstonTheme)
typography.injectStyles()
```

To customize a theme, spread it and override properties:

```javascript
import Typography from "typography"
import funstonTheme from "typography-theme-funston"

const typography = new Typography({
  ...funstonTheme,
  baseFontSize: "22px",
  overrideThemeStyles: ({ rhythm }) => ({
    h2: { marginBottom: rhythm(0.5) },
  }),
})

typography.injectStyles()
```

### Server-side rendering with React

```bash
npm install typography react-typography
```

```javascript
import Typography from "typography"
import { TypographyStyle, GoogleFont } from "react-typography"
import funstonTheme from "typography-theme-funston"

const typography = new Typography(funstonTheme)

function HTML() {
  return (
    <html>
      <head>
        <TypographyStyle typography={typography} />
        <GoogleFont typography={typography} />
      </head>
      <body>
        {/* page content */}
      </body>
    </html>
  )
}
```

`TypographyStyle` renders a `<style id="typography.js">` tag containing
the full CSS output from `typography.toString()`.

`GoogleFont` renders a `<link>` tag pointing to the Google Fonts API based on
the `googleFonts` array in options. If `googleFonts` is empty or not set, it
renders nothing (`null`).

### SSR without React

```javascript
import Typography from "typography"

const typography = new Typography({ baseFontSize: "18px" })
const css = typography.toString()

// Insert into your HTML template
const html = `<html><head><style id="typography.js">${css}</style></head>...</html>`
```

## Core Patterns

### Shared typography module

Create a single module that exports the configured instance for use across
your application. See typography-core/SKILL.md § Vertical Rhythm for how
`rhythm()` and `scale()` work:

```javascript
// src/utils/typography.js
import Typography from "typography"
import funstonTheme from "typography-theme-funston"

const typography = new Typography(funstonTheme)

export default typography
export const rhythm = typography.rhythm
export const scale = typography.scale
```

```javascript
// src/components/Header.js
import { rhythm, scale } from "../utils/typography"

const headerStyle = {
  marginBottom: rhythm(1.5),
  ...scale(1),
}
```

### Available theme packages

For theme customization, `overrideThemeStyles`, and the theme composition model,
see typography-core/usage/SKILL.md § Themes and typography-core/SKILL.md § Theme Composition.

All themes follow the naming pattern `typography-theme-[name]`:

`alton`, `bootstrap`, `de-young`, `doelger`, `elk-glen`, `fairy-gates`,
`funston`, `github`, `grand-view`, `irving`, `judah`, `kirkham`, `lawton`,
`legible`, `lincoln`, `moraga`, `noriega`, `ocean-beach`, `parnassus`,
`st-annes`, `stardust`, `stern-grove`, `stow-lake`, `sutro`, `twin-peaks`,
`us-web-design-standards`, `wikipedia`, `wordpress-2010` through `wordpress-2016`,
`wordpress-kubrick`

## Common Mistakes

### HIGH Forgetting to call injectStyles() or include TypographyStyle

Wrong:

```javascript
import Typography from "typography"

const typography = new Typography({ baseFontSize: "18px" })
// No styles applied — forgot to inject
```

Correct:

```javascript
import Typography from "typography"

const typography = new Typography({ baseFontSize: "18px" })
typography.injectStyles()
```

Creating a Typography instance only computes the styles. You must call
`injectStyles()` (client) or use `TypographyStyle` (React SSR) or
`toString()` (other SSR) to actually apply them.

Source: packages/typography/src/index.js:68-86

### HIGH Importing react-typography in a non-React project

Wrong:

```javascript
import { TypographyStyle } from "react-typography"
// In a vanilla JS project — react-typography depends on React and PropTypes
```

Correct:

```javascript
import Typography from "typography"

const typography = new Typography(theme)
const css = typography.toString()
document.head.insertAdjacentHTML("afterbegin", `<style id="typography.js">${css}</style>`)
```

`react-typography` imports `React` and `prop-types`. In non-React projects,
use `toString()` and insert the CSS string directly.

Source: packages/react-typography/src/TypographyStyle.js:1-2

### MEDIUM Mutating a theme import instead of spreading

Wrong:

```javascript
import theme from "typography-theme-funston"
theme.baseFontSize = "22px"
const typography = new Typography(theme)
```

Correct:

```javascript
import theme from "typography-theme-funston"
const typography = new Typography({
  ...theme,
  baseFontSize: "22px",
})
```

Mutating the imported theme object changes the module's cached export, affecting
all other files that import the same theme in the same process.

Source: packages/typography/src/index.js:40

## Version

Targets typography v0.16.24.
