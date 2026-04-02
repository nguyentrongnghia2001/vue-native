export interface RuntimePerformanceMarks {
  startupStartedAtMs: number | null
  startupReadyAtMs: number | null
  firstInteractionAtMs: number | null
  lastMemorySampleAtMs: number | null
}

export interface RuntimePerformanceMemoryStats {
  currentUsedBytes: number | null
  peakUsedBytes: number | null
  sampleCount: number
}

export interface RuntimePerformanceBaselineSnapshot {
  marks: RuntimePerformanceMarks
  startupTimeMs: number | null
  firstInteractionLatencyMs: number | null
  memory: RuntimePerformanceMemoryStats
}

export interface RuntimePerformanceBaselineOptions {
  now?: () => number
  readMemoryBytes?: () => number | null
}

export interface RuntimePerformanceBaseline {
  markStartupStart: (timestampMs?: number) => void
  markStartupReady: (timestampMs?: number) => void
  markFirstInteraction: (timestampMs?: number) => void
  recordMemorySample: (usedBytes: number, timestampMs?: number) => void
  sampleMemoryFromEnvironment: (timestampMs?: number) => number | null
  getSnapshot: () => RuntimePerformanceBaselineSnapshot
  reset: () => void
}

interface PerformanceMemoryLike {
  usedJSHeapSize?: number
}

interface PerformanceLike {
  now?: () => number
  memory?: PerformanceMemoryLike
}

interface ProcessLike {
  memoryUsage?: () => { heapUsed?: number }
}

function defaultNow(): number {
  const globalPerformance = (globalThis as { performance?: PerformanceLike }).performance
  if (globalPerformance && typeof globalPerformance.now === 'function') {
    return globalPerformance.now()
  }

  return Date.now()
}

function toValidMemoryBytes(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return null
  }

  return value
}

function defaultReadMemoryBytes(): number | null {
  const globalPerformance = (globalThis as { performance?: PerformanceLike }).performance
  const performanceMemoryBytes = toValidMemoryBytes(globalPerformance?.memory?.usedJSHeapSize)
  if (performanceMemoryBytes !== null) {
    return performanceMemoryBytes
  }

  const processTarget = (globalThis as { process?: ProcessLike }).process
  const processMemoryBytes = toValidMemoryBytes(processTarget?.memoryUsage?.().heapUsed)
  if (processMemoryBytes !== null) {
    return processMemoryBytes
  }

  return null
}

function createInitialSnapshot(): RuntimePerformanceBaselineSnapshot {
  return {
    marks: {
      startupStartedAtMs: null,
      startupReadyAtMs: null,
      firstInteractionAtMs: null,
      lastMemorySampleAtMs: null,
    },
    startupTimeMs: null,
    firstInteractionLatencyMs: null,
    memory: {
      currentUsedBytes: null,
      peakUsedBytes: null,
      sampleCount: 0,
    },
  }
}

function updateDerivedTimes(snapshot: RuntimePerformanceBaselineSnapshot) {
  const startupStartedAtMs = snapshot.marks.startupStartedAtMs
  const startupReadyAtMs = snapshot.marks.startupReadyAtMs
  const firstInteractionAtMs = snapshot.marks.firstInteractionAtMs

  snapshot.startupTimeMs = startupStartedAtMs !== null && startupReadyAtMs !== null
    ? Math.max(0, startupReadyAtMs - startupStartedAtMs)
    : null

  snapshot.firstInteractionLatencyMs = startupStartedAtMs !== null && firstInteractionAtMs !== null
    ? Math.max(0, firstInteractionAtMs - startupStartedAtMs)
    : null
}

export function createRuntimePerformanceBaseline(
  options: RuntimePerformanceBaselineOptions = {},
): RuntimePerformanceBaseline {
  const now = options.now ?? defaultNow
  const readMemoryBytes = options.readMemoryBytes ?? defaultReadMemoryBytes

  let snapshot = createInitialSnapshot()

  const resolveTimestamp = (timestampMs?: number): number => {
    if (typeof timestampMs === 'number' && Number.isFinite(timestampMs)) {
      return timestampMs
    }

    return now()
  }

  return {
    markStartupStart(timestampMs) {
      if (snapshot.marks.startupStartedAtMs !== null) {
        return
      }

      snapshot.marks.startupStartedAtMs = resolveTimestamp(timestampMs)
      updateDerivedTimes(snapshot)
    },

    markStartupReady(timestampMs) {
      if (snapshot.marks.startupReadyAtMs !== null) {
        return
      }

      const at = resolveTimestamp(timestampMs)

      if (snapshot.marks.startupStartedAtMs === null) {
        snapshot.marks.startupStartedAtMs = at
      }

      snapshot.marks.startupReadyAtMs = at
      updateDerivedTimes(snapshot)
    },

    markFirstInteraction(timestampMs) {
      if (snapshot.marks.firstInteractionAtMs !== null) {
        return
      }

      const at = resolveTimestamp(timestampMs)

      if (snapshot.marks.startupStartedAtMs === null) {
        snapshot.marks.startupStartedAtMs = at
      }

      snapshot.marks.firstInteractionAtMs = at
      updateDerivedTimes(snapshot)
    },

    recordMemorySample(usedBytes, timestampMs) {
      const normalizedBytes = toValidMemoryBytes(usedBytes)
      if (normalizedBytes === null) {
        return
      }

      snapshot.marks.lastMemorySampleAtMs = resolveTimestamp(timestampMs)
      snapshot.memory.currentUsedBytes = normalizedBytes
      snapshot.memory.sampleCount += 1

      snapshot.memory.peakUsedBytes = snapshot.memory.peakUsedBytes === null
        ? normalizedBytes
        : Math.max(snapshot.memory.peakUsedBytes, normalizedBytes)
    },

    sampleMemoryFromEnvironment(timestampMs) {
      const usedBytes = readMemoryBytes()
      if (usedBytes === null) {
        return null
      }

      this.recordMemorySample(usedBytes, timestampMs)
      return usedBytes
    },

    getSnapshot() {
      return {
        marks: { ...snapshot.marks },
        startupTimeMs: snapshot.startupTimeMs,
        firstInteractionLatencyMs: snapshot.firstInteractionLatencyMs,
        memory: { ...snapshot.memory },
      }
    },

    reset() {
      snapshot = createInitialSnapshot()
    },
  }
}
