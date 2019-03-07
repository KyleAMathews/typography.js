// @flow
import objectAssign from "object-assign"
import verticalRhythm from "compass-vertical-rhythm"
import ms from "modularscale"

import createStyles from "./utils/createStyles"
import compileStyles from "./utils/compileStyles"
import type { OptionsType } from "Types"

const typography = function(opts: OptionsType) {
  const defaults: OptionsType = {
    baseFontSize: "16px",
    baseLineHeight: 1.45,
    headerLineHeight: 1.1,
    scaleRatio: 2,
    googleFonts: [],
    headerFontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Roboto",
      "Oxygen",
      "Ubuntu",
      "Cantarell",
      "Fira Sans",
      "Droid Sans",
      "Helvetica Neue",
      "sans-serif",
    ],
    bodyFontFamily: ["georgia", "serif"],
    headerColor: "inherit",
    bodyColor: "hsla(0,0%,0%,0.8)",
    headerWeight: "bold",
    bodyWeight: "normal",
    boldWeight: "bold",
    includeNormalize: true,
    blockMarginBottom: 1,
  }

  const options = objectAssign({}, defaults, opts)

  const vr = verticalRhythm(options)

  // Add this function to the vertical rhythm object so it'll be passed around
  // as well and be available. Not related really but this is the easiest
  // way to pass around extra utility functions atm... :-\
  vr.scale = (value: number) => {
    // This doesn't pick the right scale ratio if a theme has more than one ratio.
    // Perhaps add optional parameter for a width and it'll get the ratio
    // for this width. Tricky part is maxWidth could be set in non-pixels.
    const baseFont = parseInt(options.baseFontSize, 10)
    const newFontSize = `${ms(value, options.scaleRatio) * baseFont}px`
    return vr.adjustFontSizeTo(newFontSize)
  }

  return {
    options,
    ...vr,
    createStyles() {
      return this.toString()
    }, // TODO remove in next breaking release.
    toJSON() {
      return createStyles(vr, options)
    },
    toString() {
      return compileStyles(vr, options, this.toJSON())
    },
    injectStyles() {
      if (typeof document !== "undefined") {
        // Replace existing
        if (document.getElementById("typography.js")) {
          const styleNode = document.getElementById("typography.js")
          styleNode.innerHTML = this.toString()
        } else {
          const node = document.createElement("style")
          node.id = "typography.js"
          node.innerHTML = this.toString()
          const head = document.head
          if (head.firstChild) {
            head.insertBefore(node, head.firstChild)
          } else {
            head.appendChild(node)
          }
        }
      }
    },
  }
}

export default typography
