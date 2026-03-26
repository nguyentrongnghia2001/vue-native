import type {
  NativeBridgeAdapter,
  NativeBridgeAdapterRuntime,
  NativeEventRecord,
  NativeMutationRecord,
} from '../bridge'

export interface NativeTransportAck {
  ok: boolean
  processed?: number
  error?: string
  meta?: Record<string, unknown>
}

export interface NativeMutationTransport {
  sendMutations: (
    batch: NativeMutationRecord[],
  ) => NativeTransportAck | void | Promise<NativeTransportAck | void>
  setEventReceiver?: ((receiver: ((event: NativeEventRecord) => void) | null) => void)
}

export interface NativeTransportAdapterStats {
  sentBatches: number
  sentMutations: number
  ackCount: number
  errorCount: number
  lastAck: NativeTransportAck | null
  lastError: string | null
}

export interface NativeTransportBridgeAdapterOptions {
  id?: string
  throwOnError?: boolean
  onAck?: (ack: NativeTransportAck, batch: NativeMutationRecord[]) => void
  onError?: (error: Error, batch: NativeMutationRecord[]) => void
}

export interface NativeTransportBridgeAdapterController {
  adapter: NativeBridgeAdapter
  getStats: () => NativeTransportAdapterStats
  resetStats: () => void
}

function createInitialStats(): NativeTransportAdapterStats {
  return {
    sentBatches: 0,
    sentMutations: 0,
    ackCount: 0,
    errorCount: 0,
    lastAck: null,
    lastError: null,
  }
}

function toError(value: unknown): Error {
  if (value instanceof Error) return value
  return new Error(String(value))
}

export function createNativeTransportBridgeAdapter(
  transport: NativeMutationTransport,
  options: NativeTransportBridgeAdapterOptions = {},
): NativeTransportBridgeAdapterController {
  let runtime: NativeBridgeAdapterRuntime | null = null
  let stats = createInitialStats()

  const adapter: NativeBridgeAdapter = {
    id: options.id ?? 'native-transport-adapter',
    async applyMutations(batch) {
      stats.sentBatches += 1
      stats.sentMutations += batch.length

      try {
        const ack = await transport.sendMutations(batch)
        const normalizedAck: NativeTransportAck = ack ?? { ok: true, processed: batch.length }

        stats.ackCount += 1
        stats.lastAck = normalizedAck

        if (!normalizedAck.ok) {
          stats.errorCount += 1
          stats.lastError = normalizedAck.error ?? 'native transport returned non-ok ack'
          options.onError?.(new Error(stats.lastError), batch)

          if (options.throwOnError) {
            throw new Error(stats.lastError)
          }

          return
        }

        options.onAck?.(normalizedAck, batch)
      } catch (err) {
        const error = toError(err)
        stats.errorCount += 1
        stats.lastError = error.message
        options.onError?.(error, batch)

        if (options.throwOnError) {
          throw error
        }
      }
    },
    onAttach(nextRuntime) {
      runtime = nextRuntime
      transport.setEventReceiver?.(event => {
        runtime?.dispatchEvent(event)
      })
    },
    onDetach() {
      runtime = null
      transport.setEventReceiver?.(null)
    },
  }

  return {
    adapter,
    getStats() {
      return { ...stats }
    },
    resetStats() {
      stats = createInitialStats()
    },
  }
}