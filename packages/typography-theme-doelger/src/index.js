// @flow
import gray from "gray-percentage"
import type { OptionsType } from "Types"
import { MOBILE_MEDIA_QUERY } from "typography-breakpoint-constants"

const theme: OptionsType = {
  title: "Doelger",
  baseFontSize: "17px",
  baseLineHeight: 1.45,
  blockMarginBottom: 0.8,
  googleFonts: [
    {
      name: "Arvo",
      styles: ["700"],
    },
    {
      name: "Cabin",
      styles: ["400", "400i", "700"],
    },
  ],
  headerFontFamily: ["Arvo", "sans-serif"],
  bodyFontFamily: ["Cabin", "serif"],
  headerColor: "hsla(0,0%,0%,0.9)",
  bodyColor: "hsla(0,0%,0%,0.8)",
  headerWeight: "700",
  bodyWeight: 400,
  boldWeight: 700,
  overrideStyles: ({ adjustFontSizeTo, scale, rhythm }, options) => {
    const linkColor = "#ff483b"
    return {
      a: {
        color: linkColor,
        textDecoration: "none",
        textShadow:
          ".03em 0 #fff,-.03em 0 #fff,0 .03em #fff,0 -.03em #fff,.06em 0 #fff,-.06em 0 #fff,.09em 0 #fff,-.09em 0 #fff,.12em 0 #fff,-.12em 0 #fff,.15em 0 #fff,-.15em 0 #fff", // eslint-disable-line
        backgroundImage: `linear-gradient(to top, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0) 1px, ${linkColor} 1px, ${linkColor} 2px, rgba(0, 0, 0, 0) 2px)`, // eslint-disable-line
      },
      "a:hover,a:active": {
        textShadow: "none",
        backgroundImage: "none",
      },
      "h1,h2,h3,h4,h5,h6": {
        lineHeight: 1.2,
        marginTop: rhythm(1.5),
        marginBottom: rhythm(0.5),
      },
      // Blockquote styles.
      blockquote: {
        ...scale(1 / 5),
        borderLeft: `${rhythm(6 / 16)} solid ${linkColor}`,
        color: gray(35),
        paddingLeft: rhythm(10 / 16),
        fontStyle: "italic",
        marginLeft: 0,
        marginRight: 0,
      },
      "blockquote > :last-child": {
        marginBottom: 0,
      },
      "blockquote cite": {
        ...adjustFontSizeTo(options.baseFontSize),
        color: options.bodyColor,
        fontStyle: "normal",
        fontWeight: options.bodyWeight,
      },
      "blockquote cite:before": {
        content: '"— "',
      },
      [MOBILE_MEDIA_QUERY]: {
        blockquote: {
          borderLeft: `${rhythm(3 / 16)} solid ${linkColor}`,
          paddingLeft: rhythm(9 / 16),
          fontStyle: "italic",
          marginLeft: rhythm(-3 / 4),
          marginRight: 0,
        },
      },
    }
  },
}

export default theme
