import { defineComponent, reactive } from '@vue-native/runtime-native'

export const state = reactive({
  count: 0,
})

export function incrementCount() {
  state.count += 1
}

export const AppRoot = defineComponent({
  setup() {
    return { state }
  },
  template: `
    <View testID="root">
      <Text :style="{ fontSize: 22 }">Count: {{ state.count }}</Text>
      <Text :style="{ fontSize: 14, opacity: 0.8 }">
        This tree is rendered by the Vue native host scaffold.
      </Text>
    </View>
  `,
})