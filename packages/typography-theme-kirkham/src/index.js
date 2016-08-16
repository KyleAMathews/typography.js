// @flow
import gray from 'gray-percentage'
import type { OptionsType } from 'Types'
import { MOBILE_MEDIA_QUERY, TABLET_MEDIA_QUERY } from 'typography-breakpoint-constants'

const theme: OptionsType = {
  title: 'Kirkham',
  baseFontSize: '18px',
  baseLineHeight: 5/3,
  googleFonts: [
    {
      name: 'Playfair Display',
      styles: [
        '700',
      ],
    },
    {
      name: 'Fira Sans',
      styles: [
        '400',
        '400i',
        '700',
        '700i',
      ],
    },
  ],
  headerFontFamily: ['Playfair Display', 'serif'],
  bodyFontFamily: ['Fira Sans', 'sans-serif'],
  headerGray: 0,
  bodyGray: 20,
  headerWeight: 700,
  bodyWeight: 400,
  boldWeight: 700,
  overrideStyles: ({ adjustFontSizeTo, adjustFontSizeToMSValue, rhythm }, options) => ({
    a: {
      color: '#9f392b',
    },
    h1: {
      ...adjustFontSizeToMSValue(6/5),
    },
    blockquote: {
      ...adjustFontSizeToMSValue(1/5),
      color: gray(41),
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
    [MOBILE_MEDIA_QUERY]: {
      blockquote: {
        marginLeft: rhythm(-3/4),
        marginRight: 0,
        paddingLeft: rhythm(9/16),
      },
    },
    [TABLET_MEDIA_QUERY]: {
      h1: {
        ...adjustFontSizeToMSValue(5/5),
      },
    },
    'h3,h4,h5,h6': {
      fontStyle: 'italic',
    },
  }),
}

export default theme
