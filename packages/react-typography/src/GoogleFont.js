import React from 'react'

module.exports = React.createClass({
  displayName: 'GoogleFont',

  propTypes: {
    typography: React.PropTypes.object.isRequired,
  },

  render () {
    // Create family + styles string
    let fontsStr = ''
    if (this.props.typography.options.googleFonts) {
      const fonts = this.props.typography.options.googleFonts.map((font) => {
        let str = ''
        str += font.name.split(' ').join('+')
        str += ':'
        str += font.styles.join(',')

        return str
      })

      fontsStr = fonts.join('|')

      if (fontsStr) {
        return React.DOM.link({
          href: `//fonts.googleapis.com/css?family=${fontsStr}`,
          rel: 'stylesheet',
          type: 'text/css',
        })
      }
    }
    return null
  },
})
