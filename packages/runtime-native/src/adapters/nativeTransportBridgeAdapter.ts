import {
  createHostTransportBridgeAdapter,
  type HostMutationTransport,
  type HostTransportAck,
  type HostTransportAdapterStats,
  type HostTransportBridgeAdapterController,
  type HostTransportBridgeAdapterOptions,
} from './hostTransportBridgeAdapter'

/** @deprecated Use HostTransportAck */
export type NativeTransportAck = HostTransportAck

/** @deprecated Use HostMutationTransport */
export type NativeMutationTransport = HostMutationTransport

/** @deprecated Use HostTransportAdapterStats */
export type NativeTransportAdapterStats = HostTransportAdapterStats

/** @deprecated Use HostTransportBridgeAdapterOptions */
export type NativeTransportBridgeAdapterOptions = HostTransportBridgeAdapterOptions

/** @deprecated Use HostTransportBridgeAdapterController */
export type NativeTransportBridgeAdapterController = HostTransportBridgeAdapterController

/** @deprecated Use createHostTransportBridgeAdapter */
export function createNativeTransportBridgeAdapter(
  transport: NativeMutationTransport,
  options: NativeTransportBridgeAdapterOptions = {},
): NativeTransportBridgeAdapterController {
  return createHostTransportBridgeAdapter(transport, options)
}