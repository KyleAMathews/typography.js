// @flow
type GoogleFontsType = {name: string; styles: string[]}
type VerticalRhythmType = {
  rhythm: (value: number) => string,
  scale: (value: number) => Object,
  adjustFontSizeTo: (value?: number | string) => Object,
}

export type OptionsType = {
  title: string,
  baseFontSize?: string,
  baseLineHeight?: number,
  scaleRatio?: number,
  googleFonts?: GoogleFontsType[],
  headerFontFamily?: string[],
  bodyFontFamily?: string[],
  headerGray?: number,
  headerGrayHue?: number | string,
  bodyGray?: number,
  bodyGrayHue?: number | string,
  headerWeight?: number | string,
  bodyWeight?: number | string,
  boldWeight?: number | string,
  blockMarginBottom?: number,
  includeNormalize?: boolean,
  overrideStyles?: (
    verticalRhythm: VerticalRhythmType, // TODO Create flow type for compass-vertical-rhythm and import here.
    options: OptionsType,
    styles: mixed,
  ) => Object,
  overrideThemeStyles?: (
    verticalRhythm: VerticalRhythmType, // TODO Create flow type for compass-vertical-rhythm and import here.
    options: OptionsType,
    styles: mixed,
  ) => Object,
  plugins?: mixed[],
}
