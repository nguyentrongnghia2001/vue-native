# @vue-native/runtime-native

A native-oriented Vue renderer scaffold for a standalone repo.

This package is intentionally small at first:
- host tree / node ops
- patch prop mapping
- renderer bootstrap
- a future JS ↔ native bridge

## Public API Contract (Phase 9.1)

Public exports are grouped into 3 buckets:

1. Stable APIs: safe for production use in v1 RC scope.
2. Compatibility APIs: legacy naming kept for backward compatibility.
3. Experimental APIs: usable for advanced integrations, may change with notice.

The authoritative manifest lives in [packages/runtime-native/src/apiContract.ts](src/apiContract.ts).

### Stable API highlights

- App/runtime bootstrap:
	- `createNativeApp`
	- `createNativeRoot`
	- `snapshotNativeTree`
	- `dispatchEventToNativeNode`
- Bridge/session:
	- `registerBridgeAdapter`
	- `setEventDispatcher`
	- `resetBridgeState`
	- `createHostRuntimeSession`
- Host adapters:
	- `createHostTransportBridgeAdapter`
	- `createInMemoryHostTransport`
	- `createInMemoryBridgeAdapter`

### Compatibility exports (legacy)

- `createNativeTransportBridgeAdapter`
- `dispatchNativeEvent`

### Semver policy (v1 RC)

- Stable APIs follow semver: breaking changes require major bump.
- Compatibility APIs stay available through v1 RC and are removed only with migration notes.
- Experimental APIs may evolve between RC iterations with explicit changelog notes.

Detailed migration policy and mapping notes: [docs/PHASE_9_MIGRATION_NOTES.md](../../docs/PHASE_9_MIGRATION_NOTES.md).
