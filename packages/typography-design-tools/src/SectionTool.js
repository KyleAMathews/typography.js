import React from 'react'

class SectionTool extends React.Component {
  render () {
    return (
      <div
        style={{
          float: 'left',
          marginRight: 5,
        }}
      >
        <span
          style={{
            fontSize: 10,
            lineHeight: '15px',
          }}
        >
          {this.props.title}
        </span>
        <br />
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            width: 80,
          }}
        >
          {this.props.children}
        </div>
      </div>
    )
  }
}

export default SectionTool
