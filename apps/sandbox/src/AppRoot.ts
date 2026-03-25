import { defineComponent, reactive } from '@vue-native/runtime-native'

export const state = reactive({
  count: 0,
  tapCount: 0,
  enabled: true,
  draft: '',
  focusCount: 0,
  blurCount: 0,
  submitCount: 0,
  draftChangeCount: 0,
  switchChangeCount: 0,
})

export function incrementCount() {
  state.count += 1
}

export function onIncrementTap() {
  state.count += 1
  state.tapCount += 1
}

export function onDraftFocus() {
  state.focusCount += 1
}

export function onDraftBlur() {
  state.blurCount += 1
}

export function onDraftSubmit() {
  state.submitCount += 1
}

export function onDraftChange() {
  state.draftChangeCount += 1
}

export function onEnabledChange() {
  state.switchChangeCount += 1
}

export const AppRoot = defineComponent({
  setup() {
    return {
      onIncrementTap,
      onDraftFocus,
      onDraftBlur,
      onDraftSubmit,
      onDraftChange,
      onEnabledChange,
      state,
    }
  },
  template: `
    <View testID="root">
      <Text :style="{ fontSize: 22 }">Count: {{ state.count }}</Text>
      <Text :style="{ fontSize: 14, opacity: 0.8 }">
        This tree is rendered by the Vue native host scaffold.
      </Text>

      <ScrollView testID="feed" :style="{ maxHeight: 220 }">
        <SafeAreaView testID="safe-zone" :style="{ paddingBottom: 6 }">
          <ActivityIndicator testID="loading-indicator" :animating="true" size="small" />
        </SafeAreaView>

        <Pressable testID="increment" @tap="onIncrementTap">
          <Text :style="{ fontSize: 16 }">Tap to increment</Text>
        </Pressable>

        <Text :style="{ fontSize: 12, opacity: 0.75 }">tap alias count: {{ state.tapCount }}</Text>

        <Image
          testID="preview"
          source="https://example.com/preview.png"
          :style="{ width: 160, height: 90 }"
        />

        <KeyboardAvoidingView testID="input-zone" behavior="padding">
          <TextInput
            testID="draft-input"
            v-model="state.draft"
            @focus="onDraftFocus"
            @blur="onDraftBlur"
            @submit="onDraftSubmit"
            @change="onDraftChange"
            class="input primary"
            placeholder="Type a draft title"
            placeholder-text-color="#8aa1ff"
            max-length="32"
            :editable="true"
            :style="[
              { marginTop: 10, padding: 8 },
              { borderWidth: 1, borderColor: '#4c6fff', opacity: 0.95 }
            ]"
          />

          <Text :style="{ fontSize: 12, opacity: 0.75 }">
            focus: {{ state.focusCount }} · blur: {{ state.blurCount }} · submit: {{ state.submitCount }} · change: {{ state.draftChangeCount }}
          </Text>

          <Switch testID="enable-flag" v-model="state.enabled" @change="onEnabledChange" />

          <Text :style="{ fontSize: 12, opacity: 0.75 }">
            switch change alias count: {{ state.switchChangeCount }}
          </Text>

          <FlatList
            testID="demo-list"
            :data="[state.count, state.count + 1, state.count + 2]"
            :style="[{ marginTop: 8 }, { maxHeight: 120 }]"
          />

          <RefreshControl testID="refresh-control" :refreshing="state.count % 3 === 0" />

          <SectionList
            testID="section-list"
            :sections="[
              { title: 'Main', data: [state.count, state.count + 1] },
              { title: 'Extra', data: [state.count + 2] }
            ]"
          />
        </KeyboardAvoidingView>

        <Modal testID="demo-modal" :visible="state.count % 2 === 0" :transparent="true">
          <View testID="modal-body" :style="{ padding: 10 }">
            <Text :style="{ fontSize: 13, opacity: 0.85 }">
              Modal sample is visible when count is even.
            </Text>
          </View>
        </Modal>
      </ScrollView>
    </View>
  `,
})