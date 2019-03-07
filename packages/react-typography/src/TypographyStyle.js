import React from "react"
import PropTypes from "prop-types"

const TypographyStyle = props => (
  <style
    id={"typography.js"}
    dangerouslySetInnerHTML={{
      __html: props.typography.toString(),
    }}
  />
)

TypographyStyle.propTypes = {
  typography: PropTypes.object.isRequired,
}

TypographyStyle.displayName = "TypographyStyle"

module.exports = TypographyStyle
