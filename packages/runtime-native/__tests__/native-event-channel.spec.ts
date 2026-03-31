import { describe, expect, it, vi } from 'vitest'
import {
  attachNativeEventChannel,
  isNativeEventEmitterCompatibleModule,
} from '../src'

describe('native event channel', () => {
  it('detects NativeEventEmitter-compatible module shape', () => {
    expect(isNativeEventEmitterCompatibleModule(null)).toBe(false)
    expect(isNativeEventEmitterCompatibleModule({})).toBe(false)
    expect(isNativeEventEmitterCompatibleModule({ addListener: () => {} })).toBe(false)
    expect(
      isNativeEventEmitterCompatibleModule({
        addListener: () => {},
        removeListeners: () => {},
      }),
    ).toBe(true)
  })

  it('uses NativeEventEmitter when module is compatible', () => {
    const listener = vi.fn()
    const nativeRemove = vi.fn()
    const deviceRemove = vi.fn()
    const nativeCalls: Array<{
      eventName: string
      payloadListener: (payload: unknown) => void
    }> = []
    const deviceCalls: Array<{
      eventName: string
      payloadListener: (payload: unknown) => void
    }> = []

    const nativeAddListener = (eventName: string, payloadListener: (payload: unknown) => void) => {
      nativeCalls.push({ eventName, payloadListener })
      return { remove: nativeRemove }
    }

    const deviceAddListener = (eventName: string, payloadListener: (payload: unknown) => void) => {
      deviceCalls.push({ eventName, payloadListener })
      return { remove: deviceRemove }
    }

    class FakeNativeEventEmitter {
      constructor(_nativeModule: unknown) {}

      addListener(eventName: string, payloadListener: (payload: unknown) => void) {
        return nativeAddListener(eventName, payloadListener)
      }
    }

    const result = attachNativeEventChannel({
      moduleRegistry: {
        VueNativeHostBridge: {
          addListener: () => {},
          removeListeners: () => {},
        },
      },
      moduleName: 'VueNativeHostBridge',
      eventName: 'vue-native:bridge-event',
      listener,
      NativeEventEmitter: FakeNativeEventEmitter,
      DeviceEventEmitter: {
        addListener: deviceAddListener,
      },
    })

    expect(result.channel).toBe('native-event-emitter')
    expect(nativeCalls).toHaveLength(1)
    expect(nativeCalls[0]?.eventName).toBe('vue-native:bridge-event')
    expect(nativeCalls[0]?.payloadListener).toBe(listener)
    expect(deviceCalls).toHaveLength(0)

    result.subscription.remove()
    expect(nativeRemove).toHaveBeenCalledTimes(1)
    expect(deviceRemove).not.toHaveBeenCalled()
  })

  it('falls back to DeviceEventEmitter when module is incompatible', () => {
    const listener = vi.fn()
    const deviceRemove = vi.fn()
    const deviceCalls: Array<{
      eventName: string
      payloadListener: (payload: unknown) => void
    }> = []

    const deviceAddListener = (eventName: string, payloadListener: (payload: unknown) => void) => {
      deviceCalls.push({ eventName, payloadListener })
      return { remove: deviceRemove }
    }

    class FakeNativeEventEmitter {
      constructor(_nativeModule: unknown) {}

      addListener(_eventName: string, _payloadListener: (payload: unknown) => void) {
        throw new Error('should not be used for incompatible module')
      }
    }

    const result = attachNativeEventChannel({
      moduleRegistry: {
        VueNativeHostBridge: {
          addListener: () => {},
        },
      },
      moduleName: 'VueNativeHostBridge',
      eventName: 'vue-native:bridge-event',
      listener,
      NativeEventEmitter: FakeNativeEventEmitter,
      DeviceEventEmitter: {
        addListener: deviceAddListener,
      },
    })

    expect(result.channel).toBe('device-event-emitter')
    expect(deviceCalls).toHaveLength(1)
    expect(deviceCalls[0]?.eventName).toBe('vue-native:bridge-event')
    expect(deviceCalls[0]?.payloadListener).toBe(listener)

    result.subscription.remove()
    expect(deviceRemove).toHaveBeenCalledTimes(1)
  })

  it('falls back to DeviceEventEmitter when NativeEventEmitter constructor throws', () => {
    const listener = vi.fn()
    const deviceRemove = vi.fn()
    const deviceCalls: Array<{
      eventName: string
      payloadListener: (payload: unknown) => void
    }> = []

    const deviceAddListener = (eventName: string, payloadListener: (payload: unknown) => void) => {
      deviceCalls.push({ eventName, payloadListener })
      return { remove: deviceRemove }
    }

    class ThrowingNativeEventEmitter {
      constructor(_nativeModule: unknown) {
        throw new Error('invalid native emitter module')
      }

      addListener(_eventName: string, _payloadListener: (payload: unknown) => void) {
        throw new Error('unreachable')
      }
    }

    const result = attachNativeEventChannel({
      moduleRegistry: {
        VueNativeHostBridge: {
          addListener: () => {},
          removeListeners: () => {},
        },
      },
      moduleName: 'VueNativeHostBridge',
      eventName: 'vue-native:bridge-event',
      listener,
      NativeEventEmitter: ThrowingNativeEventEmitter,
      DeviceEventEmitter: {
        addListener: deviceAddListener,
      },
    })

    expect(result.channel).toBe('device-event-emitter')
    expect(deviceCalls).toHaveLength(1)
    expect(deviceCalls[0]?.eventName).toBe('vue-native:bridge-event')
    expect(deviceCalls[0]?.payloadListener).toBe(listener)

    result.subscription.remove()
    expect(deviceRemove).toHaveBeenCalledTimes(1)
  })
})
