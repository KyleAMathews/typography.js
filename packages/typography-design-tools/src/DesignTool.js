import React from 'react'
import ReactDOM from 'react-dom/server'
import Typography from 'typography'
import { GoogleFont } from 'react-typography'
import _ from 'lodash'
import themes from '../themes'
import NumberEditor from './NumberEditor'
import gray from 'gray-percentage'
import GoogleFonts from './GoogleFonts'
import Select from './Select'
import SectionTool from './SectionTool'
import msToRatio from './msToRatio'
import ModularScaleTool from './ModularScaleTool'
import parseUnit from 'parse-unit'
import FontSelectTool from './FontSelectTool'
import FontWeightTool from './FontWeightTool'
import fontList from '../filteredGoogleFontList.json'

const requireThemes = require.context('../../', true, /^\.\/typography-theme.*\/src\/index.js$/)
const themeRegistry = []
_.each(themes, (theme) => {
  themeRegistry.push({
    name: theme.name,
    title: theme.title,
    module: requireThemes(theme.requireStr),
  })
})

// Add default theme
themeRegistry.unshift({
  name: 'system',
  title: 'System',
  module: {},
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

const Section = ({ children }) => (
  <div
    style={{
      clear: 'both',
      paddingBottom: 3.75,
      paddingLeft: 7.5,
      paddingRight: 7.5,
    }}
  >
    {children}
  </div>
)
const SectionRow = ({ children }) => (
  <div
    style={{
      marginBottom: 3.75,
      overflow: 'hidden',
    }}
  >
    {children}
  </div>
)

const SectionHeader = ({ children }) => (
  <div
    style={{
      background: gray(17),
      borderBottom: '1px solid',
      borderColor: gray(50),
      fontSize: 12,
      paddingLeft: 7.5,
      marginLeft: -7.5,
      marginRight: -7.5,
      marginBottom: 3.75,
    }}
  >
    {children}
  </div>
)

class DesignTool extends React.Component {
  constructor (props) {
    super()
    this.googleFonts = JSON.stringify(props.typography.options.googleFonts)
    const options = new Typography(props.typography.options).options
    let bodyFamily = _.find(fontList, (font) => font.family === props.typography.options.bodyFontFamily[0])
    let headerFamily = _.find(fontList, (font) => font.family === props.typography.options.headerFontFamily[0])
    if (!bodyFamily) { bodyFamily = {} }
    if (!headerFamily) { headerFamily = {} }
    this.state = {
      selectedTheme: 0,
      options,
      lineHeight: parseUnit(options.baseLineHeight)[0] / parseUnit(options.baseFontSize)[0],
      bodyFamily,
      headerFamily,
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
          fontSize: 10,
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
              fontSize: 15,
              fontWeight: 300,
              marginBottom: 0,
              marginTop: 10,
            }}
          >
            Typography.js
          </div>
          <SectionRow>
            <div
              style={{
                fontSize: 10,
                lineHeight: '15px',
                marginTop: 7.5,
              }}
            >
            Pick theme
            </div>
            <Select
              options={themeRegistry.map((theme) => theme.title)}
              value={this.state.selectedTheme}
              style={{
                width: '100%',
              }}
              onChange={(value) => {
                const newTheme = new Typography(themeRegistry[value].module)
                const newFontSize = parseUnit(newTheme.options.baseFontSize)[0]
                const newLineHeight = parseUnit(newTheme.options.baseLineHeight)[0]
                let newBodyFamily = _.find(
                  fontList, (font) => font.family === newTheme.options.bodyFontFamily[0]
                )
                let newHeaderFamily = _.find(
                  fontList, (font) => font.family === newTheme.options.headerFontFamily[0]
                )
                if (!newBodyFamily) { newBodyFamily = {} }
                if (!newHeaderFamily) { newHeaderFamily = {} }
                this.setState({
                  selectedTheme: parseInt(value, 10),
                  lineHeight: newLineHeight / newFontSize,
                  options: newTheme.options,
                  bodyFamily: newBodyFamily,
                  headerFamily: newHeaderFamily,
                })
              }}
            />
          </SectionRow>
        </Section>
        <Section>
          <SectionHeader>Base Font Size</SectionHeader>
          <SectionRow>
            <SectionTool
              title="Font size"
            >
              <NumberEditor
                unit="px"
                value={parseUnit(this.state.options.baseFontSize)[0]}
                min={9}
                max={100}
                step={0.25}
                decimals={2}
                onValueChange={(value) => {
                  const newOptions = { ...this.state.options }
                  newOptions.baseFontSize = `${value}px`
                  newOptions.baseLineHeight = `${value * this.state.lineHeight}px`
                  this.setState({ options: newOptions })
                }}
              />
            </SectionTool>
            <SectionTool
              title="Line Height"
            >
              <NumberEditor
                unit="number"
                value={this.state.lineHeight}
                min={1}
                max={2.5}
                step={0.01}
                decimals={2}
                onValueChange={(value) => {
                  const newOptions = { ...this.state.options }
                  const fontsize = parseUnit(this.state.options.baseFontSize)[0]
                  newOptions.baseLineHeight = `${fontsize * value}px`
                  this.setState({
                    options: newOptions,
                    lineHeight: value,
                  })
                }}
              />
            </SectionTool>
          </SectionRow>
        </Section>
        <Section>
          <SectionHeader>Modular Scale</SectionHeader>
          {this.state.options.modularScales.slice(0, 1).map((scale, i) => (
            <SectionRow>
              <ModularScaleTool
                key={i}
                modularScale={scale}
                onChange={(newScale) => {
                  const newOptions = { ...this.state.options }
                  newOptions.modularScales[i] = newScale
                  this.setState({ options: newOptions })
                }}
              />
            </SectionRow>
          ))}
        </Section>
        <Section>
          <SectionHeader>Headers</SectionHeader>
          <SectionRow>
            <div>Font</div>
            <FontSelectTool
              type="header"
              options={this.state.options}
              onChange={(options, headerFamily) => {
                this.setState({ options, headerFamily })
              }}
            />
          </SectionRow>
          <SectionRow>
            <SectionTool
              title="Weight"
            >
              <FontWeightTool
                type="header"
                family={this.state.headerFamily}
                weight={this.state.options.headerWeight}
                options={this.state.options}
                onChange={(newOptions) => this.setState({ options: newOptions })}
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
          </SectionRow>
        </Section>
        <Section>
          <SectionHeader>Body</SectionHeader>
          <SectionRow>
            <div>Font</div>
            <FontSelectTool
              type="body"
              options={this.state.options}
              onChange={(options, bodyFamily) => {
                this.setState({ options, bodyFamily })
              }}
            />
          </SectionRow>
          <SectionRow>
            <SectionTool
              title="Body Weight"
            >
              <FontWeightTool
                type="body"
                family={this.state.bodyFamily}
                weight={this.state.options.bodyWeight}
                options={this.state.options}
                onChange={(newOptions) => this.setState({ options: newOptions })}
              />
            </SectionTool>
            <SectionTool
              title="Bold Weight"
            >
              <FontWeightTool
                type="bold"
                family={this.state.bodyFamily}
                weight={this.state.options.boldWeight}
                options={this.state.options}
                onChange={(newOptions) => this.setState({ options: newOptions })}
              />
            </SectionTool>
          </SectionRow>
          <SectionRow>
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
          </SectionRow>
        </Section>
        <Section>
          <SectionHeader>Google Fonts</SectionHeader>
          <GoogleFonts options={this.state.options} />
        </Section>
        <Section>
          <SectionHeader>Advanced</SectionHeader>
          <SectionRow>
            <SectionTool
              title="Block margin-bottom"
            >
              <NumberEditor
                unit="rhythm"
                value={this.state.options.blockMarginBottom}
                min={0.25}
                max={3}
                step={0.1}
                decimals={2}
                onValueChange={(value) => {
                  const options = this.state.options
                  options.blockMarginBottom = parseFloat(value)
                  this.setState({ options: options })
                }}
              />
            </SectionTool>
          </SectionRow>
        </Section>
      </div>
    )
  }
}

export default DesignTool
