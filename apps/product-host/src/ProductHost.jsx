import React, { useEffect, useMemo, useState } from 'react'
import {
  StyleSheet,
  View as RNView,
} from 'react-native'
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

  useEffect(() => {
    const runner = createAppRootHostRunner('auto')
    setSnapshot(runner.getSnapshot())

    const interval = setInterval(() => {
      setSnapshot(runner.getSnapshot())
    }, 250)

    return () => {
      clearInterval(interval)
      runner.dispose()
    }
  }, [])

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
})
