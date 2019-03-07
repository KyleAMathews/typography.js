// @flow
import gray from "gray-percentage"
import type { OptionsType } from "Types"

const theme: OptionsType = {
  title: "GitHub",
  baseFontSize: "16px",
  baseLineHeight: 1.625,
  headerFontFamily: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica",
    "Arial",
    "sans-serif",
    "Apple Color Emoji",
    "Segoe UI Emoji",
    "Segoe UI Symbol",
  ],
  bodyFontFamily: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica",
    "Arial",
    "sans-serif",
    "Apple Color Emoji",
    "Segoe UI Emoji",
    "Segoe UI Symbol",
  ],
  scaleRatio: 2,
  bodyColor: "hsla(0,0%,0%,0.8)",
  headerWeight: 600,
  bodyWeight: "normal",
  boldWeight: 600,
  // Github has all block elements use 1/2 rhythm not a full rhythm.
  blockMarginBottom: 1 / 2,
  overrideStyles: ({ rhythm }) => ({
    h1: {
      borderBottom: `1px solid ${gray(93)}`,
      paddingBottom: `calc(${rhythm(1 / 4)} - 1px)`,
      marginBottom: rhythm(3 / 4),
      marginTop: rhythm(1.5),
    },
    h2: {
      borderBottom: `1px solid ${gray(93)}`,
      paddingBottom: `calc(${rhythm(1 / 4)} - 1px)`,
      marginBottom: rhythm(1 / 4),
      marginTop: rhythm(1),
    },
    h6: {
      color: gray(47),
    },
    "h3,h4,h5,h6": {
      marginBottom: rhythm(1 / 2),
      marginTop: rhythm(1),
    },
    "ol,ul": {
      marginLeft: rhythm(1.25),
    },
    // children ol, ul
    "li>ol,li>ul": {
      marginLeft: rhythm(1.25),
    },
    a: {
      color: "#4078c0",
      textDecoration: "none",
    },
    "a:hover,a:active": {
      textDecoration: "underline",
    },
    blockquote: {
      borderLeft: `4px solid ${gray(87)}`,
      color: gray(47),
      marginTop: 0,
      marginRight: 0,
      marginLeft: 0,
      paddingLeft: `calc(${rhythm(1 / 2)} - 1px)`,
    },
  }),
}

export default theme
