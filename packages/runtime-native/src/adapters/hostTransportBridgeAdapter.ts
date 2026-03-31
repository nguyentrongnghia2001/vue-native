import type {
  HostBridgeAdapter,
  HostBridgeAdapterRuntime,
  HostEventRecord,
  HostMutationRecord,
} from '../bridge'

export interface HostTransportAck {
  ok: boolean
  processed?: number
  error?: string
  meta?: Record<string, unknown>
}

type HostEventReceiver = (event: HostEventRecord) => void
type HostEventReceiverSetter = (receiver: HostEventReceiver | null) => void

export interface HostMutationTransport {
  sendMutations: (
    batch: HostMutationRecord[],
  ) => HostTransportAck | void | Promise<HostTransportAck | void>
  setEventReceiver?: HostEventReceiverSetter
}

export interface HostTransportAdapterStats {
  sentBatches: number
  sentMutations: number
  ackCount: number
  errorCount: number
  lastAck: HostTransportAck | null
  lastError: string | null
}

export interface HostTransportBridgeAdapterOptions {
  id?: string
  throwOnError?: boolean
  onAck?: (ack: HostTransportAck, batch: HostMutationRecord[]) => void
  onError?: (error: Error, batch: HostMutationRecord[]) => void
}

export interface HostTransportBridgeAdapterController {
  adapter: HostBridgeAdapter
  getStats: () => HostTransportAdapterStats
  resetStats: () => void
}

function createInitialStats(): HostTransportAdapterStats {
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

export function createHostTransportBridgeAdapter(
  transport: HostMutationTransport,
  options: HostTransportBridgeAdapterOptions = {},
): HostTransportBridgeAdapterController {
  let runtime: HostBridgeAdapterRuntime | null = null
  let stats = createInitialStats()

  const adapter: HostBridgeAdapter = {
    id: options.id ?? 'host-transport-adapter',
    async applyMutations(batch) {
      stats.sentBatches += 1
      stats.sentMutations += batch.length

      try {
        const ack = await transport.sendMutations(batch)
        const normalizedAck: HostTransportAck =
          ack && typeof ack === 'object' ? ack : { ok: true, processed: batch.length }

        stats.ackCount += 1
        stats.lastAck = normalizedAck

        if (!normalizedAck.ok) {
          stats.errorCount += 1
          stats.lastError = normalizedAck.error ?? 'host transport returned non-ok ack'
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
