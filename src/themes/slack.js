// @flow
import type { OptionsType } from '../Types.js'

const theme: OptionsType = {
  baseFontSize: '15px',
  baseLineHeight: '22px',
  googleFonts: [
    {
      name: 'Lato',
      styles: [
        '400',
        '400i',
        '900',
      ],
    },
  ],
  headerFontFamily: ['Lato', 'serif'],
  bodyFontFamily: ['Lato', 'serif'],
  headerGray: 18,
  headerGrayHue: 225,
  bodyGray: 18,
  bodyGrayHue: 225,
  headerWeight: 900,
  bodyWeight: 400,
  boldWeight: 900,
}

export default theme

