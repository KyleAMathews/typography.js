// @flow
import gray from "gray-percentage"

const CodePlugin =
  (): Function =>
  (vr: Object, options: Object, styles: Object) => {
    // The block margin as the core wrote it for pre. A negative one, or auto,
    // is not a padding; the reset's 0 is what browsers keep.
    const blockMarginBottom = styles.pre.marginBottom
    const padding = /^[ \t\n\r\f]*(?:-|auto[ \t\n\r\f]*$)/i.test(String(blockMarginBottom)) ? 0 : blockMarginBottom
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
