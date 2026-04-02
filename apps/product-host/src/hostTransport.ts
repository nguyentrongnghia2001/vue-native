import {
  createInMemoryHostTransport,
  type HostEventRecord,
  type HostMutationTransport,
} from '@vue-native/runtime-native'

export type ProductHostTransportMode = 'auto' | 'react-native' | 'in-memory'

export interface ProductHostTransportError {
  source: 'host-transport-factory' | 'react-native-transport'
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface CreateProductHostTransportOptions {
  mode?: ProductHostTransportMode
  maxBatches?: number
  moduleName?: string
  eventName?: string
  onError?: (error: ProductHostTransportError) => void
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
    onError?: (error: {
      code: string
      message: string
      details?: Record<string, unknown>
    }) => void
  }) => ProductHostTransport
}

function tryCreateReactNativeTransport(
  options: CreateProductHostTransportOptions,
): ProductHostTransport | null {
  try {
    const mod = require('./reactNativeHostTransport') as ReactNativeHostTransportModule
    const reactNativeOptions: {
      moduleName?: string
      eventName?: string
      onError?: (error: {
        code: string
        message: string
        details?: Record<string, unknown>
      }) => void
    } = {}

    if (options.moduleName !== undefined) reactNativeOptions.moduleName = options.moduleName
    if (options.eventName !== undefined) reactNativeOptions.eventName = options.eventName
    if (options.onError) {
      reactNativeOptions.onError = (error) => {
        options.onError?.({
          source: 'react-native-transport',
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        })
      }
    }

    return mod.createReactNativeHostTransport(reactNativeOptions)
  } catch (error) {
    options.onError?.({
      source: 'host-transport-factory',
      code: 'react-native-transport-load-failed',
      message: 'Failed to load React Native host transport module',
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    })

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
    const message = 'React Native host transport is unavailable in this runtime'
    options.onError?.({
      source: 'host-transport-factory',
      code: 'react-native-transport-unavailable',
      message,
    })
    throw new Error(message)
  }

  return createInMemoryHostTransport(options.maxBatches)
}
