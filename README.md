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

- Use primitives from `@vue-native/runtime-native`: `View`, `Text`, `Image`, `ImageBackground`, `ScrollView`, `Pressable`, `TextInput`, `FlatList`, `KeyboardAvoidingView`, `SafeAreaView`, `ActivityIndicator`, `Modal`, `Switch`, `SectionList`, `RefreshControl`, `TouchableOpacity`, `TouchableHighlight`, `TouchableWithoutFeedback`, `StatusBar`.
- Vue component syntax is template-first, similar to Vue on the web.
- The sandbox shows the native tree snapshot and debug ops so you can inspect
	renderer behavior while iterating.
- Runtime implementation should go through `runtime-native` host/bridge/primitives (from Phase 3 onward, no direct React Native native APIs/components in runtime layer).
- Prop mapping highlights:
	- `class` is normalized to `className`
	- `style` supports object/array and is merged into a single host style object
	- boolean props follow native semantics (`true` set, `false` remove)
	- component-specific mapping edge-cases:
		- `TextInput` supports `v-model` via `modelValue -> value` and `onUpdate:modelValue -> onChangeText`
		- `TextInput` event aliases: `@submit -> onSubmitEditing`, `@focus -> onFocus`, `@blur -> onBlur`
		- `TextInput` interaction alias: `@change -> onChangeText`
		- `TextInput` web-friendly alias: `@input -> onChangeText`
		- `Switch` supports `v-model` via `modelValue -> value` and `onUpdate:modelValue -> onValueChange`
		- `Switch` interaction alias: `@change -> onValueChange`
		- `Switch` web-friendly alias: `@input -> onValueChange`
		- `Pressable` interaction alias: `@tap -> onPress`
		- `Pressable` lifecycle shorthand aliases: `@longpress -> onLongPress`, `@pressin -> onPressIn`, `@pressout -> onPressOut`
		- `Pressable` pointer/web aliases: `@click -> onPress`, `@pointerdown -> onPressIn`, `@pointerup -> onPressOut`
		- touchable-family aliases (`TouchableOpacity`, `TouchableHighlight`, `TouchableWithoutFeedback`): `@tap/@click -> onPress`, `@pointerdown -> onPressIn`, `@pointerup -> onPressOut`
		- `ScrollView` lifecycle aliases: `@scrollstart -> onScrollBeginDrag`, `@scrollend -> onScrollEndDrag`, `@momentumstart -> onMomentumScrollBegin`, `@momentumend -> onMomentumScrollEnd`
		- identifier/accessibility prop aliases: `test-id -> testID`, `native-id -> nativeID`, `aria-label -> accessibilityLabel`, `role`/`aria-role -> accessibilityRole`
		- preserve `false` cho component-specific boolean props: `Switch.value`, `Modal.visible`, `RefreshControl.refreshing`, `StatusBar.hidden`
		- kebab-case props/events are normalized (`max-length`, `placeholder-text-color`, `@change-text`)

## Suggested next work

- add richer primitive coverage (layout wrappers, input/form primitives)
- improve bridge adapter implementations for real native targets
- support `.vue` single-file components in the sandbox

## Documentation

### Phase 1 Complete ✅

Phase 1 focuses on stabilizing the native host contract with 3 key features:

1. [Feature 1: patchProp Normalization](./docs/PHASE_1_FEATURE_1_patchProp.md) — Event key standardization and listener cleanup
2. [Feature 2: Serializable Snapshot Model](./docs/PHASE_1_FEATURE_2_snapshot_model.md) — JSON-safe tree snapshots for debugging and bridge communication
3. [Feature 3: Debug Instrumentation Separation](./docs/PHASE_1_FEATURE_3_instrumentation.md) — Isolated telemetry module for operation recording

**[→ Phase 1 Overview](./docs/PHASE_1_OVERVIEW.md)** — Summary of all features, tests, and integration points

### Roadmap

- See [NEXT_STEPS_ARCHITECTURE.md](./docs/NEXT_STEPS_ARCHITECTURE.md) for Phase 2 (Mutation Bridge) and Phase 3 (Primitives Expansion)
- See [ROADMAP_STATUS.md](./docs/ROADMAP_STATUS.md) for consolidated status (done + next).
