import { isOn } from '@vue/shared'
import type { RendererOptions } from '@vue/runtime-core'
import type { NativeElement } from './types'

type NativeRendererOptions = RendererOptions<NativeElement, NativeElement>

export const patchProp: NativeRendererOptions['patchProp'] = (
  el,
  key,
  prevValue,
  nextValue,
) => {
  if (isOn(key)) {
    const listeners = (el.eventListeners ||= Object.create(null))
    if (nextValue == null) {
      delete listeners[key]
    } else {
      listeners[key] = nextValue
    }
    return
  }

  if (nextValue == null || nextValue === false) {
    delete el.props[key]
    return
  }

  el.props[key] = nextValue
  if (prevValue !== nextValue) {
    el.props.__lastPatched__ = { key, prevValue, nextValue }
  }
}
