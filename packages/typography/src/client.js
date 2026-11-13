// @flow
// typography() without its stylesheet methods: its options and its rhythm
// helpers, as v0.16 shipped this entry. It does not load the stylesheet
// code (createStyles, compileStyles, normalize.css).
import configure from "./utils/configure"

import type { OptionsType } from "Types"

module.exports = (opts: OptionsType) => {
  const { options, vr } = configure(opts)
  return { options, ...vr }
}
