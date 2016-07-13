// @flow
import type { OptionsType } from 'Types'
import gray from 'gray-percentage'
import { TABLET_MEDIA_QUERY } from 'typography-breakpoint-constants'
import verticalRhythm from 'compass-vertical-rhythm'

const theme: OptionsType = {
  baseFontSize: '18px',
  baseLineHeight: '28px',
  googleFonts: [
    {
      name: 'Source Sans Pro',
      styles: [
        '300',
        '300i',
        '400',
        '400i',
        '600',
      ],
    },
  ],
  headerFontFamily: ['Source Sans Pro', 'sans-serif'],
  bodyFontFamily: ['Source Sans Pro', 'sans-serif'],
  headerGray: 15,
  bodyGray: 30,
  headerWeight: '600',
  bodyWeight: 300,
  boldWeight: 400,
  overrideStyles: ({ adjustFontSizeTo, rhythm }, options) => {
    const vr = verticalRhythm({
      baseFontSize: '16px',
      baseLineHeight: '24.88px',
    })

    const styles = {
      'h1 a,h2 a,h3 a,h4 a,h5 a,h6 a': {
        fontWeight: options.headerWeight,
      },
      a: {
        fontWeight: 400,
        color: '#419eda',
        textDecoration: 'none',
      },
      'a:hover': {
        color: '#2a6496',
        textDecoration: 'underline',
      },
      blockquote: {
        ...adjustFontSizeTo('20px'),
        color: gray(40),
        paddingLeft: rhythm(3/4),
        marginLeft: 0,
        borderLeft: `${rhythm(1/4)} solid ${gray(87)}`,
      },
      // Mobile styles.
      [TABLET_MEDIA_QUERY]: {
        html: {
          ...vr.establishBaseline(),
        },
        blockquote: {
          marginLeft: rhythm(-3/4),
          marginRight: 0,
          paddingLeft: rhythm(1/2),
        },
        table: {
          ...adjustFontSizeTo('16px'),
        },
      },
    }

    return styles
  },
}

export default theme
