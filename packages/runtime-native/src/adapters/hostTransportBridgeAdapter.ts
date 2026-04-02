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
  startedAtMs: number | null
  lastAckAtMs: number | null
  lastErrorAtMs: number | null
  totalAckLatencyMs: number
  lastAckLatencyMs: number | null
  minAckLatencyMs: number | null
  maxAckLatencyMs: number
  averageAckLatencyMs: number
  throughputBatchesPerSecond: number
  throughputMutationsPerSecond: number
  errorRate: number
}

export interface HostTransportBridgeAdapterOptions {
  id?: string
  throwOnError?: boolean
  onAck?: (ack: HostTransportAck, batch: HostMutationRecord[]) => void
  onError?: (error: Error, batch: HostMutationRecord[]) => void
  now?: () => number
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
    startedAtMs: null,
    lastAckAtMs: null,
    lastErrorAtMs: null,
    totalAckLatencyMs: 0,
    lastAckLatencyMs: null,
    minAckLatencyMs: null,
    maxAckLatencyMs: 0,
    averageAckLatencyMs: 0,
    throughputBatchesPerSecond: 0,
    throughputMutationsPerSecond: 0,
    errorRate: 0,
  }
}

function toError(value: unknown): Error {
  if (value instanceof Error) return value
  return new Error(String(value))
}

function defaultNow(): number {
  const globalPerformance = (globalThis as { performance?: { now?: () => number } }).performance

  if (globalPerformance && typeof globalPerformance.now === 'function') {
    return globalPerformance.now()
  }

  return Date.now()
}

function updateDerivedMetrics(stats: HostTransportAdapterStats, nowMs: number) {
  if (stats.startedAtMs === null) {
    stats.throughputBatchesPerSecond = 0
    stats.throughputMutationsPerSecond = 0
    stats.errorRate = 0
    return
  }

  const elapsedMs = Math.max(0, nowMs - stats.startedAtMs)
  const elapsedSeconds = elapsedMs / 1000

  if (elapsedSeconds > 0) {
    stats.throughputBatchesPerSecond = stats.sentBatches / elapsedSeconds
    stats.throughputMutationsPerSecond = stats.sentMutations / elapsedSeconds
  } else {
    stats.throughputBatchesPerSecond = 0
    stats.throughputMutationsPerSecond = 0
  }

  stats.errorRate = stats.sentBatches > 0 ? stats.errorCount / stats.sentBatches : 0
}

function recordAckLatency(
  stats: HostTransportAdapterStats,
  batchSentAtMs: number,
  ackAtMs: number,
) {
  const latencyMs = Math.max(0, ackAtMs - batchSentAtMs)
  stats.lastAckLatencyMs = latencyMs
  stats.lastAckAtMs = ackAtMs
  stats.totalAckLatencyMs += latencyMs
  stats.maxAckLatencyMs = Math.max(stats.maxAckLatencyMs, latencyMs)
  stats.minAckLatencyMs = stats.minAckLatencyMs === null
    ? latencyMs
    : Math.min(stats.minAckLatencyMs, latencyMs)
  stats.averageAckLatencyMs = stats.ackCount > 0
    ? stats.totalAckLatencyMs / stats.ackCount
    : 0
}

export function createHostTransportBridgeAdapter(
  transport: HostMutationTransport,
  options: HostTransportBridgeAdapterOptions = {},
): HostTransportBridgeAdapterController {
  let runtime: HostBridgeAdapterRuntime | null = null
  let stats = createInitialStats()
  const now = options.now ?? defaultNow

  const adapter: HostBridgeAdapter = {
    id: options.id ?? 'host-transport-adapter',
    async applyMutations(batch) {
      const batchSentAtMs = now()
      if (stats.startedAtMs === null) {
        stats.startedAtMs = batchSentAtMs
      }

      stats.sentBatches += 1
      stats.sentMutations += batch.length
      updateDerivedMetrics(stats, batchSentAtMs)

      try {
        const ack = await transport.sendMutations(batch)
        const normalizedAck: HostTransportAck =
          ack && typeof ack === 'object' ? ack : { ok: true, processed: batch.length }

        const ackAtMs = now()

        stats.ackCount += 1
        stats.lastAck = normalizedAck
        recordAckLatency(stats, batchSentAtMs, ackAtMs)

        if (!normalizedAck.ok) {
          stats.errorCount += 1
          stats.lastError = normalizedAck.error ?? 'host transport returned non-ok ack'
          stats.lastErrorAtMs = ackAtMs
          options.onError?.(new Error(stats.lastError), batch)

          if (options.throwOnError) {
            throw new Error(stats.lastError)
          }

          updateDerivedMetrics(stats, ackAtMs)
          return
        }

        options.onAck?.(normalizedAck, batch)
        updateDerivedMetrics(stats, ackAtMs)
      } catch (err) {
        const error = toError(err)
        const errorAtMs = now()
        stats.errorCount += 1
        stats.lastError = error.message
        stats.lastErrorAtMs = errorAtMs
        options.onError?.(error, batch)
        updateDerivedMetrics(stats, errorAtMs)

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
