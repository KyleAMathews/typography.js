// @flow
import gray from 'gray-percentage'
import type { OptionsType } from 'Types'
import { MOBILE_MEDIA_QUERY } from 'typography-breakpoint-constants'

const theme: OptionsType = {
  title: 'Wordpress Theme 2015',
  baseFontSize: '19px',
  baseLineHeight: 1.68,
  googleFonts: [
    {
      name: 'Noto Serif',
      styles: [
        '400',
        '700',
      ],
    },
  ],
  headerFontFamily: ['Noto Serif', 'serif'],
  bodyFontFamily: ['Noto Serif', 'serif'],
  bodyColor: 'hsla(0,0%,0%,0.8)',
  headerWeight: '700',
  bodyWeight: 400,
  boldWeight: 700,
  overrideStyles: ({ adjustFontSizeTo, scale, rhythm }, options) => ({
    'h5,h6': {
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    },
    'h1,h2,h3,h4,h5,h6': {
      marginTop: rhythm(2),
    },
    ul: {
      listStyle: 'disc',
    },
    'ul,ol': {
      marginLeft: 0,
    },
    // children ol, ul
    'li>ol,li>ul': {
      marginLeft: rhythm(2/3),
      marginBottom: 0,
    },
    // Blockquote.
    blockquote: {
      ...scale(1/5),
      color: gray(41),
      fontStyle: 'italic',
      paddingLeft: rhythm(5/8),
      marginLeft: rhythm(-6/8),
      borderLeft: `${rhythm(1/8)} solid rgba(51, 51, 51, 0.7)`,
    },
    'blockquote > :last-child': {
      marginBottom: 0,
    },
    'blockquote cite': {
      ...adjustFontSizeTo(options.baseFontSize),
      color: options.bodyColor,
      fontStyle: 'normal',
    },
    'blockquote cite:before': {
      content: '"— "',
    },
    [MOBILE_MEDIA_QUERY]: {
      'ul,ol': {
        marginLeft: rhythm(1),
      },
      blockquote: {
        marginLeft: rhythm(-3/4),
        marginRight: 0,
        paddingLeft: rhythm(9/16),
      },
    },
  }),
}

export default theme
