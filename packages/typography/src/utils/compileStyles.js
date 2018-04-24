// @flow
import normalize from "typography-normalize"
import decamelize from "decamelize"
import each from "lodash/forEach"
import reduce from "lodash/reduce"
import isObject from "lodash/isObject"

import type { OptionsType } from "Types"

const compileStyles = styles =>
  reduce(
    styles,
    (stylesStr, ruleSet, selector) => {
      stylesStr += `${selector}{` // eslint-disable-line
      each(ruleSet, (value, property) => {
        if (isObject(value)) {
          const newObject = {}
          newObject[property] = value
          stylesStr += compileStyles(newObject) // eslint-disable-line
        } else {
          let newStyle = `${decamelize(property, "-")}:${value};` // eslint-disable-line
          // If the property is prefixed, add an additional dash at the beginning.
          const prefixes = ["Webkit", "ms", "Moz", "O"]
          prefixes.forEach(prefix => {
            if (property.slice(0, prefix.length) === prefix) {
              newStyle = `-${newStyle}`
            }
          })
          stylesStr += newStyle
        }
      })
      stylesStr += "}" // eslint-disable-line
      return stylesStr
    },
    ""
  )

export default (vr: any, options: OptionsType, styles: any) => {
  // Compile styles to string.
  let stylesStr = compileStyles(styles)

  if (options.includeNormalize) {
    stylesStr = `${normalize}${stylesStr}`
  }

  return stylesStr
}
