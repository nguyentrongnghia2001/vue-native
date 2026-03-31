import { beforeEach, describe, expect, it } from 'vitest'
import {
  createHostTransportBridgeAdapter,
  createInMemoryHostTransport,
  createNativeApp,
  createNativeRoot,
  dispatchEventToNativeNode,
  reactive,
  registerBridgeAdapter,
  resetBridgeState,
  snapshotNativeTree,
  type NativeNodeSnapshot,
} from '../src'

function findNodeByTag(snapshot: NativeNodeSnapshot, tag: string): NativeNodeSnapshot | null {
  if (snapshot.tag === tag) return snapshot
  if (!Array.isArray(snapshot.children)) return null

  for (const child of snapshot.children) {
    const found = findNodeByTag(child, tag)
    if (found) return found
  }

  return null
}

function findTextByPrefix(snapshot: NativeNodeSnapshot, prefix: string): string | null {
  if (snapshot.type === 'text') {
    const text = snapshot.text
    if (typeof text === 'string' && text.startsWith(prefix)) {
      return text
    }
  }

  if (!Array.isArray(snapshot.children)) return null
  for (const child of snapshot.children) {
    const found = findTextByPrefix(child, prefix)
    if (found) return found
  }

  return null
}

describe('public API critical contracts', () => {
  beforeEach(() => {
    resetBridgeState()
  })

  it('createNativeApp mounts and auto-registers base primitives', () => {
    const root = createNativeRoot()

    const App = {
      template: `
        <View>
          <Text>API contract mounted</Text>
        </View>
      `,
    }

    const app = createNativeApp(App)
    app.mount(root)

    const snapshot = snapshotNativeTree(root)
    expect(findNodeByTag(snapshot, 'View')).toBeTruthy()
    expect(findTextByPrefix(snapshot, 'API contract')).toBe('API contract mounted')
  })

  it('host bridge adapter forwards mutation batches to transport contract', async () => {
    const transport = createInMemoryHostTransport()
    const controller = createHostTransportBridgeAdapter(transport, {
      id: 'public-api-contract-adapter',
    })

    registerBridgeAdapter(controller.adapter)

    const root = createNativeRoot()
    const App = {
      template: `
        <View>
          <Text>Bridge contract</Text>
        </View>
      `,
    }

    createNativeApp(App).mount(root)
    await Promise.resolve()

    const adapterStats = controller.getStats()
    expect(adapterStats.sentBatches).toBeGreaterThan(0)
    expect(adapterStats.sentMutations).toBeGreaterThan(0)
    expect(adapterStats.errorCount).toBe(0)

    const transportStats = transport.getStats()
    expect(transportStats.sentBatches).toBeGreaterThan(0)
    expect(transportStats.sentMutations).toBeGreaterThan(0)

    registerBridgeAdapter(null)
  })

  it('dispatchEventToNativeNode dispatches listener payload via public API', async () => {
    const root = createNativeRoot()
    const state = reactive({ count: 0 })

    const App = {
      setup() {
        const onPress = () => {
          state.count += 1
        }
        return { state, onPress }
      },
      template: `
        <View>
          <Pressable @press="onPress">
            <Text>Count: {{ state.count }}</Text>
          </Pressable>
        </View>
      `,
    }

    createNativeApp(App).mount(root)
    const before = snapshotNativeTree(root)
    const pressable = findNodeByTag(before, 'Pressable')

    expect(findTextByPrefix(before, 'Count:')).toBe('Count: 0')
    expect(typeof pressable?.id).toBe('number')

    const dispatched = dispatchEventToNativeNode(pressable?.id ?? -1, 'onPress', [])
    expect(dispatched).toBe(true)

    await Promise.resolve()

    const after = snapshotNativeTree(root)
    expect(findTextByPrefix(after, 'Count:')).toBe('Count: 1')
  })
})
