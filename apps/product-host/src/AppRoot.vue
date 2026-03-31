<script lang="ts">
import { defineComponent } from '@vue-native/runtime-native'
import { reactive } from '@vue-native/runtime-native'
import { useAppState } from './composables/useAppState'
import HomePage from './pages/HomePage.vue'
import AboutPage from './pages/AboutPage.vue'
import NavTabs from './components/NavTabs.vue'

const state = reactive({
  activeTab: 'home',
})

function switchTab(tab: string) {
  state.activeTab = tab
}

export default defineComponent({
  name: 'AppRoot',
  setup() {
    const appState = useAppState()

    return {
      state,
      appState,
      switchTab,
    }
  },
})
</script>

<template>
  <View :style="{ flex: 1, backgroundColor: '#0f172a', paddingTop: 48, paddingHorizontal: 20 }">
    <Text :style="{ color: '#ffffff', fontSize: 22, fontWeight: '700', marginBottom: 4 }">
      {{ appState.appName }}
    </Text>
    <Text :style="{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }">
      {{ appState.appVersion }}
    </Text>

    <NavTabs :activeTab="state.activeTab" @change="switchTab" />

    <HomePage v-if="state.activeTab === 'home'" />
    <AboutPage v-if="state.activeTab === 'about'" />
  </View>
</template>
