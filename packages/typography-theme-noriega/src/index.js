// @flow
import type { OptionsType } from 'Types'

const theme: OptionsType = {
  baseFontSize: '18px',
  baseLineHeight: '29px',
  headerFontFamily: ['Lato', 'sans-serif'],
  bodyFontFamily: ['Lato', 'sans-serif'],
  bodyWeight: 400,
  headerWeight: 700,
  boldWeight: 700,
  googleFonts: [
    {
      name: 'Lato',
      styles: [
        '400',
        '700',
      ],
    },
  ],
  modularScales: [
    {
      scale: 'golden',
    },
  ],
}

export default theme
