// @flow
import type { OptionsType } from '../Types.js'

const theme: OptionsType = {
  baseFontSize: '14px',
  baseLineHeight: '22px',
  googleFonts: [
    {
      name: 'Roboto',
      styles: [
        '300',
        '400',
        '400i',
        '700',
      ],
    },
  ],
  headerFontFamily: ['Roboto', 'sans-serif'],
  bodyFontFamily: ['Roboto', 'sans-serif'],
  headerGray: 20,
  bodyGray: 13,
  headerWeight: '300',
  bodyWeight: 400,
  boldWeight: 600,
}

export default theme
