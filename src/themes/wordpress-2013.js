// @flow
import type { OptionsType } from '../Types.js'
import merge from 'lodash/merge'

const theme: OptionsType = {
  baseFontSize: '16px',
  baseLineHeight: '24px',
  googleFonts: [
    {
      name: 'Bitter',
      styles: [
        '700',
      ],
    },
    {
      name: 'Source Sans Pro',
      styles: [
        '300i',
        '400',
        '400i',
        '700',
      ],
    },
  ],
  headerFontFamily: ['Bitter', 'serif'],
  bodyFontFamily: ['Source Sans Pro', 'serif'],
  headerGray: 7,
  bodyGray: 7,
  headerWeight: '700',
  bodyWeight: 400,
  boldWeight: 700,
  overrideStyles: (styles, setStyles, { adjustFontSizeTo, rhythm }, options) => {
    const newStyles = {
      h1: {
        ...adjustFontSizeTo('48px'),
      },
      '@media only screen and (max-width:768px)': {
        h1: {
          ...adjustFontSizeTo('32px'),
        },
      },
      a: {
        color: '#bc360a',
        textDecoration: 'none',
      },
      'a:hover': {
        color: '#ea9629',
        textDecoration: 'underline',
      },
      'ol,ul': {
        marginLeft: 0,
        paddingLeft: rhythm(1.5),
      },
      'li>ul,li>ol': {
        marginLeft: 0,
        paddingLeft: rhythm(1.5),
      },
      blockquote: {
        ...adjustFontSizeTo('24px'),
        fontWeight: 300,
        fontStyle: 'italic',
        marginLeft: rhythm(1.5),
        marginRight: rhythm(1.5),
      },
      'blockquote cite': {
        ...adjustFontSizeTo(options.baseFontSize),
        fontWeight: options.bodyWeight,
        textTransform: 'uppercase',
      },
      h6: {
        marginTop: rhythm(1.25),
        marginBottom: rhythm(1.25),
      },
      table: {
        ...adjustFontSizeTo('14px'),
      },
      th: {
        fontWeight: options.boldWeight,
        textTransform: 'uppercase',
      },
      dl: {
        marginLeft: rhythm(3/4),
      },
    }
    return merge(styles, newStyles)
  },
}

export default theme
