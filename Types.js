// @flow
type ModularScaleType = {scale: number | string; maxWidth?: string}
type GoogleFontsType = {name: string; styles: string[]}

export type OptionsType = {
  baseFontSize?: string,
  baseLineHeight?: string,
  modularScales?: ModularScaleType[],
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
  blockMarginBottom?: number | string,
  includeNormalize?: boolean,
  overrideStyles?: (
    verticalRhythm: mixed, // TODO Create flow type for compass-vertical-rhythm and import here.
    options: OptionsType,
    styles: mixed,
  ) => Object,
  overrideThemeStyles?: (
    verticalRhythm: mixed, // TODO Create flow type for compass-vertical-rhythm and import here.
    options: OptionsType,
    styles: mixed,
  ) => Object,
  plugins?: mixed[],
}
