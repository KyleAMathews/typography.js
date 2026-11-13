// Lints the oracle files and the package sources with the @tanstack/oracles
// presets. The repository's own lint (ESLint 3, .eslintrc) is unchanged.
// Run with ESLint 9: `pnpm lint:oracles`.
import oracles from '@tanstack/eslint-plugin-oracles'
import tsParser from '@typescript-eslint/parser'

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', ...(oracles.configs.recommended.ignores ?? [])] },
  oracles.configs.recommended,
  oracles.configs.production,
  { files: ['oracles/**/*.ts'], languageOptions: { parser: tsParser } },
  // Flow-annotated JavaScript: the TypeScript parser reads the annotations used here.
  { files: ['packages/*/src/**/*.js'], languageOptions: { parser: tsParser } },
]
