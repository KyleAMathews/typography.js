React = require 'react'

module.exports = (options) ->
  React.createClass
    displayName: "GoogleFont"

    render: ->
      # Create family + styles string
      fontsStr = ""
      fonts = options.googleFonts.map (font) ->
        str = ""
        str += font.name.split(' ').join('+')
        str += ":"
        str += font.styles.join(',')

        return str

      fontsStr = fonts.join('|')

      if fontsStr
        React.DOM.link({
          href: "//fonts.googleapis.com/css?family=#{fontsStr}"
          rel: "stylesheet"
          type: "text/css"
        })
      else
        null
