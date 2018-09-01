// @flow
import type { OptionsType } from 'Types'

const theme: OptionsType = {
  title: 'Wordpress Theme 2011',
  baseFontSize: '15px',
  baseLineHeight: 1.6,
  scaleRatio: 1.7333,
  headerFontFamily: [
    'Helvetica Neue',
    'Helvetica',
    'Segoe UI',
    'Arial',
    'freesans',
    'sans-serif',
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol',
  ], // eslint-disable-line
  bodyFontFamily: [
    'Helvetica Neue',
    'Helvetica',
    'Segoe UI',
    'Arial',
    'freesans',
    'sans-serif',
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol',
  ], // eslint-disable-line
  headerColor: 'hsla(0,0%,0%,0.87)',
  bodyColor: 'hsla(0,0%,0%,0.78)',
  headerWeight: 'bold',
  bodyWeight: 300,
  boldWeight: 'bold',
  overrideStyles: ({ adjustFontSizeTo }) => ({
    h2: {
      ...adjustFontSizeTo('15px'),
      marginBottom: 0,
    },
    h3: {
      ...adjustFontSizeTo('10px'),
      marginBottom: 0,
      textTransform: 'uppercase',
    },
    h4: {
      ...adjustFontSizeTo('15px'),
      fontWeight: 'normal',
      marginBottom: 0,
    },
    h5: {
      ...adjustFontSizeTo('15px'),
      fontWeight: 'normal',
      marginBottom: 0,
    },
    h6: {
      ...adjustFontSizeTo('15px'),
      fontWeight: 'normal',
      marginBottom: 0,
    },
    a: {
      color: '#1bafe0',
      textDecoration: 'none',
    },
    'a:focus, a:active, a:hover': {
      textDecoration: 'underline',
    },
    'ul,ol': {
      marginBottom: '1.625em',
      marginLeft: '2.5em',
    },
    li: {
      marginBottom: 0,
    },
    'li > ul': {
      marginTop: 0,
    },
    ins: {
      background: '#fff9c0',
    },
    // children ol, ul
    'li>ol,li>ul': {
      marginLeft: '2.5em',
      marginBottom: 0,
    },
    blockquote: {
      fontFamily: 'Georgia, "Bitstream Charter", serif',
      fontStyle: 'italic',
      marginTop: 0,
      marginBottom: 0,
      marginLeft: '3em',
      marginRight: '3em',
    },
  }),
}

export default theme
