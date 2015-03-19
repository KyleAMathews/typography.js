React = require 'react'

createStyles = require '../utils/createStyles'

# TODO
# adding or not adding normalize should be an prop

module.exports = (vr, options) ->
  React.createClass
    displayName: "TypographyStyle"

    render: ->
      styles = createStyles(vr, options)

      <style
        id="react-typography"
        dangerouslySetInnerHTML={{__html: styles}}
      />
