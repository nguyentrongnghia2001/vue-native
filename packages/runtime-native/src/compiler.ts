import { compile, type CompilerOptions } from '@vue/compiler-dom'
import * as VueRuntime from '@vue/runtime-core'
import { registerRuntimeCompiler, warn } from '@vue/runtime-core'

const compileCache = new Map<string, Function>()
const isBrowserRuntime = typeof globalThis !== 'undefined' && 'window' in globalThis

function normalizeCompilerOptions(options: CompilerOptions): CompilerOptions {
  const normalized: CompilerOptions = {
    mode: 'function',
    hoistStatic: true,
    ...options,
  }

  const wantsPrefixIdentifiers = normalized.prefixIdentifiers ?? true

  if (isBrowserRuntime) {
    if (wantsPrefixIdentifiers) {
      warn('[runtime-native] compileNativeTemplate: prefixIdentifiers is not supported in browser compiler build, fallback to false.')
    }

    normalized.prefixIdentifiers = false
    normalized.cacheHandlers = false
    return normalized
  }

  normalized.prefixIdentifiers = wantsPrefixIdentifiers
  normalized.cacheHandlers = normalized.cacheHandlers ?? normalized.prefixIdentifiers === true

  return normalized
}

export function compileNativeTemplate(
  template: string,
  options: CompilerOptions = {},
) {
  const normalizedOptions = normalizeCompilerOptions(options)
  const cacheKey = `${template}::${JSON.stringify(normalizedOptions)}`
  const cached = compileCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const { code } = compile(template, normalizedOptions)

  const render = new Function('Vue', code) as (...args: any[]) => any
  const runtimeRender = render(VueRuntime)

  if (typeof runtimeRender !== 'function') {
    warn('Native template compilation did not return a render function.')
  }

  compileCache.set(cacheKey, runtimeRender)
  return runtimeRender
}

registerRuntimeCompiler(compileNativeTemplate)