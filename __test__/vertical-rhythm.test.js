// @flow
// compass-vertical-rhythm 1.4.5's test suite, ported: typography.js inlined
// that library's helpers (rhythm, establishBaseline, linesForFontSize,
// adjustFontSizeTo). One fixture changes on purpose, to follow CSS Values 4:
// an em line height is relative to the element's own font size (see
// "should work with em and fromSize").

import typography from "../packages/typography/src/index"

const vr = (options: Object) => typography(options)

describe("rhythm", () => {
  it("should calculate rhythm for rem", () => {
    const { rhythm } = vr({
      baseFontSize: "21px",
      baseLineHeight: 4 / 3,
      rhythmUnit: "rem",
    })
    expect(rhythm(1)).toEqual("1.33333rem")
    expect(rhythm(0.5)).toEqual("0.66667rem")
    expect(rhythm(0.25)).toEqual("0.33333rem")
  })

  it("should calculate rhythm for em", () => {
    const { rhythm } = vr({
      baseFontSize: "24px",
      baseLineHeight: 1.25,
      rhythmUnit: "em",
    })
    expect(rhythm(1)).toEqual("1.25em")
    expect(rhythm(0.5)).toEqual("0.625em")
    expect(rhythm(0.25)).toEqual("0.3125em")
  })

  it("should calculate rhythm for px", () => {
    const { rhythm } = vr({
      baseFontSize: "24px",
      baseLineHeight: 1.25,
      rhythmUnit: "px",
    })
    expect(rhythm(1)).toEqual("30px")
    expect(rhythm(0.5)).toEqual("15px")
    expect(rhythm(0.25)).toEqual("7px")
  })

  it("should calculate rhythm if lineHeight is set in px", () => {
    const { rhythm } = vr({
      baseFontSize: "24px",
      baseLineHeight: "30px",
      rhythmUnit: "px",
    })
    expect(rhythm(1)).toEqual("30px")
    expect(rhythm(0.5)).toEqual("15px")
    expect(rhythm(0.25)).toEqual("7px")
  })
})

describe("establishBaseline", () => {
  const { establishBaseline } = vr({
    baseFontSize: "24px",
    baseLineHeight: 1.25,
    rhythmUnit: "rem",
  })

  it("should return fontSize with percent as its unit", () => {
    expect(establishBaseline().fontSize).toMatch(/%$/)
  })

  it("should return unitless lineHeight", () => {
    expect(establishBaseline().lineHeight).toMatch(/^[\d.]+$/)
  })

  it("should return lineHeight with units if specified", () => {
    const { establishBaseline: withUnits } = vr({ baseLineHeight: "1.25em" })
    expect(withUnits().lineHeight).toMatch(/em$/)
  })

  it("should return sensible results", () => {
    const result = establishBaseline()
    expect(result.fontSize).toEqual("150%")
    expect(result.lineHeight).toEqual("1.25")
  })
})

describe("linesForFontSize", () => {
  const { linesForFontSize } = vr({
    baseFontSize: "21px",
    baseLineHeight: 4 / 3,
    rhythmUnit: "rem",
  })

  it("should return line value of larger than 1 if font size is larger than baseLineHeight", () => {
    expect(linesForFontSize("29px") > 1).toBe(true)
  })

  it("should return line value of 1 if font size is less than baseLineHeight", () => {
    expect(linesForFontSize("20px")).toEqual(1)
  })

  it("should add extra lines if space taken up by font too close to edges of line (as determined by minLinePadding)", () => {
    expect(linesForFontSize("26px")).toEqual(1.5)
    expect(linesForFontSize("24px")).toEqual(1)
    const noPadding = vr({
      baseFontSize: "21px",
      baseLineHeight: 4 / 3,
      rhythmUnit: "rem",
      minLinePadding: "0px",
    })
    expect(noPadding.linesForFontSize("26px")).toEqual(1)
  })
})

describe("adjustFontSizeTo", () => {
  const { adjustFontSizeTo, rhythm } = vr({
    baseFontSize: "21px",
    baseLineHeight: 4 / 3,
    rhythmUnit: "rem",
  })

  it("should accept px", () => {
    expect(adjustFontSizeTo("63px").fontSize).toEqual("3rem")
  })

  it("should accept rem", () => {
    expect(adjustFontSizeTo("3rem").fontSize).toEqual("3rem")
  })

  it("should accept em", () => {
    expect(adjustFontSizeTo("3em").fontSize).toEqual("3rem")
  })

  it("should accept %", () => {
    expect(adjustFontSizeTo("200%").fontSize).toEqual("2rem")
  })

  it("should let you set explicit # of lines", () => {
    let result = adjustFontSizeTo("3em", 3)
    expect(result.fontSize).toEqual("3rem")
    expect(result.lineHeight).toEqual(rhythm(3))
    // Compass allows a line height smaller than the font size.
    result = adjustFontSizeTo("3em", 2)
    expect(result.fontSize).toEqual("3rem")
    expect(result.lineHeight).toEqual(rhythm(2))
  })

  it("should return values in whatever the set rhythmUnit is", () => {
    const em = vr({
      baseFontSize: "21px",
      baseLineHeight: 4 / 3,
      rhythmUnit: "em",
    })
    expect(em.adjustFontSizeTo("3em", 3).fontSize).toEqual("3em")
  })

  it("should work with em and fromSize", () => {
    const em = vr({
      baseFontSize: "21px",
      baseLineHeight: 4 / 3,
      rhythmUnit: "em",
    })
    const result = em.adjustFontSizeTo("42px", 3, "10.5px")
    expect(result.fontSize).toEqual("4em")
    // compass: "8em", relative to fromSize. CSS reads an em line height
    // relative to the element's own font size: 3 lines × 28px / 42px.
    expect(result.lineHeight).toEqual("2em")
  })
})
