import type { Component } from '@vue/runtime-core'
import { createNativeRenderer } from './renderer.js'
import {
	FlatList,
	Image,
	KeyboardAvoidingView,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from './primitives.js'

export function createNativeApp(rootComponent: Component) {
	const app = createNativeRenderer().createApp(rootComponent)
	app.component('View', View)
	app.component('Text', Text)
	app.component('Image', Image)
	app.component('ScrollView', ScrollView)
	app.component('Pressable', Pressable)
	app.component('TextInput', TextInput)
	app.component('FlatList', FlatList)
	app.component('KeyboardAvoidingView', KeyboardAvoidingView)
	return app
}
