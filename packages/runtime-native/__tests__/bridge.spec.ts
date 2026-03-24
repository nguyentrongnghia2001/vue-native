import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  dispatchNativeEvent,
  enqueue,
  flush,
  getActiveBridgeAdapterId,
  getPendingMutationCount,
  registerBridgeAdapter,
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

  it('batches multiple enqueues into a single microtask flush', async () => {
    const sink = vi.fn()
    setMutationSink(sink)

    enqueue({ type: 'insert', childId: 1, parentId: 0 })
    enqueue({ type: 'setText', nodeId: 2, text: 'batched' })

    expect(sink).not.toHaveBeenCalled()

    await Promise.resolve()

    expect(sink).toHaveBeenCalledTimes(1)
    expect(sink).toHaveBeenCalledWith([
      { type: 'insert', childId: 1, parentId: 0 },
      { type: 'setText', nodeId: 2, text: 'batched' },
    ])
    expect(getPendingMutationCount()).toBe(0)
  })

  it('registers adapter and forwards mutation batches through applyMutations', () => {
    const applyMutations = vi.fn()
    registerBridgeAdapter({
      id: 'test-adapter',
      applyMutations,
    })

    expect(getActiveBridgeAdapterId()).toBe('test-adapter')

    enqueue({ type: 'insert', childId: 11, parentId: 2 })
    const batch = flush()

    expect(batch).toEqual([{ type: 'insert', childId: 11, parentId: 2 }])
    expect(applyMutations).toHaveBeenCalledTimes(1)
    expect(applyMutations).toHaveBeenCalledWith(batch)
  })

  it('wires adapter runtime dispatchEvent to bridge event dispatcher', () => {
    const dispatcher = vi.fn()
    setEventDispatcher(dispatcher)

    let runtimeDispatch: ((event: { nodeId: number; event: string; args?: unknown[] }) => void) | undefined

    registerBridgeAdapter({
      id: 'event-adapter',
      applyMutations: vi.fn(),
      onAttach(runtime) {
        runtimeDispatch = runtime.dispatchEvent
      },
    })

    expect(runtimeDispatch).toBeTypeOf('function')
    if (typeof runtimeDispatch !== 'function') {
      throw new Error('runtimeDispatch should be assigned by adapter onAttach')
    }

    runtimeDispatch({ nodeId: 99, event: 'onPress', args: ['from-adapter'] })

    expect(dispatcher).toHaveBeenCalledTimes(1)
    expect(dispatcher).toHaveBeenCalledWith({
      nodeId: 99,
      event: 'onPress',
      args: ['from-adapter'],
    })
  })

  it('detaches previous adapter when replacing or clearing adapter', () => {
    const detachA = vi.fn()
    const detachB = vi.fn()

    registerBridgeAdapter({
      id: 'adapter-a',
      applyMutations: vi.fn(),
      onDetach: detachA,
    })

    registerBridgeAdapter({
      id: 'adapter-b',
      applyMutations: vi.fn(),
      onDetach: detachB,
    })

    expect(detachA).toHaveBeenCalledTimes(1)
    expect(getActiveBridgeAdapterId()).toBe('adapter-b')

    registerBridgeAdapter(null)

    expect(detachB).toHaveBeenCalledTimes(1)
    expect(getActiveBridgeAdapterId()).toBeNull()
  })
})