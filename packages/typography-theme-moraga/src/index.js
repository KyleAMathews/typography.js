// @flow
import type { OptionsType } from "Types"
import gray from "gray-percentage"
import { TABLET_MEDIA_QUERY } from "typography-breakpoint-constants"

const theme: OptionsType = {
  title: "Moraga",
  baseFontSize: "18px",
  baseLineHeight: 1.56,
  googleFonts: [
    {
      name: "Source Sans Pro",
      styles: ["200", "400", "400i", "700"],
    },
  ],
  scaleRatio: 2.5,
  headerFontFamily: ["Source Sans Pro", "sans-serif"],
  bodyFontFamily: ["Source Sans Pro", "sans-serif"],
  headerColor: "hsla(0,0%,0%,0.85)",
  bodyColor: "hsla(0,0%,0%,0.7)",
  headerWeight: "200",
  bodyWeight: 400,
  boldWeight: 700,
  overrideStyles: ({ scale, rhythm }, options) => {
    // The mobile baseline: a 16px base (a percentage of the browser's
    // 16px) and its line height.
    const mobileBaseline = {
      fontSize: `${(16 / 16) * 100}%`,
      lineHeight: "24.88px",
    }

    const styles = {
      "h1 a,h2 a,h3 a,h4 a,h5 a,h6 a": {
        fontWeight: options.headerWeight,
      },
      a: {
        fontWeight: 400,
        color: "#419eda",
        textDecoration: "none",
      },
      "a:hover": {
        color: "#2a6496",
        textDecoration: "underline",
      },
      blockquote: {
        ...scale(1 / 5),
        color: gray(40),
        paddingLeft: rhythm(3 / 4),
        marginLeft: 0,
        borderLeft: `${rhythm(1 / 4)} solid ${gray(87)}`,
      },
      // Mobile styles.
      [TABLET_MEDIA_QUERY]: {
        html: {
          ...mobileBaseline,
        },
        blockquote: {
          marginLeft: rhythm(-3 / 4),
          marginRight: 0,
          paddingLeft: rhythm(1 / 2),
        },
        table: {
          ...scale(-1 / 5),
        },
      },
    }

    return styles
  },
}

export default theme
