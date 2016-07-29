// @flow
import type { OptionsType } from 'Types'
import gray from 'gray-percentage'
import isNumber from 'lodash/isNumber'
import isString from 'lodash/isString'

const CodePlugin = (): Function =>
({ adjustFontSizeTo, rhythm }, options: OptionsType) => {
  let blockMarginBottom
  if (isNumber(options.blockMarginBottom)) {
    blockMarginBottom = rhythm(options.blockMarginBottom)
  } else if (isString(options.blockMarginBottom)) {
    blockMarginBottom = options.blockMarginBottom
  } else {
    blockMarginBottom = rhythm(1)
  }
  return {
    'tt,code': {
      backgroundColor: 'rgba(0,0,0,0.04)',
      borderRadius: '3px',
      fontFamily: '"Inconsolata",Consolas,"Liberation Mono",Menlo,Courier,monospace',
      padding: 0,
      paddingTop: '0.2em',
      paddingBottom: '0.2em',
    },
    pre: {
      background: gray(97),
      borderRadius: '3px',
      lineHeight: 1.42,
      overflow: 'auto',
      padding: blockMarginBottom,
    },
    'pre code': {
      background: gray(97),
      lineHeight: 1.42,
    },
    // Add space before and after code/tt elements.
    'code:before,code:after,tt:before,tt:after': {
      letterSpacing: '-0.2em',
      content: '"\u00A0"',
    },
    // But don't add spaces if code is inside a pre.
    'pre code:before,pre code:after,pre tt:before,pre tt:after': {
      content: '""',
    },
  }
}

export default CodePlugin
