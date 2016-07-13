// @flow
type ModularScaleType = {scale: number | string; maxWidth?: string}
type GoogleFontsType = {name: string; styles: string[]}
type FontFaceType = {fontFamily: string; fontWeight: number; src: string[]}

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
  fontFaces?: FontFaceType[],
  blockMarginBottom?: number | string,
  includeNormalize?: boolean,
  overrideStyles?: (
    verticalRhythm: Object, // TODO Create flow type for compass-vertical-rhythm and import here.
    options: OptionsType,
    styles: Object,
  ) => Object,
  overrideThemeStyles?: (
    verticalRhythm: Object, // TODO Create flow type for compass-vertical-rhythm and import here.
    options: OptionsType,
    styles: Object,
  ) => Object,
}
