import { describe, expect, it } from 'vitest'
import {
  createRuntimeErrorReporter,
  installGlobalErrorHandlers,
  type GlobalErrorHandlerInstallOptions,
  type GlobalErrorTarget,
} from '../src'

interface FakeGlobalTargetContext {
  target: GlobalErrorTarget
  previousHandlerCalls: Array<{ isFatal: boolean }>
  invokeErrorUtils: (error: unknown, isFatal?: boolean) => void
  emitWindow: (eventName: string, payload: unknown) => void
  emitProcess: (eventName: string, payload: unknown) => void
  getCurrentErrorUtilsHandler: () => ((error: unknown, isFatal?: boolean) => void) | undefined
  previousHandler: (error: unknown, isFatal?: boolean) => void
}

function createFakeGlobalTarget(): FakeGlobalTargetContext {
  const windowListeners = new Map<string, Set<(payload: unknown) => void>>()
  const processListeners = new Map<string, Set<(payload: unknown) => void>>()
  const previousHandlerCalls: Array<{ isFatal: boolean }> = []

  const previousHandler = (_error: unknown, isFatal?: boolean) => {
    previousHandlerCalls.push({ isFatal: Boolean(isFatal) })
  }

  let errorUtilsHandler: ((error: unknown, isFatal?: boolean) => void) | undefined = previousHandler

  const target: GlobalErrorTarget = {
    ErrorUtils: {
      getGlobalHandler() {
        return errorUtilsHandler
      },
      setGlobalHandler(handler) {
        errorUtilsHandler = handler
      },
    },
    addEventListener(eventName, listener) {
      const listeners = windowListeners.get(eventName) ?? new Set()
      listeners.add(listener)
      windowListeners.set(eventName, listeners)
    },
    removeEventListener(eventName, listener) {
      const listeners = windowListeners.get(eventName)
      listeners?.delete(listener)
    },
    process: {
      on(eventName, listener) {
        const listeners = processListeners.get(eventName) ?? new Set()
        listeners.add(listener as (payload: unknown) => void)
        processListeners.set(eventName, listeners)
      },
      off(eventName, listener) {
        const listeners = processListeners.get(eventName)
        listeners?.delete(listener as (payload: unknown) => void)
      },
    },
  }

  return {
    target,
    previousHandlerCalls,
    invokeErrorUtils(error, isFatal) {
      errorUtilsHandler?.(error, isFatal)
    },
    emitWindow(eventName, payload) {
      const listeners = windowListeners.get(eventName)
      if (!listeners) return
      for (const listener of listeners) {
        listener(payload)
      }
    },
    emitProcess(eventName, payload) {
      const listeners = processListeners.get(eventName)
      if (!listeners) return
      for (const listener of listeners) {
        listener(payload)
      }
    },
    getCurrentErrorUtilsHandler() {
      return errorUtilsHandler
    },
    previousHandler,
  }
}

describe('runtime error reporting', () => {
  it('stores bounded reports and notifies subscribers', () => {
    let nowTick = 100
    const observedCodes: string[] = []

    const reporter = createRuntimeErrorReporter({
      maxReports: 2,
      now: () => nowTick++,
    })

    const unsubscribe = reporter.subscribe((report) => {
      observedCodes.push(report.code)
    })

    reporter.report({
      source: 'host-transport',
      code: 'ack-non-ok',
      message: 'first error',
    })

    reporter.report({
      source: 'host-transport',
      code: 'send-throw',
      error: new Error('transport down'),
    })

    unsubscribe()

    reporter.report({
      source: 'runtime-session',
      code: 'snapshot-read-failed',
      error: 'snapshot crashed',
    })

    const reports = reporter.getReports()

    expect(reports).toHaveLength(2)
    expect(reports[0]).toMatchObject({
      code: 'snapshot-read-failed',
      source: 'runtime-session',
      message: 'snapshot crashed',
    })
    expect(reports[1]).toMatchObject({
      code: 'send-throw',
      source: 'host-transport',
      message: 'transport down',
    })
    expect(observedCodes).toEqual(['ack-non-ok', 'send-throw'])
  })

  it('installs global handlers and restores previous state on dispose', () => {
    const fakeGlobal = createFakeGlobalTarget()

    const reporter = createRuntimeErrorReporter({
      now: () => 321,
    })

    const dispose = installGlobalErrorHandlers(reporter, {
      globalTarget: fakeGlobal.target,
      sourcePrefix: 'product-host',
    } as GlobalErrorHandlerInstallOptions)

    fakeGlobal.invokeErrorUtils(new Error('fatal via error utils'), true)
    fakeGlobal.emitWindow('error', { error: new Error('window crash') })
    fakeGlobal.emitWindow('unhandledrejection', { reason: 'promise failed' })
    fakeGlobal.emitProcess('uncaughtException', new Error('process crash'))
    fakeGlobal.emitProcess('unhandledRejection', 'process rejection')

    const reports = reporter.getReports()

    expect(reports).toHaveLength(5)
    expect(reports.map(item => item.code)).toEqual([
      'unhandled-rejection',
      'uncaught-exception',
      'window-unhandled-rejection',
      'window-error',
      'uncaught-fatal',
    ])
    expect(reports[0]?.source).toBe('product-host/process')
    expect(reports[4]).toMatchObject({
      source: 'product-host/errorutils',
      fatal: true,
    })

    expect(fakeGlobal.previousHandlerCalls).toEqual([{ isFatal: true }])

    dispose()

    expect(fakeGlobal.getCurrentErrorUtilsHandler()).toBe(fakeGlobal.previousHandler)
  })
})
