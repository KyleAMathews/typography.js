// @flow
import ms from 'modularscale'
import normalize from './normalize'
import gray from 'gray-percentage'
import decamelize from 'decamelize'
import set from 'lodash/set'
import each from 'lodash/forEach'
import reduce from 'lodash/reduce'
import isArray from 'lodash/isArray'
import isObject from 'lodash/isObject'
import isFunction from 'lodash/isFunction'

import type { OptionsType } from '../Types.js'

const generateFontFaceRules = function (vr, options: OptionsType) {
  let styles = ''
  let properties = ''

  // Return if there's no font-faces defined.
  if ((options.fontFaces == null) || options.fontFaces.length <= 0) {
    return styles
  }
  for (let i = 0; i < options.fontFaces.length; i++) {
    const fontFace = options.fontFaces[i]
    const srcs = fontFace.src.map(s => `src:${s};`)
    each(fontFace, (v, k) => { // eslint-disable-line
      if (k !== 'src') {
        properties += `${decamelize(k, '-')}:${v};\n`
      }
    })
    styles += `@font-face {
  ${properties}
  ${srcs.join('\n')}
}`
  }

  return styles
}

const setStyles = (styles: Object = {}, els: string | string[], rules: Object) => {
  let elements
  if (!isArray(els)) {
    elements = [els]
  } else {
    elements = els
  }
  each(elements, (element) => {
    each(rules, (value, prop) => {
      set(styles, `${element}.${prop}`, value)
    })
  })
  return styles
}

const compileStyles = (styles) =>
  reduce(styles, ((stylesStr, ruleSet, selector) => {
    stylesStr += `${selector}{` // eslint-disable-line
    each(ruleSet, ((value, property) => {
      if (isObject(value)) {
        const newObject = {}
        newObject[property] = value
        stylesStr += compileStyles(newObject) // eslint-disable-line
      } else {
        stylesStr += `${decamelize(property, '-')}:${value};` // eslint-disable-line
      }
    }))
    stylesStr += '}' // eslint-disable-line
    return stylesStr
  }), '')

module.exports = (vr: any, options: any) => {
  let styles = {}
  // Base HTML styles.
  styles = setStyles(styles, 'html', {
    ...vr.establishBaseline(),
    boxSizing: 'border-box',
    overflowY: 'scroll',
  })
  // box-sizing reset.
  styles = setStyles(styles, ['*', '*:before', '*:after'], {
    boxSizing: 'inherit',
  })
  // Base body styles.
  styles = setStyles(styles, 'body', {
    color: gray(options.bodyGray, options.bodyGrayHue),
    fontFamily: options.bodyFontFamily,
    fontWeight: options.bodyWeight,
    wordWrap: 'break-word',
  })
  // Make images responsive.
  styles = setStyles(styles, 'img', {
    maxWidth: '100%',
  })
  // All block elements get one rhythm of bottom margin.
  styles = setStyles(styles, [
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
    'address',
  ], {
    // Reset margin/padding to 0.
    margin: 0,
    padding: 0,
    marginBottom: vr.rhythm(1),
  })
  // Basic blockquote styles.
  styles = setStyles(styles, 'blockquote', {
    marginRight: vr.rhythm(1),
    marginBottom: vr.rhythm(1),
    marginLeft: vr.rhythm(1),
  })
  // b, strong.
  styles = setStyles(styles, ['b', 'strong', 'dt', 'th'], {
    fontWeight: options.boldWeight,
  })
  // hr
  styles = setStyles(styles, 'hr', {
    background: gray(80, options.bodyGrayHue),
    border: 'none',
    height: '1px',
    marginBottom: `calc(${vr.rhythm(1)} - 1px)`,
  })
  // ol, ul
  styles = setStyles(styles, ['ol', 'ul'], {
    listStylePosition: 'outside',
    listStyleType: 'disc',
    listStyleImage: 'none',
    marginLeft: vr.rhythm(1),
  })
  // Remove default padding on list items (we'll set that later).
  styles = setStyles(styles, ['ol li', 'ul li'], {
    paddingLeft: 0,
  })
  // children ol, ul
  styles = setStyles(styles, ['li > ol', 'li > ul'], {
    marginLeft: vr.rhythm(1),
    marginBottom: 0,
  })
  // table
  styles = setStyles(styles, ['table'], {
    ...vr.adjustFontSizeTo(options.baseFontSize),
    width: '100%',
  })
  // thead
  styles = setStyles(styles, ['thead'], {
    textAlign: 'left',
  })
  // Make generally smaller elements, smaller.
  styles = setStyles(styles, ['code', 'kbd', 'pre', 'samp'], {
    ...vr.adjustFontSizeTo('85%'),
  })
  // Abbr, Acronym
  styles = setStyles(styles, ['abbr', 'acronym'], {
    borderBottom: `1px dotted ${gray(50)}`,
    cursor: 'help',
  })
  styles['abbr[title]'] = {
    borderBottom: `1px dotted ${gray(50)}`,
    cursor: 'help',
    textDecoration: 'none',
  }
  // Create styles for headers.
  const baseFontSize = options.baseFontSize.slice(0, -2)
  styles = setStyles(styles, ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'], {
    color: gray(options.headerGray, options.headerGrayHue),
    fontFamily: options.headerFontFamily,
    fontWeight: options.headerWeight,
    textRendering: 'optimizeLegibility',
  })
  // Loop through each modular scale and add media query as necessary.
  each(options.modularScales, (modularScale) => {
    const { maxWidth } = modularScale
    const { scale } = modularScale

    const h1 = vr.adjustFontSizeTo(`${ms(5/5, scale) * baseFontSize}px`)
    const h2 = vr.adjustFontSizeTo(`${ms(4/5, scale) * baseFontSize}px`)
    const h3 = vr.adjustFontSizeTo(`${ms(3/5, scale) * baseFontSize}px`)
    const h4 = vr.adjustFontSizeTo(`${ms(2/5, scale) * baseFontSize}px`)
    const h5 = vr.adjustFontSizeTo(`${ms(1/5, scale) * baseFontSize}px`)
    const h6 = vr.adjustFontSizeTo(`${ms(0/5, scale) * baseFontSize}px`)

    let media
    if (maxWidth) {
      media = `@media only screen and (max-width:${maxWidth})`
    }
    each([h1, h2, h3, h4, h5, h6], (header, i) => {
      if (media) {
        styles = set(styles, `${media}.h${i + 1}.fontSize`, header.fontSize)
        styles = set(styles, `${media}.h${i + 1}.lineHeight`, header.lineHeight)
      } else {
        styles = set(styles, `h${i + 1}.fontSize`, header.fontSize)
        styles = set(styles, `h${i + 1}.lineHeight`, header.lineHeight)
      }
    })
  })
  // Call escapeHatch function on options (if set).
  if (isFunction(options.escapeHatch)) {
    styles = options.escapeHatch(styles, setStyles, vr, options)
  }

  // Compile styles to string.
  let stylesStr = compileStyles(styles)
  stylesStr += `${generateFontFaceRules(vr, options)}`

  stylesStr = `${normalize}${stylesStr}`
  return stylesStr
}
