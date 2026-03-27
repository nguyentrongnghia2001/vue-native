import React, { useMemo, useState } from 'react'
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text as RNText,
  Switch as RNSwitch,
  TextInput as RNTextInput,
  View as RNView,
} from 'react-native'
import {
  createNativeApp,
  createNativeTransportBridgeAdapter,
  createNativeRoot,
  registerBridgeAdapter,
  snapshotNativeTree,
} from '@vue-native/runtime-native'
import AppRoot, { incrementCount } from './src/AppRoot.vue'
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

function snapshotStyle(snapshot: any) {
  if (!snapshot || typeof snapshot !== 'object') return undefined
  const style = snapshot.props?.style
  return style && typeof style === 'object' ? style : undefined
}

function snapshotTestId(snapshot: any) {
  if (!snapshot || typeof snapshot !== 'object') return undefined
  return snapshot.props?.testID ?? snapshot.props?.testId ?? snapshot.props?.['test-id']
}

function renderSnapshotNode(
  snapshot: any,
  keyPrefix = 'node',
  insideText = false,
): React.ReactNode {
  if (!snapshot || typeof snapshot !== 'object') return null

  if (snapshot.type === 'text') {
    return insideText ? (
      snapshot.text
    ) : (
      <RNText key={`${keyPrefix}-${snapshot.id}`} style={styles.previewText}>
        {snapshot.text}
      </RNText>
    )
  }

  if (snapshot.type === 'comment') return null

  const childNodes = Array.isArray(snapshot.children)
    ? snapshot.children.map((child: any, index: number) =>
        renderSnapshotNode(
          child,
          `${keyPrefix}-${snapshot.id}-${index}`,
          snapshot.tag === 'Text',
        ),
      )
    : null

  const commonProps = {
    key: `${keyPrefix}-${snapshot.id}`,
    testID: snapshotTestId(snapshot),
    style: snapshotStyle(snapshot),
  }

  switch (snapshot.tag) {
    case 'root':
    case 'View':
    case 'SafeAreaView':
      return <RNView {...commonProps}>{childNodes}</RNView>
    case 'ScrollView':
      return (
        <ScrollView {...commonProps} contentContainerStyle={snapshotStyle(snapshot)}>
          {childNodes}
        </ScrollView>
      )
    case 'Text':
      return (
        <RNText {...commonProps}>
          {childNodes}
        </RNText>
      )
    case 'Pressable':
      return <Pressable {...commonProps}>{childNodes}</Pressable>
    case 'TextInput':
      return (
        <RNTextInput
          {...commonProps}
          value={typeof snapshot.props?.value === 'string' ? snapshot.props.value : ''}
          editable={false}
        />
      )
    case 'Switch':
      return (
        <RNSwitch
          {...commonProps}
          value={Boolean(snapshot.props?.value)}
          disabled
        />
      )
    default:
      return <RNView {...commonProps}>{childNodes}</RNView>
  }
}

function BrowserSnapshotPreview({ snapshot }: { snapshot: any }) {
  return <RNView style={styles.previewCanvas}>{renderSnapshotNode(snapshot)}</RNView>
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
            Đây là browser preview của UI được khai báo trong `AppRoot.vue`.
            Bấm nút để xem state Vue cập nhật ngay trên màn hình.
          </RNText>

          <RNView style={styles.section}>
            <RNText style={styles.sectionTitle}>Browser preview from AppRoot.vue</RNText>
            <BrowserSnapshotPreview snapshot={tree} />
          </RNView>

          <RNView style={styles.actionsRow}>
            <Pressable onPress={increment} style={styles.button}>
              <RNText style={styles.buttonText}>Increment count</RNText>
            </Pressable>

            <Pressable onPress={simulateNativePress} style={styles.secondaryButton}>
              <RNText style={styles.buttonText}>Simulate native onPress</RNText>
            </Pressable>
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
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
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
  previewCanvas: {
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#263158',
    backgroundColor: '#0e1530',
    padding: 16,
  },
  previewText: {
    color: '#e9eeff',
  },
})
