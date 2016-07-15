// @flow
import gray from 'gray-percentage'
import type { OptionsType } from 'Types'
import { MOBILE_MEDIA_QUERY } from 'typography-breakpoint-constants'
import verticalRhythm from 'compass-vertical-rhythm'

const theme: OptionsType = {
  baseFontSize: '18px',
  baseLineHeight: '32px',
  googleFonts: [
    {
      name: 'Domine',
      styles: [
        '700',
      ],
    },
    {
      name: 'Open Sans',
      styles: [
        '400',
        '400i',
        '700',
        '700i',
      ],
    },
  ],
  headerFontFamily: ['Domine', 'sans-serif'],
  bodyFontFamily: ['Open Sans', 'sans-serif'],
  headerGray: 0,
  bodyGray: 0,
  headerWeight: 700,
  bodyWeight: 400,
  boldWeight: 700,
  overrideStyles: ({ adjustFontSizeTo, rhythm }, options) => {
    const vr = verticalRhythm({
      baseFontSize: '16px',
      baseLineHeight: '28.44px',
    })

    return {
      a: {
        color: '#ff5700',
        textDecoration: 'none',
      },
      'a:hover,a:active': {
        color: gray(options.bodyGray),
      },
      blockquote: {
        ...adjustFontSizeTo('21px'),
        color: gray(41),
        fontStyle: 'italic',
        paddingLeft: rhythm(13/16),
        marginLeft: 0,
        borderLeft: `${rhythm(3/16)} solid ${gray(10)}`,
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
        html: {
          ...vr.establishBaseline(),
        },
        blockquote: {
          marginLeft: rhythm(-3/4),
          marginRight: 0,
          paddingLeft: rhythm(9/16),
        },
      },
    }
  },
}

export default theme
