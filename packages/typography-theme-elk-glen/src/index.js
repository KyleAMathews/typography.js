// @flow
import gray from 'gray-percentage'
import type { OptionsType } from 'Types'
import { MOBILE_MEDIA_QUERY } from 'typography-breakpoint-constants'
import verticalRhythm from 'compass-vertical-rhythm'

const theme: OptionsType = {
  title: 'Elk Glen',
  baseFontSize: '20px',
  baseLineHeight: '33px',
  googleFonts: [
    {
      name: 'Alegreya Sans',
      styles: [
        '500',
      ],
    },
    {
      name: 'Alegreya',
      styles: [
        '400',
        '400i',
        '700',
        '700i',
      ],
    },
  ],
  headerFontFamily: ['Alegreya Sans', 'sans-serif'],
  bodyFontFamily: ['Alegreya', 'sans-serif'],
  headerGray: 10,
  bodyGray: 20,
  headerWeight: 500,
  bodyWeight: 400,
  boldWeight: 700,
  overrideStyles: ({ adjustFontSizeTo, adjustFontSizeToMSValue, rhythm }, options) => {
    const vr = verticalRhythm({
      baseFontSize: '18px',
      baseLineHeight: '29.7px',
    })

    return {
      a: {
        color: 'hsl(230,55%,58%)',
        textDecoration: 'none',
      },
      'a:hover,a:active': {
        boxShadow: '0 1px 0 0 currentColor',
      },
      blockquote: {
        ...adjustFontSizeToMSValue(1/5),
        color: gray(35),
        fontStyle: 'italic',
        paddingLeft: rhythm(11/16),
        marginLeft: 0,
        borderLeft: `${rhythm(5/16)} solid ${gray(80)}`,
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
        html: {
          ...vr.establishBaseline(),
        },
        blockquote: {
          borderLeft: `${rhythm(3/16)} solid ${gray(80)}`,
          marginLeft: rhythm(-3/4),
          marginRight: 0,
          paddingLeft: rhythm(9/16),
        },
      },
    }
  },
}

export default theme
