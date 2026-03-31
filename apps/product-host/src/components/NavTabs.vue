<script lang="ts">
import { defineComponent } from '@vue-native/runtime-native'

export const NavTabs = defineComponent({
  name: 'NavTabs',
  props: {
    activeTab: {
      type: String,
      required: true,
    },
  },
  emits: ['change'],
  setup(props, { emit }) {
    const selectHome = () => emit('change', 'home')
    const selectAbout = () => emit('change', 'about')

    return {
      selectHome,
      selectAbout,
      props,
    }
  },
})

export default NavTabs
</script>

<template>
  <View :style="{ flexDirection: 'row', gap: 10, marginBottom: 16 }">
    <Pressable
      @tap="selectHome"
      :style="{
        backgroundColor: props.activeTab === 'home' ? '#4c6fff' : '#233053',
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
      }"
    >
      <Text :style="{ color: '#fff', fontWeight: '700' }">Home</Text>
    </Pressable>

    <Pressable
      @tap="selectAbout"
      :style="{
        backgroundColor: props.activeTab === 'about' ? '#4c6fff' : '#233053',
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
      }"
    >
      <Text :style="{ color: '#fff', fontWeight: '700' }">About</Text>
    </Pressable>
  </View>
</template>
