export interface NativeDebugOp {
  type: string
  [key: string]: any
}

const debugOps: NativeDebugOp[] = []

export function recordDebugOp(type: string, payload: Record<string, any>) {
  debugOps.push({ type, ...payload })
}

export function dumpDebugOps() {
  return debugOps.slice()
}

export function resetDebugOps() {
  debugOps.length = 0
}