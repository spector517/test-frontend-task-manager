<script setup lang="ts">
import { ref } from 'vue'
import { useTaskStore, type TaskComment } from '@/entities/task'
import { notify } from '@/shared/lib'
import CommentForm from './CommentForm.vue'

const props = defineProps<{ taskId: string; comment: TaskComment }>()

const emit = defineEmits<{ done: [] }>()

const store = useTaskStore()
const loading = ref(false)

async function save(text: string): Promise<void> {
  if (text === props.comment.text) {
    emit('done')
    return
  }
  loading.value = true
  try {
    await store.updateComment(props.taskId, props.comment.id, text)
    notify.success('Комментарий сохранён')
    emit('done')
  } catch (error) {
    notify.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <CommentForm
    :initial-text="comment.text"
    submit-label="Сохранить"
    placeholder="Текст комментария"
    :loading="loading"
    cancellable
    @submit="save"
    @cancel="emit('done')"
  />
</template>
