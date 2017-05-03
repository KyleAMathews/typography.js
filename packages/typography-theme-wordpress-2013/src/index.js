// @flow
import type { OptionsType } from 'Types'
import { TABLET_MEDIA_QUERY } from 'typography-breakpoint-constants'

const theme: OptionsType = {
  title: 'Wordpress Theme 2013',
  baseFontSize: '16px',
  baseLineHeight: 1.5,
  googleFonts: [
    {
      name: 'Bitter',
      styles: ['700'],
    },
    {
      name: 'Source Sans Pro',
      styles: ['300i', '400', '400i', '700'],
    },
  ],
  headerFontFamily: ['Bitter', 'serif'],
  bodyFontFamily: ['Source Sans Pro', 'serif'],
  bodyColor: 'hsla(0,0%,0%,0.93)',
  headerWeight: '700',
  bodyWeight: 400,
  boldWeight: 700,
  overrideStyles: ({ adjustFontSizeTo, scale, rhythm }, options) => ({
    h1: {
      ...scale(8 / 5),
    },
    [TABLET_MEDIA_QUERY]: {
      h1: {
        ...scale(5 / 5),
      },
    },
    a: {
      color: '#bc360a',
      textDecoration: 'none',
    },
    'a:hover': {
      color: '#ea9629',
      textDecoration: 'underline',
    },
    'ol,ul': {
      marginLeft: 0,
      paddingLeft: rhythm(1.5),
    },
    'li>ul,li>ol': {
      marginLeft: 0,
      paddingLeft: rhythm(1.5),
    },
    blockquote: {
      ...scale(1 / 5),
      fontWeight: 300,
      fontStyle: 'italic',
      marginLeft: rhythm(1.5),
      marginRight: rhythm(1.5),
    },
    'blockquote cite': {
      ...adjustFontSizeTo(options.baseFontSize),
      fontWeight: options.bodyWeight,
      textTransform: 'uppercase',
    },
    h6: {
      marginTop: rhythm(1.25),
      marginBottom: rhythm(1.25),
    },
    table: {
      ...scale(-1 / 5),
    },
    th: {
      fontWeight: options.boldWeight,
      textTransform: 'uppercase',
    },
    dl: {
      marginLeft: rhythm(3 / 4),
    },
  }),
}

export default theme
