import { DeviceEventEmitter, NativeEventEmitter, NativeModules } from 'react-native'
import type { NativeEventRecord, NativeMutationRecord } from '@vue-native/runtime-native'

const DEFAULT_NATIVE_MODULE_NAME = 'VueNativeHostBridge'
const DEFAULT_NATIVE_EVENT_NAME = 'vue-native:bridge-event'

type ListenerSubscription = { remove: () => void }

interface NativeBridgeModule {
  applyMutations?: (
    batch: NativeMutationRecord[],
  ) => Promise<{ ok?: boolean; processed?: number; error?: string } | void> | { ok?: boolean; processed?: number; error?: string } | void
  applyMutationBatch?: (
    payload: string,
  ) => Promise<{ ok?: boolean; processed?: number; error?: string } | void> | { ok?: boolean; processed?: number; error?: string } | void
  sendMutations?: (
    payload: NativeMutationRecord[] | string,
  ) => Promise<{ ok?: boolean; processed?: number; error?: string } | void> | { ok?: boolean; processed?: number; error?: string } | void
}

interface NativeBridgeAckResponse {
  ok?: boolean
  processed?: number
  error?: string
}

export interface RuntimeNativeTransportStats {
  mode: 'native-module' | 'sandbox-fallback'
  sentBatches: number
  sentMutations: number
  receivedEvents: number
  lastBatchSize: number
  receiverAttached: boolean
  lastError: string | null
}

export interface RuntimeNativeTransportDiagnostics {
  moduleName: string
  eventName: string
  moduleDetected: boolean
  availableMethods: string[]
}

export interface RuntimeNativeTransport {
  sendMutations: (
    batch: NativeMutationRecord[],
  ) => Promise<{ ok: boolean; processed?: number; error?: string; meta?: Record<string, unknown> }>
  setEventReceiver: (receiver: ((event: NativeEventRecord) => void) | null) => void
  emitEvent: (event: NativeEventRecord) => void
  getStats: () => RuntimeNativeTransportStats
  getRecentBatches: () => NativeMutationRecord[][]
  getDiagnostics: () => RuntimeNativeTransportDiagnostics
}

interface RuntimeNativeTransportOptions {
  maxBatches?: number
  nativeModuleName?: string
  nativeEventName?: string
}

function parseNativeEventPayload(payload: unknown): NativeEventRecord | null {
  if (!payload) return null

  const candidate = typeof payload === 'string' ? tryParseJson(payload) : payload
  if (!candidate || typeof candidate !== 'object') return null

  const event = candidate as Record<string, unknown>
  if (typeof event.nodeId !== 'number' || typeof event.event !== 'string') return null

  const normalized: NativeEventRecord = {
    nodeId: event.nodeId,
    event: event.event,
  }

  if (Array.isArray(event.args)) {
    normalized.args = event.args
  } else if (event.payload !== undefined) {
    normalized.args = [event.payload]
  }

  return normalized
}

function tryParseJson(payload: string): unknown {
  try {
    return JSON.parse(payload)
  } catch {
    return null
  }
}

function detectNativeBridgeModule(moduleName: string): NativeBridgeModule | null {
  const modules = NativeModules as Record<string, unknown>
  const detected = modules[moduleName]

  if (!detected || typeof detected !== 'object') {
    return null
  }

  return detected as NativeBridgeModule
}

async function sendBatchToNative(
  nativeModule: NativeBridgeModule,
  batch: NativeMutationRecord[],
): Promise<{ ok: boolean; processed?: number; error?: string; meta?: Record<string, unknown> }> {
  const toAck = (
    response: NativeBridgeAckResponse | void,
    channel: string,
  ): { ok: boolean; processed?: number; error?: string; meta?: Record<string, unknown> } => {
    const ack = {
      ok: response?.ok ?? true,
      processed: response?.processed ?? batch.length,
      meta: { channel },
    }

    if (typeof response?.error === 'string') {
      return {
        ...ack,
        error: response.error,
      }
    }

    return ack
  }

  if (typeof nativeModule.applyMutations === 'function') {
    const response = await nativeModule.applyMutations(batch)
    return toAck(response, 'applyMutations')
  }

  if (typeof nativeModule.applyMutationBatch === 'function') {
    const response = await nativeModule.applyMutationBatch(JSON.stringify(batch))
    return toAck(response, 'applyMutationBatch')
  }

  if (typeof nativeModule.sendMutations === 'function') {
    const response = await nativeModule.sendMutations(batch)
    return toAck(response, 'sendMutations')
  }

  return {
    ok: false,
    error: 'native bridge module is missing applyMutations/applyMutationBatch/sendMutations',
  }
}

export function createRuntimeNativeTransport(
  options: RuntimeNativeTransportOptions = {},
): RuntimeNativeTransport {
  const maxBatches = options.maxBatches ?? 10
  const moduleName = options.nativeModuleName ?? DEFAULT_NATIVE_MODULE_NAME
  const eventName = options.nativeEventName ?? DEFAULT_NATIVE_EVENT_NAME

  const recentBatches: NativeMutationRecord[][] = []
  let receiver: ((event: NativeEventRecord) => void) | null = null
  let subscription: ListenerSubscription | null = null

  const nativeModule = detectNativeBridgeModule(moduleName)
  const mode: RuntimeNativeTransportStats['mode'] = nativeModule
    ? 'native-module'
    : 'sandbox-fallback'

  const stats: RuntimeNativeTransportStats = {
    mode,
    sentBatches: 0,
    sentMutations: 0,
    receivedEvents: 0,
    lastBatchSize: 0,
    receiverAttached: false,
    lastError: null,
  }

  const removeSubscription = () => {
    subscription?.remove()
    subscription = null
  }

  const dispatchIncomingEvent = (payload: unknown) => {
    const event = parseNativeEventPayload(payload)
    if (!event) return

    stats.receivedEvents += 1
    receiver?.(event)
  }

  const ensureSubscription = () => {
    if (subscription || !nativeModule) return

    try {
      const emitter = new NativeEventEmitter(nativeModule as never)
      subscription = emitter.addListener(eventName, dispatchIncomingEvent)
    } catch {
      subscription = DeviceEventEmitter.addListener(eventName, dispatchIncomingEvent)
    }
  }

  return {
    async sendMutations(batch) {
      stats.sentBatches += 1
      stats.sentMutations += batch.length
      stats.lastBatchSize = batch.length

      recentBatches.unshift(batch)
      if (recentBatches.length > maxBatches) {
        recentBatches.length = maxBatches
      }

      if (!nativeModule) {
        return {
          ok: true,
          processed: batch.length,
          meta: { mode: 'sandbox-fallback' },
        }
      }

      const ack = await sendBatchToNative(nativeModule, batch)
      stats.lastError = ack.ok ? null : ack.error ?? 'native bridge returned non-ok ack'
      return ack
    },
    setEventReceiver(nextReceiver) {
      receiver = nextReceiver
      stats.receiverAttached = Boolean(nextReceiver)

      if (!nextReceiver) {
        removeSubscription()
        return
      }

      ensureSubscription()
    },
    emitEvent(event) {
      stats.receivedEvents += 1
      receiver?.(event)
    },
    getStats() {
      return { ...stats }
    },
    getRecentBatches() {
      return recentBatches.slice()
    },
    getDiagnostics() {
      const availableMethods = nativeModule
        ? ['applyMutations', 'applyMutationBatch', 'sendMutations'].filter(
            key => typeof (nativeModule as Record<string, unknown>)[key] === 'function',
          )
        : []

      return {
        moduleName,
        eventName,
        moduleDetected: Boolean(nativeModule),
        availableMethods,
      }
    },
  }
}