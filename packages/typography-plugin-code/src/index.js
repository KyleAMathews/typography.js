// @flow
import type { OptionsType } from "Types"
import gray from "gray-percentage"
import isNumber from "lodash/isNumber"
import isString from "lodash/isString"

const CodePlugin =
  (): Function =>
  ({ rhythm }, options: OptionsType) => {
    // As the core reads it: rhythm units as a number or numeric string, any
    // other string as CSS.
    let blockMarginBottom
    if (
      isNumber(options.blockMarginBottom) ||
      (isString(options.blockMarginBottom) &&
        /^[ \t\n\r\f]*[+-]?(?:\d*\.\d+|\d+)(?:e[+-]?\d+)?[ \t\n\r\f]*$/i.test(
          options.blockMarginBottom
        ))
    ) {
      blockMarginBottom = rhythm(options.blockMarginBottom)
    } else if (isString(options.blockMarginBottom)) {
      blockMarginBottom = options.blockMarginBottom
    } else {
      blockMarginBottom = rhythm(1)
    }
    return {
      "tt,code": {
        backgroundColor: gray(96),
        borderRadius: "3px",
        fontFamily:
          '"SFMono-Regular", Consolas,"Roboto Mono","Droid Sans Mono","Liberation Mono",Menlo,Courier,monospace',
        padding: 0,
        paddingTop: "0.2em",
        paddingBottom: "0.2em",
      },
      pre: {
        background: gray(96),
        borderRadius: "3px",
        lineHeight: 1.42,
        overflow: "auto",
        wordWrap: "normal", // So code will scroll on Safari.
        // A negative padding is not CSS; the reset's 0 is what browsers keep.
        padding: /^-/.test(String(blockMarginBottom)) ? 0 : blockMarginBottom,
      },
      "pre code": {
        background: "none",
        lineHeight: 1.42,
      },
      // Add space before and after code/tt elements.
      "code:before,code:after,tt:before,tt:after": {
        letterSpacing: "-0.2em",
        content: '"\u00A0"',
      },
      // But don't add spaces if the code is inside a pre.
      "pre code:before,pre code:after,pre tt:before,pre tt:after": {
        content: "none",
      },
    }
  }

export default CodePlugin
