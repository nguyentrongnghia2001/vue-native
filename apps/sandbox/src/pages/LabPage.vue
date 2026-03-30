<script lang="ts">
import { defineComponent } from '@vue-native/runtime-native'

export const LabPage = defineComponent({
  props: {
    state: {
      type: Object,
      required: true,
    },
    onRotateAccent: {
      type: Function,
      required: true,
    },
  },
  setup(props) {
    const rotate = () => (props.onRotateAccent as () => void)()

    return {
      rotate,
      props,
    }
  },

  /* __VUE_TEMPLATE__ */
})

export default LabPage
</script>

<template>
  <View>
    <Text :style="{ color: '#e9eeff', fontSize: 18, fontWeight: '700' }">Theme Lab</Text>
    <Text :style="{ color: '#c8d1f0', marginTop: 8, fontSize: 14 }">
      Accent hiện tại: {{ props.state.accent }}
    </Text>

    <Pressable
      @tap="rotate"
      :style="{
        marginTop: 14,
        alignSelf: 'flex-start',
        backgroundColor: '#2e8b57',
        borderRadius: 999,
        paddingHorizontal: 16,
        paddingVertical: 10,
      }"
    >
      <Text :style="{ color: '#fff', fontWeight: '700' }">Rotate accent</Text>
    </Pressable>

    <Text :style="{ color: '#c8d1f0', marginTop: 14, fontSize: 14 }">
      Gợi ý cho team: thêm page mới bằng cách tạo `pages/NewPage.vue`, import vào `AppRoot.vue`,
      rồi thêm một tab trong `NavTabs.vue`.
    </Text>
  </View>
</template>
