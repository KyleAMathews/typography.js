// @flow
import ms from 'modularscale'
import normalize from 'typography-normalize'
import gray from 'gray-percentage'
import decamelize from 'decamelize'
import set from 'lodash/set'
import each from 'lodash/forEach'
import reduce from 'lodash/reduce'
import isArray from 'lodash/isArray'
import isNumber from 'lodash/isNumber'
import isString from 'lodash/isString'
import isObject from 'lodash/isObject'
import isFunction from 'lodash/isFunction'
import merge from 'lodash/merge'

import type { OptionsType } from 'Types'

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

const compileStyles = (styles) => {
  return reduce(styles, ((stylesStr, ruleSet, selector) => {
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
}

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
    fontFamily: options.bodyFontFamily.join(','),
    fontWeight: options.bodyWeight,
    wordWrap: 'break-word',
  })
  // Make images responsive.
  styles = setStyles(styles, 'img', {
    maxWidth: '100%',
  })
  // All block elements get one rhythm of bottom margin by default
  // or whatever is passed in as option.
  let blockMarginBottom
  if (isNumber(options.blockMarginBottom)) {
    blockMarginBottom = vr.rhythm(options.blockMarginBottom)
  } else if (isString(options.blockMarginBottom)) {
    blockMarginBottom = options.blockMarginBottom
  } else {
    blockMarginBottom = vr.rhythm(1)
  }
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
    marginBottom: blockMarginBottom,
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
    listStyleImage: 'none',
    marginLeft: vr.rhythm(1),
  })
  // li
  styles = setStyles(styles, 'li', {
    marginBottom: vr.rhythm(1/2),
  })
  // Remove default padding on list items.
  styles = setStyles(styles, ['ol li', 'ul li'], {
    paddingLeft: 0,
  })
  // children ol, ul
  styles = setStyles(styles, ['li > ol', 'li > ul'], {
    marginLeft: vr.rhythm(1),
    marginBottom: vr.rhythm(1/2),
    marginTop: vr.rhythm(1/2),
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
  // Table styles.
  styles = setStyles(styles, ['table'], {
    ...vr.adjustFontSizeTo(options.baseFontSize),
    borderCollapse: 'collapse',
    width: '100%',
  })
  styles = setStyles(styles, ['td,th'], {
    textAlign: 'left',
    borderBottom: `1px solid ${gray(88)}`,
    paddingLeft: vr.rhythm(2/3),
    paddingRight: vr.rhythm(2/3),
    paddingTop: vr.rhythm(1/2),
    paddingBottom: `calc(${vr.rhythm(1/2)} - 1px)`,
  })
  styles = setStyles(styles, 'th:first-child,td:first-child', {
    paddingLeft: 0,
  })
  styles = setStyles(styles, 'th:last-child,td:last-child', {
    paddingRight: 0,
  })
  // Create styles for headers.
  const baseFontSize = options.baseFontSize.slice(0, -2)
  styles = setStyles(styles, ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'], {
    color: gray(options.headerGray, options.headerGrayHue),
    fontFamily: options.headerFontFamily.join(','),
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
  // Call overrideStyles function on options (if set).
  if (isFunction(options.overrideStyles)) {
    styles = merge(styles, options.overrideStyles(vr, options))
  }

  // Compile styles to string.
  let stylesStr = compileStyles(styles)
  stylesStr += `${generateFontFaceRules(vr, options)}`

  if (options.includeNormalize) {
    stylesStr = `${normalize}${stylesStr}`
  }

  return stylesStr
}
