React = require 'react'

createStyles = require '../utils/createStyles'

# TODO
# responsive modular scales
# adding or not adding normalize should be an prop

module.exports = (vr, options) ->
  React.createClass
    displayName: "TypographyStyle"

    PropTypes:
      minify: React.PropTypes.bool

    getDefaultProps: ->
      minify: true

    render: ->
      styles = createStyles(vr, options)

      # Minify styles
      if @props.minify
        styles = styles.replace(/\s/g, '')

      <style id="react-typography">{styles}</style>
