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
  overrideStyles?: (
    rhythm: Function,
    options: OptionsType,
  ) => Object,
}
