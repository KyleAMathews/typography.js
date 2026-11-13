// @flow
// The vertical rhythm helpers, with the API of compass-vertical-rhythm 1.4.5
// (typography.js re-exported it through v0.16): rhythm(lines, fontSize,
// offset), adjustFontSizeTo(toSize, lines, fromSize), linesForFontSize(size),
// and establishBaseline(). Lengths convert by CSS Values 4: rem is the base,
// em and % are the parent size, and absolute units are exact (5.2). ex is
// rejected: only the browser knows the font's x-height. Results are in the rhythm unit, to 5
// decimals. Rhythm in px is floored to whole pixels.

import { dimension, number, ws } from "./css"

const invalid = (name: string, what: string = "numerical value") =>
  new RangeError(`Invalid ${what} for ${name}`)

// A CSS number, with white space around it ignored, as CSS ignores it.
const cssNumber = new RegExp(`^${ws}*${number}${ws}*$`, "i")

// A finite number, or a string that is one CSS number ("1.5"), as v0.16 read.
export const toNumber = (name: string, value: any, positive: boolean = false) => {
  const number =
    typeof value === "string" && cssNumber.test(value) ? Number(value) : value
  if (
    typeof number !== "number" ||
    !isFinite(number) ||
    (positive && number <= 0)
  ) {
    throw invalid(name)
  }
  return number
}
export const isNumeric = (value: any) =>
  typeof value === "number" || (typeof value === "string" && cssNumber.test(value))

// A length's number and unit. A plain number, or a string that is only a
// number, is px, as compass-vertical-rhythm read it (and a unitless 0 is a
// CSS length, 5.1).
const parseLength = (name: string, value: any) => {
  if (typeof value === "number") return [toNumber(name, value), "px"]
  const match = typeof value === "string" && dimension.exec(value)
  if (!match) throw invalid(name, "CSS length")
  return [Number(match[1]), match[2].toLowerCase() || "px"]
}

const absolutePx = {
  px: 1,
  in: 96,
  pt: 96 / 72,
  pc: 16,
  cm: 96 / 2.54,
  mm: 96 / 25.4,
  q: 96 / 101.6,
}

// px per unit (CSS Values 4): rem is the root size, em and % the parent size,
// and absolute units exact (5.2). ex and other font-relative units have no
// factor: only the browser knows the font's x-height (engineer decision
// 2026-11-12).
const pxPer = (unit: string, root: number, parent: number) =>
  unit === "rem"
    ? root
    : unit === "em"
    ? parent
    : unit === "%"
    ? parent / 100
    : Object.prototype.hasOwnProperty.call(absolutePx, unit)
    ? absolutePx[unit]
    : undefined
// A length in px. An unknown unit has no factor: NaN, which toNumber rejects.
const lengthPx = (name: string, value: any, root: number, parent: number) => {
  const [number, unit] = parseLength(name, value)
  return toNumber(name, number * pxPer(unit, root, parent))
}

export default function verticalRhythm(options: Object) {
  // Read once, at construction, as compass-vertical-rhythm copied its options.
  const { baseLineHeight } = options
  // The root's font size. Its own root and parent is the browser's initial
  // size, 16px, which html's percentage is of.
  const base = toNumber(
    "baseFontSize",
    lengthPx("baseFontSize", options.baseFontSize, 16, 16),
    true
  )
  const pxPerUnit = (unit: string, parent: number) => pxPer(unit, base, parent)
  const toPixels = (name: string, length: any, parent: number) =>
    lengthPx(name, length, base, parent)
  // A font size in px: a negative one is not CSS.
  const sizePx = (name: string, length: any, parent: number) => {
    const px = toPixels(name, length, parent)
    if (px < 0) throw invalid(name)
    return px
  }

  // A number is a multiple of the base; a length is read at html, whose font
  // size is the base. 16 × 1e308 is not a usable line height.
  const linePx = toNumber(
    "baseLineHeight",
    isNumeric(baseLineHeight)
      ? base * toNumber("baseLineHeight", baseLineHeight)
      : toPixels("baseLineHeight", baseLineHeight, base),
    true
  )
  const unit =
    options.rhythmUnit === undefined
      ? "rem"
      : typeof options.rhythmUnit === "string"
      ? options.rhythmUnit.toLowerCase()
      : ""
  // A unit for lengths that converts from px. % is not one: a margin's % is
  // of the container's width.
  if (unit === "%" || pxPerUnit(unit, 1) === undefined) {
    throw invalid("rhythmUnit", "CSS unit")
  }
  const paddingPx = toPixels(
    "minLinePadding",
    options.minLinePadding === undefined ? "2px" : options.minLinePadding,
    base
  )
  // Half lines unless set to a falsy value, as compass-vertical-rhythm read it.
  const step =
    options.roundToNearestHalfLine === undefined || options.roundToNearestHalfLine
      ? 0.5
      : 1

  // px in the rhythm unit, relative to a font size. An em length
  // relative to a zero (or underflowing) size cannot hold the value, so it is
  // written in px (engineer decision 2026-11-12).
  const inUnit = (name: string, px: number, fontSize: number, floor: boolean) => {
    const factor = pxPerUnit(unit, fontSize)
    const value = px / factor
    if (unit === "px" || (unit === "em" && !isFinite(value))) {
      return `${floor ? Math.floor(px) : parseFloat(px.toFixed(5))}px`
    }
    const rounded = parseFloat(value.toFixed(5))
    // Rounding can cross the representability limit.
    toNumber(name, rounded * factor)
    return `${rounded}${unit}`
  }

  // The fewest lines (half lines by default) that hold the font size, plus
  // one more when the space left is under twice minLinePadding.
  const linesForFontSize = (fontSize: any) => {
    const px = sizePx("linesForFontSize font size", fontSize, base)
    const lines = Math.ceil(px / linePx / step) * step
    return lines * linePx - px < 2 * paddingPx ? lines + step : lines
  }
  const rhythm = (lines: any, fontSize: any, offset: any) => {
    const count = lines == null ? 1 : toNumber("rhythm lines", lines)
    const context = sizePx(
      "rhythm font size",
      fontSize == null ? base : fontSize,
      base
    )
    const shift = offset == null ? 0 : toNumber("rhythm offset", offset)
    return inUnit(
      "rhythm result",
      toNumber("rhythm result", linePx * count - shift),
      context,
      true
    )
  }
  // A negative line count is not CSS either.
  const adjustFontSizeTo = (fontSize: any, lines: any, fromSize: any) => {
    const parent = sizePx(
      "adjustFontSizeTo fromSize",
      fromSize == null ? base : fromSize,
      base
    )
    const px = sizePx("adjustFontSizeTo font size", fontSize, parent)
    const count =
      lines == null || lines === "auto"
        ? linesForFontSize(`${px}px`)
        : toNumber("adjustFontSizeTo lines", lines)
    if (count < 0) throw invalid("adjustFontSizeTo lines")
    return {
      fontSize: inUnit("adjustFontSizeTo font size", px, parent, false),
      // Relative to the element's own, new font size.
      lineHeight: rhythm(count, `${px}px`),
    }
  }
  const establishBaseline = () => ({
    // 15 significant digits: "115%", not floating-point "114.99999999999999%".
    fontSize: `${parseFloat(((base / 16) * 100).toPrecision(15))}%`,
    // As given: a unitless line height stays unitless.
    lineHeight: String(baseLineHeight),
  })

  return {
    base,
    helpers: { rhythm, adjustFontSizeTo, linesForFontSize, establishBaseline },
  }
}
