React = require 'react'
gray = require 'gray-percentage'
Reflux = require 'reflux'
TypographyStore = require './TypographyStore'

module.exports = React.createClass
  displayName: 'Configuration'

  mixins: [
    Reflux.connect(TypographyStore, 'typography')
  ]

  render: ->
    <div className="usage-instructions">
      <h1 style={{marginBottom: 0}}>Typography.js</h1>

      <h3 style={{color: gray(60)}}>An opinionated toolkit for building beautiful typography.</h3>

      <a style={{color: '#2196F3'}} href="https://github.com/KyleAMathews/react-typography">Code on Github</a>
      <br />
      <br />

      <hr />

      <h2>Using within a React.js project</h2>
      <p>React Typography is designed to be used within a React.js server rendered app but with a bit of imagination, you can easily use the generated CSS below within other templating systems.</p>
      <pre><code>
        {"""
        var Typography = require('react-typography');

        {GoogleFont, TypographyStyle} = Typography(
          #{JSON.stringify(@state.typography.options, null, 4)})

        module.exports = React.createClass({
          render: ->
            <html>
              <head>
                <meta charSet="utf-8"/>
                <meta content="IE=edge"/>
                <meta name="viewport" content="user-scalable=no width=device-width, initial-scale=1.0 maximum-scale=1.0"/>
                <title>Your site title</title>
                <GoogleFont/>
                <TypographyStyle/>
              </head>
              <body>
                <div id="mount-point">
                  <YourComponents/>
                </div>
                <script src="bundle.js"/>
              </body>
            </html>
        """}
      </code></pre>
      <h2>Generated css</h2>
      <pre><code>{@state.typography.styles}</code></pre>
    </div>
