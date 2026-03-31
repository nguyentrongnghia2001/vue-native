<script lang="ts">
import { defineComponent } from '@vue-native/runtime-native'

export const AboutPage = defineComponent({
  name: 'AboutPage',
  setup() {
    return {}
  },
})

export default AboutPage
</script>

<template>
  <View>
    <Text :style="{ color: '#e2e8f0', fontSize: 16, lineHeight: 24, marginTop: 12 }">
      Về Vue Native Product
    </Text>
    <Text :style="{ color: '#94a3b8', fontSize: 14, lineHeight: 20, marginTop: 8 }">
      Product Host là app baseline cho phát hành production.
      Tách biệt hoàn toàn khỏi sandbox demo/debug.
    </Text>

    <View :style="{ marginTop: 24, padding: 16, backgroundColor: '#1e293b', borderRadius: 12 }">
      <Text :style="{ color: '#60a5fa', fontSize: 14, fontWeight: '600' }">
        🏗️ Kiến trúc
      </Text>
      <Text :style="{ color: '#cbd5e1', fontSize: 13, lineHeight: 20, marginTop: 8 }">
        - Runtime: @vue-native/runtime-native{'\n'}
        - Bridge: NativeModules + event emitter{'\n'}
        - Authoring: Vue SFC (.vue files){'\n'}
        - Host: Expo + React Native shell
      </Text>
    </View>
  </View>
</template>
