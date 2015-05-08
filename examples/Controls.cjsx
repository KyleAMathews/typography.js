React = require 'react/addons'
{Navigation, State} = require 'react-router'
_ = require 'underscore'
$ = require 'jquery'
gray = require 'gray-percentage'
NumberEditor = require 'react-number-editor'
ParseUnit = require 'parse-unit'

controls = require('../src')()

{rhythm} = require('../src')()
Typography = require '../src/'
GridOverlay = require './GridOverlay'
Actions = require './Actions'

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
  "Lora"
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
  "Petrona"
  "Raleway"
  "Karla"
  "Noto Serif"
  "Noto Sans"
  "Anonymous Pro"
  "Fira Sans"
  "Jura"
  "Bitter"
  "EB Garamond"
  "Cabin"
  "Rufina"
  "Droid Serif"
  "Droid Sans"
]

fonts = fonts.sort()

module.exports = React.createClass
  displayName: "Controls"

  mixins: [
    React.addons.LinkedStateMixin
    Navigation
    State
  ]

  getInitialState: ->
    initialState = _.extend({
        showVerticalRhythmGrid: false
        headerFont: "Lato"
        bodyFont: "Lato"
        baseFontSize: 16
        baseLineHeight: 24
        modularScales: 'diminished fourth'
        headerWeight: 400
        showConfiguration: false
        headerGray: 20
        bodyGray: 40
      },
      @props.typography.options
    )

    initialState.baseFontSize = ParseUnit(initialState.baseFontSize)[0]
    initialState.baseLineHeight = ParseUnit(initialState.baseLineHeight)[0]
    initialState.headerGray = parseInt(initialState.headerGray)
    initialState.bodyGray = parseInt(initialState.bodyGray)
    if initialState.showVerticalRhythmGrid
      initialState.showVerticalRhythmGrid = true
    initialState

  render: ->
    unless @props.typography
      <div />
    else
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
          onChange={@handleShowGridOverlayChange}
          style={{marginBottom: 8}}
          checked={@state.showVerticalRhythmGrid}
          type="checkbox"
        />
        {' '}<label>Show vertical rhythm grid</label>

        <label style={{display: "block", width: "100%"}}>Header font</label>
        <select
          style={{marginBottom: 8}}
          onChange={@onHeaderFontChange}
          value={@state.headerFont}
        >
          {headerFontOptions}
        </select>

        <label
          style={{display: "block", width: "100%"}}
        >
          Header weight (not all fonts have all weights)
        </label>
        <select
          style={{marginBottom: 8}}
          value={@state.headerWeight}
          onChange={@handleHeaderWeightChange}
        >
          <option key=100 value=100>100</option>
          <option key=400 value=400>400</option>
          <option key=700 value=700>700</option>
          <option key=900 value=900>900</option>
        </select>

        <label style={{display: "block", width: "100%"}}>Body font</label>
        <select
          style={{marginBottom: 8}}
          value={@state.bodyFont}
          onChange={@onBodyFontChange}
        >
          {bodyFontOptions}
        </select>

        <label style={{display: "block", width: "100%"}}>Modular scale</label>
        <select
          style={{marginBottom: 8}}
          value={@state.modularScales[0]}
          onChange={@handleModularScaleChange}
        >
          {modularScalesOptions}
        </select>

        <label style={{display: "block", width: "100%"}}>Base font size</label>
        <NumberEditor
          min=8
          max=100
          step={0.1}
          initialValue={@state.baseFontSize}
          onValueChange={@handleBaseFontSizeChange}
          style={{marginBottom: 8}}
        />

        <label style={{display: "block", width: "100%"}}>Base line height</label>
        <NumberEditor
          min=8
          max=120
          step={0.1}
          initialValue={@state.baseLineHeight}
          onValueChange={@handleBaseLineHeightChange}
          style={{marginBottom: 8}}
        />

        <label style={{display: "block", width: "100%"}}>Header gray % (0=black 100=white)</label>
        <NumberEditor
          min=0
          max=100
          step={0.5}
          initialValue={@state.headerGray}
          onValueChange={@handleHeaderGrayChange}
          style={{marginBottom: 8}}
        />

        <label style={{display: "block", width: "100%"}}>Body gray % (0=black 100=white)</label>
        <NumberEditor
          min=0
          max=100
          step={0.5}
          initialValue={@state.bodyGray}
          onValueChange={@handleBodyGrayChange}
          style={{marginBottom: 48}}
        />

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
        >{if @getPathname() isnt "/" then "Show styleguide" else "Show configuration"}</button>

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

    if @getPathname() is "/"
      @transitionTo("/configuration", null, @getQuery())
    else
      @transitionTo("/", null, @getQuery())


  handleHeaderWeightChange: (e) ->
    change = headerWeight: e.target.value

    @setState change
    Actions.configChange change, @

  handleModularScaleChange: (e) ->
    change = modularScales: [e.target.value]

    @setState change
    Actions.configChange change, @

  handleBaseFontSizeChange: (size) ->
    change = baseFontSize: size
    changepx = baseFontSize: size + "px"

    @setState change
    Actions.configChange changepx, @

  handleBaseLineHeightChange: (size) ->
    change = baseLineHeight: size
    changepx = baseLineHeight: size + "px"

    @setState change
    Actions.configChange changepx, @

  handleHeaderGrayChange: (percentage) ->
    change = headerGray: percentage

    @setState change
    Actions.configChange change, @

  handleBodyGrayChange: (percentage) ->
    change = bodyGray: percentage

    @setState change
    Actions.configChange change, @

  handleShowGridOverlayChange: (e) ->
    change = showVerticalRhythmGrid: e.target.checked

    @setState change
    Actions.configChange change, @

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
    {GoogleFont} = result
    $('head').append(React.renderToStaticMarkup(<GoogleFont/>))

    setTimeout((=>
      @setState headerFont: font
      Actions.configChange {
        headerFontFamily: font
        googleHeaderFont: font
        headerFont: font
      }, @
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

    {GoogleFont} = result
    $('head').append(React.renderToStaticMarkup(<GoogleFont/>))

    setTimeout((=>
      @setState bodyFont: font
      Actions.configChange {
        bodyFontFamily: font
        googleBodyFont: font
        bodyFont: font
      }, @
    ), 400)
