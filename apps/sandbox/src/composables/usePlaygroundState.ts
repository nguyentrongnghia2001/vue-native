import { reactive } from '@vue-native/runtime-native'

export type SandboxTab = 'home' | 'form' | 'lab'

export const playgroundState = reactive({
  activeTab: 'home' as SandboxTab,
  count: 0,
  draft: 'Type in the native playground',
  enabled: true,
  accent: 'blue' as 'blue' | 'green' | 'amber',
})

export function setActiveTab(tab: SandboxTab) {
  playgroundState.activeTab = tab
}

export function incrementCount() {
  playgroundState.count += 1
}

export function rotateAccent() {
  const order: Array<typeof playgroundState.accent> = ['blue', 'green', 'amber']
  const index = order.indexOf(playgroundState.accent)
  const next = (index + 1) % order.length
  playgroundState.accent = order[next] ?? 'blue'
}
