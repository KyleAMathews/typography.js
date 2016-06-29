// @flow
import type { OptionsType } from 'Types'
import gray from 'gray-percentage'
import verticalRhythm from 'compass-vertical-rhythm'
import { TABLET_MEDIA_QUERY } from 'typography-breakpoint-constants'

const theme: OptionsType = {
  baseFontSize: '22px',
  baseLineHeight: '31px',
  googleFonts: [
    {
      name: 'Lato',
      styles: [
        '900',
      ],
    },
    {
      name: 'Yrsa',
      styles: [
        '400',
        '700',
      ],
    },
  ],
  headerFontFamily: ['Lato', 'sans-serif'],
  bodyFontFamily: ['Yrsa', 'georgia', 'sans-serif'],
  headerGray: 13,
  bodyGray: 20,
  headerWeight: 900,
  bodyWeight: 400,
  boldWeight: 700,
  overrideStyles: ({ adjustFontSizeTo, rhythm }, options) => {
    const vr = verticalRhythm({
      baseFontSize: '19px',
      baseLineHeight: '26.9px',
    })

    const styles = {
      a: {
        color: gray(options.bodyGray),
      },
      'a:hover': {
        color: '#3498DB',
      },
      blockquote: {
        color: gray(40),
        paddingLeft: rhythm(3/4),
        marginLeft: rhythm(-1),
        borderLeft: `${rhythm(1/4)} solid ${gray(13)}`,
      },
      'blockquote strong, blockquote a': {
        color: gray(25),
      },
      // Mobile styles.
      [TABLET_MEDIA_QUERY]: {
        html: {
          ...vr.establishBaseline(),
        },
        blockquote: {
          marginLeft: rhythm(-1/2),
          marginRight: rhythm(1/2),
          paddingLeft: rhythm(3/4),
          borderLeft: `${rhythm(1/4)} solid ${gray(13)}`,
        },
        table: {
          ...adjustFontSizeTo('18px'),
        },
      },
      'h3,h4,h5,h6': {
        marginBottom: rhythm(1/2),
      },
      table: {
        ...adjustFontSizeTo('20px'),
      },
    }

    return styles
  },
}

export default theme
