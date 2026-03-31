import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createHostTransportBridgeAdapter,
  dispatchHostEvent,
  enqueue,
  flush,
  registerBridgeAdapter,
  resetBridgeState,
  setEventDispatcher,
} from '../src'

describe('host transport bridge adapter', () => {
  beforeEach(() => {
    resetBridgeState()
  })

  it('forwards mutation batches and tracks ack stats', async () => {
    const sendMutations = vi.fn(async () => ({ ok: true, processed: 2 }))
    const onAck = vi.fn()

    const controller = createHostTransportBridgeAdapter(
      { sendMutations },
      { id: 'host-runtime', onAck },
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

  it('wires transport receiver into host event dispatcher alias', () => {
    type HostEvent = { nodeId: number; event: string; args?: unknown[] }
    let receiver: ((event: HostEvent) => void) | null = null

    const controller = createHostTransportBridgeAdapter({
      sendMutations: vi.fn(),
      setEventReceiver(nextReceiver: ((event: HostEvent) => void) | null) {
        receiver = nextReceiver
      },
    })

    let dispatchCount = 0
    const dispatcher = () => {
      dispatchCount += 1
    }
    setEventDispatcher(dispatcher)

    registerBridgeAdapter(controller.adapter)

    if (typeof receiver !== 'function') {
      throw 'receiver is expected to be set on attach'
    }

    dispatchHostEvent({ nodeId: 9, event: 'onPress' })

    if (dispatchCount !== 1) {
      throw `dispatcher should be called once, got ${dispatchCount}`
    }

    registerBridgeAdapter(null)
    if (receiver !== null) {
      throw 'receiver should be unset on detach'
    }
  })
})
