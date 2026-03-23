import { markRaw } from '@vue/reactivity'
import type { RendererOptions } from '@vue/runtime-core'
import type {
  NativeChildNode,
  NativeComment,
  NativeElement,
  NativeNodeSnapshot,
  NativeRoot,
  NativeText,
} from './types'

let nextId = 0
const debugOps: Array<{ type: string; [key: string]: any }> = []

function log(type: string, payload: Record<string, any>) {
  debugOps.push({ type, ...payload })
}

export function dumpDebugOps() {
  return debugOps.slice()
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
    props: { ...node.props },
    children: node.children.map(child => snapshotNativeTree(child)),
  }
}

export function resetDebugOps() {
  debugOps.length = 0
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
  log('create', { tag, id: node.id })
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
  log('createText', { text, id: node.id })
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
  log('createComment', { text, id: node.id })
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
  log('insert', { childId: child.id, parentId: parent.id, anchorId: anchor?.id ?? null })
}

function remove(child: NativeChildNode) {
  const parent = child.parentNode
  if (!parent) return
  const index = parent.children.indexOf(child)
  if (index > -1) parent.children.splice(index, 1)
  child.parentNode = null
  log('remove', { childId: child.id, parentId: parent.id })
}

function setText(node: NativeText, text: string) {
  node.text = text
  log('setText', { nodeId: node.id, text })
}

function setElementText(el: NativeElement, text: string) {
  el.children = text ? [createText(text)] : []
  el.children.forEach(child => (child.parentNode = el))
  log('setElementText', { elId: el.id, text })
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
