if (process.env.NODE_ENV === `production`) {
  module.exports = require(`./client`)
} else {
  module.exports = require(`./server`)
}
