// @flow
// typography() without its stylesheet methods: its options and its rhythm
// helpers, as v0.16 shipped this entry (src/client.js).
import typography from "./index"

import type { OptionsType } from "Types"

module.exports = (opts: OptionsType) => {
  const t = typography(opts)
  return {
    options: t.options,
    rhythm: t.rhythm,
    adjustFontSizeTo: t.adjustFontSizeTo,
    linesForFontSize: t.linesForFontSize,
    establishBaseline: t.establishBaseline,
    scale: t.scale,
  }
}
