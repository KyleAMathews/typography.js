import React from 'react'
import ReactDOM from 'react-dom'
import DesignTool from './DesignTool'

let node
const wrapTypography = (typography) => {
  if (typeof window !== 'undefined') {
    if (!node) {
      node = document.createElement('div')
      node.id = 'typography-design-tools'
      document.body.appendChild(node)
    }

    // Render tool component.
    ReactDOM.render(
      <DesignTool typography={typography} />,
      typeof window !== 'undefined' ? document.getElementById('typography-design-tools') : void 0
    )
  }

  return typography
}

export default wrapTypography
