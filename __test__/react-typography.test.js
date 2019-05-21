// @flow

import React from 'react'
import typography from '../packages/typography/src/index'
import { GoogleFont, TypographyStyle } from '../packages/react-typography/src/index'
import renderer from 'react-test-renderer'

it('should return a structure', () => {
  expect(GoogleFont).toEqual(jasmine.any(Function))
  expect(TypographyStyle).toEqual(jasmine.any(Function))
})

describe('GoogleFont', () => {
  it('should render with typography object', () => {
    const component = renderer.create(React.createElement(GoogleFont, {
      typography: typography(),
    }))

    const tree = component.toJSON()
    expect(tree).toMatchSnapshot()
  })

  it('should render with googleFonts options', () => {
    const component = renderer.create(React.createElement(GoogleFont, {
      typography: typography({
        fontDisplay: 'optional',
        googleFonts: [
          {
            name: 'Montserrat',
            styles: [
              '700',
            ],
          },
        ],
      }),
    }))

    const tree = component.toJSON()
    expect(tree).toMatchSnapshot()
  })
})

describe('TypographyStyle', () => {
  it('should render with typography object', () => {
    const component = renderer.create(React.createElement(TypographyStyle, {
      typography: typography({
        includeNormalize: false,
      }),
    }))

    const tree = component.toJSON()
    expect(tree).toMatchSnapshot()
  })
})
