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
  createNativeRoot,
  dumpDebugOps,
  snapshotNativeTree,
} from '@vue-native/runtime-native'
import { AppRoot, incrementCount } from './src/AppRoot'

const root = createNativeRoot()
const app = createNativeApp(AppRoot)
app.mount(root)

export default function SandboxApp() {
  const [version, setVersion] = useState(0)

  const tree = useMemo(() => snapshotNativeTree(root), [version])
  const ops = useMemo(() => dumpDebugOps().slice(-20), [version])

  const increment = () => {
    incrementCount()
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

          <RNView style={styles.section}>
            <RNText style={styles.sectionTitle}>Native tree snapshot</RNText>
            <RNText style={styles.mono}>{JSON.stringify(tree, null, 2)}</RNText>
          </RNView>

          <RNView style={styles.section}>
            <RNText style={styles.sectionTitle}>Recent debug ops</RNText>
            <RNText style={styles.mono}>{JSON.stringify(ops, null, 2)}</RNText>
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
