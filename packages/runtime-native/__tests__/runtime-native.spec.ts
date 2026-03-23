import { describe, expect, it, beforeEach } from 'vitest'
import {
  createNativeApp,
  createNativeRoot,
  dumpDebugOps,
  reactive,
  resetDebugOps,
  snapshotNativeTree,
} from '../src'

describe('@vue-native/runtime-native', () => {
  beforeEach(() => {
    resetDebugOps()
  })

  it('creates and snapshots a native tree', () => {
    const root = createNativeRoot()
    const state = reactive({ count: 1 })

    const App = {
      setup() {
        return { state }
      },
      template: `
        <View testID="root">
          <Text>Count: {{ state.count }}</Text>
        </View>
      `,
    }

    createNativeApp(App).mount(root)

    expect(snapshotNativeTree(root)).toMatchObject({
      type: 'root',
      tag: 'root',
      children: [
        {
          type: 'element',
          tag: 'View',
          props: { testID: 'root' },
          children: [
            {
              type: 'element',
              tag: 'Text',
              children: [{ type: 'text', text: 'Count: 1' }],
            },
          ],
        },
      ],
    })

    expect(dumpDebugOps()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'create' }),
        expect.objectContaining({ type: 'insert' }),
      ]),
    )
  })

  it('patches native props and listeners', () => {
    const root = createNativeRoot()
    const App = {
      setup() {
        return { noop: () => {} }
      },
      template: `
        <View testID="pressable" @press="noop" />
      `,
    }

    createNativeApp(App).mount(root)

    const view = root.children[0]
    expect(view).toMatchObject({
      tag: 'View',
      props: { testID: 'pressable' },
      eventListeners: {
        onPress: expect.any(Function),
      },
    })
  })
})