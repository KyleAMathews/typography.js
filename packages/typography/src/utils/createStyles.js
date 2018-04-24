// @flow
import gray from "gray-percentage"
import set from "lodash/set"
import each from "lodash/forEach"
import isNumber from "lodash/isNumber"
import isString from "lodash/isString"
import isFunction from "lodash/isFunction"
import isArray from "lodash/isArray"
import merge from "lodash/merge"
import reduce from "lodash/reduce"

import type { OptionsType } from "Types"

const setStyles = (
  styles: Object = {},
  els: string | string[],
  rules: Object
) => {
  let elements
  if (!isArray(els)) {
    elements = [els]
  } else {
    elements = els
  }
  each(elements, element => {
    each(rules, (value, prop) => {
      set(styles, `${element}.${prop}`, value)
    })
  })
  return styles
}

// Wrap font names in quotes, unless the font name is actually a keyword.
// See https://stackoverflow.com/a/13752149 and https://www.w3.org/TR/CSS2/fonts.html#font-family-prop
const genericFontFamilies = [
  "inherit",
  "default",
  "serif",
  "sans-serif",
  "monospace",
  "fantasy",
  "cursive",
  "-apple-system",
]
const wrapFontFamily = fontFamily =>
  genericFontFamilies.indexOf(fontFamily) !== -1
    ? fontFamily
    : `'${fontFamily}'`

export default (vr: any, options: OptionsType) => {
  let styles = {}
  const { fontSize, lineHeight } = vr.establishBaseline()

  // Base HTML styles.
  styles = setStyles(styles, "html", {
    font: `${fontSize}/${lineHeight} ${options.bodyFontFamily
      .map(wrapFontFamily)
      .join(",")}`,
    boxSizing: "border-box",
    overflowY: "scroll",
  })

  // box-sizing reset.
  styles = setStyles(styles, ["*", "*:before", "*:after"], {
    boxSizing: "inherit",
  })

  // Base body styles.
  styles = setStyles(styles, "body", {
    color: options.bodyColor,
    fontFamily: options.bodyFontFamily.map(wrapFontFamily).join(","),
    fontWeight: options.bodyWeight,
    wordWrap: "break-word",
    fontKerning: "normal",
    MozFontFeatureSettings: '"kern", "liga", "clig", "calt"',
    msFontFeatureSettings: '"kern", "liga", "clig", "calt"',
    WebkitFontFeatureSettings: '"kern", "liga", "clig", "calt"',
    fontFeatureSettings: '"kern", "liga", "clig", "calt"',
  })

  // Make images responsive.
  styles = setStyles(styles, "img", {
    maxWidth: "100%",
  })

  // All block elements get one rhythm of bottom margin by default
  // or whatever is passed in as option.
  let blockMarginBottom = ""
  if (isNumber(options.blockMarginBottom)) {
    blockMarginBottom = vr.rhythm(options.blockMarginBottom)
  } else if (isString(options.blockMarginBottom)) {
    blockMarginBottom = options.blockMarginBottom
  } else {
    blockMarginBottom = vr.rhythm(1)
  }
  styles = setStyles(
    styles,
    [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "hgroup",
      "ul",
      "ol",
      "dl",
      "dd",
      "p",
      "figure",
      "pre",
      "table",
      "fieldset",
      "blockquote",
      "form",
      "noscript",
      "iframe",
      "img",
      "hr",
      "address",
    ],
    {
      // Reset margin/padding to 0.
      marginLeft: 0,
      marginRight: 0,
      marginTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
      paddingTop: 0,
      marginBottom: blockMarginBottom,
    }
  )

  // Basic blockquote styles.
  styles = setStyles(styles, "blockquote", {
    marginRight: vr.rhythm(1),
    marginBottom: blockMarginBottom,
    marginLeft: vr.rhythm(1),
  })

  // b, strong.
  styles = setStyles(styles, ["b", "strong", "dt", "th"], {
    fontWeight: options.boldWeight,
  })

  // hr.
  styles = setStyles(styles, "hr", {
    background: gray(80),
    border: "none",
    height: "1px",
    marginBottom: `calc(${blockMarginBottom} - 1px)`,
  })

  // ol, ul.
  styles = setStyles(styles, ["ol", "ul"], {
    listStylePosition: "outside",
    listStyleImage: "none",
    marginLeft: vr.rhythm(1),
  })

  // li.
  styles = setStyles(styles, "li", {
    marginBottom: `calc(${blockMarginBottom} / 2)`,
  })

  // Remove default padding on list items.
  styles = setStyles(styles, ["ol li", "ul li"], {
    paddingLeft: 0,
  })

  // children ol, ul.
  styles = setStyles(styles, ["li > ol", "li > ul"], {
    marginLeft: vr.rhythm(1),
    marginBottom: `calc(${blockMarginBottom} / 2)`,
    marginTop: `calc(${blockMarginBottom} / 2)`,
  })

  // Remove margin-bottom on the last-child of a few block elements
  // The worst offender of this seems to be markdown => html compilers
  // as they put paragraphs within LIs amoung other oddities.
  styles = setStyles(
    styles,
    ["blockquote *:last-child", "li *:last-child", "p *:last-child"],
    {
      marginBottom: 0,
    }
  )

  // Ensure li > p is 1/2 margin — this is another markdown => compiler oddity.
  styles = setStyles(styles, ["li > p"], {
    marginBottom: `calc(${blockMarginBottom} / 2)`,
  })

  // Make generally smaller elements, smaller.
  styles = setStyles(styles, ["code", "kbd", "pre", "samp"], {
    ...vr.adjustFontSizeTo("85%"),
  })

  // Abbr, Acronym.
  styles = setStyles(styles, ["abbr", "acronym"], {
    borderBottom: `1px dotted ${gray(50)}`,
    cursor: "help",
  })
  styles["abbr[title]"] = {
    borderBottom: `1px dotted ${gray(50)}`,
    cursor: "help",
    textDecoration: "none",
  }

  // Table styles.
  styles = setStyles(styles, ["table"], {
    ...vr.adjustFontSizeTo(options.baseFontSize),
    borderCollapse: "collapse",
    width: "100%",
  })
  styles = setStyles(styles, ["thead"], {
    textAlign: "left",
  })
  styles = setStyles(styles, ["td,th"], {
    textAlign: "left",
    borderBottom: `1px solid ${gray(88)}`,
    fontFeatureSettings: '"tnum"',
    MozFontFeatureSettings: '"tnum"',
    msFontFeatureSettings: '"tnum"',
    WebkitFontFeatureSettings: '"tnum"',
    paddingLeft: vr.rhythm(2 / 3),
    paddingRight: vr.rhythm(2 / 3),
    paddingTop: vr.rhythm(1 / 2),
    paddingBottom: `calc(${vr.rhythm(1 / 2)} - 1px)`,
  })
  styles = setStyles(styles, "th:first-child,td:first-child", {
    paddingLeft: 0,
  })
  styles = setStyles(styles, "th:last-child,td:last-child", {
    paddingRight: 0,
  })

  // Create styles for headers.
  styles = setStyles(styles, ["h1", "h2", "h3", "h4", "h5", "h6"], {
    color: options.headerColor,
    fontFamily: options.headerFontFamily.map(wrapFontFamily).join(","),
    fontWeight: options.headerWeight,
    textRendering: "optimizeLegibility",
  })

  // Set header sizes.
  const h1 = vr.scale(5 / 5)
  const h2 = vr.scale(3 / 5)
  const h3 = vr.scale(2 / 5)
  const h4 = vr.scale(0 / 5)
  const h5 = vr.scale(-1 / 5)
  const h6 = vr.scale(-1.5 / 5)

  each([h1, h2, h3, h4, h5, h6], (header, i) => {
    styles = set(styles, `h${i + 1}.fontSize`, header.fontSize)
    styles = set(styles, `h${i + 1}.lineHeight`, options.headerLineHeight)
  })

  // TODO add support for Breakpoints here.

  // Call plugins if any.
  if (isArray(options.plugins)) {
    styles = reduce(
      options.plugins,
      (stylesObj, plugin) => merge(stylesObj, plugin(vr, options, stylesObj)),
      styles
    )
  }

  // Call overrideStyles function on options (if set).
  if (options.overrideStyles && isFunction(options.overrideStyles)) {
    styles = merge(styles, options.overrideStyles(vr, options, styles))
  }

  // Call overrideThemeStyles function on options (if set).
  if (options.overrideThemeStyles && isFunction(options.overrideThemeStyles)) {
    styles = merge(styles, options.overrideThemeStyles(vr, options, styles))
  }

  return styles
}
