# Typography.js
typography는 웹사이트를 구축할 수 있는 강력한 툴킷입니다.
# Typography.js [![Build Status][build-badge]][build-status] [![Coverage Status][coverage-badge]][coverage-status]
아름다운 디자인으로 웹사이트를 구축할 수 있는 강력한 툴킷입니다.

## Install 
`npm install typography`

## Demo/playground
http://kyleamathews.github.io/typography.js

## Why
typography.js의 목표는 typography 디자인의 의도를 표현하기 위해 high-level의 훌륭한 API를 제공합니다.

Typography는 interrelated styles의 복잡한 *시스템*입니다. 수십개의 요소에
대한 스타일 선언 100여개는 균형잡힌 순서로 선언되어야 합니다. 하나의 디자인이
변경된느 것은 수십 개의 지루한 검토 및 css가 변경됨을 의미할 수 있습니다.
CSS를 사용해 새로운 Typography를 만드는 것이 어렵게 느껴질 수 있습니다.

Typography.js는 훨씬 더 간단한 방법으로 typography 디자인을
정의하고 탐색할 수 있는 매우 간단한 방법을 제공합니다.

Typography.js의 JS api에 대한 설정을 제공해 Typography 엔진이
block과 inline element에 대한 CSS를 생성합니다.

Typography.js를 사용하면 프로젝트에 고유하고 개인적이며 맞춤화된 디자인을 보다 쉽게
만들 수 있습니다.

## Themes & Plugins
- **themes**: Typography.js 테마는 간단한 자바스크립트 객체입니다.
  따라서 프로젝트 사이에서 쉽게 공유될 수 있습니다.
  [open source and share via NPM](https://www.npmjs.com/browse/keyword/typography-theme).
- **plugins**: 플로그인은 Typography의 엔진을 확장하거나 수정하는 기능입니다.
  헤더의 스타일 지정 방법을 변경하거나, 코드 또는 테이블과 같은 특수한 시스템을
  추가할 수 있습니다.

## Typography.js를 사용하는 사이트
* [bricolage.io](https://bricolage.io/?utm_source=github.com) ([source](https://github.com/KyleAMathews/blog/blob/master/blog-typography.coffee))
* [React Headroom](https://kyleamathews.github.io/react-headroom/) ([source](https://github.com/KyleAMathews/react-headroom/blob/master/www/utils/typography.js))
* [Gatsby Blog Starter](http://gatsbyjs.github.io/gatsby-starter-blog/) ([source](https://github.com/gatsbyjs/gatsby-starter-blog/blob/master/src/utils/typography.js))
* [ollieglass.com](http://ollieglass.com/)
* [mokkapps.de](https://www.mokkapps.de/) ([source](https://github.com/Mokkapps/website/blob/master/src/utils/typography.js))
* [privatimkerei-hoffmann.de](https://privatimkerei-hoffmann.de/) ([source](https://github.com/Mokkapps/imkerei-hoffmann-website/blob/master/src/utils/typography.js))
* [Edit this file to add yours!](https://github.com/KyleAMathews/typography.js/blob/master/README.md)

## Javascript usage
```javascript
import Typography from 'typography'

const typography = new Typography({
  baseFontSize: '18px',
  baseLineHeight: 1.45,
  headerFontFamily: ['Avenir Next', 'Helvetica Neue', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
  bodyFontFamily: ['Georgia', 'serif'],
  // See below for the full list of options.
})

// Output CSS as string.
typography.toString()

// Or insert styles directly into the <head> (works well for client-only
// JS web apps.
typography.injectStyles()
```

## Themes
우리는 당신의 다음 프로젝트에서 사용할 수 있는 30여개의 테마를 보유하고 있습니다.
이들은 각각 별도의 NPM package로 게시되어 있으며,
http://kyleamathews.github.io/typography.js 에서 확인할 수 있습니다.

### themes 사용하기

다음은 Funston 테마를 사용하는 방법에 대한 예시입니다.

1. 먼저, 패키지를 프로젝트에 저장합니다.
  `npm install --save typography-theme-funston`
2. Typography를 초기화할 때 전달합니다.

```javascript
import Typography from 'typography'
import funstonTheme from 'typography-theme-funston'

const typography = new Typography(funstonTheme)
```

### Customizing themes
테마는 자바스크립트 객체이므로 필요할 때 쉽게 수정할 수 있습니다.
예를 들어, Funston theme를 사용한다 하더라도 기본 크기를 조금
키우려는 경우:

```javascript
import Typography from 'typography'
import funstonTheme from 'typography-theme-funston'
funstonTheme.baseFontSize = '22px' // was 20px.

const typography = new Typography(funstonTheme)
```

또는 필수 API `overrideThemeStyles`를 사용해 테마의 스타일을
직접 설정하거나 재정의할 수 있습니다.:

```javascript
import Typography from 'typography'
import funstonTheme from 'typography-theme-funston'
funstonTheme.overrideThemeStyles = ({ rhythm }, options) => ({
  'h2,h3': {
    marginBottom: rhythm(1/2),
    marginTop: rhythm(2),
  }
})

const typography = new Typography(funstonTheme)
```

### Published Typography.js Themes
* [typography-theme-alton](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-alton/)
* [typography-theme-bootstrap](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-bootstrap/)
* [typography-theme-de-young](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-de-young/)
* [typography-theme-doelger](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-doelger/)
* [typography-theme-elk-glen](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-elk-glen/)
* [typography-theme-fairy-gates](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-fairy-gates/)
* [typography-theme-funston](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-funston/)
* [typography-theme-github](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-github/)
* [typography-theme-grand-view](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-grand-view/)
* [typography-theme-irving](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-irving/)
* [typography-theme-judah](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-judah/)
* [typography-theme-lawton](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-lawton/)
* [typography-theme-legible](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-legible/)
* [typography-theme-lincoln](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-lincoln/)
* [typography-theme-kirkham](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-kirkham/)
* [typography-theme-moraga](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-moraga/)
* [typography-theme-noriega](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-noriega/)
* [typography-theme-ocean-beach](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-ocean-beach/)
* [typography-theme-parnassus](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-parnassus/)
* [typography-theme-stardust](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-stardust/)
* [typography-theme-st-annes](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-st-annes/)
* [typography-theme-stern-grove](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-stern-grove/)
* [typography-theme-stow-lake](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-stow-lake/)
* [typography-theme-sutro](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-sutro/)
* [typography-theme-twin-peaks](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-twin-peaks/)
* [typography-theme-us-web-design-standards](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-us-web-design-standards/)
* [typography-theme-wikipedia](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wikipedia/)
* [typography-theme-wordpress-kubrick](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wordpress-kubrick/)
* [typography-theme-wordpress-2010](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wordpress-2010/)
* [typography-theme-wordpress-2011](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wordpress-2011/)
* [typography-theme-wordpress-2012](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wordpress-2012/)
* [typography-theme-wordpress-2013](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wordpress-2013/)
* [typography-theme-wordpress-2014](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wordpress-2014/)
* [typography-theme-wordpress-2015](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wordpress-2015/)
* [typography-theme-wordpress-2016](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography-theme-wordpress-2016/)
* [typography-theme-trajan](https://github.com/guoliim/typography-theme-trajan)
* [typography-theme-zacklive](https://github.com/ZacharyChim/typography-theme-zacklive)
* [typography-theme-anonymous](https://github.com/leimonio/typography-theme-anonymous)
* If you publish your own, create a PR to add it here!

## Plugins
플러그인은 typography의 엔진을 확장하거나 수정하는 기능입니다.
이것은 headers의 스타일을 변경하거나 특수 스타일을 추가할 수 있습니다.
예사: 코드 또는 테이블용으로 현재 살용할 수 있는 플러그인이 있습니다.
`typography-plugin-code`.

플러그인을 사용하기 위해서는 먼저 NPM을 사용해 설치해야 합니다.

`npm install --save typography-plugin-code`

그 다음, 새로운 typography 객체를 생성하기 전에 테마에 추가합니다.

```javascript
import Typography from 'typography'
import CodePlugin from 'typography-plugin-code'
import sternGroveTheme from 'typography-theme-stern-grove'

sternGroveTheme.plugins = [
  new CodePlugin(),
]

const typography = new Typography(sternGroveTheme)
```

## React.js helper components.
Typography.js는 React.js 프로젝트를 위한 두 가지의 구성 요소
`TypographyStyle`과 `GoogleFont`가 포함되어 있습니다.
이러한 방법은 server-rendering에 적합합니다.

* `TypographyStyle`은 style element를 만들고, 생성된 css를 테마에 적용시킵니다.
* `GoogleFont`는 테마에 지정된 Google Fonts & Weight를 포함하는 link element를 만듭니다.

사용하기 위해서는 먼저 패키지를 설치한 뒤`npm install --save react-typography`,
`html.js` 파일에 포함시킵니다.

```javascript
import { TypographyStyle, GoogleFont } from 'react-typography'
// Best practice is to have a typography module
// where you define your theme.
import typography from 'utils/typography'

// Inside your React.js HTML component.
<html>
  <head>
    <TypographyStyle typography={typography} />
    <GoogleFont typography={typography} />
  </head>
  <body>
    // stuff
  </body>
</html>
```

## API

### Configuration
Typography의 새로운 instance를 만들 때 *configuration* 객체를 전달할 수 있습니다.
모든 값은 선택사항입니다.

* **title**: 테마의 제목.
* **baseFontSize**: base font의 크기는 픽셀 단위이며, 기본값은 `16`px입니다.
* **baseLineHeight**: css unitless number의 base line 높이 값은 `1.45`입니다.
* **scaleRatio**: 테마의 척도 비율(scale ratio)입니다.
  이 값은 `h1`의 글꼴 크기와 `baseFontSize` 사이의 비율입니다.
  그래서 만약 척도 비율이 `2`이고, `baseFontSize`가 `16px`이라면,
  `h1`의 크기는 `32`px입니다.
```javascript
{
  scaleRatio: 2,
}
```
* **googleFonts**: 프로젝트의 google Font를 지정합니다.
```javascript
googleFonts: [
  {
    name: 'Montserrat',
    styles: [
      '700',
    ],
  },
  {
    name: 'Merriweather',
    styles: [
      '400',
      '400i',
      '700',
      '700i',
    ],
  },
],
```
* **headerFontFamily**:헤더의 font family 스택(`['Helvetica', 'sans-serif']`)을 지정하는 문자열 배열로,
기본값은 시스템 UI의 글꼴 값을 가집니다.
* **bodyFontFamily**: 본문에 대한 font family를 지정하는 문자열 배열의 기본값은 `['georgia', 'serif']`입니다.
* **headerColor**: 헤더의 색상을 설정합니다. 기본값은 `inherit`입니다..
* **bodyColor**: 본문의 색상을 설정합니다. 기본값은 `hsl(0,0%,0%,0.8)`입니다.
* **headerWeight**: 헤더의 글꼴 두께를 지정합니다. 기본 값은 `bold`입니다.
* **bodyWeight**: 본문의 글꼴 두께를 지정합니다. 기본 값은 `normal`입니다.
* **boldWeight**: "bold"(b, strong, dh, th) 요소의 글꼴 두께를 지정합니다.
기본 값은 `bold`입니다.
* **blockMarginBottom**: block 요소의 기본 margin-bottom 값을 지정합니다.
기본적으로 하나의 "rhythm unit"(base line의 높이)로 설정됩니다.
* **includeNormalize**: normalize.css를 포함합니다.
Normalize.css는 브라우저 전체에서 기본 브라우저의 css를 표준하는 데 사용되며,
Typograthy.css의 기초가 되는 프로젝트입니다.
normalize.CSS는 기본으로 포함하고 있지만, 이미 프로젝트의 다른 곳에서 포함하고 있다면
`false`를 전달해 호출하지 않을 수 있습니다.
* **overrideStyles**: 자동 생성된 스타일을 직접 추가하거나 재정의하기 위한 명령형 API입니다.
Vertical Rhythm object, options object, algorithmically generated styles에 의해 호출됩니다.

```javascript
overrideStyles: ({ adjustFontSizeTo, rhythm }, options, styles) => ({
  h1: {
    fontFamily: ['Montserrat', 'sans-serif'].join(','),
  },
  blockquote: {
    ...adjustFontSizeTo('19px'),
    color: gray(41),
    fontStyle: 'italic',
    paddingLeft: rhythm(13/16),
    marginLeft: rhythm(-1),
    borderLeft: `${rhythm(3/16)} solid ${gray(10)}`,
  },
  'blockquote > :last-child': {
    marginBottom: 0,
  },
})
```
* **overrideThemeStyles**: `overrideStyles`과 기능이 동일합니다.
3rd-party themes를 사용할 때 `overrideStyles`를 사용해
테마 자체의 `overrideStyle`를 삭제하지 않도록 주의해야 합니다.

```javascript
overrideThemeStyles: ({ rhythm }, options, styles) => ({
  'h2,h3': {
    marginBottom: rhythm(1/2),
    marginTop: rhythm(2),
  }
})
```

## Related

- [postcss-typography](https://github.com/BarryThePenguin/postcss-typography)

## Typography.js 개발하기
Typography.js는 [Lerna](https://github.com/lerna/lerna)를 더 쉽게 사용할 수 있게 해주는 monorepo입니다.

TODO: document constants + compass-vertical-rhythm + using typgraphy.js
for inline styles.

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/KyleAMathews/typography.js.svg

[build-status]: https://travis-ci.org/KyleAMathews/typography.js

[coverage-status]: https://codecov.io/github/KyleAMathews/typography.js

[coverage-badge]: https://img.shields.io/codecov/c/github/KyleAMathews/typography.js.svg

=======

## Backers

Support us with a monthly donation and help us continue our activities. [[Become a backer](https://opencollective.com/typographyjs#backer)]

<a href="https://opencollective.com/typographyjs/backer/0/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/0/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/1/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/1/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/2/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/2/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/3/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/3/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/4/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/4/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/5/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/5/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/6/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/6/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/7/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/7/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/8/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/8/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/9/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/9/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/10/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/10/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/11/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/11/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/12/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/12/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/13/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/13/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/14/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/14/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/15/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/15/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/16/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/16/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/17/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/17/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/18/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/18/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/19/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/19/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/20/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/20/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/21/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/21/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/22/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/22/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/23/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/23/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/24/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/24/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/25/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/25/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/26/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/26/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/27/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/27/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/28/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/28/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/backer/29/website" target="_blank"><img src="https://opencollective.com/typographyjs/backer/29/avatar.svg"></a>

## Sponsors

Become a sponsor and get your logo on our README on Github with a link to your site. [[Become a sponsor](https://opencollective.com/typographyjs#sponsor)]

<a href="https://opencollective.com/typographyjs/sponsor/0/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/1/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/2/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/3/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/4/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/5/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/6/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/7/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/8/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/9/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/9/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/10/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/10/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/11/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/11/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/12/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/12/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/13/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/13/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/14/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/14/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/15/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/15/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/16/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/16/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/17/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/17/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/18/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/18/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/19/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/19/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/20/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/20/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/21/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/21/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/22/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/22/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/23/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/23/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/24/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/24/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/25/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/25/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/26/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/26/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/27/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/27/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/28/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/28/avatar.svg"></a>
<a href="https://opencollective.com/typographyjs/sponsor/29/website" target="_blank"><img src="https://opencollective.com/typographyjs/sponsor/29/avatar.svg"></a>
