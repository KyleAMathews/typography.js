React = require 'react'
objectAssign = require('react/lib/Object.assign')
VerticalRhythm = require 'compass-vertical-rhythm'
ms = require 'modularscale'
isArray = require 'is-array'

module.exports = (options) ->
  defaults =
    baseFontSize: '16px'
    baseLineHeight: '24px'
    modularScales: [
      'diminished fourth'
    ]
    googleFonts: []
    headerFontFamily: '"Avenir Next", "Helvetica Neue", "Segoe UI", Helvetica, Arial, sans-serif'
    bodyFontFamily: '"Avenir Next", "Helvetica Neue", "Segoe UI", Helvetica, Arial, sans-serif'
    headerGray: 20
    headerGrayHue: 0
    bodyGray: 20
    bodyGrayHue: 0
    headerWeight: 700
    bodyWeight: 400
    boldWeight: 700
    fontFaces: []

  options = objectAssign defaults, options

  unless isArray options.modularScales
    options.modularScales = [options.modularScales]

  vr = VerticalRhythm(options)

  styles = require('./utils/createStyles')(vr, options)

  return {
    options: options
    GoogleFont: require('./components/GoogleFont')(options)
    TypographyStyle: require('./components/TypographyStyle')(vr, options)
    rhythm: vr.rhythm
    styles: styles
    fontSizeToPx: vr.adjustFontSizeTo
    fontSizeToMS: (scaler) ->
      baseFont = options.baseFontSize.slice(0, -2)
      newFontSize = ms(scaler, options.modularScales[0]) * baseFont + "px"
      vr.adjustFontSizeTo(newFontSize)
    injectStyles: ->
      node = document.createElement('style')
      node.innerHTML = styles
      document.head.appendChild(node)
  }
