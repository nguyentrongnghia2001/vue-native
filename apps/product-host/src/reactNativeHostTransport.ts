import { DeviceEventEmitter, NativeEventEmitter, NativeModules } from 'react-native'
import type {
  HostEventRecord,
  HostMutationRecord,
  HostMutationTransport,
  HostTransportAck,
} from '@vue-native/runtime-native'
import { attachNativeEventChannel } from '@vue-native/runtime-native'

const DEFAULT_NATIVE_MODULE_NAME = 'VueNativeHostBridge'
const DEFAULT_NATIVE_EVENT_NAME = 'vue-native:bridge-event'

type ListenerSubscription = { remove: () => void }

interface NativeBridgeModule {
  applyMutations?: (
    batch: HostMutationRecord[],
  ) => Promise<{ ok?: boolean; processed?: number; error?: string } | void> | { ok?: boolean; processed?: number; error?: string } | void
  applyMutationBatch?: (
    payload: string,
  ) => Promise<{ ok?: boolean; processed?: number; error?: string } | void> | { ok?: boolean; processed?: number; error?: string } | void
  sendMutations?: (
    payload: HostMutationRecord[] | string,
  ) => Promise<{ ok?: boolean; processed?: number; error?: string } | void> | { ok?: boolean; processed?: number; error?: string } | void
}

interface NativeBridgeAckResponse {
  ok: boolean
  processed?: number
  error?: string
}

export interface ReactNativeHostTransportStats {
  mode: 'native-module' | 'in-memory-fallback'
  sentBatches: number
  sentMutations: number
  receivedEvents: number
  lastBatchSize: number
  receiverAttached: boolean
  lastError: string | null
}

export interface ReactNativeHostTransportDiagnostics {
  moduleName: string
  eventName: string
  moduleDetected: boolean
  availableMethods: string[]
}

export interface ReactNativeHostTransport extends HostMutationTransport {
  emitEvent: (event: HostEventRecord) => void
  getStats: () => ReactNativeHostTransportStats
  getDiagnostics: () => ReactNativeHostTransportDiagnostics
}

function detectNativeBridgeModule(moduleName: string): NativeBridgeModule | null {
  const mod = NativeModules[moduleName]
  if (!mod || typeof mod !== 'object') return null
  return mod as NativeBridgeModule
}

function normalizeAckResponse(raw: unknown): NativeBridgeAckResponse {
  if (!raw || typeof raw !== 'object') return { ok: true }
  const obj = raw as Record<string, unknown>
  const result: NativeBridgeAckResponse = { ok: obj.ok !== false }
  if (typeof obj.processed === 'number') result.processed = obj.processed
  if (typeof obj.error === 'string') result.error = obj.error
  return result
}

export function createReactNativeHostTransport(
  options?: {
    moduleName?: string
    eventName?: string
  },
): ReactNativeHostTransport {
  const moduleName = options?.moduleName ?? DEFAULT_NATIVE_MODULE_NAME
  const eventName = options?.eventName ?? DEFAULT_NATIVE_EVENT_NAME

  let eventReceiver: ((event: HostEventRecord) => void) | null = null
  let eventSubscription: ListenerSubscription | null = null

  const stats: ReactNativeHostTransportStats = {
    mode: 'native-module',
    sentBatches: 0,
    sentMutations: 0,
    receivedEvents: 0,
    lastBatchSize: 0,
    receiverAttached: false,
    lastError: null,
  }

  const nativeModule = detectNativeBridgeModule(moduleName)
  const moduleDetected = nativeModule !== null

  const availableMethods: string[] = []
  if (nativeModule) {
    if (typeof nativeModule.applyMutations === 'function') availableMethods.push('applyMutations')
    if (typeof nativeModule.applyMutationBatch === 'function') availableMethods.push('applyMutationBatch')
    if (typeof nativeModule.sendMutations === 'function') availableMethods.push('sendMutations')
  }

  function attachEventReceiver() {
    if (eventSubscription) return

    try {
      const attached = attachNativeEventChannel({
        moduleRegistry: NativeModules as Record<string, unknown>,
        moduleName,
        eventName,
        listener: (payload: unknown) => {
          if (!eventReceiver) return
          const event: HostEventRecord = typeof payload === 'object' && payload !== null
            ? payload as HostEventRecord
            : { nodeId: -1, event: 'unknown', args: [payload] }
          stats.receivedEvents += 1
          eventReceiver(event)
        },
        NativeEventEmitter: NativeEventEmitter as unknown as any,
        DeviceEventEmitter: DeviceEventEmitter as unknown as any,
      })

      eventSubscription = attached.subscription as ListenerSubscription
      stats.receiverAttached = true
    } catch (err) {
      stats.lastError = err instanceof Error ? err.message : String(err)
    }
  }

  function detachEventReceiver() {
    if (eventSubscription) {
      eventSubscription.remove()
      eventSubscription = null
      stats.receiverAttached = false
    }
  }

  async function sendMutations(batch: HostMutationRecord[]) {
    stats.sentBatches += 1
    stats.sentMutations += batch.length
    stats.lastBatchSize = batch.length

    if (!nativeModule) {
      stats.mode = 'in-memory-fallback'
      const fallbackAck: HostTransportAck = {
        ok: true,
        processed: batch.length,
        meta: { mode: 'in-memory-fallback' },
      }
      return fallbackAck
    }

    try {
      let result: NativeBridgeAckResponse

      if (typeof nativeModule.applyMutations === 'function') {
        const raw = await nativeModule.applyMutations(batch)
        result = normalizeAckResponse(raw)
      } else if (typeof nativeModule.applyMutationBatch === 'function') {
        const raw = await nativeModule.applyMutationBatch(JSON.stringify(batch))
        result = normalizeAckResponse(raw)
      } else if (typeof nativeModule.sendMutations === 'function') {
        const raw = await nativeModule.sendMutations(batch)
        result = normalizeAckResponse(raw)
      } else {
        stats.lastError = `No mutation method on ${moduleName}`
        return { ok: false, error: stats.lastError }
      }

      if (!result.ok) {
        stats.lastError = result.error ?? 'unknown error'
      }

      const response: HostTransportAck = { ok: result.ok }
      if (result.processed !== undefined) response.processed = result.processed
      if (result.error !== undefined) response.error = result.error
      response.meta = { mode: 'native-module' }
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      stats.lastError = message
      return { ok: false, error: message }
    }
  }

  function setEventReceiver(receiver: ((event: HostEventRecord) => void) | null) {
    eventReceiver = receiver
    if (receiver) {
      attachEventReceiver()
    } else {
      detachEventReceiver()
    }
  }

  function emitEvent(event: HostEventRecord) {
    eventReceiver?.(event)
  }

  function getStats() {
    return { ...stats }
  }

  function getDiagnostics(): ReactNativeHostTransportDiagnostics {
    return {
      moduleName,
      eventName,
      moduleDetected,
      availableMethods,
    }
  }

  return {
    sendMutations,
    setEventReceiver,
    emitEvent,
    getStats,
    getDiagnostics,
  }
}
