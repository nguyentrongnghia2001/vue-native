# vue-native

Standalone monorepo for experimenting with a custom Vue-native renderer.

This repo is intentionally separate from `vuejs/core`. It is meant to stay
focused on native renderer work, sandbox iteration, and template-style Vue
authoring.

## What is included

- `packages/runtime-native` — custom renderer package
- `apps/sandbox` — Expo sandbox used for local iteration
- `vitest` test setup for the renderer package

## Prerequisites

- Node.js 20+
- pnpm 10+
- Expo tooling (installed automatically through dependencies)

## Install

From the repo root:

```bash
pnpm install
```

## Run the sandbox

Start the Expo sandbox:

```bash
pnpm dev:sandbox
```

If you want to run the app directly from the sandbox package:

```bash
pnpm --filter @vue-native/sandbox start
```

## Test

Run the renderer tests:

```bash
pnpm test
```

## Typecheck

Check all workspace packages:

```bash
pnpm typecheck
```

## Build

Build all packages that expose build scripts:

```bash
pnpm build
```

## Development notes

- Use `View` and `Text` from `@vue-native/runtime-native`.
- Vue component syntax is template-first, similar to Vue on the web.
- The sandbox shows the native tree snapshot and debug ops so you can inspect
	renderer behavior while iterating.

## Suggested next work

- add more native primitives (`Image`, `ScrollView`, layout wrappers)
- replace the in-memory debug tree with a real JS ↔ native bridge
- support `.vue` single-file components in the sandbox

## Next-step architecture doc

- See `docs/NEXT_STEPS_ARCHITECTURE.md`
