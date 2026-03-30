<script lang="ts">
import { defineComponent } from '@vue-native/runtime-native'

export const FormPage = defineComponent({
  props: {
    state: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    return {
      props,
    }
  },

  /* __VUE_TEMPLATE__ */
})

export default FormPage
</script>

<template>
  <View>
    <Text :style="{ color: '#e9eeff', fontSize: 18, fontWeight: '700' }">Form Playground</Text>
    <Text :style="{ color: '#c8d1f0', marginTop: 8, fontSize: 14 }">Dùng v-model như Vue website.</Text>

    <TextInput
      testID="draft-input"
      v-model="props.state.draft"
      placeholder="Type something"
      :style="{
        marginTop: 14,
        borderWidth: 1,
        borderColor: '#4c6fff',
        borderRadius: 12,
        padding: 12,
        color: '#e9eeff',
      }"
    />

    <Switch testID="enabled-switch" v-model="props.state.enabled" :style="{ marginTop: 16 }" />

    <Text :style="{ color: '#c8d1f0', marginTop: 14, fontSize: 14 }">Draft: {{ props.state.draft }}</Text>
    <Text :style="{ color: '#c8d1f0', marginTop: 6, fontSize: 14 }">Enabled: {{ props.state.enabled ? 'yes' : 'no' }}</Text>
  </View>
</template>
