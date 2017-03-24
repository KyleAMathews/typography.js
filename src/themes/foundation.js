// @flow
import type { OptionsType } from '../Types.js'

const theme: OptionsType = {
  baseFontSize: '16px',
  baseLineHeight: '26px',
  headerFontFamily: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
  bodyFontFamily: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
  modularScales: [
    {
      scale: 2.4375,
    },
    {
      scale: 'octave',
      maxWidth: '768px',
    },
  ],
  headerGray: 13,
  bodyGray: 13,
  headerWeight: 'normal',
  bodyWeight: 'normal',
  boldWeight: 'bold',
}

export default theme

