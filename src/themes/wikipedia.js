// @flow
import type { OptionsType } from '../Types.js'

const theme: OptionsType = {
  baseFontSize: '14px',
  baseLineHeight: '22px',
  headerFontFamily: ['Linux Libertine', 'Georgia', 'serif'],
  bodyFontFamily: ['sans-serif'],
  headerGray: 0,
  bodyGray: 15,
  headerWeight: 'normal',
  bodyWeight: 'normal',
  boldWeight: 'bold',
  overrideStyles: (styles, setStyles, { rhythm }) => {
    let newStyles
    newStyles = setStyles(styles, 'h1,h2,h3,h4,h5,h6', {
      borderBottom: '1px solid rgb(170, 170, 170)',
      marginBottom: `calc(${rhythm(1/4)} - 1px)`,
      marginTop: rhythm(1),
    })
    newStyles = setStyles(newStyles, 'p,ol,ul', {
      marginBottom: '0.5em',
      marginTop: '0.5em',
    })
    newStyles = setStyles(newStyles, 'dt', {
      marginBottom: '0.1em',
    })
    newStyles = setStyles(newStyles, 'dd', {
      marginLeft: '1.6em',
      marginBottom: '0.1em',
    })
    newStyles = setStyles(newStyles, 'blockquote', {
      marginTop: '1em',
      marginBottom: '1em',
      marginRight: 0,
      marginLeft: 0,
      paddingLeft: '40px',
      paddingRight: '40px',
    })
    newStyles = setStyles(newStyles, 'ol,ul', {
      listStyleImage: 'url(data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%3F%3E%0A%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20version%3D%221.1%22%20width%3D%225%22%20height%3D%2213%22%3E%0A%3Ccircle%20cx%3D%222.5%22%20cy%3D%229.5%22%20r%3D%222.5%22%20fill%3D%22%2300528c%22%2F%3E%0A%3C%2Fsvg%3E%0A)', // eslint-disable-line
    })
    newStyles = setStyles(newStyles, 'ol,ul', {
      marginLeft: '1.6em',
      marginTop: '0.3em',
    })
    newStyles = setStyles(newStyles, 'li > ul,li > ol', {
      marginTop: '0',
      marginLeft: '1.6em',
    })
    newStyles = setStyles(newStyles, 'a', {
      color: 'rgb(6, 69, 173)',
      textDecoration: 'none',
    })
    newStyles = setStyles(newStyles, 'a:hover', {
      textDecoration: 'underline',
    })
    newStyles = setStyles(newStyles, 'a:visited', {
      color: 'rgb(11, 0, 128)',
    })
    newStyles = setStyles(newStyles, 'dl', {
      marginTop: '0.2em',
      marginBottom: '0.5em',
    })
    return newStyles
  },
}

export default theme
