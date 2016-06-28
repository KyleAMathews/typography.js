// @flow
import gray from 'gray-percentage'
import type { OptionsType } from '../Types.js'

const theme: OptionsType = {
  baseFontSize: '16px',
  baseLineHeight: '26px',
  headerFontFamily: ['Helvetica Neue', 'Helvetica', 'Segoe UI', 'Arial', 'freesans', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'], // eslint-disable-line
  bodyFontFamily: ['Helvetica Neue', 'Helvetica', 'Segoe UI', 'Arial', 'freesans', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'], // eslint-disable-line
  modularScales: [
    {
      scale: 2.25,
    },
    {
      scale: 'octave',
      maxWidth: '768px',
    },
  ],
  headerGray: 20,
  bodyGray: 20,
  headerWeight: 'bold',
  bodyWeight: 'normal',
  boldWeight: 'bold',
  overrideStyles: ({ rhythm }) => ({
    h1: {
      borderBottom: `1px solid ${gray(93)}`,
      paddingBottom: `calc(${rhythm(1/4)} - 1px)`,
      marginBottom: rhythm(3/4),
      marginTop: rhythm(1.5),
    },
    h2: {
      borderBottom: `1px solid ${gray(93)}`,
      paddingBottom: `calc(${rhythm(1/4)} - 1px)`,
      marginBottom: rhythm(1/4),
      marginTop: rhythm(1),
    },
    'h3,h4,h5,h6': {
      marginBottom: rhythm(1/2),
      marginTop: rhythm(1),
    },
    // Github has all block elements use 1/2 rhythm not a full rhythm for
    // margin-bottom
      // 'hgroup',
      // 'ul',
      // 'ol',
      // 'dl',
      // 'dd',
      // 'p',
      // 'figure',
      // 'pre',
      // 'table',
      // 'fieldset',
      // 'blockquote',
      // 'form',
      // 'noscript',
      // 'iframe',
      // 'img',
      // 'hr',
    // ], {
      // marginBottom: rhythm(1/2),
    // })
    'ol,ul': {
      marginLeft: rhythm(1.25),
    },
    // children ol, ul
    'li>ol,li>ul': {
      marginLeft: rhythm(1.25),
    },
    a: {
      color: '#4078c0',
      textDecoration: 'none',
    },
    'a:hover,a:active': {
      textDecoration: 'underline',
    },
    blockquote: {
      borderLeft: `4px solid ${gray(87)}`,
      color: gray(47),
      marginTop: 0,
      marginRight: 0,
      marginLeft: 0,
      paddingLeft: `calc(${rhythm(1/2)} - 1px)`,
    },
  }),
}

export default theme
