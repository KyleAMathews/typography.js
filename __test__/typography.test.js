// @flow

import typography from '../packages/typography/src/server'

describe('typography(options?)', () => {
  it('should be a function', () => {
    expect(typography).toEqual(jasmine.any(Function))
  })

  it('should return a structure', () => {
    const actual = typography()
    expect(actual.options).toEqual(jasmine.any(Object))
    expect(actual.rhythm).toEqual(jasmine.any(Function))
    expect(actual.establishBaseline).toEqual(jasmine.any(Function))
    expect(actual.linesForFontSize).toEqual(jasmine.any(Function))
    expect(actual.adjustFontSizeTo).toEqual(jasmine.any(Function))
    expect(actual.scale).toEqual(jasmine.any(Function))
    expect(actual.createStyles).toEqual(jasmine.any(Function))
    expect(actual.toJSON).toEqual(jasmine.any(Function))
    expect(actual.toString).toEqual(jasmine.any(Function))
    expect(actual.injectStyles).toEqual(jasmine.any(Function))
  })
})

describe('typography(options?).scale()', () => {
  it('should scale', () => {
    const actual = typography().scale()
    expect(actual.fontSize).toEqual('1rem')
    expect(actual.lineHeight).toEqual('1.45rem')
  })

  it('should accept custom scales', () => {
    const actual = typography().scale(1.333)
    expect(actual.fontSize).toEqual('2.51926rem')
    expect(actual.lineHeight).toEqual('2.9rem')
  })

  it('should accept custom scales', () => {
    const actual = typography().scale(2)
    expect(actual.fontSize).toEqual('4rem')
    expect(actual.lineHeight).toEqual('4.35rem')
  })
})

describe('typography(options?).toJSON()', () => {
  it('should return CSS as JSON', () => {
    expect(typography().toJSON()).toMatchSnapshot()
  })
})

describe('typography(options?).toString()', () => {
  it('should return CSS as a string', () => {
    expect(
      typography({
        includeNormalize: false,
      }).toString()
    ).toMatchSnapshot()
  })
})

describe('typography(options?).createStyles()', () => {
  it('should return CSS as a string', () => {
    expect(
      typography({
        includeNormalize: false,
      }).createStyles()
    ).toMatchSnapshot()
  })
})

describe('typography(options?).injectStyles()', () => {
  it('should not fail if document is undefined', () => {
    expect(() => {
      typography().injectStyles()
    }).not.toThrow()
  })

  it('should set css if typography.js element exists', () => {
    const sut = typography()

    global.document = jasmine.createSpyObj('document', ['getElementById'])

    const styleNode = {}

    global.document.getElementById.and.returnValue(styleNode)

    sut.injectStyles()

    expect(styleNode.innerHTML).toEqual(sut.toString())
    expect(global.document.getElementById).toHaveBeenCalledWith('typography.js')

    delete global.document
  })

  it('should create a new style node if typography.js element does not exists', () => {
    const sut = typography()

    global.document = jasmine.createSpyObj('document', [
      'head',
      'createElement',
      'getElementById',
    ])

    const styleNode = {}

    global.document.getElementById.and.returnValue(null)
    global.document.createElement.and.returnValue(styleNode)
    global.document.head.appendChild = jasmine.createSpy('appendChild')

    sut.injectStyles()

    expect(styleNode.id).toEqual('typography.js')
    expect(styleNode.innerHTML).toEqual(sut.toString())
    expect(global.document.createElement).toHaveBeenCalledWith('style')
    expect(global.document.getElementById).toHaveBeenCalledWith('typography.js')
    expect(global.document.head.appendChild).toHaveBeenCalledWith(styleNode)

    delete global.document
  })
})
