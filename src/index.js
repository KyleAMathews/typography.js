// @flow
import objectAssign from 'object-assign'
import verticalRhythm from 'compass-vertical-rhythm'
import ms from 'modularscale'

import createStyles from './utils/createStyles'
import type { OptionsType } from './Types.js'

const createStylesString = function (options) {
  const vr = verticalRhythm(options)
  const styles = createStyles(vr, options)

  return styles
}

const Typography = function (opts: OptionsType) {
  const defaults: OptionsType = {
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
    headerFontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      'Fira Sans',
      'Droid Sans',
      'Helvetica Neue',
      'sans-serif',
    ],
    bodyFontFamily: ['georgia', 'serif'],
    headerGray: 20,
    headerGrayHue: 0,
    bodyGray: 20,
    bodyGrayHue: 0,
    headerWeight: 900,
    bodyWeight: 'normal',
    boldWeight: 'bold',
    includeNormalize: true,
    fontFaces: [],
  }

  const options = objectAssign({}, defaults, opts)

  const vr = verticalRhythm(options)

  return ({
    options,
    GoogleFont: require('./components/GoogleFont')(options),
    TypographyStyle: require('./components/TypographyStyle')(() => createStylesString(options)),
    rhythm: vr.rhythm,
    createStyles () { return createStylesString(options) },
    fontSizeToPx: vr.adjustFontSizeTo,
    fontSizeToMS (scaler: number) {
      // This doesn't pick the right scale if a theme has more than one scale.
      // Perhaps add optional parameter for a width and it'll get the scale
      // for this width. Tricky part is maxWidth could be set in non-pixels.
      const baseFont = options.baseFontSize.slice(0, -2)
      const newFontSize = `${ms(scaler, options.modularScales[0].scale) * baseFont}px`
      return vr.adjustFontSizeTo(newFontSize)
    },
    toString () {
      return this.createStyles()
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
  includeNormalize: false,
}).toString())
*/
