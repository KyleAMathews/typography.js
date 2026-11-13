// Every regular expression typography's built bundle runs is free of
// super-linear backtracking (engineer decision 2026-11-13, review P5: a
// trailing !important pattern took 7 s on 80,000 spaces). recheck decides
// each one. The token counts are the oracle typography-value-work.
//
// The expressions are the ones the bundle's own code executes:
// RegExp.prototype.exec is wrapped while the bundle builds stylesheets for
// the defaults, every theme, the code plugin, and values that reach the
// value, line-height, math, and font-stack checks (test(), replace(), and
// match() call exec), and an expression counts when the bundle called it.
// A dependency's expressions are outside the law: decamelize reads the
// property names the developer writes. Run after `pnpm build`.

const fs = require("node:fs")
const path = require("node:path")
const { checkSync } = require("recheck")

const root = path.join(__dirname, "..")
const typography = require(path.join(root, "packages/typography/dist/index.js"))
const CodePlugin = require(path.join(root, "packages/typography-plugin-code/dist/index.js")).default
const themes = fs
  .readdirSync(path.join(root, "packages"))
  .filter((name) => name.startsWith("typography-theme-"))
  .map((name) => require(path.join(root, "packages", name, "dist/index.js")).default)

const VALUES = ["red", "red !important /* x */", "url( a )", "\\75 rl(a)", '"a;b"', "var(--a, b)", "calc(1px + 2px)", "a /**/ b", "--x", "\\110000x"]
const LINE_HEIGHTS = [1.2, "1.2em", "normal", "calc(24px / 16px)", "round(up, 1.27, 0.1)", "var(--lh)", "v\\61r(--lh)", "1.2 /* c */ !important", "sibling-index()", "env(x, 1)"]
const STACKS = [["Georgia", "serif"], ["var(--a), serif"], ["inherit"], ["Font's Name", "monospace"], ["a<b"]]

const dist = path.join(root, "packages/typography/dist/index.js")
const seen = new Map()
const exec = RegExp.prototype.exec
RegExp.prototype.exec = function (text) {
  // The caller is the first frame outside this script that is not native
  // (test() and replace() show as "<anonymous>").
  const caller = new Error().stack
    .split("\n")
    .slice(2)
    .find((line) => !line.includes(__filename) && !line.includes("(<anonymous>)") && !line.includes("node:internal"))
  if (caller && caller.includes(dist)) seen.set(`${this.flags}/${this.source}`, this)
  return exec.call(this, text)
}
const run = (options) => {
  try {
    typography(options).toString()
  } catch {
    // Invalid inputs throw; the expressions they ran still count.
  }
}
try {
  run({})
  themes.forEach((theme) => run({ ...theme, plugins: [CodePlugin()] }))
  VALUES.forEach((value) => run({ overrideStyles: () => ({ p: { color: value }, ":root": { "--x": value } }) }))
  LINE_HEIGHTS.forEach((headerLineHeight) => run({ headerLineHeight }))
  STACKS.forEach((bodyFontFamily) => run({ bodyFontFamily, blockMarginBottom: "1.5rem", scaleRatio: "1.5" }))
} finally {
  RegExp.prototype.exec = exec
}

const expressions = [...seen.values()]
if (expressions.length < 15) {
  console.error(`check-regex: only ${expressions.length} expressions ran; the workload does not reach the checks`)
  process.exit(1)
}
const vulnerable = expressions
  .map((re) => ({ re: `/${re.source}/${re.flags}`, result: checkSync(re.source, re.flags.replace(/[gy]/g, "")) }))
  .filter(({ result }) => result.status !== "safe")
for (const { re, result } of vulnerable) console.error(`${result.status}: ${re}${result.attack ? `\n  attack: ${JSON.stringify(result.attack.pattern ?? result.attack.string)}` : ""}`)
console.log(`check-regex: ${expressions.length} expressions, ${vulnerable.length} not safe`)
process.exit(vulnerable.length ? 1 : 0)
