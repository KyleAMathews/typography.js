// @flow
import gray from 'gray-percentage'
import type { OptionsType } from 'Types'

const theme: OptionsType = {
  baseFontSize: '16px',
  baseLineHeight: '24px',
  googleFonts: [
    {
      name: 'Lato',
      styles: [
        '300',
        '300i',
        '400',
        '400i',
        '600',
      ],
    },
  ],
  headerFontFamily: ['Lato', 'serif'],
  bodyFontFamily: ['Lato', 'serif'],
  headerGray: 17,
  bodyGray: 17,
  headerWeight: 600,
  bodyWeight: 400,
  boldWeight: 600,
  overrideStyles: ({ adjustFontSizeTo, rhythm }, options) => ({
    'h1,h2,h3,h4,h5,h6': {
      marginTop: rhythm(1.5),
      marginBottom: rhythm(0.5),
    },
    'ul,ol': {
      marginLeft: '20px',
    },
    // children ol, ul
    'li>ol,li>ul': {
      marginLeft: '20px',
      marginBottom: 0,
    },
    // Blockquote styles.
    blockquote: {
      ...adjustFontSizeTo('19px'),
      fontWeight: 300,
      color: gray(46),
      fontStyle: 'italic',
      marginLeft: 0,
      marginRight: 0,
    },
    'blockquote > :last-child': {
      marginBottom: 0,
    },
    'blockquote cite': {
      ...adjustFontSizeTo(options.baseFontSize),
      color: gray(options.bodyGray),
      fontStyle: 'normal',
      fontWeight: options.bodyWeight,
    },
    'blockquote cite:before': {
      content: '"— "',
    },
  }),
}

export default theme

