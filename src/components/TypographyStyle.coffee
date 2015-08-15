React = require 'react'

createStyles = require '../utils/createStyles'

# TODO
# adding or not adding normalize should be an prop

module.exports = (styles) ->
  React.createClass
    displayName: "TypographyStyle"

    render: ->
      React.DOM.style({
        id: "typography.js"
        dangerouslySetInnerHTML:
          __html: styles()
      })
