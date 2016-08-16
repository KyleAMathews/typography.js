// @flow
import type { OptionsType } from 'Types'
import gray from 'gray-percentage'

const theme: OptionsType = {
  title: 'US Web Design Standards',
  baseFontSize: '17px',
  baseLineHeight: 1.53,
  scale: 2.35,
  googleFonts: [
    {
      name: 'Merriweather',
      styles: [
        '700',
      ],
    },
    {
      name: 'Source Sans Pro',
      styles: [
        '400',
        '400i',
        '700',
      ],
    },
  ],
  headerFontFamily: ['Merriweather', 'serif'],
  bodyFontFamily: ['Source Sans Pro', 'sans-serif'],
  headerGray: 20,
  bodyGray: 20,
  headerWeight: 700,
  bodyWeight: 400,
  boldWeight: 700,
  overrideStyles: ({ adjustFontSizeTo, adjustFontSizeToMSValue, rhythm }, options) => ({
    h1: adjustFontSizeToMSValue(5/5),
    h2: adjustFontSizeToMSValue(3/5),
    h3: adjustFontSizeToMSValue(1/5),
    h4: adjustFontSizeToMSValue(0/5),
    h5: adjustFontSizeToMSValue(-1/8),
    h6: {
      ...adjustFontSizeToMSValue(-2/8),
      fontFamily: options.bodyFontFamily.join(','),
      fontWeight: options.bodyWeight,
      textTransform: 'uppercase',
    },
    a: {
      color: '#0071bc',
    },
    'a:visited': {
      color: '#4c2c92',
    },
    blockquote: {
      ...adjustFontSizeToMSValue(1/4),
      borderLeft: `${rhythm(1/6)} solid`,
      borderColor: gray(93),
      paddingTop: rhythm(1/3),
      paddingBottom: rhythm(1/3),
      paddingLeft: rhythm(2/3),
      paddingRight: rhythm(2/3),
    },
    'blockquote > :last-child': {
      marginBottom: 0,
    },
    'blockquote cite': {
      ...adjustFontSizeTo(options.baseFontSize),
      color: gray(54, 204),
      fontWeight: options.bodyWeight,
      fontStyle: 'normal',
    },
  }),
}

export default theme
