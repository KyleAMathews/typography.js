import React from 'react'
import ReactDOM from 'react-dom/server'
import Typography from 'typography'
import { GoogleFont } from 'react-typography'
import _ from 'lodash'
import themes from '../themes'
import NumberEditor from './NumberEditor'
import gray from 'gray-percentage'
import Select from './Select'
import SectionTool from './SectionTool'
import msToRatio from './msToRatio'
import ModularScaleTool from './ModularScaleTool'

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

const modularScales = [
  {
    name: 'minor second',
    title: '16/15 — minor second',
  },
  {
    title: '9/8 — major second',
    name: 'major second',
  },
  {
    title: '6/5 — minor third',
    name: 'minor third',
  },
  {
    title: '4/3 — major third',
    name: 'major third',
  },
  {
    title: 'Math.sqrt(2) — diminished fourth',
    name: 'diminished fourth',
  },
  {
    title: '3/2 — perfect fifth',
    name: 'perfect fifth',
  },
  {
    title: '8/5 — minor sixth',
    name: 'minor sixth',
  },
  {
    title: '1.618 — golden',
    name: 'golden',
  },
  {
    title: '5/3 — major sixth',
    name: 'major sixth',
  },
  {
    title: '16/9 — minor seventh',
    name: 'minor seventh',
  },
  {
    title: '15/8 — major seventh',
    name: 'major seventh',
  },
  {
    title: '2 — octave',
    name: 'octave',
  },
  {
    title: '5/2 — major tenth',
    name: 'major tenth',
  },
  {
    title: '8/3 — major eleventh',
    name: 'major eleventh',
  },
  {
    title: '3 — major twelfth',
    name: 'major twelfth',
  },
  {
    title: '4 — double octave',
    name: 'double octave',
  },
]

const Section = ({children}) => (
  <div
    style={{
      marginBottom: 10,
      overflow: 'hidden',
      paddingLeft: 10,
      paddingRight: 10,
    }}
  >
    {children}
  </div>
)
const SectionHeader = ({children}) => (
  <div
    style={{
      background: gray(17),
      borderBottom: '1px solid',
      borderColor: gray(50),
      fontSize: 12,
      paddingLeft: 10,
      marginLeft: -10,
      marginRight: -10,
    }}
  >
    {children}
  </div>
)

class DesignTool extends React.Component {
  constructor (props) {
    super()
    this.googleFonts = JSON.stringify(props.typography.options.googleFonts)
    this.state = {
      selectedTheme: 0,
      options: new Typography(props.typography.options).options,
    }
  }

  render () {
    const options = themeRegistry.map((theme, i) => (
      <option key={i} value={i}>{theme.title}</option>
    ))

    // Inject active theme.
    if (typeof document !== 'undefined') {
      let activeTheme = themeRegistry[this.state.selectedTheme].module
      // Copy over plugins/overrideThemeStyles
      activeTheme = { ...activeTheme, ...this.state.options }
      activeTheme.plugins = this.props.typography.options.plugins
      activeTheme.overrideThemeStyles = this.props.typography.options.overrideThemeStyles

      const newTypography = new Typography(activeTheme)
      newTypography.injectStyles()

      // If Google Fonts have changed, insert them.
      if (this.googleFonts !== JSON.stringify(newTypography.options.googleFonts)) {
        const googleFonts = ReactDOM.renderToStaticMarkup(
          React.createFactory(GoogleFont)({ typography: newTypography })
        )
        const head = document.getElementsByTagName('head')[0]
        head.insertAdjacentHTML('beforeend', googleFonts)
        this.googleFonts = JSON.stringify(newTypography.options.googleFonts)
      }
    }

    return (
      <div
        style={{
          fontFamily: toolTypography.options.headerFontFamily,
          fontWeight: 300,
          fontSize: 13,
          lineHeight: 1.5,
          letterSpacing: 0,
          background: 'rgba(0,0,0,0.65)',
          color: 'rgba(255,255,255,0.95)',
          position: 'fixed',
          top: 0,
          right: 0,
          WebkitFontSmoothing: 'auto',
        }}
      >
        <Section>
          <div
            style={{
              color: 'rgba(255,255,255,0.95)',
              fontFamily: toolTypography.options.headerFontFamily,
              fontWeight: 300,
              marginBottom: 0,
              marginTop: 10,
            }}
          >
            Typography.js
          </div>
          <div
            style={{
              fontSize: 10,
              lineHeight: '18px',
              marginTop: 9,
            }}
          >
          Pick theme
          </div>
          <select
            style={{
              background: gray(20),
              border: '1px solid',
              borderColor: gray(50),
              borderRadius: 3,
              color: gray(90),
              fontSize: 12,
            }}
            value={this.state.selectedTheme}
            onChange={(e) => {
              const newTheme = new Typography(themeRegistry[e.target.value].module)
              this.setState({
                selectedTheme: parseInt(e.target.value, 10),
                options: newTheme.options,
              })
            }}
            onKeyDown={(e) => {
              let change = false
              let selectedTheme
              if (e.which === 40 || e.which === 38) {
                e.preventDefault()
              }
              if (e.which === 40) { // arrow down
                change = true
                if (this.state.selectedTheme === themeRegistry.length - 1) {
                  selectedTheme = 0
                } else {
                  selectedTheme = this.state.selectedTheme + 1
                }
              }
              if (e.which === 38) { // arrow up
                change = true
                if (this.state.selectedTheme === 0) {
                  selectedTheme = themeRegistry.length - 1
                } else {
                  selectedTheme = this.state.selectedTheme - 1
                }
              }

              // If keyboard press was up or down then change.
              if (change) {
                const newTheme = new Typography(themeRegistry[selectedTheme].module)
                this.setState({
                  selectedTheme: selectedTheme,
                  options: newTheme.options,
                })
              }

              return false
            }}
          >
            {options}
          </select>
          <hr
            style={{
              marginBottom: 10,
              marginTop: 12,
            }}
          />
        </Section>
        <Section>
          <SectionHeader>Base Font Sizes</SectionHeader>
          <SectionTool
            title="Font size"
          >
            <NumberEditor
              unit="px"
              value={this.state.options.baseFontSize.slice(0, -2)}
              min={9}
              max={100}
              step={1}
              decimals={0}
              onValueChange={(value) => {
                const options = this.state.options
                options.baseFontSize = value + "px"
                this.setState({ options: options })
              }}
            />
          </SectionTool>
          <SectionTool
            title="Line Height"
          >
            <NumberEditor
              unit="px"
              value={this.state.options.baseLineHeight.slice(0, -2)}
              min={9}
              max={100}
              step={1}
              decimals={0}
              onValueChange={(value) => {
                const options = this.state.options
                options.baseLineHeight = value + "px"
                this.setState({ options: options })
              }}
            />
          </SectionTool>
        </Section>
        <Section>
          <SectionHeader>Modular Scales</SectionHeader>
          {this.state.options.modularScales.map((scale, i) => (
            <ModularScaleTool
              key={i}
              modularScale={scale}
              onChange={(newScale) => {
                console.log('newScale', newScale)
                const newOptions = { ...this.state.options }
                newOptions.modularScales[i] = newScale
                this.setState({ options: newOptions })
              }}
            />
          ))}
        </Section>
        <Section>
          <SectionHeader>Headers</SectionHeader>
          <SectionTool
            title="Weight"
          >
            <NumberEditor
              unit=""
              value={this.state.options.headerWeight}
              min={0}
              max={900}
              step={100}
              decimals={0}
              onValueChange={(value) => {
                const options = this.state.options
                options.headerWeight = value
                this.setState({ options: options })
              }}
            />
          </SectionTool>
          <SectionTool
            title="Gray value"
          >
            <NumberEditor
              unit="%"
              value={this.state.options.headerGray}
              min={0}
              max={100}
              step={1}
              decimals={0}
              onValueChange={(value) => {
                const options = this.state.options
                options.headerGray = value
                this.setState({ options: options })
              }}
            />
          </SectionTool>
        </Section>
        <Section>
          <SectionHeader>Body</SectionHeader>
          <SectionTool
            title="Body Weight"
          >
            <NumberEditor
              unit=""
              value={this.state.options.bodyWeight}
              min={0}
              max={900}
              step={100}
              decimals={0}
              onValueChange={(value) => {
                const options = this.state.options
                options.bodyWeight = value
                this.setState({ options: options })
              }}
            />
          </SectionTool>
          <SectionTool
            title="Bold Weight"
          >
            <NumberEditor
              unit=""
              value={this.state.options.boldWeight}
              min={0}
              max={900}
              step={100}
              decimals={0}
              onValueChange={(value) => {
                const options = this.state.options
                options.boldWeight = value
                this.setState({ options: options })
              }}
            />
          </SectionTool>
          <br />
          <SectionTool
            title="Body gray"
          >
            <NumberEditor
              unit="%"
              value={this.state.options.bodyGray}
              min={0}
              max={100}
              step={1}
              decimals={0}
              onValueChange={(value) => {
                const options = this.state.options
                options.bodyGray = value
                this.setState({ options: options })
              }}
            />
          </SectionTool>
        </Section>
        <Section>
          <SectionHeader>Advanced</SectionHeader>
          <SectionTool
            title="Block margin-bottom"
          >
            <NumberEditor
              unit="rhythm"
              value={this.state.options.blockMarginBottom}
              min={0.25}
              max={3}
              step={0.25}
              decimals={2}
              onValueChange={(value) => {
                const options = this.state.options
                options.blockMarginBottom = parseFloat(value)
                this.setState({ options: options })
              }}
            />
          </SectionTool>
        </Section>
      </div>
    )
  }
}

export default DesignTool
