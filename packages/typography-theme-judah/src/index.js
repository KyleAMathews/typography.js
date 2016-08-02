// @flow
import gray from 'gray-percentage'
import type { OptionsType } from 'Types'
import { MOBILE_MEDIA_QUERY } from 'typography-breakpoint-constants'

const theme: OptionsType = {
  title: 'Judah',
  baseFontSize: '18px',
  baseLineHeight: '30px',
  googleFonts: [
    {
      name: 'Roboto Condensed',
      styles: [
        '400',
        '400i',
      ],
    },
    {
      name: 'Vollkorn',
      styles: [
        '400',
        '400i',
        '700',
      ],
    },
  ],
  headerFontFamily: ['Roboto Condensed', 'sans-serif'],
  bodyFontFamily: ['Vollkorn', 'Georgia', 'serif'],
  headerGray: 0,
  bodyGray: 20,
  headerWeight: 400,
  bodyWeight: 400,
  boldWeight: 700,
  overrideStyles: ({ adjustFontSizeTo, adjustFontSizeToMSValue, rhythm }, options) => ({
    a: {
      color: '#e51937',
      textDecoration: 'none',
    },
    'a:hover,a:active': {
      color: gray(options.bodyGray),
      textDecoration: 'none',
    },
    blockquote: {
      ...adjustFontSizeToMSValue(1/5),
      color: gray(0),
      fontStyle: 'italic',
      paddingLeft: rhythm(13/16),
      marginLeft: 0,
      borderLeft: `${rhythm(3/16)} solid ${gray(80)}`,
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
    ul: {
      listStyle: 'disc',
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
    'h5,h6': {
      textTransform: 'uppercase',
      fontStyle: 'italic',
    },
  }),
}

export default theme
