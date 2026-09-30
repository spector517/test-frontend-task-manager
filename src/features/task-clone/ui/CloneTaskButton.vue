<script setup lang="ts">
import { computed } from 'vue'
import { CopyDocument } from '@element-plus/icons-vue'
import { useTaskStore, type TaskFull } from '@/entities/task'
import { notify } from '@/shared/lib'

const props = withDefaults(
  defineProps<{
    taskId: string
    variant?: 'button' | 'link'
  }>(),
  { variant: 'button' },
)

const emit = defineEmits<{ cloned: [task: TaskFull] }>()

const store = useTaskStore()
const loading = computed(() => store.isPending(props.taskId, 'clone'))

async function clone(): Promise<void> {
  try {
    const copy = await store.cloneTask(props.taskId)
    notify.success('Копия задачи создана')
    emit('cloned', copy)
  } catch (error) {
    notify.error(error)
  }
}
</script>

<template>
  <el-button
    type="primary"
    :icon="CopyDocument"
    :link="variant === 'link'"
    :plain="variant === 'button'"
    :loading="loading"
    @click="clone"
  >
    Клонировать
  </el-button>
</template>
