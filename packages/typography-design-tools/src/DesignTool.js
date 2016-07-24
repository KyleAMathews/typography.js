import React from 'react'
import ReactDOM from 'react-dom/server'
import Typography from 'typography'
import { GoogleFont } from 'react-typography'
import _ from 'lodash'
import themes from '../themes'
const requireThemes = require.context('../../', true, /^\.\/typography-theme.*\/src\/index.js$/)
const themeRegistry = []
_.each(themes, (theme) => {
  themeRegistry.push({
    name: theme.name,
    title: theme.title,
    module: requireThemes(theme.requireStr),
  })
})

const toolTypography = new Typography({ includeNormalize: false })

class DesignTool extends React.Component {
  constructor () {
    super()
    this.state = {
      selectedTheme: 0,
    }
  }
  render () {
    const { rhythm } = this.props.typography
    const options = themeRegistry.map((theme, i) => (
      <option key={i} value={i}>{theme.title}</option>
    ))

    // Inject active theme.
    if (typeof document !== 'undefined') {
      const activeTheme = themeRegistry[this.state.selectedTheme].module
      // Copy over plugins/overrideThemeStyles
      activeTheme.plugins = this.props.typography.options.plugins
      activeTheme.overrideThemeStyles = this.props.typography.options.overrideThemeStyles

      const newTypography = new Typography(activeTheme)
      newTypography.injectStyles()
      const googleFonts = ReactDOM.renderToStaticMarkup(
        React.createFactory(GoogleFont)({ typography: newTypography })
      )
      const head = document.getElementsByTagName('head')[0]
      head.insertAdjacentHTML('beforeend', googleFonts)
    }

    return (
      <div
        style={{
          fontFamily: toolTypography.options.headerFontFamily,
          fontWeight: 300,
          fontSize: 14,
          lineHeight: 1.5,
          letterSpacing: 0,
          background: 'rgba(0,0,0,0.65)',
          color: 'rgba(255,255,255,0.95)',
          position: 'fixed',
          padding: 15,
          top: 0,
          right: 0,
        }}
      >
        <div
          style={{
            color: 'rgba(255,255,255,0.95)',
            fontFamily: toolTypography.options.headerFontFamily,
            fontWeight: 300,
            marginBottom: 0,
          }}
        >
          Typography.js<br /> design tool
        </div>
        <div>Pick theme</div>
        <select
          value={this.state.selectedTheme}
          onChange={(e) => {
            this.setState({ selectedTheme: parseInt(e.target.value, 10) })
          }}
          onKeyDown={(e) => {
            if (e.which === 40 || e.which === 38) {
              e.preventDefault()
            }
            if (e.which === 40) { // arrow down
              if (this.state.selectedTheme === themeRegistry.length - 1) {
                this.setState({ selectedTheme: 0 })
              } else {
                this.setState({ selectedTheme: this.state.selectedTheme + 1 })
              }
            }
            if (e.which === 38) { // arrow down
              if (this.state.selectedTheme === 0) {
                this.setState({ selectedTheme: themeRegistry.length - 1 })
              } else {
                this.setState({ selectedTheme: this.state.selectedTheme - 1 })
              }
            }
            return false
          }}
        >
          {options}
        </select>
        <div>
          <br />
          <a
            target="_blank"
            style={{
              boxShadow: 'none',
              backgroundImage: 'none',
              fontFamily: toolTypography.options.headerFontFamily,
              fontWeight: 300,
              fontSize: 14,
              lineHeight: 1.5,
              letterSpacing: 0,
              color: 'rgba(255,255,255,0.95)',
              textShadow: 'none',
              textDecoration: 'underline',
            }}
            href={`https://github.com/KyleAMathews/typography.js/tree/master/packages/${themeRegistry[this.state.selectedTheme].name}`}
          >
            How to use
          </a>
        </div>
      </div>
    )
  }
}

export default DesignTool
