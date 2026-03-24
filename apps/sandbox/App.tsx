import React, { useMemo, useState } from 'react'
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View as RNView,
} from 'react-native'
import {
  createNativeApp,
  createNativeTransportBridgeAdapter,
  createNativeRoot,
  dumpDebugOps,
  registerBridgeAdapter,
  snapshotNativeTree,
} from '@vue-native/runtime-native'
import { AppRoot, incrementCount } from './src/AppRoot'
import { createRuntimeNativeTransport } from './src/runtimeNativeTransport'

function findNodeByTag(snapshot: any, tag: string): any | null {
  if (!snapshot || typeof snapshot !== 'object') return null
  if (snapshot.tag === tag) return snapshot

  if (!Array.isArray(snapshot.children)) return null
  for (const child of snapshot.children) {
    const found = findNodeByTag(child, tag)
    if (found) return found
  }

  return null
}

const root = createNativeRoot()
const runtimeTransport = createRuntimeNativeTransport()
const transportAdapter = createNativeTransportBridgeAdapter(runtimeTransport, {
  id: 'runtime-native-transport',
})
registerBridgeAdapter(transportAdapter.adapter)
const app = createNativeApp(AppRoot)
app.mount(root)

export default function SandboxApp() {
  const [version, setVersion] = useState(0)

  const tree = useMemo(() => snapshotNativeTree(root), [version])
  const ops = useMemo(() => dumpDebugOps().slice(-20), [version])
  const transportStats = useMemo(() => transportAdapter.getStats(), [version])
  const runtimeTransportStats = useMemo(() => runtimeTransport.getStats(), [version])
  const runtimeTransportDiagnostics = useMemo(
    () => runtimeTransport.getDiagnostics(),
    [version],
  )
  const transportBatches = useMemo(
    () => runtimeTransport.getRecentBatches().slice(0, 5),
    [version],
  )

  const increment = () => {
    incrementCount()
    setVersion(v => v + 1)
  }

  const simulateNativePress = () => {
    const pressable = findNodeByTag(snapshotNativeTree(root), 'Pressable')
    if (!pressable?.id) return

    runtimeTransport.emitEvent({ nodeId: pressable.id, event: 'onPress' })
    setVersion(v => v + 1)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <RNView style={styles.card}>
          <RNText style={styles.title}>Vue Native Sandbox</RNText>
          <RNText style={styles.body}>
            Đây là repo độc lập để phát triển native renderer. Bấm nút để cập nhật
            state Vue và xem cây native/debug ops đổi theo.
          </RNText>

          <Pressable onPress={increment} style={styles.button}>
            <RNText style={styles.buttonText}>Increment count</RNText>
          </Pressable>

          <Pressable onPress={simulateNativePress} style={styles.secondaryButton}>
            <RNText style={styles.buttonText}>Simulate native onPress</RNText>
          </Pressable>

          <RNView style={styles.section}>
            <RNText style={styles.sectionTitle}>Native tree snapshot</RNText>
            <RNText style={styles.mono}>{JSON.stringify(tree, null, 2)}</RNText>
          </RNView>

          <RNView style={styles.section}>
            <RNText style={styles.sectionTitle}>Recent debug ops</RNText>
            <RNText style={styles.mono}>{JSON.stringify(ops, null, 2)}</RNText>
          </RNView>

          <RNView style={styles.section}>
            <RNText style={styles.sectionTitle}>Native transport stats</RNText>
            <RNText style={styles.mono}>{JSON.stringify(transportStats, null, 2)}</RNText>
            <RNText style={styles.mono}>{JSON.stringify(runtimeTransportStats, null, 2)}</RNText>
            <RNText style={styles.mono}>
              {JSON.stringify(runtimeTransportDiagnostics, null, 2)}
            </RNText>
          </RNView>

          <RNView style={styles.section}>
            <RNText style={styles.sectionTitle}>Recent transport batches</RNText>
            <RNText style={styles.mono}>{JSON.stringify(transportBatches, null, 2)}</RNText>
          </RNView>
        </RNView>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1020',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 24,
    backgroundColor: '#121a33',
    padding: 20,
    gap: 12,
  },
  section: {
    gap: 8,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#e9eeff',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: '#4c6fff',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#2e8b57',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  body: {
    color: '#c8d1f0',
    fontSize: 14,
    lineHeight: 20,
  },
  mono: {
    color: '#89a8ff',
    fontFamily: 'Menlo',
    fontSize: 12,
  },
})
