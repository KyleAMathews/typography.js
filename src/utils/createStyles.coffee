ms = require 'modularscale'
normalize = require '../normalize'
gray = require 'gray-percentage'
isString = require 'is-string'

generateHeaderStyles = (vr, options) ->
  styles = ""
  baseFontSize = options.baseFontSize.slice(0, -2)

  for modularScale in options.modularScales
    if isString modularScale
      maxWidth = false
      scale = modularScale
    else
      maxWidth = "@media only screen and (max-width: #{modularScale[0]}) {"
      scale = modularScale[1]

    h1 = vr.adjustFontSizeTo(ms(3, scale) * baseFontSize + "px")
    h2 = vr.adjustFontSizeTo(ms(2, scale) * baseFontSize + "px")
    h3 = vr.adjustFontSizeTo(ms(1, scale) * baseFontSize + "px")
    h4 = vr.adjustFontSizeTo(ms(2/3, scale) * baseFontSize + "px")
    h5 = vr.adjustFontSizeTo(ms(1/3, scale) * baseFontSize + "px")
    h6 = vr.adjustFontSizeTo(ms(0, scale) * baseFontSize + "px")

    if maxWidth
      styles += maxWidth

    styles += """
    h1 {
      font-size: #{h1.fontSize};
      line-height: #{h1.lineHeight};
    }

    h2 {
      font-size: #{h2.fontSize};
      line-height: #{h2.lineHeight};
    }

    h3 {
      font-size: #{h3.fontSize};
      line-height: #{h3.lineHeight};
    }

    h4 {
      font-size: #{h4.fontSize};
      line-height: #{h4.lineHeight};
    }

    h5 {
      font-size: #{h5.fontSize};
      line-height: #{h5.lineHeight};
    }

    h6 {
      font-size: #{h6.fontSize};
      line-height: #{h6.lineHeight};
    }
    """

    if maxWidth
      styles += "}"

  return styles

module.exports = (vr, options) ->

  styles = """
  #{normalize}

  html {
    font-size: #{vr.establishBaseline().fontSize};
    line-height: #{vr.establishBaseline().lineHeight};
    overflow-y: scroll;
  }

  body {
    color: #{gray(options.bodyGray, options.bodyGrayHue)};
    font-family: #{options.bodyFontFamily};
    font-weight: #{options.bodyWeight};
    word-wrap: break-word;
  }

  img {
    max-width: 100%;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  hgroup,
  ul,
  ol,
  dl,
  dd,
  p,
  figure,
  pre,
  table,
  fieldset,
  img,
  hr {
    margin: 0;
    margin-bottom: #{vr.rhythm(1)};
    padding: 0;
  }

  blockquote {
    margin: #{vr.rhythm(1)} #{vr.rhythm(2.5)};
  }

  b,
  strong {
    font-weight: #{options.boldWeight}
  }

  hr {
    background: #{gray(80, options.bodyGrayHue)};
    border: none;
    height: 1px;
    margin-bottom: calc(#{vr.rhythm(1)} - 1px);
  }

  ol,
  ul {
    list-style-position: inside;
  }

  ul li,
  ol li {
    margin-bottom: #{vr.rhythm(0.25)};
  }

  code,
  kbd,
  pre,
  samp {
    font-size: #{vr.adjustFontSizeTo('85%').fontSize};
    line-height: #{vr.adjustFontSizeTo('85%').lineHeight};
  }

  table {
    font-size: #{vr.adjustFontSizeTo(options.baseFontSize).fontSize};
    line-height: #{vr.adjustFontSizeTo(options.baseLineHeight).lineHeight};
    width: 100%;
  }

  thead {
    text-align: left;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: #{gray(options.headerGray, options.headerGrayHue)};
    font-family: #{options.headerFontFamily};
    font-weight: #{options.headerWeight};
  }

  #{generateHeaderStyles(vr, options)}
  """
  return styles
