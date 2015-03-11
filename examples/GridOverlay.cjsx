React = require 'react'

module.exports = React.createClass
  displayName: "GridOverlay"

  componentDidMount: ->
    @portalNode = document.createElement('div')
    document.body.appendChild(@portalNode)
    @renderPortal(@props)

  componentWillReceiveProps: (newProps) ->
    if @isMounted()
      @renderPortal(newProps)

  render: ->
    return null

  renderPortal: (props) ->
    if @portalNode
      grids = [0..200].map (i) ->
        <div>
          <div style={{
            borderTop: '1px solid #ccc'
            height: "calc(#{props.rhythm(1)} / 2 - 1px)"
          }}/>
          <div style={{
            borderTop: '1px dashed #ccc'
            height: "calc(#{props.rhythm(1)} / 2 - 1px)"
          }}/>
        </div>

      React.render((
        <div style={{
          width: "100vw"
          height: "100vh"
          left: "calc(280px + 3rem)"
          right: 0
          top: 24
          bottom: 0
          display: if props.showGrid then "block" else "none"
          position: 'absolute'
        }}>
          {grids}
        </div>
      ), @portalNode)
