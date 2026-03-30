<script lang="ts">
import { defineComponent } from '@vue-native/runtime-native'
import { reactive } from '@vue-native/runtime-native'

interface TodoItem {
  id: number
  title: string
  done: boolean
}

const state = reactive({
  count: 0,
  draft: '',
  nextId: 4,
  filter: 'all' as 'all' | 'active' | 'done',
  todos: [
    { id: 1, title: 'Mua cafe', done: false },
    { id: 2, title: 'Review PR', done: true },
    { id: 3, title: 'Push code sandbox', done: false },
  ] as TodoItem[],
})

export function incrementCount() {
  state.count += 1
}

function addTodo() {
  const title = state.draft.trim()
  if (!title) return

  state.todos.unshift({
    id: state.nextId,
    title,
    done: false,
  })
  state.nextId += 1
  state.draft = ''
  state.count += 1
}

function toggleTodo(id: number) {
  const target = state.todos.find(item => item.id === id)
  if (!target) return
  target.done = !target.done
}

function removeTodo(id: number) {
  state.todos = state.todos.filter(item => item.id !== id)
}

function clearDone() {
  state.todos = state.todos.filter(item => !item.done)
}

function setFilter(filter: 'all' | 'active' | 'done') {
  state.filter = filter
}

function visibleTodos() {
  if (state.filter === 'active') {
    return state.todos.filter(item => !item.done)
  }

  if (state.filter === 'done') {
    return state.todos.filter(item => item.done)
  }

  return state.todos
}

function remainingCount() {
  return state.todos.filter(item => !item.done).length
}

function completedCount() {
  return state.todos.filter(item => item.done).length
}

export const AppRoot = defineComponent({
  setup() {
    return {
      state,
      incrementCount,
      addTodo,
      toggleTodo,
      removeTodo,
      clearDone,
      setFilter,
      visibleTodos,
      remainingCount,
      completedCount,
    }
  },

  /* __VUE_TEMPLATE__ */
})

export default AppRoot
</script>

<template>
  <View
    testID="root"
    aria-label="Vue native todo app"
    :style="{
      flex: 1,
      backgroundColor: '#0b1020',
      padding: 20,
      paddingTop: 44,
    }"
  >
    <Text :style="{ color: '#ffffff', fontSize: 30, fontWeight: '800' }">TodoList</Text>
    <Text :style="{ color: '#c8d1f0', marginTop: 6, fontSize: 14 }">
      Vue Native basic app cho teammate trải nghiệm
    </Text>

    <View :style="{ flexDirection: 'row', gap: 10, marginTop: 14 }">
      <TextInput
        testID="todo-input"
        v-model="state.draft"
        placeholder="Thêm việc mới"
        :style="{
          flex: 1,
          borderWidth: 1,
          borderColor: '#4c6fff',
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: '#e9eeff',
          backgroundColor: '#121a33',
        }"
      />
      <Pressable
        testID="add-todo"
        @tap="addTodo"
        :style="{
          backgroundColor: '#4c6fff',
          borderRadius: 12,
          paddingHorizontal: 14,
          justifyContent: 'center',
        }"
      >
        <Text :style="{ color: '#fff', fontWeight: '700' }">Add</Text>
      </Pressable>
    </View>

    <View :style="{ flexDirection: 'row', gap: 10, marginTop: 14 }">
      <Pressable
        @tap="setFilter('all')"
        :style="{
          backgroundColor: state.filter === 'all' ? '#4c6fff' : '#233053',
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }"
      >
        <Text :style="{ color: '#fff', fontWeight: '700', fontSize: 12 }">All</Text>
      </Pressable>
      <Pressable
        @tap="setFilter('active')"
        :style="{
          backgroundColor: state.filter === 'active' ? '#4c6fff' : '#233053',
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }"
      >
        <Text :style="{ color: '#fff', fontWeight: '700', fontSize: 12 }">Active</Text>
      </Pressable>
      <Pressable
        @tap="setFilter('done')"
        :style="{
          backgroundColor: state.filter === 'done' ? '#4c6fff' : '#233053',
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }"
      >
        <Text :style="{ color: '#fff', fontWeight: '700', fontSize: 12 }">Done</Text>
      </Pressable>
      <Pressable
        @tap="clearDone"
        :style="{
          backgroundColor: '#2e8b57',
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }"
      >
        <Text :style="{ color: '#fff', fontWeight: '700', fontSize: 12 }">Clear done</Text>
      </Pressable>
    </View>

    <Text :style="{ color: '#9fb3ff', marginTop: 12, fontSize: 13 }">
      Remaining: {{ remainingCount() }} | Completed: {{ completedCount() }} | Interactions: {{ state.count }}
    </Text>

    <ScrollView
      testID="todo-list"
      :style="{ marginTop: 12 }"
      :content-container-style="{ gap: 10, paddingBottom: 16 }"
    >
      <View
        v-for="item in visibleTodos()"
        :key="item.id"
        :style="{
          borderRadius: 14,
          borderWidth: 1,
          borderColor: item.done ? '#2b6d57' : '#2a3d78',
          backgroundColor: item.done ? '#12291f' : '#121a33',
          paddingHorizontal: 12,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
        }"
      >
        <Pressable
          @tap="toggleTodo(item.id)"
          :style="{
            width: 22,
            height: 22,
            borderRadius: 999,
            borderWidth: 2,
            borderColor: item.done ? '#3ecf8e' : '#6f7fa8',
            backgroundColor: item.done ? '#3ecf8e' : 'transparent',
            marginRight: 10,
          }"
        />

        <Text
          :style="{
            flex: 1,
            color: item.done ? '#9ac6b1' : '#e9eeff',
            fontSize: 15,
          }"
        >
          {{ item.done ? '✓ ' : '' }}{{ item.title }}
        </Text>

        <Pressable
          @tap="removeTodo(item.id)"
          :style="{
            backgroundColor: '#7a2e3a',
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 6,
          }"
        >
          <Text :style="{ color: '#fff', fontSize: 12, fontWeight: '700' }">Delete</Text>
        </Pressable>
      </View>
    </ScrollView>
  </View>
</template>