React = require('react')
HelloWorld = require '../src/index'
{Container} = require 'react-responsive-grid'
Headroom = require 'react-headroom'

module.exports = React.createClass
  render: ->
    <div>
      <Headroom style={{background: 'pink', padding: 8}} wrapperStyle={{marginBottom: 32}}>
        <Container style={maxWidth:'1000px'}>
          <h1>React-Component-Starter</h1>
        </Container>
      </Headroom>
      <Container style={maxWidth:'1000px'}>
        <a href="https://github.com/KyleAMathews/react-component-starter">Code on Github</a>
        <br />
        <br />
        <h2>Default look</h2>
        <pre><code>
        {"""
        <HelloWorld />
          """}
        </code></pre>
        <HelloWorld />

      </Container>
    </div>
