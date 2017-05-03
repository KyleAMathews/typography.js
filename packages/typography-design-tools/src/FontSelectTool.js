import React from 'react'
import Select from 'react-select'
import fontList from '../filteredGoogleFontList.json'
import { StyleSheet, css } from 'aphrodite'
import _ from 'lodash'
import Autosuggest from 'react-autosuggest'
import gray from 'gray-percentage'

const styles = StyleSheet.create({
  input: {
    background: "url(\"data:image/svg+xml;utf8,<svg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' width='18' height='18' viewBox='0 0 24 24'><path fill='rgb(153, 153, 153)' d='M7.406 7.828l4.594 4.594 4.594-4.594 1.406 1.406-6 6-6-6z'></path></svg>\")",
    backgroundColor: gray(20),
    backgroundPosition: '100% 50%',
    backgroundRepeat: 'no-repeat',
    border: '1px solid',
    borderColor: gray(50, 0, true),
    borderRadius: 3,
    color: gray(90, 0, true),
    fontSize: 12,
    width: '100%',
    padding: '2px 8px',
    marginBottom: 3.75,
  },
  suggestionsContainer: {
    background: gray(20),
    border: '1px solid',
    borderColor: gray(50, 0, true),
    borderRadius: 3,
    color: gray(90, 0, true),
    fontSize: 12,
    padding: 0,
    margin: 0,
    listStyle: 'none',
    position: 'absolute',
    zIndex: 1,
    overflow: 'hidden',
    overflowY: 'scroll',
    maxHeight: '500px',
    width: '93%',
  },
  suggestion: {
    color: gray(90, 0, true),
    padding: '3.75px 7px',
    margin: 0,
  },
  suggestionFocused: {
    background: gray(35, 0, true),
    color: gray(95, 0, true),
  },
})

const options = fontList.map(font => ({
  name: font.family,
}))

const pickBoldStyle = name => {
  const family = _.find(fontList, font => font.family === name)

  // Pick heaviest weight that's not an italic.
  let weights = _.map(family.weights, weight => {
    if (weight === 'regular') {
      return 400
    } else {
      return parseInt(weight, 10)
    }
  })
  weights = _.filter(_.sortBy(weights), weight => _.isFinite(weight))
  if (_.includes(weights, 700)) {
    return 700
  } else {
    return _.last(weights)
  }
}

function getSuggestions(value) {
  const inputValue = value.trim().toLowerCase()
  const inputLength = inputValue.length

  if (inputValue === '') {
    return options
  }

  return inputLength === 0
    ? []
    : options.filter(option =>
        _.includes(option.name.toLowerCase(), inputValue)
      )
}

function getSuggestionValue(suggestion) {
  // when suggestion selected, this function tells
  return suggestion.name // what should be the value of the input
}

function renderSuggestion(suggestion) {
  return <span>{suggestion.name}</span>
}

class FontSelectTool extends React.Component {
  constructor(props) {
    super()

    let fontFamily
    if (props.type === 'header') {
      fontFamily = props.options.headerFontFamily[0]
    } else if (props.type === 'body') {
      fontFamily = props.options.bodyFontFamily[0]
    }

    this.state = {
      value: fontFamily,
      suggestions: getSuggestions(''),
    }

    this.onChange = this.onChange.bind(this)
    this.onSuggestionsUpdateRequested = this.onSuggestionsUpdateRequested.bind(
      this
    )
  }

  onChange(event, { newValue }) {
    this.setState({
      value: newValue,
    })
    const newOptions = { ...this.props.options }
    const family = _.find(fontList, font => font.family === newValue)

    if (family) {
      // Choose weight for choosen header font.
      if (this.props.type === 'header') {
        // Set header font family.
        newOptions.headerFontFamily = [newValue, family.category]

        const weight = pickBoldStyle(newValue)

        // Set weight.
        newOptions.headerWeight = weight

        // Add font to Google Fonts array.
        newOptions.googleFonts.push({
          name: newValue,
          styles: [weight],
        })

        // Filter out old font.
        newOptions.googleFonts = _.filter(
          newOptions.googleFonts,
          font => font.name !== this.props.options.headerFontFamily[0]
        )
      } else if (this.props.type === 'body') {
        // Set body font family.
        newOptions.bodyFontFamily = [newValue, family.category]

        const boldWeight = pickBoldStyle(newValue)

        // Set weights.
        newOptions.bodyWeight = 400
        newOptions.boldWeight = boldWeight

        // Add font to Google Fonts array.
        newOptions.googleFonts.push({
          name: newValue,
          styles: ['400', '400i', boldWeight.toString(), `${boldWeight}i`],
        })

        // Filter out old font.
        newOptions.googleFonts = _.filter(
          newOptions.googleFonts,
          font => font.name !== this.props.options.bodyFontFamily[0]
        )
      }

      this.props.onChange(newOptions, family)
    }
  }

  onSuggestionsUpdateRequested({ value }) {
    this.setState({
      suggestions: getSuggestions(value),
    })
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.type === 'header') {
      this.setState({
        value: nextProps.options.headerFontFamily[0],
      })
    } else if (this.props.type === 'body') {
      this.setState({
        value: nextProps.options.bodyFontFamily[0],
      })
    }
  }

  render() {
    const { value, suggestions } = this.state
    const inputProps = {
      placeholder: 'Type font family',
      value,
      onChange: this.onChange,
    }

    return (
      <Autosuggest
        shouldRenderSuggestions={() => true}
        suggestions={suggestions}
        onSuggestionsUpdateRequested={this.onSuggestionsUpdateRequested}
        getSuggestionValue={getSuggestionValue}
        renderSuggestion={renderSuggestion}
        inputProps={inputProps}
        theme={{
          input: css(styles.input),
          suggestionsContainer: css(styles.suggestionsContainer),
          suggestion: css(styles.suggestion),
          suggestionFocused: css(styles.suggestionFocused),
        }}
      />
    )
  }
}

export default FontSelectTool
