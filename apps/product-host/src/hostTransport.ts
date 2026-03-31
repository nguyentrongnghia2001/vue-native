import {
  createInMemoryHostTransport,
  type HostEventRecord,
  type HostMutationTransport,
} from '@vue-native/runtime-native'

export type ProductHostTransportMode = 'auto' | 'react-native' | 'in-memory'

export interface CreateProductHostTransportOptions {
  mode?: ProductHostTransportMode
  maxBatches?: number
  moduleName?: string
  eventName?: string
}

export interface ProductHostTransport extends HostMutationTransport {
  emitEvent?: (event: HostEventRecord) => void
  getStats?: () => unknown
  getDiagnostics?: () => unknown
}

interface ReactNativeHostTransportModule {
  createReactNativeHostTransport: (options?: {
    moduleName?: string
    eventName?: string
  }) => ProductHostTransport
}

function tryCreateReactNativeTransport(
  options: CreateProductHostTransportOptions,
): ProductHostTransport | null {
  try {
    const mod = require('./reactNativeHostTransport') as ReactNativeHostTransportModule
    const reactNativeOptions: { moduleName?: string; eventName?: string } = {}
    if (options.moduleName !== undefined) reactNativeOptions.moduleName = options.moduleName
    if (options.eventName !== undefined) reactNativeOptions.eventName = options.eventName
    return mod.createReactNativeHostTransport(reactNativeOptions)
  } catch {
    return null
  }
}

export function createProductHostTransport(
  options: CreateProductHostTransportOptions = {},
): ProductHostTransport {
  const mode = options.mode ?? 'auto'

  if (mode === 'in-memory') {
    return createInMemoryHostTransport(options.maxBatches)
  }

  const reactNativeTransport = tryCreateReactNativeTransport(options)

  if (reactNativeTransport) {
    return reactNativeTransport
  }

  if (mode === 'react-native') {
    throw new Error('React Native host transport is unavailable in this runtime')
  }

  return createInMemoryHostTransport(options.maxBatches)
}
