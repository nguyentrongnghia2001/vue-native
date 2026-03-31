import { reactive } from '@vue-native/runtime-native'

export interface AppState {
  appName: string
  appVersion: string
  isReady: boolean
}

const state = reactive<AppState>({
  appName: 'Vue Native Product',
  appVersion: 'v0.1.0',
  isReady: true,
})

export function useAppState() {
  return state
}
