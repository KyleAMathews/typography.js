// @flow
import type { OptionsType } from 'Types';
import gray from 'gray-percentage';
import { TABLET_MEDIA_QUERY } from 'typography-breakpoint-constants';

const theme: OptionsType = {
  baseFontSize: '21px',
  baseLineHeight: '29px',
  modularScales: [
    {
      scale: 1.5,
    },
  ],
  googleFonts: [
    {
      name: 'Exo',
      styles: [
        '700',
      ],
    },
    {
      name: 'Yrsa',
      styles: [
        '400',
        '700',
      ],
    },
  ],
  headerFontFamily: ['Exo', 'sans-serif'],
  bodyFontFamily: ['Yrsa', 'georgia', 'sans-serif'],
  headerGray: 0,
  bodyGray: 25,
  headerWeight: 700,
  bodyWeight: 400,
  boldWeight: 700,
  overrideStyles: ({ adjustFontSizeTo, rhythm }, options) => {
    const styles = {
      a: {
        color: gray(options.bodyGray),
      },
      'a:hover': {
        color: '#ADE4FF',
      },
      'a:active': {
        color: gray(options.headerGray),
        textDecoration: 'none'
      },
      button: {
        cursor: 'pointer',
        margin: 0,
        marginBottom: rhythm(1/2),
        padding: '0.15em 0.5em',
        outline: 0,
        border: `0.15em solid ${gray(options.headerGray)}`,
        background: 'transparent',
        color: gray(options.headerGray),
        fontFamily: ['Exo', 'sans-serif'].join(','),
        textAlign: 'center',
      },
      'button:hover': {
        boxShadow: '0 0.1em 0 0 #ADE4FF',
        textShadow: '0 0.1em 0 #ADE4FF',
      },
      'button:active': {
        background: gray(options.headerGray),
        color: '#fff',
        boxShadow: '0 0 0 0.05em #fff inset',
        textShadow: 'none',
      },
      'h1,h2': {
        marginBottom: rhythm(1),
      },
      'h3,h4,h5,h6': {
        marginBottom: rhythm(1/2),
      },
      small: {
        display: 'block',
        marginTop: 0,
        color: gray(options.bodyGray),
        fontSize: rhythm(1/2),
        lineHeight: rhythm(1/2),
      },
      blockquote: {
        ...adjustFontSizeTo('24px'),
        color: gray(30),
        paddingLeft: rhythm(3/4),
        marginLeft: 0,
        marginRight: 0,
        borderLeft: `${rhythm(1/4)} solid ${gray(13)}`,
      },
      hr: {
        margin: `${rhythm(1)} auto`,
        height: '0.1em',
        background: '#ade4ff',
      },
      table: {
        ...adjustFontSizeTo('20px'),
      },
      // Mobile styles.
      [TABLET_MEDIA_QUERY]: {
        blockquote: {
          marginLeft: rhythm(-3/4),
          marginRight: 0,
          paddingLeft: rhythm(1/2),
        },
        table: {
          ...adjustFontSizeTo('18px'),
        },
      },
    }

    return styles
  },
}

export default theme;
