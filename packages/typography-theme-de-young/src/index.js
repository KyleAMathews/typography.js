// @flow
import gray from 'gray-percentage'
import type { OptionsType } from 'Types'
import { MOBILE_MEDIA_QUERY } from 'typography-breakpoint-constants'
import verticalRhythm from 'compass-vertical-rhythm'

const theme: OptionsType = {
  title: 'de Young',
  baseFontSize: '20px',
  baseLineHeight: 1.45,
  googleFonts: [
    {
      name: 'Alegreya Sans',
      styles: ['500'],
    },
    {
      name: 'Alegreya',
      styles: ['400', '400i', '700', '700i'],
    },
  ],
  headerFontFamily: ['Alegreya Sans', 'sans-serif'],
  bodyFontFamily: ['Alegreya', 'sans-serif'],
  headerColor: 'hsla(0,0%,0%,0.9)',
  bodyColor: 'hsla(0,0%,0%,0.8)',
  headerWeight: 500,
  bodyWeight: 400,
  boldWeight: 700,
  overrideStyles: ({ rhythm }) => ({
    // Lighten larger headers so they don't contrast so much with the body.
    h1: {
      color: 'hsla(0,0%,0%,0.75)',
    },
    h2: {
      color: 'hsla(0,0%,0%,0.775)',
    },
    h3: {
      color: 'hsla(0,0%,0%,0.8)',
    },
    'h1,h2,h3,h4,h5,h6': {
      lineHeight: 1,
    },
    'h1,h2,h3,h4': {
      lineHeight: 1,
      marginTop: rhythm(1),
      marginBottom: rhythm(1 / 2),
    },
    'h4,h5,h6': {
      textTransformation: 'uppercase',
    },
    // Lists look better when not crowded by the larger headers.
    ul: {
      marginTop: rhythm(1 / 2),
    },
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
      paddingLeft: rhythm(11 / 16),
      marginLeft: 0,
      borderLeft: `${rhythm(5 / 16)} solid ${gray(50)}`,
    },
    'blockquote > :last-child': {
      marginBottom: 0,
    },
    [MOBILE_MEDIA_QUERY]: {
      // Make baseFontSize on mobile 18px.
      html: {
        fontSize: `${18 / 16 * 100}%`,
      },
      blockquote: {
        borderLeft: `${rhythm(3 / 16)} solid ${gray(50)}`,
        marginLeft: rhythm(-3 / 4),
        marginRight: 0,
        paddingLeft: rhythm(9 / 16),
      },
    },
  }),
}

export default theme
