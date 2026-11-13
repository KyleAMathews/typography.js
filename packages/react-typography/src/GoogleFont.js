import React from "react"
import PropTypes from "prop-types"

// A name with its spaces as "+", as v0.16 wrote it and Google Fonts reads it.
// Names and styles are otherwise written as given: sites put query
// parameters such as "&display=swap" into a style.
const plusSpaces = (text) => String(text).split(" ").join("+")

// The Google Fonts CSS API: family=Name:style,style|Name. A font without
// styles is its name alone (the default weight).
const GoogleFont = (props) => {
  const fonts = props.typography.options.googleFonts || []
  if (fonts.length === 0) return null
  const family = fonts
    .map(({ name, styles }) =>
      styles && styles.length > 0
        ? `${plusSpaces(name)}:${styles.join(",")}`
        : plusSpaces(name)
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
