import { extend } from '@vue/shared'
import {
  type CreateAppFunction,
  type HydrationRenderer,
  type Renderer,
  type RootHydrateFunction,
  type RootRenderFunction,
  createHydrationRenderer,
  createRenderer,
} from '@vue/runtime-core'
import {
  nodeOps,
  createNativeRoot,
  dumpDebugOps,
  resetDebugOps,
  snapshotNativeTree,
} from './host'
import './compiler'
import { patchProp } from './patchProp'
import type { NativeElement, NativeNodeSnapshot, NativeRoot } from './types'

const rendererOptions = /* @__PURE__ */ extend({ patchProp }, nodeOps)

let renderer: Renderer<NativeElement> | HydrationRenderer | undefined
let hydrationRenderer: HydrationRenderer | undefined

function ensureRenderer() {
  return (renderer ||= createRenderer(rendererOptions))
}

function ensureHydrationRenderer() {
  return (hydrationRenderer ||= createHydrationRenderer(rendererOptions as any))
}

export const render = ((...args) => {
  ensureRenderer().render(...args)
}) as RootRenderFunction<NativeElement>

export const hydrate = ((...args) => {
  ensureHydrationRenderer().hydrate(...args)
}) as RootHydrateFunction

export const createApp = ((...args) => {
  return ensureRenderer().createApp(...args)
}) as CreateAppFunction<NativeElement>

export function createNativeRenderer(): Renderer<NativeElement> {
  return ensureRenderer()
}

export function createNativeHydrationRenderer(): HydrationRenderer {
  return ensureHydrationRenderer()
}

export {
  createNativeRoot,
  dumpDebugOps,
  resetDebugOps,
  snapshotNativeTree,
}
export type { NativeElement, NativeRoot, NativeNodeSnapshot }