// @flow
import type { OptionsType } from 'Types'

const theme: OptionsType = {
  baseFontSize: '18px',
  baseLineHeight: '29px',
  headerFontFamily: ['Lato', 'sans-serif'],
  bodyFontFamily: ['Lato', 'sans-serif'],
  bodyWeight: 300,
  headerGrayHue: 'cool',
  bodyGrayHue: 'cool',
  headerWeight: 700,
  boldWeight: 700,
  googleFonts: [
    {
      name: 'Lato',
      styles: [
        '300',
        '700',
      ],
    },
    {
      name: 'Inconsolata',
      styles: [
        '400',
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
