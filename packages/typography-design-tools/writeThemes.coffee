glob = require 'glob'
_ = require 'lodash'
fs = require 'fs'


glob('../typography-theme*', (err, files) ->
  console.log files
  themes = []
  for dir in files
    pJson = require("#{dir}/package.json")
    module = require("#{dir}/").default
    title = module.title
    console.log module
    console.log title

    themes.push {
      name: pJson.name
      title: title
      requireStr: "#{dir.slice(1)}/src/index.js"
    }

  console.log themes
  fs.writeFileSync('./themes.json', JSON.stringify(themes))
)
