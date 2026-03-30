<script lang="ts">
import { defineComponent } from '@vue-native/runtime-native'

export const HomePage = defineComponent({
  props: {
    state: {
      type: Object,
      required: true,
    },
    onIncrement: {
      type: Function,
      required: true,
    },
  },
  setup(props) {
    const increment = () => (props.onIncrement as () => void)()

    return {
      increment,
      props,
    }
  },

  /* __VUE_TEMPLATE__ */
})

export default HomePage
</script>

<template>
  <View>
    <Text :style="{ color: '#9db6ff', fontSize: 13 }">Website-like authoring zone</Text>
    <Text :style="{ color: '#ffffff', marginTop: 6, fontSize: 26, fontWeight: '700' }">Count: {{ props.state.count }}</Text>

    <Text :style="{ color: '#c8d1f0', marginTop: 12, fontSize: 14, lineHeight: 20 }">
      Mục tiêu của layout này là để team viết Vue Native gần giống Vue web: chia component,
      tách composable và tổ chức theo page.
    </Text>

    <Pressable
      testID="increment"
      @tap="increment"
      :style="{
        marginTop: 16,
        alignSelf: 'flex-start',
        backgroundColor: '#4c6fff',
        borderRadius: 999,
        paddingHorizontal: 16,
        paddingVertical: 10,
      }"
    >
      <Text :style="{ color: '#fff', fontWeight: '700' }">Increment count</Text>
    </Pressable>
  </View>
</template>
