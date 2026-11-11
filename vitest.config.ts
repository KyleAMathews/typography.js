// Vitest runs only the oracle files. The existing suite stays on Jest
// (`pnpm test-api`), and Jest 19 never loads `.ts` files.
import flowRemoveTypes from 'flow-remove-types'
import { defineConfig, type Plugin } from 'vitest/config'

// The package sources use Flow annotations, which Vite cannot parse.
const stripFlow: Plugin = {
  name: 'strip-flow-types',
  enforce: 'pre',
  transform(code, id) {
    if (!/\/packages\/[^/]+\/src\/.+\.js$/.test(id)) return null
    return { code: flowRemoveTypes(code, { all: true }).toString(), map: null }
  },
}

export default defineConfig({
  plugins: [stripFlow],
  test: { include: ['oracles/**/*.oracle.ts'] },
})
