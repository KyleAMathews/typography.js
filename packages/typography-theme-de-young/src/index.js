// @flow
import gray from 'gray-percentage'
import type { OptionsType } from 'Types'
import { MOBILE_MEDIA_QUERY } from 'typography-breakpoint-constants'
import verticalRhythm from 'compass-vertical-rhythm'

const theme: OptionsType = {
  title: 'de Young',
  baseFontSize: '20px',
  baseLineHeight: 1.65,
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
  headerColor: 'hsla(0,0%,0%,0.9)',
  bodyColor: 'hsla(0,0%,0%,0.8)',
  headerWeight: 500,
  bodyWeight: 400,
  boldWeight: 700,
  overrideStyles: ({ rhythm }) => {
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
        color: gray(35),
        fontStyle: 'italic',
        paddingLeft: rhythm(11/16),
        marginLeft: 0,
        borderLeft: `${rhythm(5/16)} solid ${gray(80)}`,
      },
      'blockquote > :last-child': {
        marginBottom: 0,
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
