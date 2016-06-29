import React from 'react'

module.exports = React.createClass({
  displayName: 'TypographyStyle',

  propTypes: {
    typography: React.PropTypes.object.isRequired,
  },

  render () {
    return React.DOM.style({
      id: 'typography.js',
      dangerouslySetInnerHTML: {
        __html: this.props.typography.toString(),
      },
    })
  },
})
