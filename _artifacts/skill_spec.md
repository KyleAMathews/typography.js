# Typography.js — Skill Specification

## Library Identity

- **Name:** typography.js
- **Repository:** https://github.com/KyleAMathews/typography.js
- **Purpose:** Generate harmonious CSS typography from a small set of configuration values using vertical rhythm and modular scale mathematics.

## Scope

Skills cover two packages:

1. **`typography`** — Core engine (configuration, CSS generation, vertical rhythm, modular scale, themes, plugins)
2. **`react-typography`** — React SSR helpers (`TypographyStyle`, `GoogleFont`)

Theme packages (`typography-theme-*`) are data-only and referenced within skills, not given their own.

## Key Terminology

| Term | Definition |
|------|-----------|
| **Rhythm unit** | `baseFontSize × baseLineHeight` — the fundamental vertical spacing unit |
| **Modular scale** | A ratio (`scaleRatio`, default: 2) that determines heading size progression |
| **Vertical rhythm** | System where all vertical spacing aligns to a baseline grid |
| **Theme** | Plain JS object conforming to `OptionsType` — a complete typographic preset |
| **Plugin** | Function receiving `(verticalRhythm, options, styles)` that returns additional CSS rules |
| **Override styles** | `overrideStyles` / `overrideThemeStyles` — functions for final CSS customization |

## API Surface

### Core (`typography` package)

**Constructor:** `Typography(options)` → instance

**Instance methods:**
- `toString()` — CSS string
- `toJSON()` — Nested JS style object
- `injectStyles()` — Insert `<style>` into DOM
- `rhythm(value)` — Spacing in rhythm units
- `scale(value)` — Font-size/line-height at a scale step
- `adjustFontSizeTo(size)` — Recalculate line height for a size
- `linesForFontSize(size)` — Rhythm lines for a font size
- `establishBaseline()` — Baseline font-size and line-height

**Options:** `baseFontSize`, `baseLineHeight`, `scaleRatio`, `headerFontFamily`, `bodyFontFamily`, `googleFonts`, `headerColor`, `bodyColor`, `headerWeight`, `bodyWeight`, `boldWeight`, `blockMarginBottom`, `includeNormalize`, `overrideStyles`, `overrideThemeStyles`, `plugins`

### React (`react-typography` package)

- `<TypographyStyle typography={typography} />` — Renders `<style>` tag
- `<GoogleFont typography={typography} />` — Renders Google Fonts `<link>` tag

## Skill Authoring Guidelines

- Use the library's actual API in examples (`Typography()`, `rhythm()`, `scale()`)
- Always show `import` statements appropriate to the package
- For vertical rhythm, include concrete pixel math to make it tangible
- React skills should show the SSR `<head>` placement pattern
- Reference `typography-breakpoint-constants` for responsive patterns
