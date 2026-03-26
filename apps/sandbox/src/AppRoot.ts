import { defineComponent, reactive } from '@vue-native/runtime-native'

export const state = reactive({
  count: 0,
  tapCount: 0,
  longPressCount: 0,
  pressInCount: 0,
  pressOutCount: 0,
  enabled: true,
  draft: '',
  focusCount: 0,
  blurCount: 0,
  submitCount: 0,
  draftChangeCount: 0,
  switchChangeCount: 0,
  draftInputCount: 0,
  switchInputCount: 0,
  scrollStartCount: 0,
  scrollEndCount: 0,
  momentumStartCount: 0,
  momentumEndCount: 0,
  clickCount: 0,
  pointerDownCount: 0,
  pointerUpCount: 0,
  statusHidden: false,
  touchOpacityCount: 0,
  touchHighlightCount: 0,
  touchWithoutFeedbackCount: 0,
  touchWithoutPointerDownCount: 0,
  touchWithoutPointerUpCount: 0,
  touchNativeFeedbackCount: 0,
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

export function onDraftInput() {
  state.draftInputCount += 1
}

export function onEnabledChange() {
  state.switchChangeCount += 1
}

export function onEnabledInput() {
  state.switchInputCount += 1
}

export function onIncrementLongPress() {
  state.longPressCount += 1
}

export function onIncrementPressIn() {
  state.pressInCount += 1
}

export function onIncrementPressOut() {
  state.pressOutCount += 1
}

export function onFeedScrollStart() {
  state.scrollStartCount += 1
}

export function onFeedScrollEnd() {
  state.scrollEndCount += 1
}

export function onFeedMomentumStart() {
  state.momentumStartCount += 1
}

export function onFeedMomentumEnd() {
  state.momentumEndCount += 1
}

export function onIncrementClick() {
  state.clickCount += 1
}

export function onIncrementPointerDown() {
  state.pointerDownCount += 1
}

export function onIncrementPointerUp() {
  state.pointerUpCount += 1
}

export function onTouchableOpacityPress() {
  state.touchOpacityCount += 1
}

export function onTouchableHighlightPress() {
  state.touchHighlightCount += 1
  state.statusHidden = !state.statusHidden
}

export function onTouchableWithoutFeedbackPress() {
  state.touchWithoutFeedbackCount += 1
}

export function onTouchableWithoutFeedbackPointerDown() {
  state.touchWithoutPointerDownCount += 1
}

export function onTouchableWithoutFeedbackPointerUp() {
  state.touchWithoutPointerUpCount += 1
}

export function onTouchableNativeFeedbackPress() {
  state.touchNativeFeedbackCount += 1
}

export const AppRoot = defineComponent({
  setup() {
    return {
      onIncrementTap,
      onDraftFocus,
      onDraftBlur,
      onDraftSubmit,
      onDraftChange,
      onDraftInput,
      onEnabledChange,
      onEnabledInput,
      onIncrementLongPress,
      onIncrementPressIn,
      onIncrementPressOut,
      onFeedScrollStart,
      onFeedScrollEnd,
      onFeedMomentumStart,
      onFeedMomentumEnd,
      onIncrementClick,
      onIncrementPointerDown,
      onIncrementPointerUp,
      onTouchableOpacityPress,
      onTouchableHighlightPress,
      onTouchableWithoutFeedbackPress,
      onTouchableWithoutFeedbackPointerDown,
      onTouchableWithoutFeedbackPointerUp,
      onTouchableNativeFeedbackPress,
      state,
    }
  },
  template: `
    <View
      testID="root"
      test-id="root-kebab"
      native-id="root-native"
      aria-label="Root container"
      role="summary"
    >
      <StatusBar testID="status-bar" barStyle="dark-content" :hidden="state.statusHidden" />

      <Text :style="{ fontSize: 22 }">Count: {{ state.count }}</Text>
      <Text :style="{ fontSize: 14, opacity: 0.8 }">
        This tree is rendered by the Vue native host scaffold.
      </Text>

      <ScrollView
        testID="feed"
        :style="{ maxHeight: 220 }"
        @scrollstart="onFeedScrollStart"
        @scrollend="onFeedScrollEnd"
        @momentumstart="onFeedMomentumStart"
        @momentumend="onFeedMomentumEnd"
      >
        <SafeAreaView testID="safe-zone" :style="{ paddingBottom: 6 }">
          <ActivityIndicator testID="loading-indicator" :animating="true" size="small" />
        </SafeAreaView>

        <Pressable
          testID="increment"
          @tap="onIncrementTap"
          @click="onIncrementClick"
          @pointerdown="onIncrementPointerDown"
          @pointerup="onIncrementPointerUp"
          @longpress="onIncrementLongPress"
          @pressin="onIncrementPressIn"
          @pressout="onIncrementPressOut"
        >
          <Text :style="{ fontSize: 16 }">Tap to increment</Text>
        </Pressable>

        <Text :style="{ fontSize: 12, opacity: 0.75 }">tap alias count: {{ state.tapCount }}</Text>
        <Text :style="{ fontSize: 12, opacity: 0.75 }">
          longpress: {{ state.longPressCount }} · pressin: {{ state.pressInCount }} · pressout: {{ state.pressOutCount }}
        </Text>
        <Text :style="{ fontSize: 12, opacity: 0.75 }">
          click: {{ state.clickCount }} · pointerdown: {{ state.pointerDownCount }} · pointerup: {{ state.pointerUpCount }}
        </Text>
        <Text :style="{ fontSize: 12, opacity: 0.75 }">
          scrollstart: {{ state.scrollStartCount }} · scrollend: {{ state.scrollEndCount }} · momentumstart: {{ state.momentumStartCount }} · momentumend: {{ state.momentumEndCount }}
        </Text>

        <TouchableOpacity testID="touch-opacity" :activeOpacity="0.75" @press="onTouchableOpacityPress">
          <Text test-id="touch-opacity-text" aria-role="button" :style="{ fontSize: 14 }">TouchableOpacity count: {{ state.touchOpacityCount }}</Text>
        </TouchableOpacity>

        <TouchableHighlight
          testID="touch-highlight"
          :underlay-color="'#dbeafe'"
          @click="onTouchableHighlightPress"
        >
          <Text :style="{ fontSize: 14 }">
            TouchableHighlight count: {{ state.touchHighlightCount }} · status hidden: {{ state.statusHidden }}
          </Text>
        </TouchableHighlight>

        <ImageBackground
          testID="hero-bg"
          source="https://example.com/hero-bg.png"
          :style="{ marginTop: 8, padding: 8 }"
        >
          <Text :style="{ fontSize: 13, opacity: 0.9 }">ImageBackground demo content</Text>
        </ImageBackground>

        <TouchableWithoutFeedback
          testID="touch-without-feedback"
          @tap="onTouchableWithoutFeedbackPress"
          @pointerdown="onTouchableWithoutFeedbackPointerDown"
          @pointerup="onTouchableWithoutFeedbackPointerUp"
        >
          <Text :style="{ fontSize: 14 }">
            TouchableWithoutFeedback tap: {{ state.touchWithoutFeedbackCount }} · pointerdown: {{ state.touchWithoutPointerDownCount }} · pointerup: {{ state.touchWithoutPointerUpCount }}
          </Text>
        </TouchableWithoutFeedback>

        <TouchableNativeFeedback
          testID="touch-native-feedback"
          @click="onTouchableNativeFeedbackPress"
        >
          <Text :style="{ fontSize: 14 }">
            TouchableNativeFeedback click: {{ state.touchNativeFeedbackCount }}
          </Text>
        </TouchableNativeFeedback>

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
            @input="onDraftInput"
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
            focus: {{ state.focusCount }} · blur: {{ state.blurCount }} · submit: {{ state.submitCount }} · change: {{ state.draftChangeCount }} · input: {{ state.draftInputCount }}
          </Text>

          <Switch
            testID="enable-flag"
            v-model="state.enabled"
            @change="onEnabledChange"
            @input="onEnabledInput"
          />

          <Text :style="{ fontSize: 12, opacity: 0.75 }">
            switch change alias count: {{ state.switchChangeCount }} · input alias count: {{ state.switchInputCount }}
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