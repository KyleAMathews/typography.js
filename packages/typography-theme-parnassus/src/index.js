// @flow
import gray from "gray-percentage"
import type { OptionsType } from "Types"
import {
  TABLET_MEDIA_QUERY,
  MOBILE_MEDIA_QUERY,
} from "typography-breakpoint-constants"
import verticalRhythm from "compass-vertical-rhythm"

const theme: OptionsType = {
  title: "Parnassus",
  baseFontSize: "17px",
  baseLineHeight: 1.82,
  scaleRatio: 2.25,
  googleFonts: [
    {
      name: "Merriweather Sans",
      styles: ["800"],
    },
    {
      name: "Merriweather",
      styles: ["400", "400i", "700"],
    },
  ],
  headerFontFamily: ["Merriweather Sans", "sans-serif"],
  bodyFontFamily: ["Merriweather", "sans-serif"],
  headerColor: "hsla(0,0%,0%,0.9)",
  bodyColor: "hsla(0,0%,0%,0.8)",
  headerWeight: 800,
  bodyWeight: 400,
  boldWeight: 700,
  overrideStyles: ({ adjustFontSizeTo, scale, rhythm }, options) => {
    const vr = verticalRhythm({
      baseFontSize: "15px",
      baseLineHeight: "27.35px",
    })

    return {
      a: {
        color: "#375c85",
        textDecoration: "none",
        boxShadow: "0 1px 0 0 currentColor",
      },
      "a:hover,a:active": {
        boxShadow: "none",
      },
      "h1,h2,h3,h4,h5,h6": {
        marginTop: rhythm(2),
      },
      blockquote: {
        ...scale(1 / 5),
        color: gray(41),
        paddingLeft: rhythm(18 / 16),
        marginLeft: 0,
        borderLeft: `${rhythm(6 / 16)} solid`,
        borderColor: gray(90),
      },
      "blockquote > :last-child": {
        marginBottom: 0,
      },
      "blockquote cite": {
        ...adjustFontSizeTo(options.baseFontSize),
        color: options.bodyColor,
        fontWeight: options.bodyWeight,
      },
      "blockquote cite:before": {
        content: '"— "',
      },
      [MOBILE_MEDIA_QUERY]: {
        blockquote: {
          marginLeft: rhythm(-3 / 4),
          marginRight: 0,
          borderLeft: `${rhythm(3 / 16)} solid`,
          borderColor: gray(90),
          paddingLeft: rhythm(9 / 16),
        },
      },
      [TABLET_MEDIA_QUERY]: {
        html: {
          ...vr.establishBaseline(),
        },
      },
    }
  },
}

export default theme
