# AGENTS.md

typography.js is a lerna monorepo managed with pnpm (`pnpm-workspace.yaml`).
Package sources are in `packages/*/src`, written in JavaScript with Flow
annotations. The Jest suite in `__test__/` imports those sources directly.

- Install: `pnpm install`. Build every package: `pnpm build`.
- Tests: `pnpm test` (build, ESLint 3 lint, Jest, then the oracles).
- Oracle tests: `pnpm test:oracles` (Vitest, `vitest.config.ts`). The Chrome
  witness (`oracles/font-family.chrome.oracle.ts`) needs an installed Chrome;
  without one it fails, on purpose, rather than skip.
- Oracle lint: `pnpm lint:oracles` (ESLint 9 from `tools/oracle-lint`; the
  repository's own `pnpm lint` stays on ESLint 3 and `.eslintrc`).

<!-- BEGIN @tanstack/oracles (template 3) -->

## Oracle tests

This repository tests its laws with `@tanstack/oracles`.

**Who owns what.** The laws belong to the people who maintain this
repository: what the code promises, the authority for each promise, and its
limits. Propose a law, but do not adopt or change one without their
approval. The production code that the oracles own is yours. How it is built
is your call, and you will keep building on it. Make it the smallest, clearest
code that satisfies the oracles: merge repeated code, remove code that no law
needs (after the checks in `oracles-design` step 8), and restructure freely while the oracles pass.

- To find where an oracle would help, or to sketch a new one, read
  `node_modules/@tanstack/oracles/skills/oracles-start/SKILL.md` in full and
  follow it.
- Before you create or change an oracle, or change production code that an
  oracle owns, read `node_modules/@tanstack/oracles/skills/oracles-design/SKILL.md`
  in full and follow it.
- Before you review oracle work, read
  `node_modules/@tanstack/oracles/skills/oracles-review/SKILL.md` in full.
- Before you act on review findings, read
  `node_modules/@tanstack/oracles/skills/oracles-evaluate-review/SKILL.md` in
  full.
- Lint each oracle file and each changed production file after you edit it.
  Fix every report. Do not disable a rule.
- Oracle files: `oracles/**/*.oracle.ts`. Gap check: `pnpm exec oracle-gaps --package . --source packages/typography/src/utils/fontFamily.js --seed 20261111 --mutants oracles/font-family-mutants --out .oracle-gaps/out`.

<!-- END @tanstack/oracles -->
