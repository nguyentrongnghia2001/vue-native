import type { Component } from '@vue/runtime-core'
import { createNativeRenderer } from './renderer.js'
import { Text, View } from './primitives.js'

export function createNativeApp(rootComponent: Component) {
	const app = createNativeRenderer().createApp(rootComponent)
	app.component('View', View)
	app.component('Text', Text)
	return app
}
