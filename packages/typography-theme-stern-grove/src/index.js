// @flow
import gray from 'gray-percentage'
import type { OptionsType } from 'Types'
import { MOBILE_MEDIA_QUERY } from 'typography-breakpoint-constants'

const theme: OptionsType = {
  baseFontSize: '18px',
  baseLineHeight: '30px',
  googleFonts: [
    {
      name: 'Montserrat',
      styles: [
        '400',
      ],
    },
  ],
  headerFontFamily: ['Montserrat', 'sans-serif'],
  bodyFontFamily: ['Georgia', 'Cambria', 'serif'],
  headerGray: 50,
  bodyGray: 13,
  headerWeight: 400,
  bodyWeight: 400,
  boldWeight: 700,
  overrideStyles: ({ adjustFontSizeTo, adjustFontSizeToMSValue, rhythm }, options) => ({
    a: {
      color: '#07e',
      textDecoration: 'none',
    },
    'a:hover,a:active': {
      color: '#e32',
    },
    blockquote: {
      ...adjustFontSizeToMSValue(1/5),
      background: gray(97),
      color: gray(31),
      paddingLeft: rhythm(14/16),
      paddingRight: rhythm(1/2),
      paddingTop: rhythm(1/2),
      paddingBottom: rhythm(1/2),
      marginLeft: 0,
      marginRight: 0,
      borderLeft: `${rhythm(2/16)} solid ${gray(80)}`,
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
    ul: {
      listStyle: 'disc',
    },
    [MOBILE_MEDIA_QUERY]: {
      'ul,ol': {
        marginLeft: rhythm(1),
      },
      blockquote: {
        marginLeft: rhythm(-3/4),
        marginRight: rhythm(-3/4),
        paddingLeft: rhythm(11/16),
        paddingRight: rhythm(3/4),
      },
    },
    'h1,h2,h3,h4,h5,h6': {
      marginTop: rhythm(2),
    },
    h6: {
      fontStyle: 'italic',
    },
  }),
}

export default theme
