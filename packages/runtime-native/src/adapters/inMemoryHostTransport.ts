import type { HostEventRecord, HostMutationRecord } from '../bridge'
import type { HostMutationTransport, HostTransportAck } from './hostTransportBridgeAdapter'

export interface InMemoryHostTransportStats {
  sentBatches: number
  sentMutations: number
  receivedEvents: number
  lastBatchSize: number
  receiverAttached: boolean
}

export interface InMemoryHostTransport extends HostMutationTransport {
  emitEvent: (event: HostEventRecord) => void
  getStats: () => InMemoryHostTransportStats
  getRecentBatches: () => HostMutationRecord[][]
}

export function createInMemoryHostTransport(maxBatches = 10): InMemoryHostTransport {
  let eventReceiver: ((event: HostEventRecord) => void) | null = null
  const recentBatches: HostMutationRecord[][] = []

  const stats: InMemoryHostTransportStats = {
    sentBatches: 0,
    sentMutations: 0,
    receivedEvents: 0,
    lastBatchSize: 0,
    receiverAttached: false,
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

      const ack: HostTransportAck = {
        ok: true,
        processed: batch.length,
        meta: { mode: 'in-memory-host' },
      }

      return ack
    },
    setEventReceiver(receiver) {
      eventReceiver = receiver
      stats.receiverAttached = Boolean(receiver)
    },
    emitEvent(event) {
      stats.receivedEvents += 1
      eventReceiver?.(event)
    },
    getStats() {
      return { ...stats }
    },
    getRecentBatches() {
      return recentBatches.slice()
    },
  }
}
