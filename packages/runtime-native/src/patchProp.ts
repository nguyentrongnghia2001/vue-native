import { isOn } from '@vue/shared'
import type { RendererOptions } from '@vue/runtime-core'
import { enqueue } from './bridge.js'
import type { NativeElement } from './types'

type NativeRendererOptions = RendererOptions<NativeElement, NativeElement>

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

  if (nextValue == null || nextValue === false) {
    delete el.props[key]
    enqueue({
      type: 'patchProp:prop',
      nodeId: el.id,
      key,
      action: 'remove',
    })
    return
  }

  el.props[key] = nextValue
  enqueue({
    type: 'patchProp:prop',
    nodeId: el.id,
    key,
    action: 'set',
    value: nextValue,
  })
}
