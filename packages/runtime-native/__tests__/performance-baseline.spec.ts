import { describe, expect, it } from 'vitest'
import { createRuntimePerformanceBaseline } from '../src'

describe('runtime performance baseline', () => {
  it('tracks startup and first interaction latency baseline', () => {
    let tick = 100
    const baseline = createRuntimePerformanceBaseline({
      now: () => tick,
      readMemoryBytes: () => null,
    })

    baseline.markStartupStart()
    tick = 250
    baseline.markStartupReady()
    tick = 410
    baseline.markFirstInteraction()
    tick = 620
    baseline.markFirstInteraction()

    const snapshot = baseline.getSnapshot()

    expect(snapshot.marks.startupStartedAtMs).toBe(100)
    expect(snapshot.marks.startupReadyAtMs).toBe(250)
    expect(snapshot.marks.firstInteractionAtMs).toBe(410)
    expect(snapshot.startupTimeMs).toBe(150)
    expect(snapshot.firstInteractionLatencyMs).toBe(310)
  })

  it('tracks memory baseline with sampling and reset', () => {
    const memorySamples = [512, 1024, 700, null]
    let index = 0

    const baseline = createRuntimePerformanceBaseline({
      now: () => 1000 + index * 50,
      readMemoryBytes: () => memorySamples[index++] ?? null,
    })

    expect(baseline.sampleMemoryFromEnvironment()).toBe(512)
    expect(baseline.sampleMemoryFromEnvironment()).toBe(1024)
    expect(baseline.sampleMemoryFromEnvironment()).toBe(700)
    expect(baseline.sampleMemoryFromEnvironment()).toBeNull()

    baseline.recordMemorySample(-1)

    const sampled = baseline.getSnapshot()

    expect(sampled.memory).toMatchObject({
      currentUsedBytes: 700,
      peakUsedBytes: 1024,
      sampleCount: 3,
    })
    expect(sampled.marks.lastMemorySampleAtMs).toBe(1150)

    baseline.reset()

    const resetSnapshot = baseline.getSnapshot()
    expect(resetSnapshot.startupTimeMs).toBeNull()
    expect(resetSnapshot.firstInteractionLatencyMs).toBeNull()
    expect(resetSnapshot.memory).toMatchObject({
      currentUsedBytes: null,
      peakUsedBytes: null,
      sampleCount: 0,
    })
  })
})
