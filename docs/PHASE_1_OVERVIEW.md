# Phase 1: Host Contract Stabilization

**Goal**: Establish a stable, type-safe host contract between the Vue renderer and native tree operations.

**Completion Date**: March 24, 2026

## Phase 1 at a Glance

Phase 1 focuses on three core features that lock down the native host interface:

| Feature | File(s) | Purpose | Status |
|---------|---------|---------|--------|
| **Feature 1** | `src/patchProp.ts` | Normalize event keys and handle listener cleanup | ✅ Complete |
| **Feature 2** | `src/types.ts`, `src/host.ts` | Serializable snapshot model with no side effects | ✅ Complete |
| **Feature 3** | `src/instrumentation.ts` | Isolated debug telemetry module | ✅ Complete |

## Features Delivered

### 1. patchProp Normalization (Event Key Handling)
- **What**: Standardize how event listeners are attached/removed from native elements
- **Why**: React Native and other native systems use different event naming (e.g., `onPress` vs `on-press`). Vue uses `@press` in templates. We need a unified interface.
- **How**: `patchProp()` now recognizes both Vue conventions (`@` syntax) and raw `onXxx` patterns, normalizes them consistently, and cleans up empty listener buckets.
- **Test**: ✅ "normalizes listener keys and removes listener bucket when empty"

**Key Behavior**:
```typescript
// Before
patchProp(el, '@press', undefined, handler)  // Not recognized

// After
patchProp(el, '@press', undefined, handler)  // ✅ Works
patchProp(el, 'onpress', undefined, handler) // ✅ Both work, normalized to onPress
patchProp(el, 'onPress', undefined, handler) // ✅ Works
```

[Read detailed docs](./PHASE_1_FEATURE_1_patchProp.md)

---

### 2. Serializable Snapshot Model (Tree Inspection)
- **What**: Trees can be serialized to JSON without losing critical structure information
- **Why**: Debugging, testing, and serialization for cross-process communication need snapshots with no function references (functions can't be serialized)
- **How**: Introduced `NativeSnapshotValue` type that excludes functions, and `snapshotNativeTree()` that creates safe, serializable copies
- **Test**: ✅ "serializes snapshot props and listener names safely"

**Key Behavior**:
```typescript
// Before: Functions in snapshot
snapshot.props.onClick // [Function onClick] ❌ Can't serialize

// After: Functions filtered out, listener names preserved
snapshot.props.onClick // undefined (filtered)
snapshot.listeners      // ['onClick', 'onPress'] ✅ Serializable
```

[Read detailed docs](./PHASE_1_FEATURE_2_snapshot_model.md)

---

### 3. Debug Instrumentation Separation (Telemetry Module)
- **What**: Move all debug/telemetry tracking into a dedicated module
- **Why**: Keeps host logic focused on mutations, not side effects. Makes testing easier and debug features optional.
- **How**: Created `src/instrumentation.ts` with `recordDebugOp()`, `dumpDebugOps()`, `resetDebugOps()` exported functions
- **Test**: ✅ All 4 tests pass (no regression)

**Key Behavior**:
```typescript
// Before: Debug logic mixed in host.ts
export function insert(parent: NativeElement, child: NativeElement) {
  parent.children.push(child)
  console.log('insert operation')  // ❌ Side effect
}

// After: Clean separation
export function insert(parent: NativeElement, child: NativeElement) {
  parent.children.push(child)
  recordDebugOp('insert', { parent: parent.id, child: child.id })  // ✅ Isolated
}
```

[Read detailed docs](./PHASE_1_FEATURE_3_instrumentation.md)

---

## Test Coverage

All Phase 1 features are validated with dedicated tests:

```bash
$ pnpm test
✓ creates and snapshots a native tree
✓ patches native props and listeners
✓ normalizes listener keys and removes listener bucket when empty
✓ serializes snapshot props and listener names safely

4 tests pass in 59ms
```

**Test File**: [packages/runtime-native/__tests__/runtime-native.spec.ts](../packages/runtime-native/__tests__/runtime-native.spec.ts)

---

## Type Safety

All Phase 1 code passes strict TypeScript checking:

```bash
$ pnpm typecheck
runtime-native: Done in 4.4s
sandbox: Done in 3.3s
✓ No errors
```

### Type Improvements in Phase 1
- `NativeSnapshotValue` explicitly excludes functions
- `NativeNodeSnapshot` uses precise types for serializable data
- Event key handling uses strict string methods (`charAt()` vs array indexing)
- All listeners stored with correct types

---

## Key Takeaways

### Host Contract is Now Stable
After Phase 1, the native host interface is locked down:
- ✅ Props and events have standardized handling
- ✅ Snapshots are predictable and serializable
- ✅ Debug operations are traceable

### Benefits for Phase 2
- Phase 2 can build a mutation bridge knowing prop/event contract won't change
- Instrumentation separation makes it easy to implement cross-process mutation queuing
- Serializable snapshots are essential for bridge serialization

### Benefits for Phase 3
- Primitives (`Image`, `ScrollView`, `Pressable`) can confidently use `patchProp()` without surprises
- Snapshot model ensures type safety for complex nested structures
- Instrumentation can track primitive-specific mutations separately

---

## File Structure After Phase 1

```
packages/runtime-native/src/
├── patchProp.ts          ← Feature 1: Event normalization
├── types.ts              ← Feature 2: Snapshot types
├── host.ts               ← Feature 2: Snapshot generation
├── instrumentation.ts    ← Feature 3: Debug telemetry
├── renderer.ts           ← Unchanged: Exports public API
├── nativeApp.ts          ← Unchanged: Helper for Vue apps
└── index.ts              ← Unchanged: Re-exports

packages/runtime-native/__tests__/
└── runtime-native.spec.ts ← All 4 tests (Feature 1, 2, 3 validation)
```

---

## Next Steps: Phase 2

Phase 2 will implement the [Mutation Bridge](./PHASE_1_FEATURE_3_instrumentation.md#phase-2-mutation-bridge-adapter) that the instrumentation module prepared for.

See: [NEXT_STEPS_ARCHITECTURE.md](./NEXT_STEPS_ARCHITECTURE.md#phase-2-mutation-bridge)

---

## Summary

**Phase 1 Status**: ✅ **Complete**
- 3 features implemented
- 4 tests passing (100%)
- TypeScript strict mode: ✅ Clean
- Git: ✅ Pushed to main branch

**What was locked down**: Native host contract (props, events, snapshots, instrumentation)

**What's ready**: Phase 2 can now build mutation bridge on top of this stable foundation
