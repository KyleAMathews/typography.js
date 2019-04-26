import React from "react"
import NumberEditor from "./NumberEditor"
import Select from "./Select"
import SectionTool from "./SectionTool"
import msToRatio from "./msToRatio"

class ModularScale extends React.Component {
  render() {
    return (
      <SectionTool title="Scale Ratio">
        <NumberEditor
          unit="ratio"
          value={msToRatio(this.props.scaleRatio)}
          min={1}
          max={6}
          step={0.1}
          decimals={2}
          onValueChange={value => {
            const valueFloat = parseFloat(value)
            this.props.onChange(valueFloat)
          }}
        />
      </SectionTool>
    )
  }
}

export default ModularScale
