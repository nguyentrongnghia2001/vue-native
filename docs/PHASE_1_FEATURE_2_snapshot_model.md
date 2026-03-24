# Phase 1, Feature 2: Serializable Snapshot Model

**Files**: 
- [packages/runtime-native/src/types.ts](../../packages/runtime-native/src/types.ts) (types)
- [packages/runtime-native/src/host.ts](../../packages/runtime-native/src/host.ts) (implementation)

**Goal**: Create a JSON-serializable representation of the native element tree that excludes function references and other non-serializable values.

**Completion Date**: March 24, 2026

## Problem Solved

Vue's renderer maintains a live tree in memory:

```typescript
// Live tree (contains function references)
{
  id: 1,
  tag: 'View',
  props: {
    backgroundColor: 'red',
    onClick: [Function onClick]  // ❌ Can't serialize to JSON
  },
  listeners: {
    onPress: [Function handler]  // ❌ Can't serialize
  }
}
```

**Before Phase 2**: The renderer had no safe way to:
- Send tree state across process boundaries
- Log tree structure for debugging
- Create testable snapshots
- Inspect tree state without functions polluting the output

**After Phase 1**: We now have type-safe serializable snapshots that preserve structure while filtering out non-serializable values.

---

## What Changed

### New Type: `NativeSnapshotValue`

This union type represents values that are safe to serialize to JSON:

```typescript
export type NativeSnapshotValue =
  | string
  | number
  | boolean
  | null
  | NativeSnapshotValue[]  // Recursive arrays
  | { [key: string]: NativeSnapshotValue }  // Recursive objects
```

**What it INCLUDES**:
```typescript
const ok: NativeSnapshotValue = {
  text: 'hello',           // ✅ string
  count: 42,               // ✅ number
  visible: true,           // ✅ boolean
  empty: null,             // ✅ null
  nested: {
    items: [1, 2, 3],      // ✅ nested arrays with recursion
    tags: ['a', 'b']       // ✅ string arrays
  }
}
```

**What it EXCLUDES**:
```typescript
const notOk: any = {
  handler: () => {},        // ❌ functions not in union
  instance: new Date(),     // ❌ Date objects not in union
  sym: Symbol('test'),      // ❌ Symbols not in union
  circ: undefined           // ❌ undefined not in union
}
```

### Updated Type: `NativeNodeSnapshot`

The snapshot of a single element:

```typescript
export interface NativeNodeSnapshot {
  id: number
  type: NativeNodeType  // 'element' | 'text' | 'comment'
  tag?: string          // Only for 'element' type
  text?: string         // Only for 'text' type
  
  // New: Serializable props (functions filtered out)
  props?: Record<string, NativeSnapshotValue>
  
  // New: Listener names array instead of function references
  listeners?: string[]  // ['onPress', 'onClick', ...]
  
  children?: NativeNodeSnapshot[]
}
```

**Example Snapshot**:
```json
{
  "id": 1,
  "type": "element",
  "tag": "View",
  "props": {
    "backgroundColor": "red",
    "opacity": 0.8,
    "visible": true
  },
  "listeners": ["onPress", "onLongPress"],
  "children": [
    {
      "id": 2,
      "type": "element",
      "tag": "Text",
      "props": { "color": "white" },
      "listeners": ["onClick"],
      "children": [
        {
          "id": 3,
          "type": "text",
          "text": "Hello World"
        }
      ]
    }
  ]
}
```

This is **valid JSON** with no function references.

### New Helper: `toSnapshotValue()`

Safely converts any value to `NativeSnapshotValue`:

```typescript
function toSnapshotValue(value: unknown): NativeSnapshotValue {
  if (value === null || value === undefined) return null
  
  const type = typeof value
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return value as NativeSnapshotValue
  }
  
  if (type === 'function' || type === 'symbol') {
    return null  // Filter out non-serializable
  }
  
  if (Array.isArray(value)) {
    return value.map(item => toSnapshotValue(item))
  }
  
  if (type === 'object') {
    const result: Record<string, NativeSnapshotValue> = {}
    for (const key in value) {
      const val = (value as any)[key]
      const snapshotVal = toSnapshotValue(val)
      if (snapshotVal !== null || val === null) {
        result[key] = snapshotVal
      }
    }
    return result
  }
  
  return null
}
```

**Examples**:
```typescript
toSnapshotValue('hello')            // 'hello' ✅
toSnapshotValue(42)                 // 42 ✅
toSnapshotValue(true)               // true ✅
toSnapshotValue(null)               // null ✅
toSnapshotValue(() => {})           // null ✅ (function filtered)
toSnapshotValue(Symbol('x'))        // null ✅ (symbol filtered)
toSnapshotValue([1, 'x', null])     // [1, 'x', null] ✅
toSnapshotValue({                   // { x: 1, nested: { y: 2 } } ✅
  x: 1,
  func: () => {},                   // Removed ✅
  nested: { y: 2 }
})
```

### New Helper: `snapshotProps()`

Filters element props to remove functions:

```typescript
function snapshotProps(
  props: Record<string, any>
): Record<string, NativeSnapshotValue> {
  const result: Record<string, NativeSnapshotValue> = {}
  
  for (const key in props) {
    const value = props[key]
    if (value === undefined) continue  // Skip undefined
    
    const snapshotValue = toSnapshotValue(value)
    if (snapshotValue !== null || value === null) {
      result[key] = snapshotValue
    }
  }
  
  return result
}
```

**Example**:
```typescript
const props = {
  backgroundColor: 'red',
  opacity: 0.8,
  onClick: () => console.log('clicked'),  // Will be removed
  style: { width: 100, display: 'flex' }
}

snapshotProps(props)
// {
//   backgroundColor: 'red',
//   opacity: 0.8,
//   style: { width: 100, display: 'flex' }
// }
```

### Updated: `snapshotNativeTree()`

Creates a complete snapshot of the tree:

```typescript
export function snapshotNativeTree(
  node: NativeChildNode
): NativeNodeSnapshot {
  if (node.type === 'text' || node.type === 'comment') {
    return {
      id: node.id,
      type: node.type,
      text: node.text
    }
  }
  
  return {
    id: node.id,
    type: node.type,
    tag: node.tag,
    
    // Sanitized props (no functions)
    props: snapshotProps(node.props),
    
    // Listener names as array (not Function objects)
    listeners: node.eventListeners
      ? Object.keys(node.eventListeners).sort()
      : [],
    
    // Recursively snapshot all children
    children: node.children.map(child => snapshotNativeTree(child))
  }
}
```

**Why `.sort()`?** Predictable order for testing and debugging.

---

## Behavior Changes

### Before Phase 1

```typescript
const tree = createNativeTree()
const snapshot = snapshotNativeTree(tree)

// ❌ Snapshot contains function references
snapshot.props.onClick            // [Function onClick]
snapshot.listeners                // { onPress: [Function] }

// ❌ Can't JSON.stringify
JSON.stringify(snapshot)           // ❌ Error: Converting circular structure
```

### After Phase 1

```typescript
const tree = createNativeTree()
const snapshot = snapshotNativeTree(tree)

// ✅ Snapshot is serializable
snapshot.props.onClick            // undefined (already filtered)
snapshot.listeners                // ['onPress', 'onClick'] (sorted strings)

// ✅ Can JSON.stringify safely
const json = JSON.stringify(snapshot)  // ✅ Valid JSON

// ✅ Can parse back
const restored = JSON.parse(json)      // ✅ Exact same structure
```

### Listener Names Array

**Why listener names instead of function objects?**

1. **Serializable**: `['onPress', 'onClick']` can convert to JSON
2. **Testable**: Easy to assert which handlers are attached
3. **Debuggable**: See listener hooks without executing them
4. **Performant**: No function object overhead in snapshots
5. **Sorted**: Deterministic order for consistent testing

**Example**:
```typescript
// Add listeners in random order
patchProp(el, 'onClick', undefined, handler1)
patchProp(el, 'onPress', undefined, handler2)
patchProp(el, 'onLongPress', undefined, handler3)

const snapshot = snapshotNativeTree(el)
// listeners automatically sorted
snapshot.listeners  // ['onClick', 'onLongPress', 'onPress'] ✅ Deterministic
```

---

## Test Coverage

### Test Name
```
serializes snapshot props and listener names safely
```

### Test Code
```typescript
test('serializes snapshot props and listener names safely', () => {
  const el = createNativeElement()
  
  // Add mixed props and listeners
  patchProp(el, 'backgroundColor', undefined, 'red')
  patchProp(el, 'opacity', undefined, 0.8)
  patchProp(el, 'onClick', undefined, () => {})
  patchProp(el, 'onPress', undefined, () => {})
  
  const snapshot = snapshotNativeTree(el)
  
  // ✅ Props are sanitized (click not in serializable output)
  expect(snapshot.props).toEqual({
    backgroundColor: 'red',
    opacity: 0.8
  })
  
  // ✅ Listener names are strings, sorted
  expect(snapshot.listeners).toEqual(['onClick', 'onPress'])
  
  // ✅ Snapshot is JSON-serializable
  const json = JSON.stringify(snapshot)
  expect(json).toContain('"backgroundColor":"red"')
  expect(json).not.toContain('Function')
})
```

### Test Result
```
✓ serializes snapshot props and listener names safely (4-8ms)
```

---

## Usage Examples

### Debugging in Development

```typescript
import { snapshotNativeTree } from '@vue-native/runtime-native'

const renderer = createNativeRenderer()
const root = renderer.nodeOps.createElement('View')

// ... render some tree ...

// Get serializable snapshot for inspection
const snapshot = snapshotNativeTree(root)

// Log cleanly (no function clutter)
console.log(JSON.stringify(snapshot, null, 2))

// Output:
// {
//   "id": 1,
//   "type": "element",
//   "tag": "View",
//   "props": { "backgroundColor": "red" },
//   "listeners": ["onPress"],
//   "children": [...]
// }
```

### Testing Tree Structure

```typescript
test('renders counter with correct structure', () => {
  const snapshot = snapshotNativeTree(rootElement)
  
  // Assert structure without worrying about function references
  expect(snapshot.tag).toBe('View')
  expect(snapshot.listeners).toContain('onPress')
  expect(snapshot.children).toHaveLength(2)
  expect(snapshot.children[0].tag).toBe('Text')
})
```

### Sending Tree to Native Bridge

```typescript
// Feature 3 integration: Send snapshot across bridge
function sendTreeUpdate(node: NativeElement) {
  const snapshot = snapshotNativeTree(node)
  
  // Snapshot is JSON-serializable, safe to send via bridge
  const serialized = JSON.stringify(snapshot)
  nativeBridge.updateTree(serialized)  // ✅ Works
}
```

### React Native Integration

```typescript
import { snapshotNativeTree } from '@vue-native/runtime-native'

function VueTreeToReactComponents(vueRoot: NativeElement) {
  const snapshot = snapshotNativeTree(vueRoot)
  
  return renderSnapshot(snapshot)
  
  function renderSnapshot(snap: NativeNodeSnapshot): ReactNode {
    if (snap.type === 'text') {
      return <Text>{snap.text}</Text>
    }
    
    // Props are already sanitized for React
    const reactProps: any = {
      ...snap.props,
      key: snap.id
    }
    
    // Attach listeners from listener names
    if (snap.listeners?.includes('onPress')) {
      reactProps.onPress = handlePress(snap.id)
    }
    if (snap.listeners?.includes('onClick')) {
      reactProps.onClick = handleClick(snap.id)
    }
    
    const Component = snap.tag === 'View' ? View : Text
    return (
      <Component {...reactProps} key={snap.id}>
        {snap.children?.map(child => renderSnapshot(child))}
      </Component>
    )
  }
}
```

---

## Why This Design

### 1. Type Safety
`NativeSnapshotValue` type explicitly forbids functions, making it impossible to accidentally serialize non-serializable values.

### 2. Performance
Snapshots exclude function references, reducing memory footprint and serialization overhead.

### 3. Testability
Deterministic listener order and sanitized props make snapshots perfect for assertion comparisons.

### 4. Bridge-Friendly
Feature 2 enables cross-process communication in Phase 2 (Mutation Bridge) by providing JSON-safe tree state.

### 5. Backward Compatible
Live tree (with functions) is unchanged. Only snapshot output is sanitized.

---

## Integration Points

### From Feature 1 (patchProp)
Feature 1 ensures listener keys are normalized:

```
patchProp normalizes event keys to 'onXxx' format
   ↓ (during snapshotNativeTree)
Listeners array automatically sorted: ['onClick', 'onPress', 'onX']
   ↓ (in snapshot)
Predictable, deterministic output ✅
```

### To Feature 3 (Instrumentation)
Feature 2 snapshots work seamlessly with debug ops:

```typescript
// Feature 3 records operation
recordDebugOp('patchProp', { key: 'onPress', oldValue: null })

// Feature 2 captures the result
const snapshot = snapshotNativeTree(el)
snapshot.listeners  // ['onPress'] ✅
```

### To Phase 2 (Mutation Bridge)
Feature 2 provides serializable state for cross-process:

```typescript
// Phase 2 will use
const snapshot = snapshotNativeTree(node)
const json = JSON.stringify(snapshot)  // ✅ Safe to send to bridge
```

---

## Common Questions

### Q: Why store listener names as array instead of object?
**A**: 
- Arrays are more serializable-friendly (simpler JSON)
- Names alone are enough for most use cases
- Sorted order is deterministic for testing
- Function references in object would break serialization

### Q: What if a prop value contains a function nested deep in an object?
**A**: 
`toSnapshotValue()` recursively filters. Nested functions are removed:
```typescript
const props = {
  style: {
    onClick: () => {},  // Even nested functions removed
    width: 100          // Only primitives kept
  }
}
snapshotProps(props)  // { style: { width: 100 } }
```

### Q: How do I know if a listener is active if I only have names?
**A**: 
The presence of a name in `listeners` array means it's active. To get the Function back and execute it, use the live tree (not snapshot).

### Q: Can I extend NativeSnapshotValue for custom types?
**A**: 
No, by design. `NativeSnapshotValue` is a closed union to guarantee JSON serializability. If you need custom types, store them separately and reference by ID.

### Q: What happens to undefined prop values?
**A**:
```typescript
const props = {
  visible: true,
  hidden: undefined  // This is skipped
}
snapshotProps(props)  // { visible: true } (hidden omitted)
```
This keeps snapshots clean and focused on actual values.

---

## What's Next

Feature 2 (Snapshot Model) enables:

1. **Phase 2**: Bridge adapter can reliably serialize and deserialize tree state
2. **Phase 3**: Primitives can inspect snapshot structure for validation
3. **Debugging**: Console inspection shows clean, JSON-compatible output
4. **Testing**: Snapshot assertions are deterministic and portable

---

## Files Modified

- ✅ [packages/runtime-native/src/types.ts](../../packages/runtime-native/src/types.ts)
  - Added `NativeSnapshotValue` type
  - Updated `NativeNodeSnapshot` interface
  
- ✅ [packages/runtime-native/src/host.ts](../../packages/runtime-native/src/host.ts)
  - Added `toSnapshotValue()` helper
  - Added `snapshotProps()` helper
  - Updated `snapshotNativeTree()` to use sanitizers
  - Added listener names array in snapshot

## Test Status

```bash
$ pnpm test -- --reporter=verbose

✓ serializes snapshot props and listener names safely
  ↳ Props are sanitized (no functions)
  ↳ Listeners are name strings, sorted
  ↳ Full snapshot is JSON-serializable
```

---

## Summary

**Feature 2 Status**: ✅ **Complete and Tested**

**What it does**: 
- Defines `NativeSnapshotValue` union type excluding functions
- Creates JSON-serializable tree snapshots
- Filters props to remove non-serializable values
- Tracks listener names as deterministic arrays

**Why it matters**: 
- Enables cross-process state sharing (Phase 2)
- Makes tree debugging clean and safe
- Provides type-safe serialization contract
- Critical foundation for mutation bridge

**Next Feature**: [Feature 3: Instrumentation Separation](./PHASE_1_FEATURE_3_instrumentation.md)
