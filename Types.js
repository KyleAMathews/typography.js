// @flow
type GoogleFontsType = {name: string; styles?: string[]}
// A number, or a string that is one ("1.5"); a length may also be a number (px).
type NumberLike = number | string
type Length = number | string
type VerticalRhythmType = {
  rhythm: (lines?: ?NumberLike, fontSize?: ?Length, offset?: ?NumberLike) => string,
  scale: (position?: ?NumberLike) => { fontSize: string, lineHeight: string },
  adjustFontSizeTo: (
    fontSize: Length,
    lines?: ?(NumberLike | "auto"),
    fromSize?: ?Length,
  ) => { fontSize: string, lineHeight: string },
  linesForFontSize: (fontSize: Length) => number,
  establishBaseline: () => { fontSize: string, lineHeight: string },
}

export type OptionsType = {
  title: string,
  baseFontSize?: Length,
  baseLineHeight?: NumberLike,
  headerLineHeight?: NumberLike,
  scaleRatio?: NumberLike,
  rhythmUnit?: string,
  minLinePadding?: Length,
  roundToNearestHalfLine?: mixed,
  googleFonts?: GoogleFontsType[],
  headerFontFamily?: string[],
  bodyFontFamily?: string[],
  headerColor?: string,
  bodyColor?: string,
  headerWeight?: number | string,
  bodyWeight?: number | string,
  boldWeight?: number | string,
  blockMarginBottom?: NumberLike,
  includeNormalize?: boolean,
  overrideStyles?: (
    verticalRhythm: VerticalRhythmType,
    options: OptionsType,
    styles: mixed,
  ) => Object,
  overrideThemeStyles?: (
    verticalRhythm: VerticalRhythmType,
    options: OptionsType,
    styles: mixed,
  ) => Object,
  plugins?: mixed[],
}
