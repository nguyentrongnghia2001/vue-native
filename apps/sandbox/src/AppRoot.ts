import { defineComponent, reactive } from '@vue-native/runtime-native'

export const state = reactive({
  count: 0,
})

export function incrementCount() {
  state.count += 1
}

export const AppRoot = defineComponent({
  setup() {
    return { incrementCount, state }
  },
  template: `
    <View testID="root">
      <Text :style="{ fontSize: 22 }">Count: {{ state.count }}</Text>
      <Text :style="{ fontSize: 14, opacity: 0.8 }">
        This tree is rendered by the Vue native host scaffold.
      </Text>

      <ScrollView testID="feed" :style="{ maxHeight: 220 }">
        <Pressable testID="increment" @press="incrementCount">
          <Text :style="{ fontSize: 16 }">Tap to increment</Text>
        </Pressable>

        <Image
          testID="preview"
          source="https://example.com/preview.png"
          :style="{ width: 160, height: 90 }"
        />

        <KeyboardAvoidingView testID="input-zone" behavior="padding">
          <TextInput
            testID="draft-input"
            class="input primary"
            placeholder="Type a draft title"
            :editable="true"
            :style="[
              { marginTop: 10, padding: 8 },
              { borderWidth: 1, borderColor: '#4c6fff', opacity: 0.95 }
            ]"
          />

          <FlatList
            testID="demo-list"
            :data="[state.count, state.count + 1, state.count + 2]"
            :style="[{ marginTop: 8 }, { maxHeight: 120 }]"
          />
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  `,
})