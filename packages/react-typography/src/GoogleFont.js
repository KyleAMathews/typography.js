import React from "react"
import PropTypes from "prop-types"

const GoogleFont = props => {
  // Create family + styles string
  let fontsStr = ""
  let subsetsStr = "latin"
  if (props.typography.options.googleFonts) {
    const fonts = props.typography.options.googleFonts.map(font => {
      let str = ""
      str += font.name.split(" ").join("+")
      str += ":"
      str += font.styles.join(",")

      return str
    })

    if (props.typography.options.googleFonts.subset) {
      subsetsStr = props.typography.options.googleFonts.subset.join(",")
    }

    fontsStr = fonts.join("|")

    if (fontsStr) {
      return (
        <link
          href={`//fonts.googleapis.com/css?family=${fontsStr}&subset=${subsetsStr}`}
          rel={"stylesheet"}
          type={"text/css"}
        />
      )
    }
    return null
  }
}

GoogleFont.propTypes = {
  typography: PropTypes.object.isRequired,
}

GoogleFont.displayName = "GoogleFont"

module.exports = GoogleFont
