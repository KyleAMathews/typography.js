import React from 'react'
import ReactNumberEditor from 'react-number-editor'
import gray from 'gray-percentage'
import { StyleSheet, css } from 'aphrodite'

const styles = StyleSheet.create({
  editor: {
    ':active': {
      borderColor: gray(75),
    },
    ':hover': {
      borderColor: gray(75),
    },
    ':focus': {
      borderColor: gray(75),
    },
  },
})

class NumberEditor extends React.Component {
  render () {
    // TODO wrap onChange and if value isn't a number, set to minimum value.
    return (
      <div>
        <ReactNumberEditor
          {...this.props}
          className={css(styles.editor)}
          style={{
            background: gray(20),
            border: '1px solid',
            borderColor: gray(50),
            borderRadius: 3,
            color: gray(90),
            fontSize: 12,
            padding: '2px 8px',
            width: 80,
          }}
        />
        <div
          style={{
            color: gray(60),
            fontSize: 10,
            position: 'absolute',
            right: 5,
            top: 4,
          }}
        >
          {this.props.unit}
        </div>
      </div>
    )
  }
}

export default NumberEditor
