import type { Component } from '@vue/runtime-core'
import { createNativeRenderer } from './renderer'
import {
	ActivityIndicator,
	FlatList,
	Image,
	KeyboardAvoidingView,
	Modal,
	Pressable,
	RefreshControl,
	SafeAreaView,
	SectionList,
	ScrollView,
	StatusBar,
	Switch,
	Text,
	TextInput,
	TouchableHighlight,
	TouchableNativeFeedback,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
	ImageBackground,
} from './primitives'

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
	app.component('SafeAreaView', SafeAreaView)
	app.component('ActivityIndicator', ActivityIndicator)
	app.component('Modal', Modal)
	app.component('Switch', Switch)
	app.component('SectionList', SectionList)
	app.component('RefreshControl', RefreshControl)
	app.component('TouchableOpacity', TouchableOpacity)
	app.component('TouchableHighlight', TouchableHighlight)
	app.component('TouchableWithoutFeedback', TouchableWithoutFeedback)
	app.component('TouchableNativeFeedback', TouchableNativeFeedback)
	app.component('StatusBar', StatusBar)
	app.component('ImageBackground', ImageBackground)
	return app
}
