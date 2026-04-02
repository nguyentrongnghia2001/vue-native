export interface RuntimeErrorReport {
  id: number
  timestampMs: number
  source: string
  code: string
  message: string
  fatal: boolean
  stack?: string
  context?: Record<string, unknown>
}

export interface RuntimeErrorReportInput {
  source: string
  code: string
  error?: unknown
  message?: string
  fatal?: boolean
  context?: Record<string, unknown>
  timestampMs?: number
}

export interface RuntimeErrorReporterOptions {
  maxReports?: number
  now?: () => number
  onReport?: (report: RuntimeErrorReport) => void
}

export interface RuntimeErrorReporter {
  report: (input: RuntimeErrorReportInput) => RuntimeErrorReport
  getReports: () => RuntimeErrorReport[]
  clear: () => void
  subscribe: (listener: (report: RuntimeErrorReport) => void) => () => void
}

export interface GlobalErrorHandlerInstallOptions {
  globalTarget?: GlobalErrorTarget
  sourcePrefix?: string
}

type GlobalErrorHandler = (error: unknown, isFatal?: boolean) => void

type EventListener = (event: unknown) => void

type ProcessEventListener = (...args: unknown[]) => void

interface ErrorUtilsLike {
  getGlobalHandler?: () => GlobalErrorHandler | undefined
  setGlobalHandler?: (handler: GlobalErrorHandler) => void
}

interface ProcessLike {
  on?: (eventName: string, listener: ProcessEventListener) => void
  off?: (eventName: string, listener: ProcessEventListener) => void
  removeListener?: (eventName: string, listener: ProcessEventListener) => void
}

export interface GlobalErrorTarget {
  ErrorUtils?: ErrorUtilsLike
  process?: ProcessLike
  addEventListener?: (eventName: string, listener: EventListener) => void
  removeEventListener?: (eventName: string, listener: EventListener) => void
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (error === undefined) {
    return 'unknown error'
  }

  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error && typeof error.stack === 'string') {
    return error.stack
  }

  return undefined
}

function defaultNow(): number {
  const globalPerformance = (globalThis as { performance?: { now?: () => number } }).performance
  if (globalPerformance && typeof globalPerformance.now === 'function') {
    return globalPerformance.now()
  }

  return Date.now()
}

export function createRuntimeErrorReporter(
  options: RuntimeErrorReporterOptions = {},
): RuntimeErrorReporter {
  const maxReports = options.maxReports ?? 50
  const now = options.now ?? defaultNow

  const reports: RuntimeErrorReport[] = []
  const listeners = new Set<(report: RuntimeErrorReport) => void>()
  let nextId = 1

  const report: RuntimeErrorReporter['report'] = (input) => {
    const errorMessage = input.message ?? getErrorMessage(input.error)
    const timestampMs = input.timestampMs ?? now()
    const stack = getErrorStack(input.error)

    const normalized: RuntimeErrorReport = {
      id: nextId++,
      timestampMs,
      source: input.source,
      code: input.code,
      message: errorMessage,
      fatal: Boolean(input.fatal),
      ...(stack ? { stack } : {}),
      ...(input.context !== undefined ? { context: input.context } : {}),
    }

    reports.unshift(normalized)
    if (reports.length > maxReports) {
      reports.length = maxReports
    }

    for (const listener of listeners) {
      listener(normalized)
    }

    options.onReport?.(normalized)
    return normalized
  }

  return {
    report,
    getReports() {
      return reports.slice()
    },
    clear() {
      reports.length = 0
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export function installGlobalErrorHandlers(
  reporter: RuntimeErrorReporter,
  options: GlobalErrorHandlerInstallOptions = {},
): () => void {
  const globalTarget = options.globalTarget ?? (globalThis as unknown as GlobalErrorTarget)
  const sourcePrefix = options.sourcePrefix ?? 'global'
  const cleanups: Array<() => void> = []

  const errorUtils = globalTarget.ErrorUtils
  if (errorUtils && typeof errorUtils.setGlobalHandler === 'function') {
    const previousHandler = typeof errorUtils.getGlobalHandler === 'function'
      ? errorUtils.getGlobalHandler()
      : undefined

    const nextHandler: GlobalErrorHandler = (error, isFatal) => {
      reporter.report({
        source: `${sourcePrefix}/errorutils`,
        code: isFatal ? 'uncaught-fatal' : 'uncaught-error',
        error,
        fatal: Boolean(isFatal),
      })

      if (typeof previousHandler === 'function') {
        previousHandler(error, isFatal)
      }
    }

    errorUtils.setGlobalHandler(nextHandler)
    cleanups.push(() => {
      if (typeof previousHandler === 'function') {
        errorUtils.setGlobalHandler?.(previousHandler)
      }
    })
  }

  if (
    typeof globalTarget.addEventListener === 'function'
    && typeof globalTarget.removeEventListener === 'function'
  ) {
    const onWindowError: EventListener = (event) => {
      const payload = event as { error?: unknown; message?: unknown }
      reporter.report({
        source: `${sourcePrefix}/window`,
        code: 'window-error',
        error: payload?.error ?? payload?.message ?? event,
      })
    }

    const onUnhandledRejection: EventListener = (event) => {
      const payload = event as { reason?: unknown }
      reporter.report({
        source: `${sourcePrefix}/window`,
        code: 'window-unhandled-rejection',
        error: payload?.reason ?? event,
      })
    }

    globalTarget.addEventListener('error', onWindowError)
    globalTarget.addEventListener('unhandledrejection', onUnhandledRejection)
    cleanups.push(() => {
      globalTarget.removeEventListener?.('error', onWindowError)
      globalTarget.removeEventListener?.('unhandledrejection', onUnhandledRejection)
    })
  }

  const processTarget = globalTarget.process
  if (processTarget && typeof processTarget.on === 'function') {
    const onUncaughtException: ProcessEventListener = (error) => {
      reporter.report({
        source: `${sourcePrefix}/process`,
        code: 'uncaught-exception',
        error,
        fatal: true,
      })
    }

    const onUnhandledRejection: ProcessEventListener = (reason) => {
      reporter.report({
        source: `${sourcePrefix}/process`,
        code: 'unhandled-rejection',
        error: reason,
      })
    }

    processTarget.on('uncaughtException', onUncaughtException)
    processTarget.on('unhandledRejection', onUnhandledRejection)

    cleanups.push(() => {
      if (typeof processTarget.off === 'function') {
        processTarget.off('uncaughtException', onUncaughtException)
        processTarget.off('unhandledRejection', onUnhandledRejection)
        return
      }

      if (typeof processTarget.removeListener === 'function') {
        processTarget.removeListener('uncaughtException', onUncaughtException)
        processTarget.removeListener('unhandledRejection', onUnhandledRejection)
      }
    })
  }

  return () => {
    for (let i = cleanups.length - 1; i >= 0; i -= 1) {
      const cleanup = cleanups[i]
      if (cleanup) {
        cleanup()
      }
    }
  }
}
