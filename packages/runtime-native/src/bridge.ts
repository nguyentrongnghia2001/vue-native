export interface NativeMutationRecord {
  type: string
  [key: string]: unknown
}

export interface NativeEventRecord {
  nodeId: number
  event: string
  args?: unknown[]
}

type MutationSink = (batch: NativeMutationRecord[]) => void
type EventDispatcher = (event: NativeEventRecord) => void

const mutationQueue: NativeMutationRecord[] = []

let mutationSink: MutationSink | null = null
let eventDispatcher: EventDispatcher | null = null

export function enqueue(op: NativeMutationRecord): void {
  mutationQueue.push(op)
}

export function flush(): NativeMutationRecord[] {
  if (mutationQueue.length === 0) {
    return []
  }

  const batch = mutationQueue.slice()
  mutationQueue.length = 0

  mutationSink?.(batch)
  return batch
}

export function setMutationSink(sink: MutationSink | null): void {
  mutationSink = sink
}

export function setEventDispatcher(dispatcher: EventDispatcher | null): void {
  eventDispatcher = dispatcher
}

export function dispatchNativeEvent(event: NativeEventRecord): void {
  eventDispatcher?.(event)
}

export function getPendingMutationCount(): number {
  return mutationQueue.length
}

export function resetBridgeState(): void {
  mutationQueue.length = 0
  mutationSink = null
  eventDispatcher = null
}