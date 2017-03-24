// @flow

import typography from '../packages/typography/src/index'
import CodePlugin from '../packages/typography-plugin-code/src/index'

it('should return a structure', () => {
  expect(CodePlugin).toEqual(jasmine.any(Function))
})

describe('CodePlugin()', () => {
  it('should add code styles', () => {
    const actual = typography({
      plugins: [
        new CodePlugin(),
      ],
    }).toJSON()

    expect(actual).toMatchSnapshot()
  })

  it('should accept a custom blockMarginBottom', () => {
    const actual = typography({
      blockMarginBottom: '1rem',
      plugins: [
        new CodePlugin(),
      ],
    }).toJSON()

    expect(actual).toMatchSnapshot()
  })

  it('should accept an empty blockMarginBottom', () => {
    const actual = typography({
      blockMarginBottom: null,
      plugins: [
        new CodePlugin(),
      ],
    }).toJSON()

    expect(actual).toMatchSnapshot()
  })
})
