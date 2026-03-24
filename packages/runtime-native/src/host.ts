import { markRaw } from '@vue/reactivity'
import type { RendererOptions } from '@vue/runtime-core'
import { enqueue } from './bridge.js'
import { dumpDebugOps, recordDebugOp, resetDebugOps } from './instrumentation.js'
import type {
  NativeChildNode,
  NativeComment,
  NativeElement,
  NativeNodeSnapshot,
  NativeSnapshotValue,
  NativeRoot,
  NativeText,
} from './types'

let nextId = 0

export { dumpDebugOps, resetDebugOps }

function toSnapshotValue(value: unknown): NativeSnapshotValue {
  if (value == null) return null

  const type = typeof value
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return value as string | number | boolean
  }

  if (Array.isArray(value)) {
    return value.map(item => toSnapshotValue(item))
  }

  if (type === 'object') {
    const output: Record<string, NativeSnapshotValue> = {}
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      if (nestedValue === undefined) continue
      if (typeof nestedValue === 'function') continue
      output[key] = toSnapshotValue(nestedValue)
    }
    return output
  }

  return String(value)
}

function snapshotProps(props: Record<string, any>): Record<string, NativeSnapshotValue> {
  const output: Record<string, NativeSnapshotValue> = {}

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue
    if (typeof value === 'function') continue
    output[key] = toSnapshotValue(value)
  }

  return output
}

export function snapshotNativeTree(node: NativeChildNode): NativeNodeSnapshot {
  if (node.type === 'text' || node.type === 'comment') {
    return {
      id: node.id,
      type: node.type,
      text: node.text,
    }
  }

  return {
    id: node.id,
    type: node.type,
    tag: node.tag,
    props: snapshotProps(node.props),
    listeners: node.eventListeners
      ? Object.keys(node.eventListeners).sort()
      : [],
    children: node.children.map(child => snapshotNativeTree(child)),
  }
}

export function createNativeRoot(): NativeRoot {
  return createElement('root') as NativeRoot
}

function createElement(tag: string): NativeElement {
  const node: NativeElement = {
    id: nextId++,
    type: tag === 'root' ? 'root' : 'element',
    tag,
    children: [],
    props: {},
    parentNode: null,
    eventListeners: null,
  }
  enqueue({
    type: 'createElement',
    id: node.id,
    tag: node.tag,
    nodeType: node.type,
  })
  recordDebugOp('create', { tag, id: node.id })
  markRaw(node)
  return node
}

function createText(text: string): NativeText {
  const node: NativeText = {
    id: nextId++,
    type: 'text',
    text,
    parentNode: null,
  }
  enqueue({
    type: 'createText',
    id: node.id,
    text,
  })
  recordDebugOp('createText', { text, id: node.id })
  markRaw(node)
  return node
}

function createComment(text: string): NativeComment {
  const node: NativeComment = {
    id: nextId++,
    type: 'comment',
    text,
    parentNode: null,
  }
  enqueue({
    type: 'createComment',
    id: node.id,
    text,
  })
  recordDebugOp('createComment', { text, id: node.id })
  markRaw(node)
  return node
}

function insert(child: NativeChildNode, parent: NativeElement, anchor: NativeChildNode | null = null) {
  const index = anchor ? parent.children.indexOf(anchor) : -1
  if (child.parentNode) {
    remove(child)
  }
  if (index === -1) {
    parent.children.push(child)
  } else {
    parent.children.splice(index, 0, child)
  }
  child.parentNode = parent
  enqueue({
    type: 'insert',
    childId: child.id,
    parentId: parent.id,
    anchorId: anchor?.id ?? null,
  })
  recordDebugOp('insert', {
    childId: child.id,
    parentId: parent.id,
    anchorId: anchor?.id ?? null,
  })
}

function remove(child: NativeChildNode) {
  const parent = child.parentNode
  if (!parent) return
  const index = parent.children.indexOf(child)
  if (index > -1) parent.children.splice(index, 1)
  child.parentNode = null
  enqueue({
    type: 'remove',
    childId: child.id,
    parentId: parent.id,
  })
  recordDebugOp('remove', { childId: child.id, parentId: parent.id })
}

function setText(node: NativeText, text: string) {
  node.text = text
  enqueue({
    type: 'setText',
    nodeId: node.id,
    text,
  })
  recordDebugOp('setText', { nodeId: node.id, text })
}

function setElementText(el: NativeElement, text: string) {
  el.children = text ? [createText(text)] : []
  el.children.forEach(child => (child.parentNode = el))
  enqueue({
    type: 'setElementText',
    elId: el.id,
    text,
  })
  recordDebugOp('setElementText', { elId: el.id, text })
}

function parentNode(node: NativeChildNode) {
  return node.parentNode
}

function nextSibling(node: NativeChildNode) {
  const parent = node.parentNode
  if (!parent) return null
  const index = parent.children.indexOf(node)
  return parent.children[index + 1] ?? null
}

function setScopeId(el: NativeElement, id: string) {
  el.props[id] = ''
  enqueue({
    type: 'setScopeId',
    elId: el.id,
    scopeId: id,
  })
}

export const nodeOps: Omit<RendererOptions<NativeChildNode, NativeElement>, 'patchProp'> = {
  insert,
  remove,
  createElement,
  createText,
  createComment,
  setText,
  setElementText,
  parentNode,
  nextSibling,
  setScopeId,
}
