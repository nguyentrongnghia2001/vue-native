declare module '*.vue' {
  import type { Component } from '@vue/runtime-core'

  const component: Component
  export default component
  export const incrementCount: () => void
}