import React from 'react'

// TODO
// adding or not adding normalize should be an prop

module.exports = styles =>
  React.createClass({
    displayName: 'TypographyStyle',

    render () {
      return React.DOM.style({
        id: 'typography.js',
        dangerouslySetInnerHTML: {
          __html: styles(),
        },
      })
    },
  })

