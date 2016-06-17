// @flow
import gray from 'gray-percentage'
import type { OptionsType } from '../Types.js'

const theme: OptionsType = {
  baseFontSize: '16px',
  baseLineHeight: '28px',
  modularScales: [
    {
      scale: 'major tenth',
    },
    {
      scale: 'octave',
      maxWidth: '768px',
    },
  ],
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
  headerFontFamily: '"Merriweather", "Georgia", serif',
  bodyFontFamily: '"Merriweather", "Georgia", serif',
  headerGray: 10,
  bodyGray: 10,
  headerWeight: 900,
  bodyWeight: 400,
  boldWeight: 700,
  escapeHatch: (styles, setStyles, { adjustFontSizeTo, rhythm }, options) => {
    let newStyles = setStyles(styles, 'h1', {
      fontFamily: '"Montserrat",sans-serif',
    })
    newStyles = setStyles(styles, 'blockquote', {
      ...adjustFontSizeTo('19px'),
      color: gray(41),
      fontStyle: 'italic',
      paddingLeft: rhythm(13/16),
      marginLeft: rhythm(-1),
      borderLeft: `${rhythm(3/16)} solid ${gray(10)}`,
    })
    newStyles = setStyles(styles, 'blockquote > :last-child', {
      marginBottom: 0,
    })
    newStyles = setStyles(styles, 'blockquote cite', {
      ...adjustFontSizeTo(options.baseFontSize),
      color: gray(options.bodyGray),
      fontStyle: 'normal',
    })
    newStyles = setStyles(styles, 'blockquote cite:before', {
      content: '"— "',
    })
    newStyles = setStyles(styles, ['ul', 'ol'], {
      marginLeft: 0,
    })
    newStyles = setStyles(newStyles, ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'], {
      marginTop: rhythm(2),
    })
    newStyles = setStyles(newStyles, 'h4', {
      letterSpacing: '0.140625em',
      textTransform: 'uppercase',
    })
    newStyles = setStyles(newStyles, 'h6', {
      fontStyle: 'italic',
    })
    newStyles = setStyles(styles, ['a'], {
      boxShadow: '0 1px 0 0 currentColor',
      color: '#007acc',
      textDecoration: 'none',
    })
    newStyles = setStyles(styles, ['a:hover', 'a:active'], {
      boxShadow: 'none',
    })
    newStyles = setStyles(styles, ['mark', 'ins'], {
      background: '#007acc',
      color: 'white',
      padding: `${rhythm(1/16)} ${rhythm(1/8)}`,
      textDecoration: 'none',
    })

    return newStyles
  },
}

export default theme
