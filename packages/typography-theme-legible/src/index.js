// @flow
import type { OptionsType } from '../../../Types'

const theme: OptionsType = {
  title: 'Legible',
  baseFontSize: '16px',
  baseLineHeight: 1.4,
  googleFonts: [
    {
      name: 'Fira Sans',
      styles: ['400', '500'],
    },
    {
      name: 'Merriweather',
      styles: ['900'],
    },
  ],
  headerFontFamily: ['Merriweather', 'serif'],
  bodyFontFamily: ['Fira Sans', 'sans-serif'],
  headerColor: 'hsla(0, 0%, 0%, 0.86)',
  bodyColor: 'hsla(0, 0%, 0%, 0.93)',
  headerWeight: 900,
  bodyWeight: 400,
  boldWeight: 500,
  scaleRatio: 2.45,
}

export default theme
