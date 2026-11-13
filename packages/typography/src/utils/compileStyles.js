// @flow
import normalize from "typography-normalize"
import decamelize from "decamelize"
import each from "lodash/forEach"
import reduce from "lodash/reduce"
import isPlainObject from "lodash/isPlainObject"

import { escapeLessThan, isDeclarationValue, isPropertyName, trimSpace, withoutImportant } from "./css"
import type { OptionsType } from "Types"

// A property name in CSS: kebab case, with a leading dash for a vendor
// prefix. A custom property is written as given: its name is case-sensitive
// (CSS Variables 1 2).
const cssName = (property: string) => {
  if (property.slice(0, 2) === "--") return property
  const name = decamelize(property, "-")
  return /^(?:Webkit|Moz|ms|O)[A-Z]/.test(property) ? `-${name}` : name
}

// Text CSS reads whole, which a <style> element can hold once each "<"
// before "/" is escaped: nothing that ends it early (a stray "}", ";", or
// "!", an open string, comment, or block, a lone backslash) or drops it (a
// top-level {} block outside a custom property).
const html = (text: string) => escapeLessThan(text, true)

// A declaration's value; a trailing !important is CSS. An empty value is a
// custom property's only (CSS Variables 1 2).
const cssValue = (selector: string, property: string, value: mixed) => {
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  const custom = property.slice(0, 2) === "--"
  const body = typeof value === "string" ? trimSpace(withoutImportant(value)) : ""
  if (typeof value !== "string" || (!body && !custom) || !isDeclarationValue(body, custom)) {
    throw new RangeError(`Invalid CSS value for ${selector} ${property}`)
  }
  return html(value)
}

const compileStyles = styles =>
  reduce(
    styles,
    (stylesStr, ruleSet, selector) => {
      if (!trimSpace(selector) || !isDeclarationValue(selector, false)) {
        throw new RangeError(`Invalid CSS selector ${selector}`)
      }
      stylesStr += `${html(selector)}{`
      each(ruleSet, (value, property) => {
        // null removes a declaration, and so do false and "" outside a custom
        // property, as in `cond && value` (engineer decisions 2026-11-12).
        if (value == null || value === false || (value === "" && property.slice(0, 2) !== "--")) return
        // A plain object is a nested rule (an array or a function is not a
        // CSS value).
        if (isPlainObject(value)) {
          stylesStr += compileStyles({ [property]: value })
        } else {
          const name = cssName(property)
          if (!isPropertyName(name)) {
            throw new RangeError(`Invalid CSS property for ${selector} ${property}`)
          }
          stylesStr += `${name}:${cssValue(selector, property, value)};`
        }
      })
      stylesStr += "}"
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
