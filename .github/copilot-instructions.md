# Project Guidelines

These instructions apply to the whole `vue-native` workspace.

## Build and Test

- Install: `pnpm install`
- Sandbox dev: `pnpm dev:sandbox`
- Tests (minimum validation): `pnpm test`
- Type checks (when types/contracts change): `pnpm typecheck`
- Full workspace build: `pnpm build`

## Architecture

- Monorepo split:
  - `packages/runtime-native`: renderer, host contract, bridge, primitives (portable runtime layer)
  - `apps/sandbox`: Expo host app and transport wiring for demo/debug
- Runtime boundary (critical):
  - In `packages/runtime-native/**`, do **not** use direct React Native APIs/components.
  - Native behavior must go through host contract/bridge/primitives.
  - `apps/sandbox/App.tsx` may import from `react-native` for sandbox UI/chrome/debug views.

## Mandatory Phase/Feature Workflow

Before implementing a new **Phase** or **Feature**, do all of the following:

1. **Overview previous work**
   - Summarize objective, files changed, tests run, and current status.
2. **Log the overview**
   - Update `docs/PHASE_FEATURE_LOG.md`.
3. **Approval checkpoint in chat**
   - Present the summary and wait for review checkpoint before proceeding.
4. **Per-feature validation and commit**
   - For each feature: implement → `pnpm test` (and `pnpm typecheck` if needed) → commit.
   - Do not batch multiple requested features into one commit.

## Phase/Feature Log Format (required)

Use this structure in `docs/PHASE_FEATURE_LOG.md`:

- `## [YYYY-MM-DD HH:mm] Phase X / Feature Y`
- `### Overview`
- `### Files changed`
- `### Validation`
- `### Decision / Next`

## Conventions

- Keep log entries concise and review-friendly.
- If user communicates in Vietnamese, write log entries in Vietnamese.
- If `docs/PHASE_FEATURE_LOG.md` does not exist, create it before implementing a new Phase/Feature.
- Prefer existing runtime patterns for tests and host/bridge behavior (`packages/runtime-native/__tests__`, `packages/runtime-native/src`).

## Key Docs (link, don’t duplicate)

- Progress + checkpoints: `docs/PHASE_FEATURE_LOG.md`
- Consolidated status: `docs/ROADMAP_STATUS.md`
- Architecture next steps: `docs/NEXT_STEPS_ARCHITECTURE.md`
- Phase 1 overview: `docs/PHASE_1_OVERVIEW.md`
