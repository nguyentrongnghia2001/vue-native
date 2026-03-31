import {
  createHostRuntimeSession,
  type Component,
  type HostRuntimeSession,
  type HostRuntimeSessionOptions,
} from '@vue-native/runtime-native'
import type { ProductHostTransport } from './hostTransport'

export type ProductRuntimeSessionOptions = HostRuntimeSessionOptions

export type ProductRuntimeSession = HostRuntimeSession

export function createProductRuntimeSession(
  rootComponent: Component,
  transport: ProductHostTransport,
  options: ProductRuntimeSessionOptions = {},
): ProductRuntimeSession {
  return createHostRuntimeSession(rootComponent, transport, {
    adapterId: options.adapterId ?? 'product-runtime-session',
    ...(options.scheduler !== undefined ? { scheduler: options.scheduler } : {}),
    ...(options.lifecycle !== undefined ? { lifecycle: options.lifecycle } : {}),
  })
}
