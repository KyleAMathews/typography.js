import ms from 'modularscale'
import normalize from '../normalize'
import gray from 'gray-percentage'
import decamelize from 'decamelize'
import map from 'lodash/map'

let stn = null

const generateFontFaceRules = function (vr, options) {
  let styles = ''
  let properties = ''

  // Return if there's no font-faces defined.
  if ((options.fontFaces == null) || options.fontFaces.length <= 0) {
    return styles
  }
  for (let i = 0; i < options.fontFaces.length; i++) {
    const fontFace = options.fontFaces[i]
    const srcs = fontFace.src.map(s => `src:${s};`)
    for (let k in fontFace) {
      const v = fontFace[k]
      if (k !== 'src') {
        properties += `${decamelize(k, '-')}:${v};\n`
      }
    }
    styles += `@font-face {
  ${properties}
  ${srcs.join('\n')}
}`
  }

  return styles
}

const createStyle = function (elements, rules) {
  if (stn != null) {
    elements = map(elements, element => `.typography-theme-${stn} ${element}`
    )
  }

  const elementsStr = elements.join(',')

  return `${elementsStr}{${rules}}`
}

const generateHeaderStyles = function (vr, options) {
  let styles = ''
  const baseFontSize = options.baseFontSize.slice(0, -2)

  for (let i = 0; i < options.modularScales.length; i++) {
    const modularScale = options.modularScales[i]
    const { maxWidth } = modularScale
    const { scale } = modularScale

    const h1 = vr.adjustFontSizeTo(`${ms(4/4, scale) * baseFontSize}px`)
    const h2 = vr.adjustFontSizeTo(`${ms(3/4, scale) * baseFontSize}px`)
    const h3 = vr.adjustFontSizeTo(`${ms(2/4, scale) * baseFontSize}px`)
    const h4 = vr.adjustFontSizeTo(`${ms(1/4, scale) * baseFontSize}px`)
    const h5 = vr.adjustFontSizeTo(`${ms(0/4, scale) * baseFontSize}px`)
    const h6 = vr.adjustFontSizeTo(`${ms(-1/4, scale) * baseFontSize}px`)

    if (maxWidth) {
      styles += `@media only screen and (max-width:${maxWidth}) {\n`
    }


    styles += createStyle([
      'h1',
    ], `font-size:${h1.fontSize};
        line-height:${h1.lineHeight};`)

    styles += createStyle([
      'h2',
    ], `font-size:${h2.fontSize};
        line-height:${h2.lineHeight};`)

    styles += createStyle([
      'h3',
    ], `font-size:${h3.fontSize};
        line-height:${h3.lineHeight};`)

    styles += createStyle([
      'h4',
    ], `font-size:${h4.fontSize};
        line-height:${h4.lineHeight};`)

    styles += createStyle([
      'h5',
    ], `font-size:${h5.fontSize};
        line-height:${h6.lineHeight};`)


    styles += createStyle([
      'h6',
    ], `font-size:${h6.fontSize};
        line-height:${h6.lineHeight};`)

    if (maxWidth) {
      styles += '}'
    }
  }

  return styles
}

// options is either the global or sub-theme options
module.exports = (vr, options, subThemeName, globalOptions) => {
  stn = subThemeName

  // Create function createStyle(elements=string/array, rules=string, subThemeName="")
  // if there's a themeName, each rule is prefixed with that.
  // Don't create global rules for sub-themes.
  //
  let styles = ''

  // Only the global theme gets these styles.
  if (subThemeName == null) {
    styles = `
      ${normalize}
      html {
        box-sizing:border-box;
        font-size:${vr.establishBaseline().fontSize};
        line-height:${vr.establishBaseline().lineHeight};
        overflow-y:scroll;
      }

      *, *:before, *:after {
        box-sizing:inherit;
      }

      body {
        color:${gray(options.bodyGray, options.bodyGrayHue)};
        font-family:${options.bodyFontFamily};
        font-weight:${options.bodyWeight};
        word-wrap:break-word;
      }

      /* Make image responsive by default */
      img {
        max-width:100%;
      }
    `
  }

  // Create class for sub-theme with rules that override base theme.
  if (subThemeName) {
    styles += `
      .typography-theme-${subThemeName}{
        color:${gray(options.bodyGray, options.bodyGrayHue)};
        font-family:${options.bodyFontFamily};
        font-weight:${options.bodyWeight};
        font-size:${vr.adjustFontSizeTo(options.baseFontSize, 'auto', globalOptions.baseFontSize).fontSize};
        line-height:${vr.adjustFontSizeTo(options.baseFontSize, 'auto', globalOptions.baseFontSize).lineHeight};
      }
    `
  }
  // All block elements get one rhythm of bottom margin.
  styles += createStyle([
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hgroup',
    'ul',
    'ol',
    'dl',
    'dd',
    'p',
    'figure',
    'pre',
    'table',
    'fieldset',
    'blockquote',
    'form',
    'noscript',
    'iframe',
    'img',
    'hr',
  ], `margin:0;
      margin-bottom:${vr.rhythm(1)};
      padding:0;`)

  styles += createStyle([
    'blockquote',
  ], `margin:${vr.rhythm(1)} ${vr.rhythm(2.5)};`)

  styles += createStyle([
    'b',
    'strong',
  ], `font-weight:${options.boldWeight}`)

  styles += createStyle([
    'hr',
  ], `background:${gray(80, options.bodyGrayHue)};
      border:none;
      height:1px;
      margin-bottom:calc(${vr.rhythm(1)} - 1px);`)

  styles += createStyle([
    'ol',
    'ul',
  ], `list-style-position:outside;
      margin-left:${vr.rhythm(1)};`)

  styles += createStyle([
    'ul li',
    'ol li',
  ], 'padding-left:0;')

  styles += createStyle([
    'code',
    'kbd',
    'pre',
    'samp',
  ], `font-size:${vr.adjustFontSizeTo('85%').fontSize};
      line-height:${vr.adjustFontSizeTo('85%').lineHeight};`)

  styles += createStyle([
    'table',
  ], `font-size:${vr.adjustFontSizeTo(options.baseFontSize).fontSize};
      line-height:${vr.adjustFontSizeTo(options.baseLineHeight).lineHeight};
      width:100%;`)

  styles += createStyle([
    'thead',
  ], 'text-align:left;')

  styles += createStyle([
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
  ], `color:${gray(options.headerGray, options.headerGrayHue)};
      font-family:${options.headerFontFamily};
      font-weight:${options.headerWeight};`)

  styles += `${generateHeaderStyles(vr, options)}
             ${generateFontFaceRules(vr, options)}`

  return styles.replace(/(\r\n|\n|\r)/gm, '')
}
