# Typography.js
An opinionated toolkit for building websites with beautiful typography.

## Install
`npm install typography`

## Demo/playground
http://kyleamathews.github.io/typography.js

## Why
Typography is a dash of design sense and a cup full of math. Math that's
tedious and hard to do right in CSS.

Typography.js provides a *declarative* way to define your typography. Now creating custom beautiful typography designs is easy!

## Usage
```javascript
import Typography from 'typography'

const typography = new Typography()
```

## Typography.js Themes
We maintain 14 (and counting) themes that are ready to use on your next
project. These are each published as seperate NPM packages. To use, for
example, the Funston theme:

1. First save the package to your project `npm install --save
   typography-theme-funston`
2. Then import and pass into Typography when initializing.

```javascript
import Typography from 'typography'
import Funston from 'typography-theme-funston'

const typography = new Typography(Funston)
```

### Published Typography.js Themes
* [typography-theme-funston](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-funston/src/index.js)
* [typography-theme-irving](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-irving/src/index.js)
* [typography-theme-moraga](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-moraga/src/index.js)
* [typography-theme-wordpress-kubrick](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wordpress-kubrick/src/index.js)
* [typography-theme-wordpress-2010](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wordpress-2010/src/index.js)
* [typography-theme-wordpress-2011](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wordpress-2011/src/index.js)
* [typography-theme-wordpress-2012](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wordpress-2012/src/index.js)
* [typography-theme-wordpress-2013](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wordpress-2013/src/index.js)
* [typography-theme-wordpress-2014](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wordpress-2014/src/index.js)
* [typography-theme-wordpress-2015](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wordpress-2015/src/index.js)
* [typography-theme-wordpress-2016](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wordpress-2016/src/index.js)
* [typography-theme-wordpress-boingboing](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-boingboing/src/index.js)
* [typography-theme-wordpress-github](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-github/src/index.js)
* [typography-theme-wordpress-wikipedia](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wikipedia/src/index.js)
* If you publish your own, create a PR to add it here!

## React.js helper components.
Typography.js includes two helper components for your React.js projects, `TypographyStyle` and `GoogleFont`.

* `TypographyStyle` creates a style element and inserts the generated css for your theme.
* `GoogleFont` creates the link element to include the Google Fonts &
  weights specified in your theme.

To use, first install the package `npm install --save typography-react` then import them into your `html.js` file.

```javascript
import { TypographyStyle, GoogleFont } from 'typography-react'
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
When creating a new instance of Typography, you can pass in an *configuration* object. All configuration keys are optional.

* **baseFontSize**: The base font size in pixels, defaults to "16px"
* **baseLineHeight**: The base line height in pixels, defaults to "24px".
* **modularScales**: An array of modular scales.
```javascript
[
  {
    scale: 'octave',
  },
  {
    scale: 'golden',
    maxWidth: '768px',
  },
]
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
      '900',
      '900i',
    ],
  },
],
```
* **headerFontFamily**: An array of strings specifying the font family stack for headers e.g. `['Helvetica', 'sans-serif']`. Defaults to a system UI font stack.
* **bodyFontFamily**: An array of strings specifying the font family stack for the body, defaults to `['georgia', 'serif']`.
* **headerGray**: The "lightness" value for headers (in hsl). Defaults to 20.
* **headerGrayHue**: The "hue" value for headers (in hsl). Defaults to 0. Also accepts three named hues, "cool", "slate", and "warm".
* **bodyGray**: The "lightness" value for body text (in hsl). Defaults to 20.
* **bodyGrayHue**: The "hue" value for body text (in hsl). Defaults to 0. Also accepts three named hues, "cool", "slate", and "warm".
* **headerWeight**: Specify the font weight for headers. Defaults to 900.
* **bodyWeight**: Specify the font weight for body text. Defaults to 'normal'.
* **boldWeight**: Specify the font weight for bold (b, strong, dt, th) elements. Defaults to "bold".
* **fontFaces**: Specify custom font faces.
```javascript
fontFaces: [
  {
    fontFamily: 'DinNextRounded'
    fontWeight: 700
    src: [
      "url(http://example.com/dinbold.eot?#iefix) format(embedded-opentype),url(http://example.com/dinbold.woff) format(woff),url(http://example.com/dinbold.ttf) format(truetype),url(http://example.com/dinbold.svg) format(svg)"
    ]
  }
]
```
* **blockMarginBottom**: Specify the default margin-bottom for block elements. Defaults to one "rhythm unit" or the base line height.
* **includeNormalize**: Include in generated css normalize.css. Normalize.css is an excellent project which works to normalize the base css across browsers and serves as an excellent foundation for Typography.js. We include normalize.css by default but if you're already including it elsewhere in your project, you can disable including it here by passing `false`.
* **overrideStyles**: Function where you can add to or override
  auto-generated css.

```javascript
overrideStyles: ({ adjustFontSizeTo, rhythm }, options) => ({
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
  'blockquote cite': {
    ...adjustFontSizeTo(options.baseFontSize),
    color: gray(options.bodyGray),
    fontStyle: options.bodyWeight,
  },
  'blockquote cite:before': {
    content: '"— "',
  },
  'ul,ol': {
    marginLeft: 0,
  },
  [MOBILE_MEDIA_QUERY]: {
    'ul,ol': {
      marginLeft: rhythm(1),
    },
    blockquote: {
      marginLeft: rhythm(-1/2),
      marginRight: 0,
    },
  },
})
```

## Developing Typography.js
Typography.js is a monorepo facilitated by
[Lerna](https://github.com/lerna/lerna).

TODO: document constants + compass-vertical-rhythm + using
typgraphy.js for inline styles.
