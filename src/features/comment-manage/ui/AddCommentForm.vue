<script setup lang="ts">
import { ref } from 'vue'
import { useTaskStore } from '@/entities/task'
import { notify } from '@/shared/lib'
import CommentForm from './CommentForm.vue'

const props = defineProps<{ taskId: string }>()

const store = useTaskStore()
const loading = ref(false)
const formRef = ref<InstanceType<typeof CommentForm>>()

async function add(text: string): Promise<void> {
  loading.value = true
  try {
    await store.addComment(props.taskId, text)
    formRef.value?.reset()
    notify.success('Комментарий добавлен')
  } catch (error) {
    notify.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <CommentForm
    ref="formRef"
    submit-label="Добавить комментарий"
    placeholder="Новый комментарий (Ctrl + Enter — отправить)"
    :loading="loading"
    @submit="add"
  />
</template>
