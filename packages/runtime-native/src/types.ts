export type NativeNodeType = 'root' | 'element' | 'text' | 'comment'

export interface NativeNode {
  id: number
  type: NativeNodeType
  parentNode: NativeElement | null
}

export interface NativeElement extends NativeNode {
  type: 'root' | 'element'
  tag: string
  children: NativeChildNode[]
  props: Record<string, any>
  eventListeners: Record<string, Function | Function[]> | null
}

export interface NativeText extends NativeNode {
  type: 'text'
  text: string
}

export interface NativeComment extends NativeNode {
  type: 'comment'
  text: string
}

export type NativeChildNode = NativeElement | NativeText | NativeComment
export type NativeRoot = NativeElement & { type: 'root' }

export type NativeSnapshotValue =
  | string
  | number
  | boolean
  | null
  | NativeSnapshotValue[]
  | { [key: string]: NativeSnapshotValue }

export interface NativeNodeSnapshot {
  id: number
  type: NativeNodeType
  tag?: string
  text?: string
  props?: Record<string, NativeSnapshotValue>
  listeners?: string[]
  children?: NativeNodeSnapshot[]
}
