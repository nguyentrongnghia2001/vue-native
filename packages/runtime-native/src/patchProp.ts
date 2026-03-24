import { isOn } from '@vue/shared'
import type { RendererOptions } from '@vue/runtime-core'
import { enqueue } from './bridge.js'
import type { NativeElement } from './types'

type NativeRendererOptions = RendererOptions<NativeElement, NativeElement>

type NativeStyleValue =
  | Record<string, unknown>
  | Array<Record<string, unknown> | null | undefined | false>
  | null
  | undefined

function normalizeStyleValue(value: NativeStyleValue): Record<string, unknown> | undefined {
  if (value == null) {
    return undefined
  }

  if (Array.isArray(value)) {
    const merged: Record<string, unknown> = {}

    for (const item of value) {
      if (!item || typeof item !== 'object') continue
      Object.assign(merged, item)
    }

    return Object.keys(merged).length > 0 ? merged : undefined
  }

  if (typeof value === 'object') {
    return value
  }

  return undefined
}

function isEventKey(key: string): boolean {
  return isOn(key) || /^on[a-z]/.test(key)
}

function normalizeEventKey(key: string): string {
  if (!isEventKey(key)) return key

  const eventName = key.slice(2)
  if (!eventName) return key

  const normalizedEventName =
    eventName.charAt(0).toUpperCase() + eventName.slice(1)

  return `on${normalizedEventName}`
}

export const patchProp: NativeRendererOptions['patchProp'] = (
  el,
  key,
  prevValue,
  nextValue,
) => {
  if (isEventKey(key)) {
    const listeners = (el.eventListeners ||= Object.create(null))
    const eventKey = normalizeEventKey(key)
    const action = nextValue == null ? 'remove' : 'set'

    if (nextValue == null) {
      delete listeners[eventKey]

      if (Object.keys(listeners).length === 0) {
        el.eventListeners = null
      }
    } else {
      listeners[eventKey] = nextValue
    }

    enqueue({
      type: 'patchProp:event',
      nodeId: el.id,
      key: eventKey,
      action,
    })

    return
  }

  const mappedKey = key === 'class' ? 'className' : key
  const mappedValue = mappedKey === 'style'
    ? normalizeStyleValue(nextValue as NativeStyleValue)
    : nextValue

  if (mappedValue == null || mappedValue === false) {
    delete el.props[mappedKey]
    enqueue({
      type: 'patchProp:prop',
      nodeId: el.id,
      key: mappedKey,
      action: 'remove',
    })
    return
  }

  el.props[mappedKey] = mappedValue
  enqueue({
    type: 'patchProp:prop',
    nodeId: el.id,
    key: mappedKey,
    action: 'set',
    value: mappedValue,
  })
}
