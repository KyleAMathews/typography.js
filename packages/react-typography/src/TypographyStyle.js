import React from 'react'
import PropTypes from 'prop-types'
import Typography from 'typography/server'

const TypographyStyle = props => (
  <style
    id={'typography.js'}
    dangerouslySetInnerHTML={{
      __html: new Typography(props.typography.options).toString(),
    }}
  />
)

TypographyStyle.propTypes = {
  typography: PropTypes.object.isRequired,
}

TypographyStyle.displayName = 'TypographyStyle'

module.exports = TypographyStyle
