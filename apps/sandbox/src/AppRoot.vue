<script lang="ts">
import { defineComponent, reactive } from '@vue-native/runtime-native'

const state = reactive({
  count: 0,
  draft: 'Type in the browser preview',
  enabled: true,
})

export function incrementCount() {
  state.count += 1
}

export const AppRoot = defineComponent({
  setup() {
    return {
      state,
      incrementCount,
    }
  },

  /* __VUE_TEMPLATE__ */
})

export default AppRoot
</script>

<template>
  <View
    testID="root"
    aria-label="Vue native SFC demo"
    :style="{
      flex: 1,
      justifyContent: 'center',
      backgroundColor: '#0b1020',
      padding: 24,
    }"
  >
    <Text :style="{ color: '#fff', fontSize: 28, fontWeight: '700' }">
      Vue SFC sandbox
    </Text>

    <Text :style="{ color: '#c8d1f0', marginTop: 8, fontSize: 14 }">
      This screen is now authored in `AppRoot.vue`.
    </Text>

    <Text :style="{ color: '#89a8ff', marginTop: 16, fontSize: 20 }">
      Count: {{ state.count }}
    </Text>

    <Pressable
      testID="increment"
      @tap="incrementCount"
      :style="{
        alignSelf: 'flex-start',
        marginTop: 12,
        backgroundColor: '#4c6fff',
        borderRadius: 999,
        paddingHorizontal: 16,
        paddingVertical: 10,
      }"
    >
      <Text :style="{ color: '#fff', fontWeight: '700' }">Increment count</Text>
    </Pressable>

    <TextInput
      testID="draft-input"
      v-model="state.draft"
      placeholder="Type something"
      :style="{
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#4c6fff',
        borderRadius: 12,
        padding: 12,
        color: '#e9eeff',
      }"
    />

    <Switch
      testID="enabled-switch"
      v-model="state.enabled"
      :style="{ marginTop: 16 }"
    />

    <Text :style="{ color: '#c8d1f0', marginTop: 16, fontSize: 14 }">
      Draft: {{ state.draft }}
    </Text>

    <Text :style="{ color: '#c8d1f0', marginTop: 6, fontSize: 14 }">
      Enabled: {{ state.enabled ? 'yes' : 'no' }}
    </Text>
  </View>
</template>