// @flow
import normalize from 'typography-normalize'
import decamelize from 'decamelize'
import each from 'lodash/forEach'
import reduce from 'lodash/reduce'
import isObject from 'lodash/isObject'

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

const compileStyles = (styles) => (
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
)

module.exports = (vr: any, options: OptionsType, styles: any) => {
  // Compile styles to string.
  let stylesStr = compileStyles(styles)
  stylesStr += `${generateFontFaceRules(vr, options)}`

  if (options.includeNormalize) {
    stylesStr = `${normalize}${stylesStr}`
  }

  return stylesStr
}
