glob = require 'glob'
_ = require 'lodash'
json2md = require 'json2md'
fs = require 'fs'

glob('packages/typography-theme*', (err, files) ->
  console.log files
  for dir in files
    pJson = require("../#{dir}/package.json")
    module = require("../#{dir}/").default
    console.log module
    title = _.words(pJson.name.slice(17)).map((word) -> _.capitalize(word)).join(' ')
    description = pJson.description
    headerFont = _.first(module.headerFontFamily)
    bodyFont = _.first(module.bodyFontFamily)
    googleFonts = []
    if module.googleFonts?
      googleFonts = module.googleFonts.map (font) -> font.name

    console.log title
    console.log('headerFont', headerFont)
    if headerFont in googleFonts
      headerFont = "<a href='https://fonts.google.com/specimen/#{_.words(headerFont).join('+')}'>#{headerFont}</a>"
    console.log('headerFont', headerFont)
    if bodyFont in googleFonts
      bodyFont = "<a href='https://fonts.google.com/specimen/#{_.words(bodyFont).join('+')}'>#{bodyFont}</a>"

    md = json2md([
      { h1: title + " — a <a href='https://github.com/kyleamathews/typography.js'>Typography.js</a> theme" },
      { p: description },
      { h2: "Install" },
      { code: {
          language: 'bash'
          content: ["npm install --save typography #{pJson.name}"]
        },
      },
      { h2: "Usage" },
      { code: {
          language: 'javascript'
          content: [
            "import Typography from 'typography'"
            "import #{_.camelCase(title)}Theme from '#{pJson.name}'"
            ""
            "const typography = new Typography(#{_.camelCase(title)}Theme)"
          ]
        },
      },
      { h2: "More on theme" },
      { p: "#{title} uses \"#{headerFont}\" for headers and \"#{bodyFont}\" for body text" },
    ])

    fs.writeFileSync("./#{dir}/README.md", md)
    #console.log title, description
)
