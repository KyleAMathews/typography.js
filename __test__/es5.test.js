// @flow
// typography's published bundle runs on ES5 engines, as v0.16's did (review
// U1): it loads and gives the same stylesheet in a realm without the ES2015
// built-ins it might reach for, and whose RegExp rejects the sticky ("y") and
// unicode ("u") flags. The bundle is the one `pnpm build` writes.

import fs from "fs"
import path from "path"
import vm from "vm"
import CodePlugin from "../packages/typography-plugin-code/src/index"

const bundle = path.join(__dirname, "../packages/typography/dist/index.js")
const packageRequire = (id: string) =>
  require(require.resolve(id, { paths: [path.dirname(bundle)] }))

// A realm with ES5's built-ins only (Object.assign stays: the bundle's
// helper falls back without it, as v0.16's did).
const es5Realm = () => {
  const context = vm.createContext({})
  vm.runInContext(
    `
    delete Number.isFinite; delete Number.isNaN; delete Number.isInteger;
    delete Array.from; delete Array.of;
    delete Array.prototype.find; delete Array.prototype.findIndex;
    delete Array.prototype.includes; delete Array.prototype.fill;
    delete String.fromCodePoint; delete String.prototype.codePointAt;
    delete String.prototype.includes; delete String.prototype.startsWith;
    delete String.prototype.endsWith; delete String.prototype.repeat;
    delete Object.entries; delete Object.values;
    var NativeRegExp = RegExp;
    RegExp = function RegExp(pattern, flags) {
      if (/[yu]/.test(flags || "")) throw new SyntaxError("ES5 has no " + flags + " flag");
      return new NativeRegExp(pattern, flags);
    };
    RegExp.prototype = NativeRegExp.prototype;
    `,
    context
  )
  return context
}

const load = (context: Object) => {
  const module = { exports: {} }
  const wrapper = vm.runInContext(
    `(function (module, exports, require) {${fs.readFileSync(bundle, "utf8")}\n})`,
    context
  )
  wrapper(module, module.exports, packageRequire)
  return module.exports
}

const OPTIONS = [
  {},
  { baseFontSize: "18px", scaleRatio: "golden", headerLineHeight: "calc(1.1 * 1)" },
  { bodyFontFamily: ["var(--body)", "Georgia", "serif"], blockMarginBottom: "1.5rem" },
  { overrideStyles: () => ({ q: { content: '"</p>"' }, ":root": { "--x": "url(a.png)" } }) },
]

describe("the ES5 bundle", () => {
  it("loads and writes the same stylesheet without ES2015 built-ins", () => {
    const es5 = load(es5Realm())
    const host = load(vm.createContext({}))
    OPTIONS.forEach(options => {
      const plugins = [new CodePlugin()]
      expect(es5({ ...options, plugins }).toString()).toEqual(host({ ...options, plugins }).toString())
    })
  })
})
