import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createInMemoryBridgeAdapter,
  createNativeApp,
  createNativeRoot,
  createNativeTransportBridgeAdapter,
  getActiveBridgeAdapterId,
  reactive,
  registerBridgeAdapter,
  resetBridgeState,
  snapshotNativeTree,
} from '../src'

function findNodeByTag(snapshot: any, tag: string): any | null {
  if (!snapshot || typeof snapshot !== 'object') return null
  if (snapshot.tag === tag) return snapshot

  if (!Array.isArray(snapshot.children)) return null
  for (const child of snapshot.children) {
    const found = findNodeByTag(child, tag)
    if (found) return found
  }

  return null
}

describe('bridge adapter integration', () => {
  beforeEach(() => {
    resetBridgeState()
  })

  it('keeps mutation ordering in applied batches from mounted app', async () => {
    const adapter = createInMemoryBridgeAdapter('integration-memory')
    registerBridgeAdapter(adapter.adapter)

    const root = createNativeRoot()
    const App = {
      template: `
        <View testID="root">
          <Text>hello</Text>
        </View>
      `,
    }

    createNativeApp(App).mount(root)
    await Promise.resolve()

    const batches = adapter.getBatches()
    expect(batches.length).toBeGreaterThan(0)

    const flat = batches.flat()
    const createIndex = flat.findIndex(op => op.type === 'createElement')
    const insertIndex = flat.findIndex(op => op.type === 'insert')

    expect(createIndex).toBeGreaterThanOrEqual(0)
    expect(insertIndex).toBeGreaterThan(createIndex)
  })

  it('supports runtime adapter replacement without breaking active adapter state', async () => {
    const detachA = vi.fn()
    const adapterA = {
      id: 'adapter-a',
      applyMutations: vi.fn(),
      onDetach: detachA,
    }
    const adapterB = {
      id: 'adapter-b',
      applyMutations: vi.fn(),
    }

    registerBridgeAdapter(adapterA)
    expect(getActiveBridgeAdapterId()).toBe('adapter-a')

    registerBridgeAdapter(adapterB)
    expect(getActiveBridgeAdapterId()).toBe('adapter-b')

    await Promise.resolve()
    expect(detachA).toHaveBeenCalledTimes(1)
  })

  it('round-trips native event from adapter runtime to Vue handler', async () => {
    const adapter = createInMemoryBridgeAdapter('event-memory')
    registerBridgeAdapter(adapter.adapter)

    const root = createNativeRoot()
    const state = reactive({ count: 0 })

    const App = {
      setup() {
        const inc = () => {
          state.count += 1
        }
        return { inc }
      },
      template: `
        <View>
          <Pressable @press="inc">
            <Text>Tap me</Text>
          </Pressable>
        </View>
      `,
    }

    createNativeApp(App).mount(root)
    await Promise.resolve()

    const tree = snapshotNativeTree(root)
    const pressable = findNodeByTag(tree, 'Pressable')
    expect(pressable).toBeTruthy()
    expect(pressable.listeners).toContain('onPress')

    adapter.emitEvent({ nodeId: pressable.id, event: 'onPress' })

    expect(state.count).toBe(1)
  })

  it('forwards mount mutations through native transport adapter and receives native events', async () => {
    const sentBatches: any[] = []
    let receiver: ((event: { nodeId: number; event: string; args?: unknown[] }) => void) | undefined

    const adapterController = createNativeTransportBridgeAdapter({
      async sendMutations(batch) {
        sentBatches.push(batch)
        return { ok: true, processed: batch.length }
      },
      setEventReceiver(nextReceiver) {
        receiver = nextReceiver ?? undefined
      },
    })

    registerBridgeAdapter(adapterController.adapter)

    const root = createNativeRoot()
    const state = reactive({ count: 0 })

    const App = {
      setup() {
        const inc = () => {
          state.count += 1
        }
        return { inc }
      },
      template: `
        <View>
          <Pressable @press="inc">
            <Text>Tap from native transport</Text>
          </Pressable>
        </View>
      `,
    }

    createNativeApp(App).mount(root)
    await Promise.resolve()

    expect(sentBatches.length).toBeGreaterThan(0)
    const mutationTypes = sentBatches.flat().map((op: any) => op.type)
    expect(mutationTypes).toEqual(expect.arrayContaining(['createElement', 'insert', 'patchProp:event']))

    const snapshot = snapshotNativeTree(root)
    const pressable = findNodeByTag(snapshot, 'Pressable')
    expect(pressable).toBeTruthy()

    if (typeof receiver !== 'function') {
      throw new Error('native transport receiver should be set on adapter attach')
    }

    receiver({ nodeId: pressable.id, event: 'onPress' })
    expect(state.count).toBe(1)
  })
})