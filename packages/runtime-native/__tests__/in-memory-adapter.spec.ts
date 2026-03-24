import { beforeEach, describe, expect, it } from 'vitest'
import {
  createInMemoryBridgeAdapter,
  enqueue,
  flush,
  registerBridgeAdapter,
  resetBridgeState,
} from '../src'

describe('in-memory bridge adapter', () => {
  beforeEach(() => {
    resetBridgeState()
  })

  it('applies mapped mutations into adapter state', () => {
    const adapter = createInMemoryBridgeAdapter('memory-target')
    registerBridgeAdapter(adapter.adapter)

    enqueue({ type: 'createElement', id: 1, nodeType: 'element', tag: 'View' })
    enqueue({ type: 'createElement', id: 2, nodeType: 'element', tag: 'Text' })
    enqueue({ type: 'insert', parentId: 1, childId: 2, anchorId: null })
    enqueue({ type: 'patchProp:prop', nodeId: 1, key: 'testID', action: 'set', value: 'root' })
    enqueue({ type: 'patchProp:event', nodeId: 2, key: 'onPress', action: 'set' })
    enqueue({ type: 'setText', nodeId: 2, text: 'hello' })

    flush()

    expect(adapter.getBatches()).toHaveLength(1)

    const viewNode = adapter.getNode(1)
    const textNode = adapter.getNode(2)

    expect(viewNode).toMatchObject({
      id: 1,
      tag: 'View',
      children: [2],
      props: { testID: 'root' },
    })

    expect(textNode).toMatchObject({
      id: 2,
      tag: 'Text',
      parentId: 1,
      text: 'hello',
      listeners: ['onPress'],
    })
  })

  it('removes mapped data when remove/prop-event remove mutations are applied', () => {
    const adapter = createInMemoryBridgeAdapter('memory-target')
    registerBridgeAdapter(adapter.adapter)

    enqueue({ type: 'createElement', id: 1, nodeType: 'element', tag: 'View' })
    enqueue({ type: 'createElement', id: 2, nodeType: 'element', tag: 'Pressable' })
    enqueue({ type: 'insert', parentId: 1, childId: 2, anchorId: null })
    enqueue({ type: 'patchProp:prop', nodeId: 2, key: 'disabled', action: 'set', value: true })
    enqueue({ type: 'patchProp:event', nodeId: 2, key: 'onPress', action: 'set' })
    flush()

    enqueue({ type: 'patchProp:prop', nodeId: 2, key: 'disabled', action: 'remove' })
    enqueue({ type: 'patchProp:event', nodeId: 2, key: 'onPress', action: 'remove' })
    enqueue({ type: 'remove', parentId: 1, childId: 2 })
    flush()

    const parent = adapter.getNode(1)
    const child = adapter.getNode(2)

    expect(parent?.children).toEqual([])
    expect(child?.parentId).toBeNull()
    expect(child?.props).toEqual({})
    expect(child?.listeners).toEqual([])
  })
})