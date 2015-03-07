React = require 'react/addons'
_ = require 'underscore'
$ = require 'jquery'
gray = require 'gray-percentage'
deepEqual = require 'deep-equal'

controls = require('../src')()

{rhythm} = require('../src')()
Typography = require '../src/'
GridOverlay = require './GridOverlay'

ratios =
  "minor second": "16/15"
  "major second": "9/8"
  "minor third": "6/5"
  "major third": "4/3"
  "diminished fourth": "Math.sqrt(2)"
  "perfect fifth": "3/2"
  "minor sixth": "8/5"
  "golden": "1.61803398875"
  "phi": "1.61803398875"
  "major sixth": "5/3"
  "minor seventh": "16/9"
  "major seventh": "15/8"
  "octave": "2"
  "major tenth": "5/2"
  "major eleventh": "8/3"
  "major twelfth": "3"
  "double octave": "4"

fonts = [
  "Abril"
  "Fatface"
  "Open Sans"
  "Open Sans Condensed"
  "Crimson Text"
  "Almendra Display"
  "Philosopher"
  "Gentium Book Basic"
  "Vollkorn"
  "Gravitas One"
  "Lato"
  "Old Standard TT"
  "PT Serif"
  "PT Sans Narrow"
  "Merriweather"
  "Playfair Display"
  "Oswald"
  "PT Mono"
  "Cardo"
  "Inconsolata"
  "Roboto"
  "Roboto Slab"
  "Source Sans Pro"
  "Alegreya"
  "Libre Baskerville"
  "Railway"
  "Unica One"
  "Megrim"
  "Ovo"
  "Neuton"
  "Fanwood Text"
]

fonts = fonts.sort()

module.exports = React.createClass
  displayName: "Controls"

  mixins: [React.addons.LinkedStateMixin]

  getInitialState: ->
    showVerticalRhythmGrid: false
    headerFont: "Lato"
    bodyFont: "Lato"
    baseFontSize: 16
    baseLineHeight: 24
    modularScale: 'diminished fourth'
    headerWeight: 400
    showConfiguration: false

  shouldComponentUpdate: (nextProps, nextState) ->
    return not deepEqual(nextState, @state)

  componentWillUpdate: (nextProps, nextState) ->
    @props.onChange nextState

  render: ->
    modularScalesOptions = _.pairs(ratios).map (ratio) ->
      <option key={ratio[0]} value={ratio[0]}>{ratio[0]} — {ratio[1]}</option>

    headerFontOptions = fonts.map (font) ->
      <option key={font + "-header"} value={font}>{font}</option>

    bodyFontOptions = fonts.map (font) ->
      <option key={font + "-body"} value={font}>{font}</option>

    <div style={{
      fontSize: 16
      lineHeight: "24px"
      fontFamily: "Source Sans Pro"
    }}>
      <input
        checkedLink={@linkState("showVerticalRhythmGrid")}
        style={{marginBottom: 8}}
        type="checkbox"
      />
      {' '}<label>Show vertical rhythm grid</label>

      <label style={{display: "block", width: "100%"}}>Header font</label>
      <select style={{marginBottom: 8}}  onChange={@onHeaderFontChange} value={@state.headerFont}>{headerFontOptions}</select>

      <label style={{display: "block", width: "100%"}}>Header weight (not all fonts have all weights)</label>
      <select style={{marginBottom: 8}}  valueLink={@linkState('headerWeight')}>
        <option key=100 value=100>100</option>
        <option key=400 value=400>400</option>
        <option key=700 value=700>700</option>
        <option key=900 value=900>900</option>
      </select>

      <label style={{display: "block", width: "100%"}}>Body font</label>
      <select style={{marginBottom: 8}} onChange={@onBodyFontChange} value={@state.bodyFont}>{bodyFontOptions}</select>

      <label style={{display: "block", width: "100%"}}>Modular scale</label>
      <select style={{marginBottom: 8}} valueLink={@linkState('modularScale')}>{modularScalesOptions}</select>

      <label style={{display: "block", width: "100%"}}>Base font size</label>
      <input style={{marginBottom: 8}} type="number" valueLink={@linkState('baseFontSize')} />

      <label style={{display: "block", width: "100%"}}>Base line height</label>
      <input style={{marginBottom: 48}}  type="number" valueLink={@linkState('baseLineHeight')} />

      <button
        onClick={@handleConfigToggle}
        style={{
          fontSize: 16
          border: "1px solid #{gray(80)}"
          lineHeight: "24px"
          padding: "5px 15px"
          cursor: 'pointer'
          borderRadius: 6
          backgroundColor: 'white'
          color: gray(40)
          textShadow: 'none'
        }}
      >{if @state.showConfiguration then "Show styleguide" else "Show configuration"}</button>

      <GridOverlay
        rhythm={@props.typography.rhythm}
        showGrid={@state.showVerticalRhythmGrid}
      />
    </div>

  handleConfigToggle: ->
    if @state.showConfiguration
      @setState showConfiguration: false
    else
      @setState showConfiguration: true

  onHeaderFontChange: (e) ->
    font = e.target.value

    result = Typography({
      googleFonts: [
        {
          name: font
          styles: [
            "100"
            "400"
            "700"
            "900"
          ]
        }
      ]
    })

    $('head').append(React.renderToStaticMarkup(result.GoogleFont()))

    setTimeout((=>
      @setState headerFont: font
    ), 400)

  onBodyFontChange: (e) ->
    font = e.target.value

    result = Typography({
      googleFonts: [
        {
          name: font
          styles: [
            "100"
            "400"
            "700"
            "900"
          ]
        }
      ]
    })

    $('head').append(React.renderToStaticMarkup(result.GoogleFont()))

    setTimeout((=>
      @setState bodyFont: font
    ), 400)
