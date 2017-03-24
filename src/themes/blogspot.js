// @flow
import type { OptionsType } from '../Types.js'

const theme: OptionsType = {
  baseFontSize: '13.2px',
  baseLineHeight: '18.4px',
  headerFontFamily: ['Arial', 'Helvetica', 'sans-serif'],
  bodyFontFamily: ['Arial', 'Helvetica', 'sans-serif'],
  modularScales: [
    {
      scale: 1.69,
    },
  ],
  headerGray: 13,
  bodyGray: 13,
  headerWeight: 'bold',
  bodyWeight: 'normal',
  boldWeight: 'bold',
  blockMarginBottom: '15px',
  overrideStyles: () => ({
    blockquote: {
      marginLeft: '40px',
      marginRight: '40px',
      marginTop: '1em',
      marginBottom: '1em',
    },
  }),
}

export default theme
