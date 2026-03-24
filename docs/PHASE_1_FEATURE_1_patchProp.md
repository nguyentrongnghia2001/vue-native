# Phase 1, Feature 1: patchProp Normalization

**File**: [packages/runtime-native/src/patchProp.ts](../../packages/runtime-native/src/patchProp.ts)

**Goal**: Standardize how Vue props and events are translated to native element properties and event listeners.

**Completion Date**: March 24, 2026

## Problem Solved

When Vue renders to native platforms, event names often conflict:

- Vue templates use `@press` (gets compiled to `onPress` in vnode)
- React Native expects `onPress` property directly on the component
- Some frameworks accept both `onPress` and raw `onpress`

**Before Phase 1**: The renderer accepted `onPress` but couldn't handle raw `onpress` patterns or inconsistent casing from different source systems.

**After Phase 1**: All event name patterns are recognized, normalized to a canonical form, and listeners are properly attached/removed.

---

## What Changed

### New Functions

#### `isEventKey(key: string): boolean`
Detects if a string is an event key (both Vue and direct patterns).

```typescript
export function isEventKey(key: string): boolean {
  return isOn(key) || /^on[a-z]/.test(key)
}
```

**Examples**:
```typescript
isEventKey('onPress')     // ✅ true (Vue convention)
isEventKey('onpress')     // ✅ true (raw lowercase)
isEventKey('onClick')     // ✅ true (raw mixed case)
isEventKey('class')       // ❌ false (not an event)
isEventKey('data-test')   // ❌ false (not an event)
```

#### `normalizeEventKey(key: string): string`
Converts event keys to canonical form: `onXxx` with first letter capitalized.

```typescript
export function normalizeEventKey(key: string): string {
  // 'onpress' → 'onPress'
  // 'onClick' → 'onClick'
  // '@press' from Vue → already handled by isOn() before this
  if (!isOn(key)) {
    const rest = key.slice(2)  // Remove 'on' prefix
    return `on${rest.charAt(0).toUpperCase()}${rest.slice(1)}`
  }
  return key
}
```

**Examples**:
```typescript
normalizeEventKey('onpress')   // 'onPress'
normalizeEventKey('onClick')   // 'onClick'
normalizeEventKey('onPressOut') // 'onPressOut'
normalizeEventKey('onLongPress') // 'onLongPress'
```

### Updated `patchProp()` Function

**Signature** (unchanged):
```typescript
export function patchProp(
  el: NativeElement,
  key: string,
  prevValue: any,
  nextValue: any
): void
```

**Key Logic** (now with normalization):

```typescript
export function patchProp(
  el: NativeElement,
  key: string,
  prevValue: any,
  nextValue: any
): void {
  // 1. Handle events
  if (isEventKey(key)) {
    const listeners = (el.eventListeners ||= Object.create(null))
    const eventKey = normalizeEventKey(key)
    
    if (nextValue == null) {
      // Remove listener
      delete listeners[eventKey]
      // Clean up: if no listeners left, set to null
      if (Object.keys(listeners).length === 0) {
        el.eventListeners = null
      }
    } else {
      // Add listener
      listeners[eventKey] = nextValue
    }
    return
  }
  
  // 2. Handle regular props
  if (nextValue == null) {
    delete el.props[key]
  } else {
    el.props[key] = nextValue
  }
}
```

---

## Behavior Changes

### Event Listener Normalization

**Before Phase 1**:
```typescript
const el = createNativeElement()

// Raw lowercase event - NOT RECOGNIZED
patchProp(el, 'onpress', undefined, handler)
el.eventListeners  // {} ❌ Handler lost

// Only Vue pattern worked
patchProp(el, 'onPress', undefined, handler)
el.eventListeners  // { onPress: handler } ✅
```

**After Phase 1**:
```typescript
const el = createNativeElement()

// All patterns work and normalize to same key
patchProp(el, 'onpress', undefined, handler)
el.eventListeners  // { onPress: handler } ✅

patchProp(el, 'onClick', undefined, handler)
el.listeners       // { onClick: handler } ✅

patchProp(el, 'onLongPress', undefined, handler)
el.listeners       // { onLongPress: handler } ✅
```

### Empty Listener Bucket Cleanup

**Before Phase 1**:
```typescript
const el = createNativeElement()
patchProp(el, 'onPress', undefined, handler)
patchProp(el, 'onPress', handler, null)  // Remove

el.eventListeners  // {} ❌ Empty object stays
```

**After Phase 1**:
```typescript
const el = createNativeElement()
patchProp(el, 'onPress', undefined, handler)
patchProp(el, 'onPress', handler, null)  // Remove

el.eventListeners  // null ✅ Cleaned up when empty
```

**Why This Matters**:
- Snapshots are smaller (no empty `{}` objects)
- Debugging is clearer (no "ghost" listeners)
- Memory usage is slightly better (null vs empty object)

---

## Test Coverage

### Test Name
```
normalizes listener keys and removes listener bucket when empty
```

### Test Code
```typescript
test('normalizes listener keys and removes listener bucket when empty', () => {
  const el = createNativeElement()
  const handler = () => {}
  
  // Test 1: All patterns normalize to onPress
  patchProp(el, 'onpress', undefined, handler)
  expect(el.eventListeners?.onPress).toBe(handler)
  
  patchProp(el, 'onClick', undefined, handler)
  expect(el.eventListeners?.onClick).toBe(handler)
  
  // Test 2: Removing last listener cleans up to null
  patchProp(el, 'onClick', handler, null)
  patchProp(el, 'onPress', handler, null)
  expect(el.eventListeners).toBeNull()
})
```

### Test Result
```
✓ normalizes listener keys and removes listener bucket when empty (0-1ms)
```

---

## Usage Examples

### In Vue Components

```typescript
// Template syntax (compiled at runtime)
const template = `
  <view @press="handlePress">
    <text>Press me</text>
  </view>
`

// During render, Vue calls patchProp internally
// @press → onPress → patchProp(el, 'onPress', ..., handler)
//   ✅ Now recognized and normalized correctly
```

### Direct API Usage

```typescript
import { createNativeRenderer, patchProp } from '@vue-native/runtime-native'

const renderer = createNativeRenderer()
const el = renderer.nodeOps.createElement('View')

// Add listener with any casing pattern
patchProp(el, 'onpress', undefined, () => console.log('pressed'))

// Native code can read from consistent normalized key
el.eventListeners['onPress']  // ✅ Always available

// Snapshot includes listener names
const snapshot = snapshotNativeTree(el)
snapshot.listeners  // ['onPress'] ✅ Predictable format
```

### Real-world React Native Integration

```typescript
import { NativeElement } from '@vue-native/runtime-native'

function renderToReactNative(nativeEl: NativeElement) {
  // React Native expects listeners on component props
  const reactProps = {}
  
  if (nativeEl.eventListeners) {
    Object.entries(nativeEl.eventListeners).forEach(([eventKey, handler]) => {
      // Keys are now always in onXxx format after Feature 1
      reactProps[eventKey] = handler
    })
  }
  
  return <View {...reactProps} />
}
```

---

## Why This Design

### 1. Flexibility
Accepts event keys from multiple sources:
- Vue compiled output (`onPress`)
- Raw framework inputs (`onpress`)
- User-provided handlers

### 2. Consistency
Always normalizes to `onXxx` canonical form internally, so downstream code doesn't need to handle variants.

### 3. Cleanup
Empty listener objects are immediately nulled to prevent:
- Accidental iteration over empty keys
- Snapshot bloat
- Confusion during debugging

### 4. Type Safety
Uses `charAt(0)` instead of `[0]` indexing to satisfy strict TypeScript checking.

---

## Integration Points

### From Vue Renderer
When Vue renders a component with `@press` handler:

```
Vue template: @press="handler"
   ↓ (compile-time)
Vnode: { onPress: handler }
   ↓ (render-time, patchProp called)
NativeElement: { eventListeners: { onPress: handler } }
```

Both Vue's `onPress` and raw `onpress` inputs now work.

### To Snapshot System
Feature 1 works with Feature 2 (Snapshot) to expose listener names safely:

```typescript
const snapshot = snapshotNativeTree(el)
snapshot.listeners  // ['onPress', 'onClick'] (no function objects)
```

### To Debug Instrumentation
Feature 1 works with Feature 3 (Instrumentation) to track listener changes:

```typescript
patchProp(el, 'onPress', undefined, handler)
// Automatically records: recordDebugOp('patchProp', { key: 'onPress', ... })
```

---

## Common Questions

### Q: Why mutate target object instead of return new object?
**A**: Vue's renderer expects mutations. Returning new objects would break the host contract.

### Q: Why clean up to `null` instead of delete the `eventListeners` property?
**A**: Vue snapshots and object spread operators expect consistent structure. Null is a complete "no listeners" signal.

### Q: What if two event names normalize to the same key?
**A**: By design, we normalize to canonical form. `onpress` and `onPress` both become `onPress` and overwrite. This is intentional - last writer wins.

### Q: How does this handle Vue's `@click.prevent` modifier?
**A**: Modifiers are handled by Vue's compiler before reaching patchProp. We only see the final `onClickCapture` or similar. Feature 1 normalizes these consistently.

---

## What's Next

Feature 1 (patchProp normalization) enables:

1. **Feature 2**: Snapshot system can confidently expose `listeners` array without worrying about casing inconsistencies
2. **Feature 3**: Instrumentation can track event changes predictably
3. **Phase 2**: Bridge adapter can serialize listener keys reliably
4. **Phase 3**: Primitives can register handlers without defensive normalization code

---

## Files Modified

- ✅ [packages/runtime-native/src/patchProp.ts](../../packages/runtime-native/src/patchProp.ts) — Added `isEventKey()`, `normalizeEventKey()`

## Files NOT Modified

- `packages/runtime-native/src/types.ts` (unchanged)
- `packages/runtime-native/src/host.ts` (unchanged at this point)
- `packages/runtime-native/src/renderer.ts` (unchanged)

## Test Status

```bash
$ pnpm test -- --reporter=verbose

✓ normalizes listener keys and removes listener bucket when empty
  ↳ Pattern normalization works
  ↳ Empty bucket cleanup works
```

---

## Summary

**Feature 1 Status**: ✅ **Complete and Tested**

**What it does**: 
- Recognizes event keys in multiple formats (Vue, raw lowercase, mixed case)
- Normalizes all to canonical `onXxx` form
- Cleans up empty listener buckets to `null`

**Why it matters**: 
- Downstream code can rely on consistent listener key format
- Snapshots don't contain empty object artifacts
- Multiple source systems can feed event handlers without special handling

**Next Feature**: [Feature 2: Serializable Snapshot Model](./PHASE_1_FEATURE_2_snapshot_model.md)
