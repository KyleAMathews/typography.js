// @flow
import gray from 'gray-percentage'
import type { OptionsType } from 'Types'

const theme: OptionsType = {
  title: 'Wordpress Theme 2014',
  baseFontSize: '16px',
  baseLineHeight: 1.5,
  googleFonts: [
    {
      name: 'Lato',
      styles: ['300', '300i', '400', '400i', '600'],
    },
  ],
  headerFontFamily: ['Lato', 'serif'],
  bodyFontFamily: ['Lato', 'serif'],
  bodyColor: 'hsla(0,0%,0%,0.83)',
  headerWeight: 600,
  bodyWeight: 400,
  boldWeight: 600,
  overrideStyles: ({ adjustFontSizeTo, scale, rhythm }, options) => ({
    'h1,h2,h3,h4,h5,h6': {
      marginTop: rhythm(1.5),
      marginBottom: rhythm(0.5),
    },
    'ul,ol': {
      marginLeft: rhythm(5 / 6),
    },
    // children ol, ul
    'li>ol,li>ul': {
      marginLeft: rhythm(5 / 6),
      marginBottom: 0,
    },
    // Blockquote styles.
    blockquote: {
      ...scale(1 / 5),
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
      color: options.bodyColor,
      fontStyle: 'normal',
      fontWeight: options.bodyWeight,
    },
    'blockquote cite:before': {
      content: '"— "',
    },
  }),
}

export default theme
