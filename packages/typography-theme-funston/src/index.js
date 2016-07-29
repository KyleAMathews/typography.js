// @flow
import type { OptionsType } from 'Types'
import gray from 'gray-percentage'
import { MOBILE_MEDIA_QUERY } from 'typography-breakpoint-constants'

const theme: OptionsType = {
  baseFontSize: '20px',
  baseLineHeight: '28px',
  googleFonts: [
    {
      name: 'Patua One',
      styles: [
        '400',
      ],
    },
    {
      name: 'Cabin Condensed',
      styles: [
        '400',
        '700',
      ],
    },
  ],
  headerFontFamily: ['Patua One', 'sans-serif'],
  bodyFontFamily: ['Cabin Condensed', 'georgia', 'sans-serif'],
  headerGray: 13,
  bodyGray: 13,
  headerWeight: '400',
  bodyWeight: 400,
  boldWeight: 700,
  overrideStyles: ({ adjustFontSizeTo, adjustFontSizeToMSValue, rhythm }, options) => ({
    html: {
      '-webkit-font-smoothing': 'antialiased',
    },
    body: {
      letterSpacing: '.03em',
    },
    a: {
      color: gray(options.bodyGray),
    },
    'a:hover': {
      color: '#3498DB',
    },
    blockquote: {
      ...adjustFontSizeToMSValue(1/5),
      color: gray(40),
      paddingLeft: rhythm(13/16),
      marginLeft: rhythm(-1),
      borderLeft: `${rhythm(3/16)} solid ${gray(13)}`,
    },
    [MOBILE_MEDIA_QUERY]: {
      blockquote: {
        marginLeft: rhythm(-3/4),
        paddingLeft: rhythm(9/16),
        marginRight: 0,
      },
    },
  }),
}

export default theme

