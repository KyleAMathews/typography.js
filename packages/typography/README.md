# Typography.js
A powerful toolkit for building websites with beautiful typography.
# Typography.js [![Build Status][build-badge]][build-status] [![Coverage Status][coverage-badge]][coverage-status]
A powerful toolkit for building websites with beautiful design.

## Install
`npm install typography`

## Demo/playground
http://kyleamathews.github.io/typography.js

## Why
The goal of Typography.js is to provide a high-level elegant API for
expressing typographic design intent.

Typography is a complex *system* of interrelated styles. 100s of style
declarations on dozens of elements must be in harmonious order. Trying
one design change can mean making dozens of tedious recalculations and
CSS value changes. Creating new Typography themes with CSS feels hard.

Typography.js provides a vastly simpler way to define and
explore typography designs.

You provide configuration to the Typography.js JS api and it uses its
Typography engine to generate CSS for block and inline
elements.

Typography.js makes it easy to create designs that are unique, personal, and
custom to your project.

## Themes & Plugins
- **themes**: Typography.js themes are simple Javascript objects. As
  such they're easy to share across projects or even
  [open source and share via
NPM](https://www.npmjs.com/browse/keyword/typography-theme).
- **plugins**: Plugins are functions that extend or modify the core
  Typography engine. They can change how headers are styled
  or add specialized styles e.g. for code or tables.

## Sites that use Typography.js
* [bricolage.io](https://bricolage.io/?utm_source=github.com) ([source](https://github.com/KyleAMathews/blog/blob/master/blog-typography.coffee))
* [React Headroom](https://kyleamathews.github.io/react-headroom/) ([source](https://github.com/KyleAMathews/react-headroom/blob/master/www/utils/typography.js))
* [Gatsby Blog Starter](http://gatsbyjs.github.io/gatsby-starter-blog/) ([source](https://github.com/gatsbyjs/gatsby-starter-blog/blob/master/utils/typography.js))
* [ollieglass.com](http://ollieglass.com/)
* [Edit this file to add yours!](https://github.com/KyleAMathews/typography.js/blob/master/README.md)

## Javascript usage
```javascript
import Typography from 'typography'

const typography = new Typography({
  baseFontSize: '18px',
  baseLineHeight: 1.45,
  headerFontFamily: ['Avenir Next', 'Helvetica Neue', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
  bodyFontFamily: ['Georgia', 'serif'],
  // See below for the full list of options.
})

// Output CSS as string.
typography.toString()

// Or insert styles directly into the <head> (works well for client-only
// JS web apps.
typography.injectStyles()
```

## Themes
We maintain 30 (and counting) themes that are ready to use on your next
project. These are each published as seperate NPM packages. Explore
themes at http://kyleamathews.github.io/typography.js.

### Using themes

Here's an example of how to use the Funston theme.

1. First save the package to your project `npm install --save
   typography-theme-funston`
2. Then import and pass into Typography when initializing.

```javascript
import Typography from 'typography'
import funstonTheme from 'typography-theme-funston'

const typography = new Typography(funstonTheme)
```

### Customizing themes
Themes are just javascript objects so it's easy to modify them as
needed. For example, if you're using the Funston theme but want to
increase the base font size slightly:

```javascript
import Typography from 'typography'
import funstonTheme from 'typography-theme-funston'
funstonTheme.baseFontSize = '22px' // was 20px.

const typography = new Typography(funstonTheme)
```

Or you can use the imperative API `overrideThemeStyles` to directly set/override
styles on a theme:

```javascript
import Typography from 'typography'
import funstonTheme from 'typography-theme-funston'
funston.overrideThemeStyles = ({ rhythm }, options) => ({
  'h2,h3': {
    marginBottom: rhythm(1/2),
    marginTop: rhythm(2),
  }
})

const typography = new Typography(funstonTheme)
```

### Published Typography.js Themes
* [typography-theme-alton](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-alton/)
* [typography-theme-de-young](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-de-young/)
* [typography-theme-doelger](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-doelger/)
* [typography-theme-elk-glen](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-elk-glen/)
* [typography-theme-fairy-gates](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-fairy-gates/)
* [typography-theme-funston](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-funston/)
* [typography-theme-grand-view](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-grand-view/)
* [typography-theme-irving](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-irving/)
* [typography-theme-judah](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-judah/)
* [typography-theme-lawton](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-lawton/)
* [typography-theme-lincoln](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-lincoln/)
* [typography-theme-kirkham](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-kirkham/)
* [typography-theme-moraga](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-moraga/)
* [typography-theme-noriega](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-noriega/)
* [typography-theme-ocean-beach](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-ocean-beach/)
* [typography-theme-parnassus](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-parnassus/)
* [typography-theme-st-annes](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-st-annes/)
* [typography-theme-stow-lake](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-stow-lake/)
* [typography-theme-sutro](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-sutro/)
* [typography-theme-stern-grove](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-stern-grove/)
* [typography-theme-twin-peaks](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-twin-peaks/)
* [typography-theme-wordpress-kubrick](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wordpress-kubrick/)
* [typography-theme-wordpress-2010](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wordpress-2010/)
* [typography-theme-wordpress-2011](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wordpress-2011/)
* [typography-theme-wordpress-2012](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wordpress-2012/)
* [typography-theme-wordpress-2013](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wordpress-2013/)
* [typography-theme-wordpress-2014](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wordpress-2014/)
* [typography-theme-wordpress-2015](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wordpress-2015/)
* [typography-theme-wordpress-2016](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wordpress-2016/)
* [typography-theme-wordpress-github](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-github/)
* [typography-theme-wordpress-wikipedia](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wikipedia/)
* If you publish your own, create a PR to add it here!

## Plugins
Plugins are functions that extend or modify the core typography engine.
they can change how headers are styled or add specialized styles e.g.
for code or tables. Currently there's one plugin available,
`typography-plugin-code`.

To use the Code plugin, first install using NPM.

`npm install --save typography-plugin-code`

Then add to your theme before creating a new typography object.

```javascript
import Typography from 'typography'
import CodePlugin from 'typography-plugin-code'
import sternGroveTheme from 'typography-theme-stern-grove'

sternGroveTheme.plugins = [
  new CodePlugin(),
]

const typography = new Typography(sternGroveTheme)
```

## React.js helper components.
Typography.js includes two helper components for your React.js projects,
`TypographyStyle` and `GoogleFont`. These are ideal for
server-rendering.

* `TypographyStyle` creates a style element and inserts the generated
  CSS for your theme.
* `GoogleFont` creates the link element to include the Google Fonts &
  weights specified in your theme.

To use, first install the package `npm install --save react-typography`
then import them into your `html.js` file.

```javascript
import { TypographyStyle, GoogleFont } from 'react-typography'
// Best practice is to have a typography module
// where you define your theme.
import typography from 'utils/typography'

// Inside your React.js HTML component.
<html>
  <head>
    <TypographyStyle typography={typography} />
    <GoogleFont typography={typography} />
  </head>
  <body>
    // stuff
  </body>
</html>
```

## API

### Configuration
When creating a new instance of Typography, you can pass in an
*configuration* object. All configuration keys are optional.

* **title**: The theme title.
* **baseFontSize**: The base font size in pixels, defaults to `16px`.
* **baseLineHeight**: The base line height using the css unitless number, defaults to `1.45`.
* **scaleRatio**: The "scale ratio" for the theme. This value is the ratio
  between the `h1` font size and the `baseFontSize`. So if the scale ratio is `2`
  and the `baseFontSize` is `16px` then the `h1` font size is `32px`.
```javascript
{
  scaleRatio: 2,
}
```
* **googleFonts**: An array specifying Google Fonts for this project.
```javascript
googleFonts: [
  {
    name: 'Montserrat',
    styles: [
      '700',
    ],
  },
  {
    name: 'Merriweather',
    styles: [
      '400',
      '400i',
      '700',
      '700i',
    ],
  },
],
```
* **headerFontFamily**: An array of strings specifying the font family
  stack for headers e.g. `['Helvetica', 'sans-serif']`. Defaults to a
system UI font stack.
* **bodyFontFamily**: An array of strings specifying the font family
  stack for the body, defaults to `['georgia', 'serif']`.
* **headerColor**: A css color string to be set on headers. Defaults
  to `inherit`.
* **bodyColor**: A css color string to be set for body text. Defaults
to `hsl(0,0%,0%,0.8)`.
* **headerWeight**: Specify the font weight for headers. Defaults to
`bold`.
* **bodyWeight**: Specify the font weight for body text. Defaults to
  `normal`.
* **boldWeight**: Specify the font weight for "bold" (b, strong, dt, th)
  elements. Defaults to `bold`.
* **blockMarginBottom**: Specify the default margin-bottom for block
  elements. Defaults to one "rhythm unit" (i.e. the height of the base line height).
* **includeNormalize**: Include normalize.css.
  Normalize.css is an excellent project which works to normalize the
base browser CSS across browsers and serves as an excellent foundation
for Typography.js. We include normalize.CSS by default but if you're
already including it elsewhere in your project, you can disable
including it here by passing `false`.
* **overrideStyles**: Imperative API for directly adding to or
overriding auto-generated styles. It's called with a Vertical
Rhythm object, the options object, and the algorithmically generated
styles.

```javascript
overrideStyles: ({ adjustFontSizeTo, rhythm }, options, styles) => ({
  h1: {
    fontFamily: ['Montserrat', 'sans-serif'].join(','),
  },
  blockquote: {
    ...adjustFontSizeTo('19px'),
    color: gray(41),
    fontStyle: 'italic',
    paddingLeft: rhythm(13/16),
    marginLeft: rhythm(-1),
    borderLeft: `${rhythm(3/16)} solid ${gray(10)}`,
  },
  'blockquote > :last-child': {
    marginBottom: 0,
  },
})
```
* **overrideThemeStyles**: This has the same function signature as
`overrideStyles` but should be used in place of `overrideStyles` when
using a 3rd-party theme so as to not delete the theme's own
`overrideStyles` function.

```javascript
overrideThemeStyles: ({ rhythm }, options, styles) => ({
  'h2,h3': {
    marginBottom: rhythm(1/2),
    marginTop: rhythm(2),
  }
})
```

## Related

- [postcss-typography](https://github.com/BarryThePenguin/postcss-typography)

## Developing Typography.js
Typography.js is a monorepo facilitated by
[Lerna](https://github.com/lerna/lerna).

TODO: document constants + compass-vertical-rhythm + using typgraphy.js
for inline styles.

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/KyleAMathews/typography.js.svg

[build-status]: https://travis-ci.org/KyleAMathews/typography.js

[coverage-badge]: https://img.shields.io/codecov/c/github/KyleAMathews/typography.js.svg

[coverage-status]: https://codecov.io/github/KyleAMathews/typography.js
=======

## Backers

Support us with a monthly donation and help us continue our activities. [[Become a backer](https://opencollective.com/typographyjs#backer)]

<a href="https://opencollective.com/typographyjs/backer/0/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/0/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/1/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/1/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/2/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/2/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/3/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/3/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/4/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/4/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/5/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/5/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/6/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/6/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/7/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/7/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/8/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/8/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/9/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/9/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/10/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/10/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/11/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/11/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/12/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/12/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/13/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/13/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/14/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/14/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/15/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/15/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/16/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/16/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/17/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/17/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/18/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/18/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/19/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/19/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/20/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/20/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/21/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/21/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/22/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/22/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/23/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/23/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/24/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/24/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/25/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/25/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/26/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/26/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/27/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/27/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/28/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/28/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/29/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/29/avatar.svg"></a>

## Sponsors

Become a sponsor and get your logo on our README on Github with a link to your site. [[Become a sponsor](https://opencollective.com/typographyjs#sponsor)]

<a href="https://opencollective.com/typographyjs/sponsor/0/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/1/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/2/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/3/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/4/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/5/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/6/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/7/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/8/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/9/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/9/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/10/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/10/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/11/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/11/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/12/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/12/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/13/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/13/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/14/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/14/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/15/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/15/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/16/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/16/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/17/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/17/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/18/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/18/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/19/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/19/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/20/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/20/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/21/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/21/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/22/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/22/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/23/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/23/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/24/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/24/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/25/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/25/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/26/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/26/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/27/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/27/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/28/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/28/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/29/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/29/avatar.svg"></a>
