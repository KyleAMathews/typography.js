// @flow

import normalize from '../packages/typography-normalize/src/index'

it('should return a structure', () => {
  expect(normalize).toEqual(jasmine.any(String))
})
