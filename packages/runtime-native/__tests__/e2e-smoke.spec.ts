import { beforeEach, describe, expect, it } from 'vitest'
import {
  createHostRuntimeSession,
  createInMemoryHostTransport,
  getActiveBridgeAdapterId,
  reactive,
  resetBridgeState,
  type NativeNodeSnapshot,
} from '../src'

function findNodeByTestId(snapshot: NativeNodeSnapshot, testID: string): NativeNodeSnapshot | null {
  if (snapshot.props?.testID === testID) {
    return snapshot
  }

  if (!Array.isArray(snapshot.children)) {
    return null
  }

  for (const child of snapshot.children) {
    const found = findNodeByTestId(child, testID)
    if (found) {
      return found
    }
  }

  return null
}

function findTextByPrefix(snapshot: NativeNodeSnapshot, prefix: string): string | null {
  if (snapshot.type === 'text' && typeof snapshot.text === 'string') {
    if (snapshot.text.startsWith(prefix)) {
      return snapshot.text
    }
  }

  if (!Array.isArray(snapshot.children)) {
    return null
  }

  for (const child of snapshot.children) {
    const found = findTextByPrefix(child, prefix)
    if (found) {
      return found
    }
  }

  return null
}

describe('phase 10 e2e smoke', () => {
  beforeEach(() => {
    resetBridgeState()
  })

  it('covers launch + input + toggle + press event roundtrip via host session', async () => {
    const transport = createInMemoryHostTransport()
    const state = reactive({
      inputValue: '',
      enabled: false,
      pressCount: 0,
      lastAction: 'idle',
    })

    const App = {
      setup() {
        const onChangeText = (value: unknown) => {
          state.inputValue = typeof value === 'string' ? value : String(value ?? '')
        }

        const onValueChange = (value: unknown) => {
          state.enabled = Boolean(value)
        }

        const onPress = () => {
          state.pressCount += 1
          state.lastAction = `${state.inputValue}|${state.enabled ? 'on' : 'off'}|${state.pressCount}`
        }

        return {
          state,
          onChangeText,
          onValueChange,
          onPress,
        }
      },
      template: `
        <View>
          <TextInput testID="input-field" :model-value="state.inputValue" @change-text="onChangeText" />
          <Switch testID="toggle-field" :model-value="state.enabled" @change="onValueChange" />
          <Pressable testID="submit-button" @press="onPress">
            <Text>Submit</Text>
          </Pressable>
          <Text testID="summary">Summary: {{ state.inputValue }} | {{ state.enabled ? 'on' : 'off' }} | {{ state.pressCount }}</Text>
          <Text testID="last-action">Last: {{ state.lastAction }}</Text>
        </View>
      `,
    }

    const session = createHostRuntimeSession(App, transport, {
      adapterId: 'phase-10-e2e-smoke',
    })

    const initialSnapshot = session.getSnapshot()
    const inputNode = findNodeByTestId(initialSnapshot, 'input-field')
    const toggleNode = findNodeByTestId(initialSnapshot, 'toggle-field')
    const submitNode = findNodeByTestId(initialSnapshot, 'submit-button')

    expect(inputNode?.id).toBeTypeOf('number')
    expect(toggleNode?.id).toBeTypeOf('number')
    expect(submitNode?.id).toBeTypeOf('number')
    expect(findTextByPrefix(initialSnapshot, 'Summary:')).toBe('Summary:  | off | 0')

    session.emitEvent({
      nodeId: inputNode?.id ?? -1,
      event: 'onChangeText',
      args: ['phase10'],
    })
    await Promise.resolve()

    session.emitEvent({
      nodeId: toggleNode?.id ?? -1,
      event: 'onValueChange',
      args: [true],
    })
    await Promise.resolve()

    session.emitEvent({
      nodeId: submitNode?.id ?? -1,
      event: 'onPress',
      args: [],
    })
    await Promise.resolve()

    const finalSnapshot = session.getSnapshot()

    expect(findTextByPrefix(finalSnapshot, 'Summary:')).toBe('Summary: phase10 | on | 1')
    expect(findTextByPrefix(finalSnapshot, 'Last:')).toBe('Last: phase10|on|1')

    expect(transport.getStats()).toMatchObject({
      receivedEvents: 3,
      receiverAttached: true,
    })

    session.dispose()

    expect(transport.getStats().receiverAttached).toBe(false)
    expect(getActiveBridgeAdapterId()).toBeNull()
  })
})
