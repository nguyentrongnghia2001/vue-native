import { defineComponent, h } from '@vue/runtime-core'

function createNativePrimitive(tag: string) {
  return defineComponent({
    name: `Native${tag}`,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(tag, attrs, slots.default?.())
    },
  })
}

export const View = createNativePrimitive('View')
export const Text = createNativePrimitive('Text')
export const Image = createNativePrimitive('Image')
export const ScrollView = createNativePrimitive('ScrollView')
export const Pressable = createNativePrimitive('Pressable')
export const TextInput = createNativePrimitive('TextInput')
export const FlatList = createNativePrimitive('FlatList')
export const KeyboardAvoidingView = createNativePrimitive('KeyboardAvoidingView')
export const SafeAreaView = createNativePrimitive('SafeAreaView')
export const ActivityIndicator = createNativePrimitive('ActivityIndicator')
export const Modal = createNativePrimitive('Modal')