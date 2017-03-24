// @flow
import type { OptionsType } from '../Types.js'

const theme: OptionsType = {
  baseFontSize: '15px',
  baseLineHeight: '24px',
  headerFontFamily: ['Raleway', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
  bodyFontFamily: ['Raleway', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
  modularScales: [
    {
      scale: 3.333,
    },
    {
      scale: 2.5,
      maxWidth: '768px',
    },
  ],
  googleFonts: [
    {
      name: 'Raleway',
      styles: [
        '300',
        '400',
        '400i',
        '600',
      ],
    },
  ],
  headerGray: 13,
  bodyGray: 13,
  headerWeight: 300,
  bodyWeight: 'normal',
  boldWeight: 600,
}

export default theme
