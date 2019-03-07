// @flow
import type { OptionsType } from "Types"
import gray from "gray-percentage"
import { TABLET_MEDIA_QUERY } from "typography-breakpoint-constants"

const theme: OptionsType = {
  title: "Irving",
  baseFontSize: "21px",
  baseLineHeight: 1.38,
  scaleRatio: 1.5,
  googleFonts: [
    {
      name: "Exo",
      styles: ["700"],
    },
    {
      name: "Yrsa",
      styles: ["400", "700"],
    },
  ],
  headerFontFamily: ["Exo", "sans-serif"],
  bodyFontFamily: ["Yrsa", "georgia", "sans-serif"],
  bodyColor: "hsla(0,0%,0%,0.8)",
  headerWeight: 700,
  bodyWeight: 400,
  boldWeight: 700,
  overrideStyles: ({ adjustFontSizeTo, scale, rhythm }, options) => {
    const styles = {
      a: {
        color: options.bodyColor,
      },
      "a:hover": {
        color: "#3498DB",
      },
      blockquote: {
        ...scale(1 / 5),
        color: gray(30),
        paddingLeft: rhythm(3 / 4),
        marginLeft: 0,
        marginRight: 0,
        borderLeft: `${rhythm(1 / 4)} solid ${gray(13)}`,
      },
      "h3,h4,h5,h6": {
        marginBottom: rhythm(1 / 2),
      },
      table: {
        ...scale(-1 / 5),
      },
      // Mobile styles.
      [TABLET_MEDIA_QUERY]: {
        blockquote: {
          marginLeft: rhythm(-3 / 4),
          marginRight: 0,
          paddingLeft: rhythm(1 / 2),
        },
      },
    }

    return styles
  },
}

export default theme
