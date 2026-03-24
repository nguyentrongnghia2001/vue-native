import type { NativeEventRecord, NativeMutationRecord } from '@vue-native/runtime-native'

export interface SandboxTransportStats {
  sentBatches: number
  sentMutations: number
  lastBatchSize: number
}

export interface SandboxNativeTransport {
  sendMutations: (batch: NativeMutationRecord[]) => Promise<{ ok: true; processed: number }>
  setEventReceiver: (receiver: ((event: NativeEventRecord) => void) | null) => void
  emitEvent: (event: NativeEventRecord) => void
  getStats: () => SandboxTransportStats
  getRecentBatches: () => NativeMutationRecord[][]
}

export function createSandboxNativeTransport(maxBatches = 10): SandboxNativeTransport {
  let eventReceiver: ((event: NativeEventRecord) => void) | null = null
  const recentBatches: NativeMutationRecord[][] = []

  const stats: SandboxTransportStats = {
    sentBatches: 0,
    sentMutations: 0,
    lastBatchSize: 0,
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

      return { ok: true, processed: batch.length }
    },
    setEventReceiver(receiver) {
      eventReceiver = receiver
    },
    emitEvent(event) {
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
