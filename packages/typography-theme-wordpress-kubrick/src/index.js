// @flow
import type { OptionsType } from 'Types'
import gray from 'gray-percentage'

const theme: OptionsType = {
  baseFontSize: '12px',
  baseLineHeight: '16.8px',
  headerFontFamily: ['Lucida Grande', 'Verdana', 'Arial', 'Sans-Serif'],
  bodyFontFamily: ['Lucida Grande', 'Verdana', 'Arial', 'Sans-Serif'],
  headerGray: 20,
  bodyGray: 20,
  headerWeight: 'bold',
  bodyWeight: 'normal',
  boldWeight: 'bold',
  overrideStyles: ({ rhythm }) => ({
    h2: {
      marginTop: rhythm(2),
    },
    h3: {
      marginTop: rhythm(2),
    },
    p: {
      marginBottom: '1em',
      marginTop: '1em',
    },
    ol: {
      marginBottom: 0,
      marginLeft: '35px',
    },
    ul: {
      listStyle: 'none',
      marginLeft: 0,
      paddingLeft: '10px',
      textIndent: '-10px',
    },
    li: {
      display: 'list-item',
      marginLeft: '10px',
    },
    'ul li:before': {
      content: '"» "',
    },
    a: {
      color: '#06c',
      textDecoration: 'none',
    },
    'a:hover': {
      color: '#147',
      textDecoration: 'underline',
    },
    'a:visited': {
      color: '#b85b5a',
    },
    blockquote: {
      color: gray(47),
      marginTop: '15px',
      marginRight: '30px',
      marginBottom: 0,
      marginLeft: '10px',
      paddingLeft: '20px',
      borderLeft: `5px solid ${gray(87)}`,
    },
  }),
}

export default theme
