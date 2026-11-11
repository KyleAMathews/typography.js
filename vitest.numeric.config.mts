// Scope numerical mutation runs without loading unrelated browser witnesses.
import config from './vitest.config'

export default {
  ...config,
  test: { ...config.test, include: ['oracles/numeric-typography.oracle.ts'] },
}
