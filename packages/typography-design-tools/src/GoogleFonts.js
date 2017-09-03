import React from 'react'
import _ from 'lodash'
import fontList from '../filteredGoogleFontList.json'
import Select from 'react-select'

const Font = ({ font }) => (
  <div
    style={{
      marginBottom: 7.5,
    }}
  >
    {font.name} — {font.styles.length} styles
  </div>
)

class GoogleFontsTool extends React.Component {
  render() {
    const fonts = this.props.options.googleFonts.map(font => (
      <Font font={font} />
    ))
    return <div>{fonts}</div>
  }
}

export default GoogleFontsTool
