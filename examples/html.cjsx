React = require 'react'
{GoogleFont, TypographyStyle, rhythm} = require('../src')()
Body = require './Body'
gray = require 'gray-percentage'

module.exports = React.createClass

  render: ->
    body = React.renderToString(<Body/>)
    <html>
      <head>
        <meta charSet="utf-8"/>
        <meta content="IE=edge"/>
        <meta name="viewport" content="user-scalable=no width=device-width, initial-scale=1.0 maximum-scale=1.0"/>
        <title>React Typography</title>
        <link href="//fonts.googleapis.com/css?family=Source+Sans+Pro:400|Inconsolata:400" rel="stylesheet" type="text/css"/>
        <style>
        {"""
          body {
            padding: 0 #{rhythm(1)};
          }

          .usage-instructions pre {
            font-family: $alt-font-family;
            margin: 0;
            margin-bottom: 36px;
            padding: 0;
          }

          .usage-instructions pre code {
            background: #{gray(95)};
            border: 0;
            border-radius(3px);
            display: inline-block;
            font-family: Inconsolata, monospace, serif;
            font-size: 16px;
            line-height: 20px;
            overflow: hidden;
            padding: 36px;
            white-space: inherit;
            word-wrap: normal;
          }
        """}
        </style>
        <GoogleFont/>
        <TypographyStyle/>
      </head>
      <body>
        <div id="mount-point" dangerouslySetInnerHTML={{__html: body}}/>
        <script src="bundle.js"/>
      </body>
    </html>
