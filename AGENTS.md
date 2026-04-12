# AGENTS.md

This file defines project conventions for AI coding agents.

## Stack
- Vue 3 + TypeScript + Vite
- Element Plus
- Vitest + Vue Test Utils
- Playwright

## Package Manager
- Use `pnpm` only.
- Do not use `npm` commands in this repository.
- Keep `pnpm-lock.yaml` as the source of truth lockfile.

## Component Naming Rules
- All new public components must use the `Ml` prefix.
- Examples: `MlRibbon`, `MlRibbonGroup`, `MlRibbonGallery`.
- Avoid introducing new public component names without `Ml` prefix.

## CSS Naming Rules
- All new CSS classes/selectors must use the `ml-` prefix.
- Prefer BEM-like structure under the prefix, e.g.:
  - `ml-ribbon`
  - `ml-ribbon__header`
  - `ml-ribbon-group__footer`

## Architecture Rules
- Reuse Element Plus components where possible.
- Do not re-implement Element Plus primitives.
- Implement only Ribbon-specific orchestration and behavior in local components.
- Keep runtime API behavior centralized in Ribbon state/composables.

## Quality Gates
- Run before finishing:
  - `pnpm test`
  - `pnpm build`
- If changes affect UI behavior, add or update tests.

## Documentation Rules
- Keep `README.md` aligned with current project capabilities.
- Keep `docs/requirements.md` updated when scope changes.
