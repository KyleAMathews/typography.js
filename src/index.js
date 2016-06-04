import objectAssign from 'object-assign'
import verticalRhythm from 'compass-vertical-rhythm'
import ms from 'modularscale'
import isObject from 'lodash/isObject'

import createStyles from './utils/createStyles'

const createStylesString = function (options) {
  // Create styles for base theme + each subtheme.
  let vr = verticalRhythm(options)
  let styles = createStyles(vr, options)

  if ((options.subThemes != null) && isObject(options.subThemes)) {
    options.subThemes.forEach((name) => {
      const theme = options.subThemes[name]
      vr = verticalRhythm(theme)
      styles += createStyles(vr, theme, name, options)
    })
  }

  return styles
}

const Typography = function (opts) {
  const defaults = {
    baseFontSize: '18px',
    baseLineHeight: '28.5px',
    modularScales: [
      {
        scale: 'octave',
      },
      {
        scale: 'golden',
        maxWidth: '768px',
      },
    ],
    googleFonts: [],
    headerFontFamily: `
      -apple-system, BlinkMacSystemFont,
      "Segoe UI", "Roboto", "Oxygen",
      "Ubuntu", "Cantarell", "Fira Sans",
      "Droid Sans", "Helvetica Neue", sans-serif;`,
    bodyFontFamily: 'georgia, serif',
    headerGray: 20,
    headerGrayHue: 0,
    bodyGray: 20,
    bodyGrayHue: 0,
    headerWeight: 700,
    bodyWeight: 400,
    boldWeight: 700,
    fontFaces: [],
  }

  const options = objectAssign(defaults, opts)

  if ((options.subThemes != null) && isObject(options.subThemes)) {
    options.subThemes.forEach((name) => {
      const theme = options.subThemes[name]
      options.subThemes[name] = objectAssign({}, options, theme, { rhythmUnit: 'px' })
    })
  }

  const vr = verticalRhythm(options)

  return ({
    options,
    GoogleFont: require('./components/GoogleFont')(options),
    TypographyStyle: require('./components/TypographyStyle')(() => createStylesString(options)),
    rhythm: vr.rhythm,
    createStyles () { return createStylesString(options) },
    fontSizeToPx: vr.adjustFontSizeTo,
    fontSizeToMS (scaler) {
      // TODO detect which modular scale to use based on current screen width.
      // or better, this should just generate styles and insert them in head
      // with media queries? Perhaps do something similar to CSS Modules
      // where this just returns a custom class name that you add to your
      // component.
      const baseFont = options.baseFontSize.slice(0, -2)
      const newFontSize = `${ms(scaler, options.modularScales[0].scale) * baseFont}px`
      return vr.adjustFontSizeTo(newFontSize)
    },
    injectStyles () {
      if (typeof document !== 'undefined') {
        // Replace existing
        if (document.getElementById('typography.js')) {
          const styleNode = document.getElementById('typography.js')
          styleNode.innerHTML = createStylesString(options)
        } else {
          const node = document.createElement('style')
          node.id = 'typography.js'
          node.innerHTML = createStylesString(options)
          document.head.appendChild(node)
        }
      }
    },
  })
}

module.exports = Typography

/*
console.log(Typography({
  baseFontSize: '16px',
  subThemes: {
    blog: {
      baseFontSize: '18px',
      bodyFontFamily: 'Open Sans',
    },
  },
}).createStyles())
*/
