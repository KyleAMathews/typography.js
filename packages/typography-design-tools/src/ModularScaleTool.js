import React from 'react'
import NumberEditor from './NumberEditor'
import Select from './Select'
import SectionTool from './SectionTool'
import msToRatio from './msToRatio'

class ModularScale extends React.Component {
  render () {
    // Determine the maxWidth
    let maxWidthValue
    switch (this.props.modularScale.maxWidth) {
      case '480px':
        maxWidthValue = 0
        break
      case '768px':
        maxWidthValue = 1
        break
      case '980px':
        maxWidthValue = 2
        break
      case '1280px':
        maxWidthValue = 3
        break
      default:
        maxWidthValue = 4
    }
    return (
      <div
        style={{
          clear: 'both',
        }}
      >
        <SectionTool
          title="Scale"
        >
          <NumberEditor
            unit="scale"
            value={msToRatio(this.props.modularScale.scale)}
            min={1}
            max={4}
            step={0.1}
            decimals={2}
            onValueChange={(value) => {
              console.log(value)
              const valueFloat = parseFloat(value)
              const newScale = { ...this.props.modularScale }
              newScale.scale = valueFloat
              this.props.onChange(newScale)
            }}
          />
        </SectionTool>
        <SectionTool
          title="Max Width"
        >
          <Select
            options={['Mobile', 'Tablet', 'Desktop', 'Very Wide', 'Infinite']}
            value={maxWidthValue}
            onChange={(value) => {
              const newScale = { ...this.props.modularScale }
              console.log(value, newScale)
              let maxWidth
              console.log('value', value)
              if (value === '0') {
                maxWidth = '480px'
              } else if (value === '1') {
                maxWidth = '768px'
              } else if (value === '2') {
                maxWidth = '980px'
              } else if (value === '3') {
                maxWidth = '1280px'
              }

              console.log(maxWidth)
              newScale.maxWidth = maxWidth
              this.props.onChange(newScale)
            }}
          />
        </SectionTool>
      </div>
    )
  }
}

export default ModularScale
