import type { NativeNodeSnapshot } from '@vue-native/runtime-native'
import AppRoot from './AppRoot.vue'
import {
  createProductHostTransport,
  type ProductHostTransportMode,
} from './hostTransport'
import {
  createProductRuntimeSession,
  type ProductRuntimeSessionOptions,
  type ProductRuntimeSession,
} from './productRuntimeSession'

export interface AppRootHostRunner extends ProductRuntimeSession {
  mode: ProductHostTransportMode
}

export function createAppRootHostRunner(
  mode: ProductHostTransportMode = 'auto',
  options: ProductRuntimeSessionOptions = {},
): AppRootHostRunner {
  const transport = createProductHostTransport({ mode })
  const sessionOptions: ProductRuntimeSessionOptions = {
    adapterId: options.adapterId ?? `product-app-root-${mode}`,
  }
  if (options.scheduler !== undefined) {
    sessionOptions.scheduler = options.scheduler
  }
  if (options.lifecycle !== undefined) {
    sessionOptions.lifecycle = options.lifecycle
  }

  const session = createProductRuntimeSession(AppRoot, transport, sessionOptions)

  return {
    mode,
    ...session,
  }
}

export interface DualHostAppRootSnapshotCheck {
  inMemory: NativeNodeSnapshot
  auto: NativeNodeSnapshot
}

export interface DualHostAppRootParitySmoke {
  normalizedInMemory: Record<string, unknown>
  normalizedAuto: Record<string, unknown>
  isEqual: boolean
}

function normalizeSnapshot(snapshot: NativeNodeSnapshot): Record<string, unknown> {
  if (snapshot.type === 'text' || snapshot.type === 'comment') {
    return {
      type: snapshot.type,
      text: snapshot.text ?? '',
    }
  }

  const normalizedProps = snapshot.props
    ? Object.fromEntries(Object.entries(snapshot.props).sort(([left], [right]) => left.localeCompare(right)))
    : undefined

  const normalizedListeners = Array.isArray(snapshot.listeners)
    ? [...snapshot.listeners].sort()
    : undefined

  return {
    type: snapshot.type,
    tag: snapshot.tag,
    props: normalizedProps,
    listeners: normalizedListeners,
    children: Array.isArray(snapshot.children)
      ? snapshot.children.map(child => normalizeSnapshot(child))
      : [],
  }
}

export function runAppRootDualHostSnapshotCheck(): DualHostAppRootSnapshotCheck {
  const inMemoryRunner = createAppRootHostRunner('in-memory')
  const inMemory = inMemoryRunner.getSnapshot()
  inMemoryRunner.dispose()

  const autoRunner = createAppRootHostRunner('auto')
  const auto = autoRunner.getSnapshot()
  autoRunner.dispose()

  return {
    inMemory,
    auto,
  }
}

export function runAppRootDualHostParitySmokeCheck(): DualHostAppRootParitySmoke {
  const snapshots = runAppRootDualHostSnapshotCheck()
  const normalizedInMemory = normalizeSnapshot(snapshots.inMemory)
  const normalizedAuto = normalizeSnapshot(snapshots.auto)

  return {
    normalizedInMemory,
    normalizedAuto,
    isEqual: JSON.stringify(normalizedInMemory) === JSON.stringify(normalizedAuto),
  }
}
