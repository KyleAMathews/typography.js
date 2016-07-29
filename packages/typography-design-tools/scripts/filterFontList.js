const fs = require('fs')
const _ = require('lodash')

const fontList = require('../googleFonts.json')
const whiteList = require('../fontWhitelist')

const filteredList = fontList.items.filter(
  (item) => _.includes(whiteList, item.family)
)

const mappedList = filteredList.map((item) => ({
  category: item.category,
  family: item.family,
  weights: Object.keys(item.files),
}))

fs.writeFileSync('./filteredGoogleFontList.json', JSON.stringify(mappedList))
