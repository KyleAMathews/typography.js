// @flow
import gray from "gray-percentage"

// blockMarginBottom as the core reads it: one rhythm unit for null or
// undefined, rhythm units when rhythm() takes the value (a number or a
// numeric string), and any other string as written. typography 0.17's
// rhythm() throws for such a string; 0.16's returned NaN text, and read null
// as 0.
const blockMargin = (rhythm: Function, value: mixed) => {
  if (value == null) return rhythm(1)
  try {
    const margin = rhythm(value)
    return /NaN/.test(String(margin)) ? value : margin
  } catch (error) {
    return value
  }
}

// A negative padding, or auto, is not CSS, and a CSS-wide word means another
// thing on padding (inherit takes the parent's padding): these pad with the
// reset's 0. The words are the core's margin keywords (utils/css.js).
const zeroPadding = /^[ \t\n\r\f]*(?:-|(?:auto|inherit|initial|unset|revert|revert-layer)[ \t\n\r\f]*$)/i

const CodePlugin =
  (): Function =>
  ({ rhythm }: Object, options: Object) => {
    const margin = blockMargin(rhythm, options.blockMarginBottom)
    const padding = zeroPadding.test(String(margin)) ? 0 : margin
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
        padding,
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
