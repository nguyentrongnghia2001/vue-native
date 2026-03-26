import { camelize, isOn } from '@vue/shared'
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

function resolveModelUpdateEventKey(tag: string): string {
  if (tag === 'TextInput') {
    return 'onChangeText'
  }

  if (tag === 'Switch') {
    return 'onValueChange'
  }

  return 'onUpdateModelValue'
}

function resolveComponentEventAlias(tag: string, normalizedEventToken: string): string | null {
  if (tag === 'TextInput') {
    if (normalizedEventToken === 'input') {
      return 'onChangeText'
    }

    if (normalizedEventToken === 'change') {
      return 'onChangeText'
    }

    if (normalizedEventToken === 'submit') {
      return 'onSubmitEditing'
    }
  }

  if (tag === 'Switch') {
    if (normalizedEventToken === 'input') {
      return 'onValueChange'
    }

    if (normalizedEventToken === 'change') {
      return 'onValueChange'
    }
  }

  if (tag === 'Pressable') {
    if (normalizedEventToken === 'click') {
      return 'onPress'
    }

    if (normalizedEventToken === 'pointerdown') {
      return 'onPressIn'
    }

    if (normalizedEventToken === 'pointerup') {
      return 'onPressOut'
    }

    if (normalizedEventToken === 'longpress') {
      return 'onLongPress'
    }

    if (normalizedEventToken === 'pressin') {
      return 'onPressIn'
    }

    if (normalizedEventToken === 'pressout') {
      return 'onPressOut'
    }

    if (normalizedEventToken === 'tap') {
      return 'onPress'
    }
  }

  if (tag === 'ScrollView') {
    if (normalizedEventToken === 'scrollstart') {
      return 'onScrollBeginDrag'
    }

    if (normalizedEventToken === 'scrollend') {
      return 'onScrollEndDrag'
    }

    if (normalizedEventToken === 'momentumstart') {
      return 'onMomentumScrollBegin'
    }

    if (normalizedEventToken === 'momentumend') {
      return 'onMomentumScrollEnd'
    }
  }

  return null
}

function normalizeEventKey(key: string, tag: string): string {
  if (!isEventKey(key)) return key

  const rawEventName = key.startsWith('on-') || key.startsWith('on:')
    ? key.slice(3)
    : key.slice(2)

  if (!rawEventName) return key

  const eventName = camelize(rawEventName.replace(/^[-:]+/, '').replace(/:/g, '-'))
  if (!eventName) return key

  const normalizedEventToken = eventName.charAt(0).toLowerCase() + eventName.slice(1)

  if (normalizedEventToken === 'updateModelValue') {
    return resolveModelUpdateEventKey(tag)
  }

  const componentEventAlias = resolveComponentEventAlias(tag, normalizedEventToken)
  if (componentEventAlias) {
    return componentEventAlias
  }

  const normalizedEventName =
    eventName.charAt(0).toUpperCase() + eventName.slice(1)

  return `on${normalizedEventName}`
}

function normalizePropKey(key: string, tag: string): string {
  const normalizedKey = key.includes('-') ? camelize(key) : key

  if (normalizedKey === 'testId') {
    return 'testID'
  }

  if (normalizedKey === 'nativeId') {
    return 'nativeID'
  }

  if (normalizedKey === 'ariaLabel') {
    return 'accessibilityLabel'
  }

  if (normalizedKey === 'ariaRole' || normalizedKey === 'role') {
    return 'accessibilityRole'
  }

  if (normalizedKey === 'modelValue') {
    if (tag === 'TextInput' || tag === 'Switch') {
      return 'value'
    }
  }

  if (normalizedKey === 'class') {
    return 'className'
  }

  return normalizedKey
}

function shouldKeepFalseValue(tag: string, mappedKey: string): boolean {
  return (
    (tag === 'Switch' && mappedKey === 'value') ||
    (tag === 'Modal' && mappedKey === 'visible') ||
    (tag === 'RefreshControl' && mappedKey === 'refreshing')
  )
}

function shouldRemoveProp(tag: string, mappedKey: string, value: unknown): boolean {
  if (value == null) {
    return true
  }

  if (value === false && !shouldKeepFalseValue(tag, mappedKey)) {
    return true
  }

  return false
}

export const patchProp: NativeRendererOptions['patchProp'] = (
  el,
  key,
  prevValue,
  nextValue,
) => {
  if (isEventKey(key)) {
    const listeners = (el.eventListeners ||= Object.create(null))
    const eventKey = normalizeEventKey(key, el.tag)
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

  const mappedKey = normalizePropKey(key, el.tag)
  const mappedValue = mappedKey === 'style'
    ? normalizeStyleValue(nextValue as NativeStyleValue)
    : nextValue

  if (shouldRemoveProp(el.tag, mappedKey, mappedValue)) {
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
