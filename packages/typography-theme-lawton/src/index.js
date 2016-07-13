// @flow
import gray from 'gray-percentage'
import type { OptionsType } from 'Types'
import verticalRhythm from 'compass-vertical-rhythm'
import { MOBILE_MEDIA_QUERY } from 'typography-breakpoint-constants'

const theme: OptionsType = {
  baseFontSize: '16px',
  baseLineHeight: '24px',
  modularScales: [
    {
      scale: 'major tenth',
    },
    {
      scale: 'octave',
      maxWidth: '768px',
    },
  ],
  googleFonts: [
    {
      name: 'Raleway',
      styles: [
        '800',
      ],
    },
    {
      name: 'Libre Baskerville',
      styles: [
        '400',
        '400i',
        '700',
      ],
    },
  ],
  headerFontFamily: ['Raleway'],
  bodyFontFamily: ['Libre Baskerville'],
  headerGray: 0,
  bodyGray: 20,
  headerWeight: 800,
  bodyWeight: 400,
  boldWeight: 700,
  overrideStyles: () => {
    const vr = verticalRhythm({
      baseFontSize: '12.8px',
      baseLineHeight: '19.2px',
    })

    const styles = {
      [MOBILE_MEDIA_QUERY]: {
        html: {
          ...vr.establishBaseline(),
        },
      },
      blockquote: {
        color: gray(26.6),
        borderLeft: '4px solid #999',
        paddingLeft: '1em',
        marginLeft: '1em',
        marginRight: '1em',
        marginTop: '1em',
        marginBottom: '1em',
      },
      'p, h1, h2, h3, h4, h5, h6': {
        marginBottom: '1rem',
      },
      a: {
        fontWeight: 'bold',
        color: '#00f',
        textDecoration: 'none',
      },
      'a:hover': {
        textDecoration: 'underline',
      },
    }

    return styles
  },
}

export default theme
