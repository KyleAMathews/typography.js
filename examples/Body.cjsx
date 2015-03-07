React = require 'react'
Typography = require '../src/'
typography = Typography()
{GoogleFont, TypographyStyle, HTMLStyle, rhythm} = typography
Styleguide = require './Styleguide'
Controls = require './Controls'
{Container} = require 'react-responsive-grid'

module.exports = React.createClass

  getInitialState: ->
    typography: typography
    rhythm: rhythm
    configState: {}

  render: ->
    <div>
      <div style={{
        background: '#E3F2FD'
        height: "100vh"
        left: 0
        padding: 24
        paddingTop: 48
        position: "fixed"
        width: 280
      }}>
        <Controls typography={@state.typography} onChange={@handleControlsChange}/>
      </div>
      <Container style={{
        maxWidth: 768
        padding: rhythm(1)
        paddingLeft: "calc(280px + #{rhythm(1.5)})"
      }}>
        <Styleguide typography={@state.typography} configState={@state.configState}/>
      </Container>
    </div>

  handleControlsChange: (configState) ->
    typography = Typography({
      baseFontSize: configState.baseFontSize + "px"
      baseLineHeight: configState.baseLineHeight + "px"
      modularScale: [configState.modularScale]
      headerFontFamily: "#{configState.headerFont}, sans-serif"
      bodyFontFamily: "#{configState.bodyFont}, sans-serif"
      headerWeight: configState.headerWeight
    })

    document.getElementById("react-typography").innerHTML = typography.styles

    @setState {
      typography: typography
      rhythm: typography.rhythm
      configState: configState
    }
