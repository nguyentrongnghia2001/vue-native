import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createInMemoryBridgeAdapter,
  createNativeApp,
  createNativeRoot,
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
})