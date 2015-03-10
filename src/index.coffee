React = require 'react'
objectAssign = require('react/lib/Object.assign')
VerticalRhythm = require 'compass-vertical-rhythm'
ms = require 'modularscale'

module.exports = (options) ->
  defaults =
    baseFontSize: '16px'
    baseLineHeight: '24px'
    modularScale: [
      'diminished fourth'
      { 768: 'minor third'}
    ]
    googleFonts: [
      {
        name: "Lato"
        styles: [
          "100"
          "400"
          "700"
          "900"
        ]
      },
    ]
    headerFontFamily: "Lato, sans-serif"
    bodyFontFamily: "Lato, sans-serif"
    headerGray: 20
    bodyGray: 40
    headerWeight: 400
    bodyWeight: 400
    boldWeight: 700

  options = objectAssign defaults, options

  vr = VerticalRhythm(options)

  return {
    options: options
    GoogleFont: require('./components/GoogleFont')(options)
    TypographyStyle: require('./components/TypographyStyle')(vr, options)
    rhythm: vr.rhythm
    styles: require('./utils/createStyles')(vr, options)
    fontSizeToPx: vr.adjustFontSizeTo
    fontSizeToMS: (scaler) ->
      baseFont = options.baseFontSize.slice(0, -2)
      newFontSize = ms(scaler, options.modularScale[0]) * baseFont + "px"
      vr.adjustFontSizeTo(newFontSize)
  }
