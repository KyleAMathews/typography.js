// @flow

import {readdirSync} from 'fs'
import {join} from 'path'
import typography from '../packages/typography/src/index'

describe('themes', () => {
  const themes = readdirSync('./packages')

  themes
    .filter(theme => theme.startsWith('typography-theme'))
    .forEach(theme => {
      it(`should match the ${theme} snapshot`, () => {
        const themeOptions = require(`../packages/${theme}/src/index`).default
        const actual = typography(themeOptions).toJSON()
        expect(actual).toMatchSnapshot()
      })
    })
})
