import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createNativeTransportBridgeAdapter,
  dispatchNativeEvent,
  enqueue,
  flush,
  registerBridgeAdapter,
  resetBridgeState,
  setEventDispatcher,
} from '../src'

describe('native transport bridge adapter', () => {
  beforeEach(() => {
    resetBridgeState()
  })

  it('forwards mutation batches to transport and tracks ack stats', async () => {
    const sendMutations = vi.fn(async () => ({ ok: true, processed: 2 }))
    const onAck = vi.fn()

    const controller = createNativeTransportBridgeAdapter(
      { sendMutations },
      { id: 'native-runtime', onAck },
    )

    registerBridgeAdapter(controller.adapter)
    enqueue({ type: 'insert', childId: 1, parentId: 0 })
    enqueue({ type: 'setText', nodeId: 1, text: 'hello' })

    const batch = flush()
    await Promise.resolve()

    expect(sendMutations).toHaveBeenCalledTimes(1)
    expect(sendMutations).toHaveBeenCalledWith(batch)
    expect(onAck).toHaveBeenCalledTimes(1)

    expect(controller.getStats()).toMatchObject({
      sentBatches: 1,
      sentMutations: 2,
      ackCount: 1,
      errorCount: 0,
      lastAck: { ok: true, processed: 2 },
    })
  })

  it('tracks errors on non-ok ack and transport throw', async () => {
    const onError = vi.fn()
    const sendMutations = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, error: 'native reject' })
      .mockRejectedValueOnce(new Error('transport down'))

    const controller = createNativeTransportBridgeAdapter(
      { sendMutations },
      { id: 'native-runtime', onError },
    )

    registerBridgeAdapter(controller.adapter)

    enqueue({ type: 'insert', childId: 2, parentId: 0 })
    flush()
    await Promise.resolve()

    enqueue({ type: 'setText', nodeId: 2, text: 'retry' })
    flush()
    await Promise.resolve()

    const stats = controller.getStats()
    expect(stats.errorCount).toBe(2)
    expect(stats.lastError).toBe('transport down')
    expect(onError).toHaveBeenCalledTimes(2)
  })

  it('wires transport event receiver into bridge event dispatcher', () => {
    let receiver: ((event: { nodeId: number; event: string; args?: unknown[] }) => void) | null = null

    const controller = createNativeTransportBridgeAdapter({
      sendMutations: vi.fn(),
      setEventReceiver(nextReceiver) {
        receiver = nextReceiver
      },
    })

    const dispatcher = vi.fn()
    setEventDispatcher(dispatcher)

    registerBridgeAdapter(controller.adapter)

    expect(receiver).toBeTypeOf('function')
    if (!receiver) {
      throw new Error('receiver is expected to be set on attach')
    }

    receiver({ nodeId: 9, event: 'onPress', args: ['payload'] })
    dispatchNativeEvent({ nodeId: 9, event: 'onPress' })

    expect(dispatcher).toHaveBeenCalledTimes(2)

    registerBridgeAdapter(null)
    expect(receiver).toBeNull()
  })
})