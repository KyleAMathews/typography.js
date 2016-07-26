import React from 'react'
import gray from 'gray-percentage'

const Select = ({ options, value, onChange }) => {
  const optionsEls = options.map((text, i) => (
    <option key={i} value={i}>{text}</option>
  ))
  return (
    <select
      style={{
        background: gray(20),
        border: '1px solid',
        borderColor: gray(50),
        borderRadius: 3,
        color: gray(90),
        fontSize: 12,
      }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        const valueInt = parseInt(value, 10)
        let change = false
        let newValue
        if (e.which === 40 || e.which === 38) {
          e.preventDefault()
        }
        if (e.which === 40) { // arrow down
          change = true
          // At end?
          if (valueInt === options.length - 1) {
            newValue = 0
          } else {
            newValue = valueInt + 1
          }
        }
        if (e.which === 38) { // arrow up
          change = true
          // At beginning?
          if (valueInt === 0) {
            newValue = options.length - 1
          } else {
            newValue = valueInt - 1
          }
        }

        // If keyboard press was up or down then change.
        if (change) {
          onChange(newValue.toString())
        }

        return false
      }}
    >
      {optionsEls}
    </select>
  )
}

export default Select
