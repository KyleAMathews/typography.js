// @flow
import gray from 'gray-percentage'
import type { OptionsType } from 'Types'
import { MOBILE_MEDIA_QUERY } from 'typography-breakpoint-constants'

const theme: OptionsType = {
  title: 'St. Annes',
  baseFontSize: '16px',
  baseLineHeight: 1.5625,
  googleFonts: [
    {
      name: 'Source Serif Pro',
      styles: [
        '600',
      ],
    },
    {
      name: 'Source Sans Pro',
      styles: [
        '400',
        '400i',
        '700',
      ],
    },
  ],
  headerFontFamily: ['Source Serif Pro', 'sans-serif'],
  bodyFontFamily: ['Source Sans Pro', 'sans-serif'],
  headerGray: 0,
  bodyGray: 20,
  headerWeight: 600,
  bodyWeight: 400,
  boldWeight: 700,
  overrideStyles: ({ adjustFontSizeTo, scale, rhythm }, options) => ({
    a: {
      color: '#fb251b',
      textDecoration: 'none',
    },
    'a:hover,a:active': {
      color: gray(options.bodyGray),
    },
    'h1,h2,h3,h4,h5,h6': {
      marginTop: rhythm(2),
    },
    blockquote: {
      ...scale(1/5),
      color: gray(41),
      paddingLeft: rhythm(18/16),
      marginLeft: 0,
      borderLeft: `${rhythm(6/16)} solid`,
      borderColor: '#fcea0e',
    },
    'blockquote > :last-child': {
      marginBottom: 0,
    },
    'blockquote cite': {
      ...adjustFontSizeTo(options.baseFontSize),
      color: gray(options.bodyGray),
      fontWeight: options.bodyWeight,
    },
    'blockquote cite:before': {
      content: '"— "',
    },
    [MOBILE_MEDIA_QUERY]: {
      blockquote: {
        marginLeft: rhythm(-3/4),
        marginRight: 0,
        borderLeft: `${rhythm(3/16)} solid`,
        borderColor: '#fcea0e',
        paddingLeft: rhythm(9/16),
      },
    },
  }),
}

export default theme
