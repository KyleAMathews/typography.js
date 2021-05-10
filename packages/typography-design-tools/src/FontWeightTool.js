import React from "react"
import Select from "./Select"
import _ from "lodash"
import parseUnit from "parse-unit"

const prepareFamilyWeights = (weights = [], filterOutItalics) => {
  let newWeights

  // Convert regular/italic to 400 / 400italic
  newWeights = weights.map((weight) => {
    if (weight === "regular") {
      return "400"
    } else if (weight === "italic") {
      return "400italic"
    } else {
      return weight
    }
  })

  // Remove italic options.
  if (filterOutItalics) {
    newWeights = _.filter(
      newWeights,
      (weight) => parseUnit(weight)[1] !== "italic"
    )
  }

  newWeights = _.sortBy(newWeights, (weight) => parseUnit(weight)[0])

  return newWeights
}

const pickFamilyWeightValue = (weights = [], weight, filterOutItalics) => {
  const preparedWeights = prepareFamilyWeights(weights, filterOutItalics)
  return _.indexOf(preparedWeights, weight.toString())
}

class FontWeightTool extends React.Component {
  render() {
    return (
      <Select
        options={prepareFamilyWeights(this.props.family.weights, true)}
        value={pickFamilyWeightValue(
          this.props.family.weights,
          this.props.weight,
          true
        )}
        style={{
          width: "100%",
        }}
        onChange={(value) => {
          const newOptions = { ...this.props.options }
          const weights = prepareFamilyWeights(this.props.family.weights, true)

          const newWeight = weights[value]

          // Set new weight.
          if (this.props.type === "header") {
            newOptions.headerWeight = newWeight
          } else if (this.props.type === "body") {
            newOptions.bodyWeight = newWeight
          } else if (this.props.type === "bold") {
            newOptions.boldWeight = newWeight
          }

          // Add weight to Google Fonts array.
          const fontFamily = _.find(
            newOptions.googleFonts,
            (font) => font.name === this.props.family.family
          )
          fontFamily.styles.push(newWeight.toString())

          // Also push italic if this is for body/bold
          if (this.props.type === "body" || this.props.type === "bold") {
            fontFamily.styles.push(`${newWeight}i`)
          }

          // Filter out old weight.
          fontFamily.styles = _.filter(
            fontFamily.styles,
            (style) =>
              parseUnit(style)[0].toString() !== this.props.weight.toString()
          )

          this.props.onChange(newOptions)
        }}
      />
    )
  }
}

export default FontWeightTool
