import React from 'react'
import PropTypes from 'prop-types'

class TypographyStyle extends React.Component {
  render() {
    return React.DOM.style({
      id: 'typography.js',
      dangerouslySetInnerHTML: {
        __html: this.props.typography.toString(),
      },
    })
  }
}

TypographyStyle.propTypes = {
  typography: PropTypes.object.isRequired,
}

TypographyStyle.displayName = 'TypographyStyle'

module.exports = TypographyStyle
