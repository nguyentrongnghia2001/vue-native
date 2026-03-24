import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  dispatchNativeEvent,
  enqueue,
  flush,
  getPendingMutationCount,
  resetBridgeState,
  setEventDispatcher,
  setMutationSink,
} from '../src/bridge'

describe('bridge queue contract', () => {
  beforeEach(() => {
    resetBridgeState()
  })

  it('keeps enqueue order and clears queue on flush', () => {
    enqueue({ type: 'create', id: 1, tag: 'View' })
    enqueue({ type: 'insert', childId: 1, parentId: 0 })

    expect(getPendingMutationCount()).toBe(2)

    const batch = flush()

    expect(batch).toEqual([
      { type: 'create', id: 1, tag: 'View' },
      { type: 'insert', childId: 1, parentId: 0 },
    ])
    expect(getPendingMutationCount()).toBe(0)
  })

  it('forwards flushed batch to mutation sink', () => {
    const sink = vi.fn()
    setMutationSink(sink)

    enqueue({ type: 'setText', nodeId: 2, text: 'hello' })

    const batch = flush()

    expect(batch).toEqual([{ type: 'setText', nodeId: 2, text: 'hello' }])
    expect(sink).toHaveBeenCalledTimes(1)
    expect(sink).toHaveBeenCalledWith(batch)
  })

  it('dispatches native events through configured event dispatcher', () => {
    const dispatcher = vi.fn()
    setEventDispatcher(dispatcher)

    dispatchNativeEvent({ nodeId: 10, event: 'onPress', args: ['payload'] })

    expect(dispatcher).toHaveBeenCalledTimes(1)
    expect(dispatcher).toHaveBeenCalledWith({
      nodeId: 10,
      event: 'onPress',
      args: ['payload'],
    })
  })
})