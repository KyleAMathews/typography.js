import React from "react"
import PropTypes from "prop-types"

// A query value, percent-encoded so that no character in a name ends or
// splits it ("&", "#", "%"), with spaces as "+", as Google Fonts writes
// them. A "+" in a name is a space: v0.16 wrote names such as 'Open+Sans'
// into the URL as they were, and no Google family has a "+".
const encode = (text) => encodeURIComponent(text.replace(/\+/g, " ")).replace(/%20/g, "+")

// The Google Fonts CSS API: family=Name:style,style|Name. A font without
// styles is its name alone (the default weight).
const GoogleFont = (props) => {
  const fonts = props.typography.options.googleFonts || []
  if (fonts.length === 0) return null
  const family = fonts
    .map(({ name, styles }) =>
      styles && styles.length > 0
        ? `${encode(name)}:${styles.map(encode).join(",")}`
        : encode(name)
    )
    .join("|")
  return React.createElement("link", {
    href: `//fonts.googleapis.com/css?family=${family}`,
    rel: "stylesheet",
    type: "text/css",
  })
}

GoogleFont.propTypes = {
  typography: PropTypes.object.isRequired,
}

GoogleFont.displayName = "GoogleFont"

module.exports = GoogleFont
