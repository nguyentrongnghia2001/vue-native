import { beforeEach, describe, expect, it } from 'vitest'
import {
  createHostRuntimeSession,
  createInMemoryHostTransport,
  getActiveBridgeAdapterId,
  reactive,
  resetBridgeState,
  type HostRuntimePhase,
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
  if (snapshot.type === 'text' && typeof snapshot.text === 'string') {
    if (snapshot.text.startsWith(prefix)) return snapshot.text
  }

  if (!Array.isArray(snapshot.children)) return null
  for (const child of snapshot.children) {
    const found = findTextByPrefix(child, prefix)
    if (found) return found
  }

  return null
}

describe('host runtime session', () => {
  beforeEach(() => {
    resetBridgeState()
  })

  it('mounts app, emits host events and unmounts via unified session', async () => {
    const transport = createInMemoryHostTransport()
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

    const session = createHostRuntimeSession(App, transport, {
      adapterId: 'host-runtime-session-test',
    })

    const beforeSnapshot = session.getSnapshot()
    const pressable = findNodeByTag(beforeSnapshot, 'Pressable')

    expect(findTextByPrefix(beforeSnapshot, 'Count:')).toBe('Count: 0')
    expect(pressable?.id).toBeTypeOf('number')

    session.emitEvent({ nodeId: pressable?.id ?? -1, event: 'onPress' })
    await Promise.resolve()

    const afterSnapshot = session.getSnapshot()
    expect(findTextByPrefix(afterSnapshot, 'Count:')).toBe('Count: 1')

    session.dispose()
    expect(getActiveBridgeAdapterId()).toBeNull()
  })

  it('runs scheduler phases and lifecycle hooks in expected order', () => {
    const transport = createInMemoryHostTransport()
    const schedulerPhases: HostRuntimePhase[] = []
    const lifecycleEvents: string[] = []

    const App = {
      template: `
        <View>
          <Text>Lifecycle probe</Text>
        </View>
      `,
    }

    const session = createHostRuntimeSession(App, transport, {
      adapterId: 'host-runtime-scheduler-test',
      scheduler: {
        run(phase, job) {
          schedulerPhases.push(phase)
          return job()
        },
      },
      lifecycle: {
        onBeforePhase(phase) {
          lifecycleEvents.push(`before:${phase}`)
        },
        onAfterPhase(phase) {
          lifecycleEvents.push(`after:${phase}`)
        },
        onDisposed() {
          lifecycleEvents.push('disposed')
        },
      },
    })

    session.getSnapshot()
    session.emitEvent({ nodeId: -1, event: 'noop' })
    session.dispose()

    expect(schedulerPhases).toEqual(['mount', 'snapshot', 'emit-event', 'unmount'])
    expect(lifecycleEvents).toEqual([
      'before:mount',
      'after:mount',
      'before:snapshot',
      'after:snapshot',
      'before:emit-event',
      'after:emit-event',
      'before:unmount',
      'after:unmount',
      'disposed',
    ])
  })
})
