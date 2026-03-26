import type {
  NativeBridgeAdapter,
  NativeBridgeAdapterRuntime,
  NativeEventRecord,
  NativeMutationRecord,
} from '../bridge'

interface InMemoryNode {
  id: number
  type?: string
  tag?: string
  text?: string
  parentId: number | null
  children: number[]
  props: Record<string, unknown>
  listeners: string[]
}

export interface InMemoryBridgeAdapterController {
  adapter: NativeBridgeAdapter
  clear: () => void
  emitEvent: (event: NativeEventRecord) => void
  getBatches: () => NativeMutationRecord[][]
  getNode: (id: number) => InMemoryNode | undefined
}

function toNumber(value: unknown): number | null {
  return typeof value === 'number' ? value : null
}

function ensureNode(nodes: Map<number, InMemoryNode>, id: number): InMemoryNode {
  const existing = nodes.get(id)
  if (existing) return existing

  const created: InMemoryNode = {
    id,
    parentId: null,
    children: [],
    props: {},
    listeners: [],
  }

  nodes.set(id, created)
  return created
}

function applyMutation(nodes: Map<number, InMemoryNode>, op: NativeMutationRecord): void {
  switch (op.type) {
    case 'createElement': {
      const id = toNumber(op.id)
      if (id == null) return
      const node = ensureNode(nodes, id)
      node.type = typeof op.nodeType === 'string' ? op.nodeType : 'element'
      if (typeof op.tag === 'string') {
        node.tag = op.tag
      }
      return
    }

    case 'createText':
    case 'createComment': {
      const id = toNumber(op.id)
      if (id == null) return
      const node = ensureNode(nodes, id)
      node.type = op.type === 'createText' ? 'text' : 'comment'
      node.text = typeof op.text === 'string' ? op.text : ''
      return
    }

    case 'insert': {
      const childId = toNumber(op.childId)
      const parentId = toNumber(op.parentId)
      const anchorId = toNumber(op.anchorId)
      if (childId == null || parentId == null) return

      const parent = ensureNode(nodes, parentId)
      const child = ensureNode(nodes, childId)

      if (child.parentId != null && child.parentId !== parentId) {
        const prevParent = nodes.get(child.parentId)
        if (prevParent) {
          prevParent.children = prevParent.children.filter(id => id !== childId)
        }
      }

      parent.children = parent.children.filter(id => id !== childId)

      if (anchorId != null) {
        const anchorIndex = parent.children.indexOf(anchorId)
        if (anchorIndex >= 0) {
          parent.children.splice(anchorIndex, 0, childId)
        } else {
          parent.children.push(childId)
        }
      } else {
        parent.children.push(childId)
      }

      child.parentId = parentId
      return
    }

    case 'remove': {
      const childId = toNumber(op.childId)
      const parentId = toNumber(op.parentId)
      if (childId == null || parentId == null) return

      const parent = nodes.get(parentId)
      const child = nodes.get(childId)
      if (parent) {
        parent.children = parent.children.filter(id => id !== childId)
      }
      if (child) {
        child.parentId = null
      }
      return
    }

    case 'setText': {
      const nodeId = toNumber(op.nodeId)
      if (nodeId == null) return
      const node = ensureNode(nodes, nodeId)
      node.text = typeof op.text === 'string' ? op.text : ''
      return
    }

    case 'patchProp:prop': {
      const nodeId = toNumber(op.nodeId)
      const key = typeof op.key === 'string' ? op.key : null
      if (nodeId == null || key == null) return
      const node = ensureNode(nodes, nodeId)
      const action = op.action
      if (action === 'remove') {
        delete node.props[key]
      } else {
        node.props[key] = op.value
      }
      return
    }

    case 'patchProp:event': {
      const nodeId = toNumber(op.nodeId)
      const key = typeof op.key === 'string' ? op.key : null
      if (nodeId == null || key == null) return
      const node = ensureNode(nodes, nodeId)
      const action = op.action
      if (action === 'remove') {
        node.listeners = node.listeners.filter(item => item !== key)
      } else if (!node.listeners.includes(key)) {
        node.listeners.push(key)
      }
      return
    }

    default:
      return
  }
}

export function createInMemoryBridgeAdapter(id = 'in-memory-adapter'): InMemoryBridgeAdapterController {
  const batches: NativeMutationRecord[][] = []
  const nodes = new Map<number, InMemoryNode>()

  let runtime: NativeBridgeAdapterRuntime | null = null

  const adapter: NativeBridgeAdapter = {
    id,
    applyMutations(batch) {
      batches.push(batch)
      for (const op of batch) {
        applyMutation(nodes, op)
      }
    },
    onAttach(nextRuntime) {
      runtime = nextRuntime
    },
    onDetach() {
      runtime = null
    },
  }

  return {
    adapter,
    clear() {
      batches.length = 0
      nodes.clear()
    },
    emitEvent(event) {
      runtime?.dispatchEvent(event)
    },
    getBatches() {
      return batches.slice()
    },
    getNode(nodeId) {
      return nodes.get(nodeId)
    },
  }
}