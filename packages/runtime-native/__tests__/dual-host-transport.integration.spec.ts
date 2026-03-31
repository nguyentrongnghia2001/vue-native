import { beforeEach, describe, expect, it } from 'vitest'
import {
  createHostTransportBridgeAdapter,
  createInMemoryHostTransport,
  createNativeApp,
  createNativeRoot,
  createNativeTransportBridgeAdapter,
  registerBridgeAdapter,
  resetBridgeState,
  snapshotNativeTree,
  type NativeBridgeAdapter,
  type NativeNodeSnapshot,
} from '../src'

function findText(snapshot: NativeNodeSnapshot): string | null | undefined {
  if (snapshot.type === 'text') {
    const text = snapshot.text
    return typeof text === 'string' ? text : null
  }
  if (!Array.isArray(snapshot.children)) return null

  for (const child of snapshot.children) {
    const text = findText(child)
    if (text) return text
  }

  return null
}

function normalizeSnapshot(snapshot: NativeNodeSnapshot): Record<string, unknown> {
  if (snapshot.type === 'text' || snapshot.type === 'comment') {
    return {
      type: snapshot.type,
      text: snapshot.text ?? '',
    }
  }

  const normalizedProps = snapshot.props
    ? Object.fromEntries(Object.entries(snapshot.props).sort(([left], [right]) => left.localeCompare(right)))
    : undefined

  const normalizedListeners = Array.isArray(snapshot.listeners)
    ? [...snapshot.listeners].sort()
    : undefined

  return {
    type: snapshot.type,
    tag: snapshot.tag,
    props: normalizedProps,
    listeners: normalizedListeners,
    children: Array.isArray(snapshot.children)
      ? snapshot.children.map(child => normalizeSnapshot(child))
      : [],
  }
}

async function mountWithAdapter(adapter: NativeBridgeAdapter): Promise<NativeNodeSnapshot> {
  registerBridgeAdapter(adapter)

  const root = createNativeRoot()
  const App = {
    template: `
      <View>
        <Text>Dual host path</Text>
      </View>
    `,
  }

  createNativeApp(App).mount(root)
  await Promise.resolve()

  const snapshot = snapshotNativeTree(root)
  registerBridgeAdapter(null)
  return snapshot
}

describe('dual host transport integration', () => {
  beforeEach(() => {
    resetBridgeState()
  })

  it('renders the same app via host transport and legacy native transport paths', async () => {
    const hostTransport = createInMemoryHostTransport()
    const hostController = createHostTransportBridgeAdapter(hostTransport, {
      id: 'host-path',
    })

    const hostSnapshot = await mountWithAdapter(hostController.adapter)

    const nativeCompatController = createNativeTransportBridgeAdapter(
      {
        async sendMutations(batch) {
          return {
            ok: true,
            processed: batch.length,
          }
        },
      },
      {
        id: 'native-compat-path',
      },
    )

    const nativeCompatSnapshot = await mountWithAdapter(nativeCompatController.adapter)

    expect(findText(hostSnapshot)).toBe('Dual host path')
    expect(findText(nativeCompatSnapshot)).toBe('Dual host path')
    expect(normalizeSnapshot(hostSnapshot)).toEqual(normalizeSnapshot(nativeCompatSnapshot))
    expect(hostTransport.getStats().sentBatches).toBeGreaterThan(0)
  })
})
