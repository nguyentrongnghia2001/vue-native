import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createNativeApp,
  createNativeRoot,
  dispatchEventToNativeNode,
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

  it('normalizes class/style/boolean prop mapping', () => {
    const el = {
      id: 2,
      type: 'element',
      tag: 'View',
      children: [],
      props: {},
      parentNode: null,
      eventListeners: null,
    } as any

    patchProp(el, 'class', null, 'card primary')
    expect(el.props.className).toBe('card primary')
    expect(el.props.class).toBeUndefined()

    patchProp(el, 'style', null, [{ width: 10 }, null, false, { opacity: 0.8 }])
    expect(el.props.style).toEqual({ width: 10, opacity: 0.8 })

    patchProp(el, 'editable', null, true)
    expect(el.props.editable).toBe(true)

    patchProp(el, 'editable', true, false)
    expect(el.props.editable).toBeUndefined()

    const switchEl = {
      id: 20,
      type: 'element',
      tag: 'Switch',
      children: [],
      props: {},
      parentNode: null,
      eventListeners: null,
    } as any

    patchProp(switchEl, 'modelValue', null, false)
    expect(switchEl.props.value).toBe(false)

    const refreshEl = {
      id: 21,
      type: 'element',
      tag: 'RefreshControl',
      children: [],
      props: {},
      parentNode: null,
      eventListeners: null,
    } as any

    patchProp(refreshEl, 'refreshing', null, false)
    expect(refreshEl.props.refreshing).toBe(false)

    patchProp(el, 'max-length', null, 120)
    expect(el.props.maxLength).toBe(120)

    patchProp(el, 'placeholder-text-color', null, '#999')
    expect(el.props.placeholderTextColor).toBe('#999')
  })

  it('normalizes kebab-case event keys', () => {
    const el = {
      id: 3,
      type: 'element',
      tag: 'TextInput',
      children: [],
      props: {},
      parentNode: null,
      eventListeners: null,
    } as any

    const onChangeText = () => 'changed'
    patchProp(el, 'on-change-text', null, onChangeText)

    expect(el.eventListeners).toMatchObject({
      onChangeText,
    })

    patchProp(el, 'on-change-text', onChangeText, undefined)
    expect(el.eventListeners).toBeNull()
  })

  it('normalizes TextInput focus/blur/submit event aliases', () => {
    const el = {
      id: 4,
      type: 'element',
      tag: 'TextInput',
      children: [],
      props: {},
      parentNode: null,
      eventListeners: null,
    } as any

    const onFocus = () => 'focus'
    const onBlur = () => 'blur'
    const onSubmit = () => 'submit'

    patchProp(el, 'on-focus', null, onFocus)
    patchProp(el, 'onBlur', null, onBlur)
    patchProp(el, 'on-submit', null, onSubmit)

    expect(el.eventListeners).toMatchObject({
      onFocus,
      onBlur,
      onSubmitEditing: onSubmit,
    })
  })

  it('normalizes interaction aliases for change and tap events', () => {
    const textInputEl = {
      id: 5,
      type: 'element',
      tag: 'TextInput',
      children: [],
      props: {},
      parentNode: null,
      eventListeners: null,
    } as any

    const switchEl = {
      id: 6,
      type: 'element',
      tag: 'Switch',
      children: [],
      props: {},
      parentNode: null,
      eventListeners: null,
    } as any

    const pressableEl = {
      id: 7,
      type: 'element',
      tag: 'Pressable',
      children: [],
      props: {},
      parentNode: null,
      eventListeners: null,
    } as any

    const onTextChange = () => 'text-change'
    const onSwitchChange = () => 'switch-change'
    const onTap = () => 'tap'

    patchProp(textInputEl, 'on-change', null, onTextChange)
    patchProp(switchEl, 'on-change', null, onSwitchChange)
    patchProp(pressableEl, 'on-tap', null, onTap)

    expect(textInputEl.eventListeners).toMatchObject({ onChangeText: onTextChange })
    expect(switchEl.eventListeners).toMatchObject({ onValueChange: onSwitchChange })
    expect(pressableEl.eventListeners).toMatchObject({ onPress: onTap })
  })

  it('normalizes web-friendly interaction lifecycle aliases', () => {
    const textInputEl = {
      id: 8,
      type: 'element',
      tag: 'TextInput',
      children: [],
      props: {},
      parentNode: null,
      eventListeners: null,
    } as any

    const switchEl = {
      id: 9,
      type: 'element',
      tag: 'Switch',
      children: [],
      props: {},
      parentNode: null,
      eventListeners: null,
    } as any

    const pressableEl = {
      id: 10,
      type: 'element',
      tag: 'Pressable',
      children: [],
      props: {},
      parentNode: null,
      eventListeners: null,
    } as any

    const onInput = () => 'input'
    const onSwitchInput = () => 'switch-input'
    const onLongPress = () => 'long-press'
    const onPressIn = () => 'press-in'
    const onPressOut = () => 'press-out'

    patchProp(textInputEl, 'on-input', null, onInput)
    patchProp(switchEl, 'on-input', null, onSwitchInput)
    patchProp(pressableEl, 'on-longpress', null, onLongPress)
    patchProp(pressableEl, 'on-pressin', null, onPressIn)
    patchProp(pressableEl, 'on-pressout', null, onPressOut)

    expect(textInputEl.eventListeners).toMatchObject({ onChangeText: onInput })
    expect(switchEl.eventListeners).toMatchObject({ onValueChange: onSwitchInput })
    expect(pressableEl.eventListeners).toMatchObject({
      onLongPress,
      onPressIn,
      onPressOut,
    })
  })

  it('maps onUpdate:modelValue listeners for TextInput and Switch', () => {
    const textInputEl = {
      id: 30,
      type: 'element',
      tag: 'TextInput',
      children: [],
      props: {},
      parentNode: null,
      eventListeners: null,
    } as any

    const onTextUpdate = () => 'text-updated'
    patchProp(textInputEl, 'onUpdate:modelValue', null, onTextUpdate)
    expect(textInputEl.eventListeners).toMatchObject({
      onChangeText: onTextUpdate,
    })

    const switchEl = {
      id: 31,
      type: 'element',
      tag: 'Switch',
      children: [],
      props: {},
      parentNode: null,
      eventListeners: null,
    } as any

    const onSwitchUpdate = () => 'switch-updated'
    patchProp(switchEl, 'onUpdate:modelValue', null, onSwitchUpdate)
    expect(switchEl.eventListeners).toMatchObject({
      onValueChange: onSwitchUpdate,
    })
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

  it('renders app-level primitives (SafeAreaView, ActivityIndicator, Modal)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const root = createNativeRoot()
    const App = {
      setup() {
        return {
          loading: true,
          modalVisible: true,
        }
      },
      template: `
        <SafeAreaView testID="safe-root">
          <ActivityIndicator :animating="loading" size="large" testID="spinner" />
          <Modal :visible="modalVisible" :transparent="true" testID="confirm-modal">
            <View testID="modal-content">
              <Text>Modal body</Text>
            </View>
          </Modal>
        </SafeAreaView>
      `,
    }

    createNativeApp(App).mount(root)

    expect(snapshotNativeTree(root)).toMatchObject({
      children: [
        {
          tag: 'SafeAreaView',
          props: { testID: 'safe-root' },
          children: [
            {
              tag: 'ActivityIndicator',
              props: {
                animating: true,
                size: 'large',
                testID: 'spinner',
              },
            },
            {
              tag: 'Modal',
              props: {
                visible: true,
                transparent: true,
                testID: 'confirm-modal',
              },
              children: [
                {
                  tag: 'View',
                  props: {
                    testID: 'modal-content',
                  },
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

  it('renders input/form/list primitives batch 2 (Switch, SectionList, RefreshControl)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const root = createNativeRoot()
    const App = {
      setup() {
        return {
          enabled: true,
          sections: [
            { title: 'A', data: [1, 2] },
            { title: 'B', data: [3] },
          ],
          refreshing: true,
        }
      },
      template: `
        <View testID="batch-2-root">
          <Switch testID="flag" :value="enabled" />
          <RefreshControl testID="refresh" :refreshing="refreshing" />
          <SectionList testID="section-list" :sections="sections" />
        </View>
      `,
    }

    createNativeApp(App).mount(root)

    expect(snapshotNativeTree(root)).toMatchObject({
      children: [
        {
          tag: 'View',
          props: { testID: 'batch-2-root' },
          children: [
            {
              tag: 'Switch',
              props: {
                testID: 'flag',
                value: true,
              },
            },
            {
              tag: 'RefreshControl',
              props: {
                testID: 'refresh',
                refreshing: true,
              },
            },
            {
              tag: 'SectionList',
              props: {
                testID: 'section-list',
                sections: [
                  { title: 'A', data: [1, 2] },
                  { title: 'B', data: [3] },
                ],
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

  it('supports v-model roundtrip for TextInput and Switch', () => {
    const root = createNativeRoot()
    const state = reactive({
      text: 'hello',
      enabled: false,
    })

    const App = {
      setup() {
        return { state }
      },
      template: `
        <View>
          <TextInput v-model="state.text" testID="vm-text" />
          <Switch v-model="state.enabled" testID="vm-switch" />
        </View>
      `,
    }

    createNativeApp(App).mount(root)

    const snapshot = snapshotNativeTree(root)
    const vmText = snapshot.children?.[0]?.children?.[0] as any
    const vmSwitch = snapshot.children?.[0]?.children?.[1] as any

    expect(vmText.props.value).toBe('hello')
    expect(vmText.listeners).toContain('onChangeText')

    expect(vmSwitch.props.value).toBe(false)
    expect(vmSwitch.listeners).toContain('onValueChange')

    expect(dispatchEventToNativeNode(vmText.id, 'onChangeText', ['updated'])).toBe(true)
    expect(dispatchEventToNativeNode(vmSwitch.id, 'onValueChange', [true])).toBe(true)

    expect(state.text).toBe('updated')
    expect(state.enabled).toBe(true)
  })

  it('supports TextInput @submit roundtrip via onSubmitEditing alias', () => {
    const root = createNativeRoot()
    const state = reactive({ submitted: 0 })

    const App = {
      setup() {
        const onSubmit = () => {
          state.submitted += 1
        }

        return { onSubmit }
      },
      template: `
        <View>
          <TextInput @submit="onSubmit" testID="submit-input" />
        </View>
      `,
    }

    createNativeApp(App).mount(root)

    const snapshot = snapshotNativeTree(root)
    const input = snapshot.children?.[0]?.children?.[0] as any

    expect(input.listeners).toContain('onSubmitEditing')
    expect(dispatchEventToNativeNode(input.id, 'onSubmitEditing')).toBe(true)
    expect(state.submitted).toBe(1)
  })

  it('supports interaction alias roundtrip for @change and @tap', () => {
    const root = createNativeRoot()
    const state = reactive({ textChanges: 0, switchChanges: 0, taps: 0 })

    const App = {
      setup() {
        const onTextChange = () => {
          state.textChanges += 1
        }
        const onSwitchChange = () => {
          state.switchChanges += 1
        }
        const onTap = () => {
          state.taps += 1
        }

        return { onTextChange, onSwitchChange, onTap }
      },
      template: `
        <View>
          <TextInput @change="onTextChange" testID="alias-input" />
          <Switch @change="onSwitchChange" testID="alias-switch" />
          <Pressable @tap="onTap" testID="alias-pressable">
            <Text>Tap alias</Text>
          </Pressable>
        </View>
      `,
    }

    createNativeApp(App).mount(root)

    const snapshot = snapshotNativeTree(root)
    const children = snapshot.children?.[0]?.children as any[]
    const input = children[0]
    const toggle = children[1]
    const pressable = children[2]

    expect(input.listeners).toContain('onChangeText')
    expect(toggle.listeners).toContain('onValueChange')
    expect(pressable.listeners).toContain('onPress')

    expect(dispatchEventToNativeNode(input.id, 'onChangeText', ['x'])).toBe(true)
    expect(dispatchEventToNativeNode(toggle.id, 'onValueChange', [true])).toBe(true)
    expect(dispatchEventToNativeNode(pressable.id, 'onPress')).toBe(true)

    expect(state.textChanges).toBe(1)
    expect(state.switchChanges).toBe(1)
    expect(state.taps).toBe(1)
  })

  it('supports web-friendly interaction lifecycle alias roundtrip', () => {
    const root = createNativeRoot()
    const state = reactive({ inputs: 0, switchInputs: 0, longPresses: 0, pressIns: 0, pressOuts: 0 })

    const App = {
      setup() {
        return {
          onInput: () => {
            state.inputs += 1
          },
          onSwitchInput: () => {
            state.switchInputs += 1
          },
          onLongPress: () => {
            state.longPresses += 1
          },
          onPressIn: () => {
            state.pressIns += 1
          },
          onPressOut: () => {
            state.pressOuts += 1
          },
        }
      },
      template: `
        <View>
          <TextInput @input="onInput" testID="wf-input" />
          <Switch @input="onSwitchInput" testID="wf-switch" />
          <Pressable
            @longpress="onLongPress"
            @pressin="onPressIn"
            @pressout="onPressOut"
            testID="wf-pressable"
          >
            <Text>Gesture aliases</Text>
          </Pressable>
        </View>
      `,
    }

    createNativeApp(App).mount(root)

    const snapshot = snapshotNativeTree(root)
    const children = snapshot.children?.[0]?.children as any[]
    const input = children[0]
    const toggle = children[1]
    const pressable = children[2]

    expect(input.listeners).toContain('onChangeText')
    expect(toggle.listeners).toContain('onValueChange')
    expect(pressable.listeners).toEqual(expect.arrayContaining(['onLongPress', 'onPressIn', 'onPressOut']))

    expect(dispatchEventToNativeNode(input.id, 'onChangeText', ['hello'])).toBe(true)
    expect(dispatchEventToNativeNode(toggle.id, 'onValueChange', [false])).toBe(true)
    expect(dispatchEventToNativeNode(pressable.id, 'onLongPress')).toBe(true)
    expect(dispatchEventToNativeNode(pressable.id, 'onPressIn')).toBe(true)
    expect(dispatchEventToNativeNode(pressable.id, 'onPressOut')).toBe(true)

    expect(state.inputs).toBe(1)
    expect(state.switchInputs).toBe(1)
    expect(state.longPresses).toBe(1)
    expect(state.pressIns).toBe(1)
    expect(state.pressOuts).toBe(1)
  })
})