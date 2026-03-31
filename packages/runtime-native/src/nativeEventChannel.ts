export interface EventSubscription {
  remove: () => void
}

export interface NativeEventEmitterCompatibleModule {
  addListener: (eventName: string) => void
  removeListeners: (count: number) => void
}

export interface NativeEventEmitterInstance {
  addListener: (eventName: string, listener: (payload: unknown) => void) => EventSubscription
}

export interface NativeEventEmitterConstructor {
  new (nativeModule: unknown): NativeEventEmitterInstance
}

export interface DeviceEventEmitterLike {
  addListener: (eventName: string, listener: (payload: unknown) => void) => EventSubscription
}

export type NativeEventChannelKind = 'native-event-emitter' | 'device-event-emitter'

export interface AttachNativeEventChannelOptions {
  moduleRegistry: Record<string, unknown>
  moduleName: string
  eventName: string
  listener: (payload: unknown) => void
  NativeEventEmitter: NativeEventEmitterConstructor
  DeviceEventEmitter: DeviceEventEmitterLike
}

export function isNativeEventEmitterCompatibleModule(
  value: unknown,
): value is NativeEventEmitterCompatibleModule {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.addListener === 'function' &&
    typeof candidate.removeListeners === 'function'
  )
}

export function attachNativeEventChannel(
  options: AttachNativeEventChannelOptions,
): { channel: NativeEventChannelKind; subscription: EventSubscription } {
  const nativeModule = options.moduleRegistry[options.moduleName]

  if (isNativeEventEmitterCompatibleModule(nativeModule)) {
    try {
      const emitter = new options.NativeEventEmitter(nativeModule)
      const subscription = emitter.addListener(options.eventName, options.listener)
      return {
        channel: 'native-event-emitter',
        subscription,
      }
    } catch {
      // fall through to DeviceEventEmitter fallback
    }
  }

  const subscription = options.DeviceEventEmitter.addListener(options.eventName, options.listener)
  return {
    channel: 'device-event-emitter',
    subscription,
  }
}
