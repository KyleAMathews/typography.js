// @flow
import gray from 'gray-percentage'
import type { OptionsType } from '../Types.js'
import verticalRhythm from 'compass-vertical-rhythm'

const theme: OptionsType = {
  baseFontSize: '16px',
  baseLineHeight: '24px',
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
      name: 'Raleway',
      styles: [
        '100',
        '200',
        '300',
        '400',
        '500',
        '600',
        '700',
        '800',        
      ],
    },
    {
      name: 'Libre Baskerville',
      styles: [
        '100',
        '200',
        '300',
        '400',
        '500',
        '600',
        '700',
        '800'
      ],
    },
  ],
  headerFontFamily: ['Raleway'],
  bodyFontFamily: ['Libre Baskerville'],
  headerGray: 0,
  bodyGray: 20,
  headerWeight: 800,
  bodyWeight: 400,
  boldWeight: 700,
  escapeHatch: (styles, setStyles, { adjustFontSizeTo, rhythm }, options) => {
    let newStyles = setStyles(styles, 'blockquote', {
      color: gray(26.6),
      borderLeft: "4px solid #999",
      paddingLeft: "1em",
      marginLeft: "1em",
      marginRight: "1em",
      marginTop: "1em",
      marginBottom: "1em",
    })

    newStyles = setStyles(styles, 'p, h1, h2, h3, h4, h5, h6', {
      marginBottom: "1rem",
    })

    newStyles = setStyles(styles, 'a', {
      fontWeight: "bold",
      color: "#00f",
      textDecoration: "none"
    })

    newStyles = setStyles(styles, 'a:hover', {
      textDecoration: "underline"
    })

    const vr = verticalRhythm({
      baseFontSize: '12.8px',
      baseLineHeight: '19.2px'
    })

    newStyles[`@media only screen and (max-width:480px)`] = {
      html: {
        ...vr.establishBaseline()
      }
    }

    return newStyles
  },
}

export default theme
