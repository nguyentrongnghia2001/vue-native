import { compile, type CompilerOptions } from '@vue/compiler-dom'
import * as VueRuntime from '@vue/runtime-core'
import { registerRuntimeCompiler, warn } from '@vue/runtime-core'

const compileCache = new Map<string, Function>()

export function compileNativeTemplate(
  template: string,
  options: CompilerOptions = {},
) {
  const cacheKey = `${template}::${JSON.stringify(options)}`
  const cached = compileCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const { code } = compile(template, {
    mode: 'function',
    prefixIdentifiers: true,
    hoistStatic: true,
    cacheHandlers: true,
    ...options,
  })

  const render = new Function('Vue', code) as (...args: any[]) => any
  const runtimeRender = render(VueRuntime)

  if (typeof runtimeRender !== 'function') {
    warn('Native template compilation did not return a render function.')
  }

  compileCache.set(cacheKey, runtimeRender)
  return runtimeRender
}

registerRuntimeCompiler(compileNativeTemplate)