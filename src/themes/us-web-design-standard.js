// @flow
import type { OptionsType } from '../Types.js'

const theme: OptionsType = {
  baseFontSize: '17px',
  baseLineHeight: '26px',
  modularScales: [
    {
      scale: 'major tenth',
    },
    {
      scale: 'minor seventh',
      maxWidth: '768px',
    },
  ],
  googleFonts: [
    {
      name: 'Merriweather',
      styles: [
        '700',
      ],
    },
    {
      name: 'Source Sans Pro',
      styles: [
        '400',
        '400i',
        '700',
      ],
    },
  ],
  headerFontFamily: ['Merriweather', 'serif'],
  bodyFontFamily: ['Source Sans Pro', 'sans-serif'],
  headerGray: 20,
  bodyGray: 20,
  headerWeight: 700,
  bodyWeight: 400,
  boldWeight: 700,
}

export default theme
