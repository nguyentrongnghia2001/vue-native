<script lang="ts">
import { defineComponent } from '@vue-native/runtime-native'

export const HomePage = defineComponent({
  name: 'HomePage',
  setup() {
    return {}
  },
})

export default HomePage
</script>

<template>
  <View>
    <Text :style="{ color: '#e2e8f0', fontSize: 16, lineHeight: 24, marginTop: 12 }">
      Chào mừng đến với Vue Native Product Host.
    </Text>
    <Text :style="{ color: '#94a3b8', fontSize: 14, lineHeight: 20, marginTop: 8 }">
      Đây là app production — không có debug panels hay sandbox UI.
      Team có thể thêm màn hình mới bằng cách tạo .vue files trong src/pages/.
    </Text>

    <View :style="{ marginTop: 24, padding: 16, backgroundColor: '#1e293b', borderRadius: 12 }">
      <Text :style="{ color: '#fbbf24', fontSize: 14, fontWeight: '600' }">
        📋 Hướng dẫn phát triển
      </Text>
      <Text :style="{ color: '#cbd5e1', fontSize: 13, lineHeight: 20, marginTop: 8 }">
        1. Tạo page mới trong src/pages/YourPage.vue{'\n'}
        2. Import vào AppRoot.vue và thêm vào NavTabs{'\n'}
        3. Chạy pnpm dev:product để preview
      </Text>
    </View>
  </View>
</template>
