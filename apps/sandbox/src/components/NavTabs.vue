<script lang="ts">
import { defineComponent } from '@vue-native/runtime-native'

export const NavTabs = defineComponent({
  props: {
    activeTab: {
      type: String,
      required: true,
    },
    onChange: {
      type: Function,
      required: true,
    },
  },
  setup(props) {
    const selectHome = () => (props.onChange as (tab: string) => void)('home')
    const selectForm = () => (props.onChange as (tab: string) => void)('form')
    const selectLab = () => (props.onChange as (tab: string) => void)('lab')

    return {
      selectHome,
      selectForm,
      selectLab,
      props,
    }
  },

  /* __VUE_TEMPLATE__ */
})

export default NavTabs
</script>

<template>
  <View :style="{ flexDirection: 'row', gap: 10, marginTop: 18, marginBottom: 16 }">
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
      @tap="selectForm"
      :style="{
        backgroundColor: props.activeTab === 'form' ? '#4c6fff' : '#233053',
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
      }"
    >
      <Text :style="{ color: '#fff', fontWeight: '700' }">Form</Text>
    </Pressable>

    <Pressable
      @tap="selectLab"
      :style="{
        backgroundColor: props.activeTab === 'lab' ? '#4c6fff' : '#233053',
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
      }"
    >
      <Text :style="{ color: '#fff', fontWeight: '700' }">Lab</Text>
    </Pressable>
  </View>
</template>
