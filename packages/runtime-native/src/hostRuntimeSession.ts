import type { Component } from '@vue/runtime-core'
import {
  type HostEventRecord,
  registerBridgeAdapter,
} from './bridge'
import {
  createHostTransportBridgeAdapter,
  type HostTransportAdapterStats,
  type HostMutationTransport,
} from './adapters/hostTransportBridgeAdapter'
import { createNativeApp } from './nativeApp'
import { createNativeRoot, snapshotNativeTree } from './renderer'
import type { NativeNodeSnapshot } from './types'

export type HostRuntimePhase = 'mount' | 'snapshot' | 'emit-event' | 'unmount'

export interface HostRuntimeScheduler {
  run: <T>(phase: HostRuntimePhase, job: () => T) => T
}

export interface HostRuntimeLifecycleHooks {
  onBeforePhase?: (phase: HostRuntimePhase) => void
  onAfterPhase?: (phase: HostRuntimePhase) => void
  onDisposed?: () => void
}

export interface HostRuntimeSessionOptions {
  adapterId?: string
  scheduler?: HostRuntimeScheduler
  lifecycle?: HostRuntimeLifecycleHooks
}

export interface HostRuntimeSession {
  getSnapshot: () => NativeNodeSnapshot
  emitEvent: (event: HostEventRecord) => void
  getAdapterStats: () => HostTransportAdapterStats
  dispose: () => void
}

export interface HostRuntimeTransport extends HostMutationTransport {
  emitEvent?: (event: HostEventRecord) => void
}

const immediateScheduler: HostRuntimeScheduler = {
  run(_phase, job) {
    return job()
  },
}

export function createHostRuntimeSession(
  rootComponent: Component,
  transport: HostRuntimeTransport,
  options: HostRuntimeSessionOptions = {},
): HostRuntimeSession {
  const scheduler = options.scheduler ?? immediateScheduler
  const lifecycle = options.lifecycle

  const runPhase = <T>(phase: HostRuntimePhase, job: () => T): T => {
    lifecycle?.onBeforePhase?.(phase)
    try {
      return scheduler.run(phase, job)
    } finally {
      lifecycle?.onAfterPhase?.(phase)
    }
  }

  const adapterController = createHostTransportBridgeAdapter(transport, {
    id: options.adapterId ?? 'host-runtime-session',
  })
  registerBridgeAdapter(adapterController.adapter)

  const root = createNativeRoot()
  const app = createNativeApp(rootComponent)
  runPhase('mount', () => app.mount(root))

  let disposed = false

  return {
    getSnapshot() {
      return runPhase('snapshot', () => snapshotNativeTree(root))
    },
    emitEvent(event) {
      runPhase('emit-event', () => {
        transport.emitEvent?.(event)
      })
    },
    getAdapterStats() {
      return adapterController.getStats()
    },
    dispose() {
      if (disposed) return
      disposed = true

      runPhase('unmount', () => {
        app.unmount()
        registerBridgeAdapter(null)
        transport.setEventReceiver?.(null)
      })

      lifecycle?.onDisposed?.()
    },
  }
}
