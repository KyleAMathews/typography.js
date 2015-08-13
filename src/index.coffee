React = require 'react'
objectAssign = require('object-assign')
VerticalRhythm = require 'compass-vertical-rhythm'
ms = require 'modularscale'
isArray = require 'is-array'
isObject = require 'isobject'
copy = require 'shallow-copy'

createStyles = require('./utils/createStyles')

module.exports = test = (options) ->
  defaults =
    baseFontSize: '18px'
    baseLineHeight: '28.5px'
    modularScales: [
      {
        scale: 'diminished fourth'
      },
      {
        maxWidth: '768px'
        scale: 'minor third'
      }
    ]
    googleFonts: []
    headerFontFamily: '"Avenir Next", "Helvetica Neue", "Segoe UI", Helvetica, Arial, sans-serif'
    bodyFontFamily: 'georgia, serif'
    headerGray: 20
    headerGrayHue: 0
    bodyGray: 20
    bodyGrayHue: 0
    headerWeight: 700
    bodyWeight: 400
    boldWeight: 700
    fontFaces: []

  options = objectAssign(defaults, options)

  if options.subThemes? and isObject(options.subThemes)
    for name, theme of options.subThemes
      options.subThemes[name] = objectAssign(copy(options), theme, rhythmUnit: 'px')

  unless isArray options.modularScales
    options.modularScales = [options.modularScales]

  # Create styles for base theme + each subtheme.
  vr = VerticalRhythm(options)
  styles = createStyles(vr, options)

  if options.subThemes? and isObject(options.subThemes)
    for name, theme of options.subThemes
      vr = VerticalRhythm(theme)
      styles += createStyles(vr, theme, name, options)

  return {
    options: options
    GoogleFont: require('./components/GoogleFont')(options)
    TypographyStyle: require('./components/TypographyStyle')(styles)
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

#console.log test({
  #baseFontSize: '16px'
  #subThemes:
    #blog:
      #baseFontSize: '18px'
      #bodyFontFamily: 'Open Sans'
#}).styles
