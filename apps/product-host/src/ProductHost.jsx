import React, { useEffect, useMemo, useState } from 'react'
import {
  StyleSheet,
  Text as RNText,
  View as RNView,
} from 'react-native'
import {
  createRuntimeErrorReporter,
  installGlobalErrorHandlers,
} from '@vue-native/runtime-native'
import { createAppRootHostRunner } from './dualHostAppRootRunner'

/**
 * ProductHost — production entry, không phụ thuộc debug panels.
 *
 * Khác với SandboxPreviewHost:
 * - Không có debug overlay, mutation log, hay snapshot inspector
 * - Chỉ render Vue tree qua runtime-native bridge
 * - Transport dùng NativeModules khi có, fallback sang in-memory khi dev web
 */
export default function ProductHost() {
  const [snapshot, setSnapshot] = useState(null)
  const [fatalReport, setFatalReport] = useState(null)

  const errorReporter = useMemo(() => createRuntimeErrorReporter({
    maxReports: 100,
    onReport(report) {
      if (report.fatal) {
        console.error('[product-host][error-pipeline][fatal]', report)
        return
      }
      console.warn('[product-host][error-pipeline]', report)
    },
  }), [])

  useEffect(() => {
    const unsubscribe = errorReporter.subscribe((report) => {
      if (report.fatal) {
        setFatalReport(report)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [errorReporter])

  useEffect(() => {
    const disposeGlobalHandlers = installGlobalErrorHandlers(errorReporter, {
      sourcePrefix: 'product-host/global',
    })

    return () => {
      disposeGlobalHandlers()
    }
  }, [errorReporter])

  useEffect(() => {
    let runner = null
    let interval = null

    try {
      runner = createAppRootHostRunner('auto', {
        transportOptions: {
          onError(transportError) {
            errorReporter.report({
              source: `product-host/${transportError.source}`,
              code: transportError.code,
              message: transportError.message,
              ...(transportError.details ? { context: transportError.details } : {}),
            })
          },
        },
      })

      setSnapshot(runner.getSnapshot())

      interval = setInterval(() => {
        if (!runner) return

        try {
          setSnapshot(runner.getSnapshot())
        } catch (error) {
          errorReporter.report({
            source: 'product-host/runtime-session',
            code: 'snapshot-read-failed',
            error,
          })
        }
      }, 250)
    } catch (error) {
      const report = errorReporter.report({
        source: 'product-host/runtime-session',
        code: 'runner-init-failed',
        error,
        fatal: true,
      })
      setFatalReport(report)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }

      if (runner) {
        try {
          runner.dispose()
        } catch (error) {
          errorReporter.report({
            source: 'product-host/runtime-session',
            code: 'runner-dispose-failed',
            error,
          })
        }
      }
    }
  }, [errorReporter])

  if (fatalReport) {
    return (
      <RNView style={styles.fatalRoot}>
        <RNText style={styles.fatalTitle}>Product Host encountered a fatal runtime error.</RNText>
        <RNText style={styles.fatalMessage}>{fatalReport.message}</RNText>
      </RNView>
    )
  }

  const tree = useMemo(() => {
    if (!snapshot) return null
    return renderSnapshotTree(snapshot)
  }, [snapshot])

  return (
    <RNView style={styles.root}>
      {tree}
    </RNView>
  )
}

/**
 * Render snapshot tree thành React Native elements.
 * Đây là lớp hiển thị tối thiểu cho product — không debug info.
 */
function renderSnapshotTree(node) {
  if (!node || typeof node !== 'object') return null

  if (node.type === 'text') {
    const { Text } = require('@vue-native/runtime-native')
    return React.createElement(Text, {
      key: node.tag,
      style: node.props?.style,
    }, node.text)
  }

  const { View, Pressable, ScrollView, TextInput, Image, Switch } = require('@vue-native/runtime-native')

  const primitiveMap = {
    view: View,
    scrollview: ScrollView,
    pressable: Pressable,
    textinput: TextInput,
    image: Image,
    switch: Switch,
  }

  const Component = primitiveMap[node.type?.toLowerCase()] || View

  const props = {
    key: node.tag,
    ...filterProps(node.props),
  }

  const children = (node.children || []).map(renderSnapshotTree)

  return React.createElement(Component, props, ...children)
}

function filterProps(props) {
  if (!props || typeof props !== 'object') return {}
  const result = {}
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('on') && typeof value === 'function') continue
    if (key === 'children') continue
    result[key] = value
  }
  return result
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  fatalRoot: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  fatalTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  fatalMessage: {
    color: '#fca5a5',
    fontSize: 14,
    textAlign: 'center',
  },
})
