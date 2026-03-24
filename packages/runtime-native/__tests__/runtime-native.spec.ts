import { describe, expect, it, beforeEach } from 'vitest'
import {
  createNativeApp,
  createNativeRoot,
  dumpDebugOps,
  reactive,
  resetDebugOps,
  snapshotNativeTree,
} from '../src'
import { patchProp } from '../src/patchProp'

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

  it('normalizes listener keys and removes listener bucket when empty', () => {
    const el = {
      id: 1,
      type: 'element',
      tag: 'View',
      children: [],
      props: {},
      parentNode: null,
      eventListeners: null,
    } as any
    const onPress = () => 'ok'

    patchProp(el, 'onpress', null, onPress)
    expect(el).toMatchObject({
      eventListeners: {
        onPress,
      },
    })

    patchProp(el, 'onpress', onPress, undefined)
    expect(el.eventListeners).toBeNull()
  })

  it('serializes snapshot props and listener names safely', () => {
    const root = createNativeRoot()
    const App = {
      setup() {
        return {
          payload: {
            text: 'ok',
            count: 2,
            nested: { a: 1, run: () => 'nope' },
          },
          noop: () => {},
        }
      },
      template: `
        <View :data="payload" @press="noop">
          <Text>Hello</Text>
        </View>
      `,
    }

    createNativeApp(App).mount(root)

    const snapshot = snapshotNativeTree(root)
    expect(snapshot).toMatchObject({
      type: 'root',
      children: [
        {
          tag: 'View',
          props: {
            data: {
              text: 'ok',
              count: 2,
              nested: { a: 1 },
            },
          },
          listeners: ['onPress'],
        },
      ],
    })
  })
})