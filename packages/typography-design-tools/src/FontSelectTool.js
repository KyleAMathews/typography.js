import React from 'react'
import Select from 'react-select'
import fontList from '../filteredGoogleFontList.json'
import { StyleSheet, css } from 'aphrodite'
import _ from 'lodash'

const styles = StyleSheet.create({
  select: {
    '.select-control': {
      background: 'black',
    },
  },
})


console.log(fontList)

const options = fontList.map((font) => ({
  value: font.family,
  label: font.family,
}))

const pickDefaultHeaderStyle = (name) => {
  const family = _.find(fontList, (font) => font.family === name)

  // Pick heaviest weight that's not an italic.
  let weights = _.map(family.weights, (weight) => {
    if (weight === 'regular') {
      return 400
    } else {
      return parseInt(weight, 10)
    }
  })
  weights = _.filter(_.sortBy(weights), (weight) => _.isFinite(weight))
  console.log(weights)
  if (_.includes(weights, 700)) {
    return 700
  } else {
    return _.last(weights)
  }
}

class FontSelectTool extends React.Component {
  onChange (val) {
    console.log(val, this.props.options)
    const newOptions = { ...this.props.options }
    const family = _.find(fontList, (font) => font.family === val.value)
    console.log('family', family)

    // Set header font family.
    newOptions.headerFontFamily = [val.value, family.category]

    // Choose weight for choosen header font.
    const weight = pickDefaultHeaderStyle(val.value)

    // Set weight.
    newOptions.headerWeight = weight

    // Add font to Google Fonts array.
    newOptions.googleFonts.push({
      name: val.value,
      styles: [
        weight,
      ],
    })

    // Filter out old header font.
    newOptions.googleFonts = _.filter(newOptions.googleFonts, (font) => (
      font.name !== this.props.options.headerFontFamily[0]
    ))

    this.props.onChange(newOptions)
  }
  render () {
    return (
      <div>
        <Select
          className={css(styles.select)}
          name="font-picker"
          value={this.props.options.headerFontFamily[0]}
          options={options}
          allowCreate
          onChange={(val) => this.onChange(val)}
        />
      </div>
    )
  }
}

export default FontSelectTool
