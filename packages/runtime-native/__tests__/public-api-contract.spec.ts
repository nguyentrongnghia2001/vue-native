import { describe, expect, it } from 'vitest'
import {
  COMPAT_PUBLIC_API_KEYS,
  EXPERIMENTAL_PUBLIC_API_KEYS,
  STABLE_PUBLIC_API_KEYS,
} from '../src'
import * as runtime from '../src'

function hasDuplicates(values: readonly string[]) {
  return new Set(values).size !== values.length
}

describe('public API contract', () => {
  it('keeps stable API exports available', () => {
    const runtimeRecord = runtime as Record<string, unknown>

    for (const key of STABLE_PUBLIC_API_KEYS) {
      expect(runtimeRecord[key], `missing stable export: ${key}`).toBeDefined()
    }
  })

  it('keeps compatibility exports available', () => {
    const runtimeRecord = runtime as Record<string, unknown>

    for (const key of COMPAT_PUBLIC_API_KEYS) {
      expect(runtimeRecord[key], `missing compat export: ${key}`).toBeDefined()
    }
  })

  it('maintains a non-overlapping API manifest', () => {
    expect(hasDuplicates(STABLE_PUBLIC_API_KEYS)).toBe(false)
    expect(hasDuplicates(COMPAT_PUBLIC_API_KEYS)).toBe(false)
    expect(hasDuplicates(EXPERIMENTAL_PUBLIC_API_KEYS)).toBe(false)

    const stableSet = new Set(STABLE_PUBLIC_API_KEYS)
    const compatSet = new Set(COMPAT_PUBLIC_API_KEYS)
    const experimentalSet = new Set(EXPERIMENTAL_PUBLIC_API_KEYS)

    for (const key of COMPAT_PUBLIC_API_KEYS) {
      expect(stableSet.has(key)).toBe(false)
    }

    for (const key of EXPERIMENTAL_PUBLIC_API_KEYS) {
      expect(stableSet.has(key)).toBe(false)
      expect(compatSet.has(key)).toBe(false)
      expect(runtime[key as keyof typeof runtime]).toBeDefined()
    }

    for (const key of STABLE_PUBLIC_API_KEYS) {
      expect(experimentalSet.has(key)).toBe(false)
    }
  })
})
