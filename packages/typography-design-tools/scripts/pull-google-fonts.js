const request = require('request')
const fs = require('fs')

const url = 'https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyCNFL9uV4FCjfjvD4X6axpg-sNBJnL2Dno&sort=popularity'

request.get(url, (err, res, body) => {
  fs.writeFileSync('./googleFonts.json', body)
})
