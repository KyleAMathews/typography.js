// @flow
import normalize from 'typography-normalize'
import decamelize from 'decamelize'
import each from 'lodash/forEach'
import reduce from 'lodash/reduce'
import isObject from 'lodash/isObject'

import type { OptionsType } from 'Types'

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

  if (options.includeNormalize) {
    stylesStr = `${normalize}${stylesStr}`
  }

  return stylesStr
}
