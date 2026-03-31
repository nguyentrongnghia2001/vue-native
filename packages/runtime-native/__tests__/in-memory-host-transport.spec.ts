import { describe, expect, it, vi } from 'vitest'
import { createInMemoryHostTransport } from '../src'

describe('in memory host transport', () => {
  it('stores sent batches and exposes stats', async () => {
    const transport = createInMemoryHostTransport(2)

    const ack1 = await transport.sendMutations([
      { type: 'insert', childId: 1, parentId: 0 },
      { type: 'setText', nodeId: 1, text: 'hello' },
    ])

    const ack2 = await transport.sendMutations([
      { type: 'remove', childId: 1, parentId: 0 },
    ])

    expect(ack1).toMatchObject({ ok: true, processed: 2 })
    expect(ack2).toMatchObject({ ok: true, processed: 1 })
    expect(transport.getStats()).toMatchObject({
      sentBatches: 2,
      sentMutations: 3,
      lastBatchSize: 1,
      receiverAttached: false,
    })
    expect(transport.getRecentBatches()).toHaveLength(2)
  })

  it('dispatches emitted events to attached receiver', () => {
    const transport = createInMemoryHostTransport()
    const receiver = vi.fn()

    transport.setEventReceiver(receiver)
    transport.emitEvent({ nodeId: 7, event: 'onPress', args: ['payload'] })

    expect(receiver).toHaveBeenCalledTimes(1)
    expect(receiver).toHaveBeenCalledWith({
      nodeId: 7,
      event: 'onPress',
      args: ['payload'],
    })

    transport.setEventReceiver(null)
    expect(transport.getStats().receiverAttached).toBe(false)
  })
})
