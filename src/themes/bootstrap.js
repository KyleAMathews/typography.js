// @flow
import type { OptionsType } from '../Types.js'

const theme: OptionsType = {
  baseFontSize: '16px',
  baseLineHeight: '24px',
  headerFontFamily: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
  bodyFontFamily: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
  modularScales: [
    {
      scale: 2.25,
    },
    {
      scale: 'octave',
      maxWidth: '768px',
    },
  ],
  headerGray: 20,
  bodyGray: 20,
  headerWeight: 500,
  bodyWeight: 'normal',
  boldWeight: 'bold',
}

export default theme
