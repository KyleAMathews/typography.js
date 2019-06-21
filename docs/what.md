# High-level explanation of core Typography.js concepts

The goal of Typography.js is to provide a high-level elegant API
for expressing typographic design intent.

The library then generates styles appropriate to the system (the Web or React
Native are the two current targets) it's running in.

* **Themes** encapsulate a typography design in a javascript object.
* **Plugins** extend or modify the core typography engine. Plugins are
  designed so that their configuration can also be exposed in the design
tools.

## Core ideas

#### Only set the base (or body) font-size/line-height
Only set your body font size and then derive all other font sizes from
that.

#### Pick font sizes from a scale and then set the "scale ratio"
Pick other font sizes (e.g. for headers) off a scale.  The *scale ratio*
determines the exact font size that's choosen.  Don't set exact header
sizes. Instead pick where to place them on a scale. Like everything in
Typography.js, we're only concerned about defining the *relationship*
between elements and then compiling these relationships into actual
pixels sizes on the screen. For example in the core typography engine,
the `h1` size is always `1` scale unit away from the body font size. So
if the scale *ratio* is `2` (the default value) and the base font size is `16px` the `h1`
font size will be `32px`.  If you decide to change the scale ratio to
`2.25`, the h1 is now set to `36px`.  When building a site with
Typography.js, all sizes should be set using a scale value so all
non-base-font-size text can be resized together.

You can set custom font sizes using the `scale` function.

```javascript
import { scale } from '../utils/typography'

<div>
  <h1
    style={{
      ...scale(1.5),
    }}
  >
    Hello world
  </h1>
</div>
```

#### Base all other spacings off the "rhythm" unit
Margins and paddings and other sizes shouldn't generally be hand-picked.
Hand-crafted design, like beer, doesn't scale. All spacings need to stay
in harmony.  Picking margins/paddings by hand will cause you a world of
hurt as it's easy for inconsistencies to develop plus the hard-coded
distances have to be tediously recalculated and changed if you should
want to modify your design.  Typography.js provides an alternative in
the form of a new dynamic unit called `rhythm`.  This is taken from the
`line-height`. One `rhythm` equals one `line-height`. When you change
your line-height, every other spacing in your site will respond in turn.

When building a site with inline styles or css-in-js, you can import
your typography object and use the provided rhythm function e.g.

```javascript
import { rhythm } from '../utils/typography'

var styles = StyleSheet.create({
  container: {
    padding: rhythm(1),
    marginBottom: rhythm(1.5),
  },
});
```

When the rhythm function is used consistently throughout your app, your
design will remain consistent and harmonous through all design tweaks
and changes.

#### Adhere to a vertical rhythm (when possible)
A vertical rhythm is a similar concept to grids where grids partition
horizontal space, vertical rhythm partitions vertical space.  As the eye
scans down a page, it expects there to be harmony, that the space
between lines, block elements, etc. are consistent and mathmatically
related. To ensure this, Typography.js overrides all block element
margins and sets a margin-bottom of one rhythm [on all block
elements.](https://github.com/KyleAMathews/typography.js/blob/master/packages/typography/src/utils/createStyles.js#L57)
This is the "Paragraph Spacing" value in the design tools.

Additionally it tries to maintain the vertical rhythm when choosing
larger/smaller font sizes and line heights. [This is the
algorithm](https://github.com/KyleAMathews/compass-vertical-rhythm/blob/b0bd20587bf93052a371e649f7ce4f54bcc12317/src/index.coffee#L68).
Essentially what happens is it'll directly scale the
font-size/line-height up and then round the line-height to the nearest
1/2 vertical rhythm line.
