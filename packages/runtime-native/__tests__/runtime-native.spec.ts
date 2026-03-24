import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createNativeApp,
  createNativeRoot,
  flush,
  dumpDebugOps,
  getPendingMutationCount,
  reactive,
  resetBridgeState,
  resetDebugOps,
  snapshotNativeTree,
} from '../src'
import { patchProp } from '../src/patchProp'

describe('@vue-native/runtime-native', () => {
  beforeEach(() => {
    resetDebugOps()
    resetBridgeState()
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

  it('emits host and patchProp mutations to bridge queue during mount', () => {
    const root = createNativeRoot()
    const App = {
      setup() {
        return { noop: () => {}, visible: true }
      },
      template: `
        <View testID="root" :accessible="visible" @press="noop">
          <Text>Bridge</Text>
        </View>
      `,
    }

    createNativeApp(App).mount(root)

    expect(getPendingMutationCount()).toBeGreaterThan(0)

    const batch = flush()
    const types = batch.map(op => op.type)

    expect(types).toEqual(expect.arrayContaining([
      'createElement',
      'insert',
      'patchProp:prop',
      'patchProp:event',
    ]))
  })

  it('renders new native primitives (Image, ScrollView, Pressable)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const root = createNativeRoot()
    const App = {
      setup() {
        return {
          src: 'https://example.com/a.png',
          noop: () => {},
        }
      },
      template: `
        <View>
          <ScrollView testID="list">
            <Pressable @press="noop" testID="pressable">
              <Text>Tap</Text>
            </Pressable>
            <Image :source="src" testID="thumb" />
          </ScrollView>
        </View>
      `,
    }

    createNativeApp(App).mount(root)

    expect(snapshotNativeTree(root)).toMatchObject({
      children: [
        {
          tag: 'View',
          children: [
            {
              tag: 'ScrollView',
              props: { testID: 'list' },
              children: [
                {
                  tag: 'Pressable',
                  listeners: ['onPress'],
                  props: { testID: 'pressable' },
                },
                {
                  tag: 'Image',
                  props: { source: 'https://example.com/a.png', testID: 'thumb' },
                },
              ],
            },
          ],
        },
      ],
    })

    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Failed to resolve component'),
    )
    warnSpy.mockRestore()
  })

  it('renders advanced primitives (TextInput, FlatList, KeyboardAvoidingView)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const root = createNativeRoot()
    const App = {
      setup() {
        return {
          data: [1, 2, 3],
        }
      },
      template: `
        <KeyboardAvoidingView behavior="padding" testID="kav-root">
          <TextInput testID="input" placeholder="Type here" :editable="true" />
          <FlatList testID="list" :data="data" />
        </KeyboardAvoidingView>
      `,
    }

    createNativeApp(App).mount(root)

    expect(snapshotNativeTree(root)).toMatchObject({
      children: [
        {
          tag: 'KeyboardAvoidingView',
          props: {
            behavior: 'padding',
            testID: 'kav-root',
          },
          children: [
            {
              tag: 'TextInput',
              props: {
                testID: 'input',
                placeholder: 'Type here',
                editable: true,
              },
            },
            {
              tag: 'FlatList',
              props: {
                testID: 'list',
                data: [1, 2, 3],
              },
            },
          ],
        },
      ],
    })

    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Failed to resolve component'),
    )
    warnSpy.mockRestore()
  })
})