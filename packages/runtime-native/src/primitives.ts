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