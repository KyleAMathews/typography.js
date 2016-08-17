# WIP high-level explanation of core Typography.js concepts.

The core goal of Typography.js is to provide a high-level elegant API
for expressing typography design intent.

The library then generates styles appropriate to the sytem it's running
in.

* **Themes** encapsulate a typography design in a javascript object.
* **Plugins** extend or modify the core typography engine.

## Core ideas

* **base or body font size** there should be a base font size that body
  font is set in and that all other font sizes are derived from.
* **scale ratio** headers and other font sizes not the base font size
  should be picked from along a scale. The *scale ratio* determines the
exact font size that's choosen. For example in, the core typography engine, the h1 size is always 1 scale away from the body font size. So if the scale ratio is 2 and the base font size is 16px the h1 font size will be 32px.
* **rhythm unit** Picking margins and paddings and other sizes within a
  site or app shouldn't be picked blindly. They should stay in
harmony with the rest of design. Picking margins/paddings w/ pixels can
cause you a world of hurt as it's easy for inconsistencies to develop
plus the hard-coded distances have to be tediously recalculated and
changed if you should want to modify your design. Typography.js instead
provides a new unit called `rhythm`. This is taken from the `line-height`. One `rhythm` equals one `line-height`. If building a site with inline styles or css-in-js, you can import your typography object and use the provided rhythm function e.g.
```javascript
import { rhythm } from '../utils/typography'

var styles = StyleSheet.create({
  container: {
    padding: rhythm(1),
    marginBottom: rhythm(1.5),
  },
});
```

Using the rhythm function consistently ensures that w/ any design
changes in the future, your app's typography remains consisten and
harmonous.
* **Vertical Rhythm** vertical rhythm is a similar concept as grids
  whereas grids partition horizontal space, vertical rhythm partitions
vertical space. As the eye scans down a page, it expects there to be
harmony, that the space between lines, block elements, etc. are
consistent and mathmatically related. To ensure this, Typography.js
overrides all margins and sets a `marginBottom: rhythm(1)` [on all block
elements.](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography/src/utils/createStyles.js#L57)
Additionally it tries to maintain the vertical rhythm when choosing
larger/smaller fontSizes and lineHeights. [This is the
algorithm](https://github.com/KyleAMathews/compass-vertical-rhythm/blob/b0bd20587bf93052a371e649f7ce4f54bcc12317/src/index.coffee#L68).
Essentially what happens is it'll directly scale the fontSize/lineHeight
up and then round the lineHeight to the nearest 1/2 vertical rhythm
line. Typically you'd use the `adjustFontSizeToMSValue` (which needs
renamed) where you pass in a value on the scale e.g.
`adjustFontSizeToMSValue(1.5)` which would return an object like `{
fontSize: '2rem', lineHeight: '3rem' }`.
