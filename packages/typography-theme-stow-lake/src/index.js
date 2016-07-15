// @flow
import gray from 'gray-percentage'
import type { OptionsType } from 'Types'
import { MOBILE_MEDIA_QUERY } from 'typography-breakpoint-constants'

const theme: OptionsType = {
  baseFontSize: '18px',
  baseLineHeight: '31px',
  googleFonts: [
    {
      name: 'Neuton',
      styles: [
        '400',
      ],
    },
    {
      name: 'Lato',
      styles: [
        '300',
        '300i',
        '600',
      ],
    },
  ],
  headerFontFamily: ['Neuton', 'sans-serif'],
  bodyFontFamily: ['Lato', 'sans-serif'],
  headerGray: 10,
  bodyGray: 20,
  headerWeight: 400,
  bodyWeight: 300,
  boldWeight: 600,
  overrideStyles: ({ adjustFontSizeTo, rhythm }, options) => ({
    a: {
      color: '#4665b7',
      textDecoration: 'none',
    },
    'a:hover,a:active': {
      color: gray(options.bodyGray),
    },
    'h1,h2,h3,h4,h5,h6': {
      marginTop: rhythm(2),
    },
    blockquote: {
      ...adjustFontSizeTo('19px'),
      color: gray(41),
      paddingLeft: rhythm(18/16),
      marginLeft: 0,
      borderLeft: `${rhythm(6/16)} solid`,
      borderColor: '#612423',
    },
    'blockquote > :last-child': {
      marginBottom: 0,
    },
    'blockquote cite': {
      ...adjustFontSizeTo(options.baseFontSize),
      color: gray(options.bodyGray),
      fontStyle: options.bodyWeight,
    },
    'blockquote cite:before': {
      content: '"— "',
    },
    [MOBILE_MEDIA_QUERY]: {
      blockquote: {
        marginLeft: rhythm(-3/4),
        marginRight: 0,
        borderLeft: `${rhythm(3/16)} solid`,
        borderColor: '#612423',
        paddingLeft: rhythm(9/16),
      },
    },
  }),
}

export default theme
