import { realpathSync } from 'node:fs'
import { mergeConfig } from 'vitest/config'
import base from "./vitest.config.ts"
// Vitest accepts a config object or a function that returns one.
export default async (env) => {
  const merged = mergeConfig(typeof base === 'function' ? await base(env) : base, {
  plugins: [{
    name: 'oracle-gaps-schemata',
    enforce: 'pre',
    // A workspace dependency loads from its one-file bundle (workspaceBundles).
    resolveId(source) {
      return globalThis.__oracleGapsBundles?.get(source)
    },
    load(id) {
      // Vite's own asset and worker queries ('?raw', '?url', '?worker&url', ...)
      // are loaded as written, so their module is not instrumented (a stated
      // limit: a worker's code is not mutated). Any other query is the module
      // itself, served instrumented under its plain id.
      const at = id.indexOf('?')
      if (at >= 0 && [...new URLSearchParams(id.slice(at + 1)).keys()].every((key) => ['raw', 'url', 'worker', 'sharedworker', 'inline'].includes(key))) return undefined
      const path = at < 0 ? id : id.slice(0, at)
      // This context's authored patch, or else the instrumented source of the
      // current check, both set by the runner in this process.
      try {
        const real = realpathSync(path)
        return globalThis.__oracleGapsServe?.[4]?.get(real) ?? globalThis.__oracleGapsSchemata?.get(real)
      } catch { return undefined }
    },
  }],
  })
  // The harness runs before the package's own setup files, so that it sees
  // the worker's globals before a setup file adds to them.
  merged.test = { ...merged.test, setupFiles: ['./.oracle-gaps-42937.capture-setup.mjs', ...[merged.test?.setupFiles ?? []].flat()] }
  return merged
}
