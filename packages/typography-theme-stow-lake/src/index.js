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
        '700',
      ],
    },
    {
      name: 'Lato',
      styles: [
        '400',
        '400i',
        '700',
      ],
    },
  ],
  headerFontFamily: ['Neuton', 'sans-serif'],
  bodyFontFamily: ['Lato', 'sans-serif'],
  headerGray: 10,
  bodyGray: 20,
  headerWeight: 700,
  bodyWeight: 400,
  boldWeight: 700,
  overrideStyles: ({ adjustFontSizeTo, adjustFontSizeToMSValue, rhythm }, options) => ({
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
      ...adjustFontSizeToMSValue(1/5),
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
