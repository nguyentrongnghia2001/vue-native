import React from 'react'
import {
  StyleSheet,
  Text as RNText,
  View as RNView,
} from 'react-native'

function readNumber(record, key) {
  if (!record || typeof record !== 'object') return null
  const value = record[key]
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return null
  }
  return value
}

function readString(record, key) {
  if (!record || typeof record !== 'object') return null
  const value = record[key]
  if (typeof value !== 'string' || value.length === 0) {
    return null
  }
  return value
}

function formatDuration(ms) {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return 'n/a'
  return `${ms.toFixed(1)} ms`
}

function formatRate(value, digits = 2) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'n/a'
  return value.toFixed(digits)
}

function formatBytes(bytes) {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes < 0) {
    return 'n/a'
  }

  const KB = 1024
  const MB = KB * 1024

  if (bytes >= MB) {
    return `${(bytes / MB).toFixed(2)} MB`
  }

  return `${(bytes / KB).toFixed(1)} KB`
}

function resolveHealthStatus(health) {
  const errors = health?.errors ?? {}
  const adapter = health?.adapterStats ?? {}
  const diagnostics = health?.transportDiagnostics ?? {}

  const fatalReports = readNumber(errors, 'fatalReports') ?? 0
  const errorRate = readNumber(adapter, 'errorRate') ?? 0
  const moduleDetected = diagnostics.moduleDetected

  if (fatalReports > 0) {
    return { label: 'fatal', color: '#ef4444' }
  }

  if (errorRate > 0) {
    return { label: 'degraded', color: '#f59e0b' }
  }

  if (moduleDetected === false) {
    return { label: 'fallback', color: '#f97316' }
  }

  return { label: 'healthy', color: '#22c55e' }
}

function MetricLine({ label, value }) {
  return (
    <RNView style={styles.metricRow}>
      <RNText style={styles.metricLabel}>{label}</RNText>
      <RNText style={styles.metricValue}>{value}</RNText>
    </RNView>
  )
}

export default function RuntimeHealthDashboard({ health }) {
  if (!health) {
    return null
  }

  const adapter = health.adapterStats ?? {}
  const transport = health.transportStats ?? {}
  const diagnostics = health.transportDiagnostics ?? {}
  const performance = health.performance ?? {}
  const memory = performance.memory ?? {}
  const errors = health.errors ?? {}

  const healthStatus = resolveHealthStatus(health)

  const startupTimeMs = performance.startupTimeMs
  const firstInteractionLatencyMs = performance.firstInteractionLatencyMs
  const currentMemory = readNumber(memory, 'currentUsedBytes')
  const peakMemory = readNumber(memory, 'peakUsedBytes')

  const throughputMutations = readNumber(adapter, 'throughputMutationsPerSecond')
  const throughputBatches = readNumber(adapter, 'throughputBatchesPerSecond')
  const ackLatencyAvg = readNumber(adapter, 'averageAckLatencyMs')
  const ackLatencyLast = readNumber(adapter, 'lastAckLatencyMs')
  const errorRate = readNumber(adapter, 'errorRate')

  const sentMutations = readNumber(transport, 'sentMutations')
  const sentBatches = readNumber(transport, 'sentBatches')
  const receivedEvents = readNumber(transport, 'receivedEvents')

  const totalReports = readNumber(errors, 'totalReports')
  const fatalReports = readNumber(errors, 'fatalReports')
  const lastErrorCode = readString(errors, 'lastCode')

  return (
    <RNView style={styles.container} pointerEvents="none">
      <RNView style={styles.headerRow}>
        <RNText style={styles.title}>Runtime Health</RNText>
        <RNText style={[styles.statusBadge, { borderColor: healthStatus.color, color: healthStatus.color }]}>status: {healthStatus.label}</RNText>
      </RNView>

      <MetricLine label="Mode" value={`${health.mode ?? 'unknown'} / ${diagnostics.moduleDetected === false ? 'fallback' : 'native'}`} />
      <MetricLine label="Startup" value={formatDuration(startupTimeMs)} />
      <MetricLine label="First interaction" value={formatDuration(firstInteractionLatencyMs)} />
      <MetricLine label="Heap (cur/peak)" value={`${formatBytes(currentMemory)} / ${formatBytes(peakMemory)}`} />
      <MetricLine label="Throughput (mut/s)" value={formatRate(throughputMutations)} />
      <MetricLine label="Throughput (batch/s)" value={formatRate(throughputBatches)} />
      <MetricLine label="Ack latency (avg/last)" value={`${formatDuration(ackLatencyAvg)} / ${formatDuration(ackLatencyLast)}`} />
      <MetricLine label="Error rate" value={formatRate(errorRate, 3)} />
      <MetricLine label="Traffic (m/b/e)" value={`${sentMutations ?? 0} / ${sentBatches ?? 0} / ${receivedEvents ?? 0}`} />
      <MetricLine label="Reports (all/fatal)" value={`${totalReports ?? 0} / ${fatalReports ?? 0}`} />
      <MetricLine label="Last error" value={lastErrorCode ?? 'none'} />
    </RNView>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 14,
    right: 14,
    minWidth: 260,
    maxWidth: 320,
    backgroundColor: 'rgba(2, 6, 23, 0.9)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
    gap: 6,
  },
  title: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    textTransform: 'uppercase',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 11,
    flexShrink: 1,
  },
  metricValue: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 0,
  },
})
