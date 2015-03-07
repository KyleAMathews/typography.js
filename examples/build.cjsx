fs = require 'fs'
React = require 'react'
require('node-cjsx').transform()

Page = require './html'

fs.writeFile('examples/index.html', React.renderToStaticMarkup(<Page/>))
