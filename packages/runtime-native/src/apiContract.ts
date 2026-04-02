export const STABLE_PUBLIC_API_KEYS = [
  'createNativeApp',
  'createNativeRoot',
  'snapshotNativeTree',
  'dispatchEventToNativeNode',
  'registerBridgeAdapter',
  'setEventDispatcher',
  'resetBridgeState',
  'createHostRuntimeSession',
  'createHostTransportBridgeAdapter',
  'createInMemoryHostTransport',
  'createInMemoryBridgeAdapter',
  'View',
  'Text',
  'Pressable',
  'TextInput',
  'Switch',
  'ScrollView',
  'Image',
] as const

export const COMPAT_PUBLIC_API_KEYS = [
  'createNativeTransportBridgeAdapter',
  'dispatchNativeEvent',
] as const

export const EXPERIMENTAL_PUBLIC_API_KEYS = [
  'attachNativeEventChannel',
  'isNativeEventEmitterCompatibleModule',
  'createRuntimeErrorReporter',
  'installGlobalErrorHandlers',
  'createNativeRenderer',
  'createNativeHydrationRenderer',
  'render',
  'hydrate',
  'createApp',
  'enqueue',
  'flush',
  'setMutationSink',
  'scheduleFlush',
  'dispatchHostEvent',
  'getPendingMutationCount',
  'dumpDebugOps',
  'resetDebugOps',
] as const

export type StablePublicApiKey = (typeof STABLE_PUBLIC_API_KEYS)[number]
export type CompatPublicApiKey = (typeof COMPAT_PUBLIC_API_KEYS)[number]
export type ExperimentalPublicApiKey = (typeof EXPERIMENTAL_PUBLIC_API_KEYS)[number]
