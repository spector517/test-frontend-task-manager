<script setup lang="ts">
import { computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { useTaskStore, type Task } from '@/entities/task'
import { notify } from '@/shared/lib'

const props = withDefaults(
  defineProps<{
    task: Pick<Task, 'id' | 'title'>
    /** `link` — компактная кнопка для карточки канбана */
    variant?: 'button' | 'link'
  }>(),
  { variant: 'button' },
)

const emit = defineEmits<{ deleted: [] }>()

const store = useTaskStore()
const loading = computed(() => store.isPending(props.task.id, 'delete'))

async function confirmDeletion(): Promise<boolean> {
  try {
    await ElMessageBox.confirm(
      `Задача «${props.task.title}» будет удалена без возможности восстановления.`,
      'Удалить задачу?',
      {
        type: 'warning',
        confirmButtonText: 'Удалить',
        cancelButtonText: 'Отмена',
        confirmButtonClass: 'el-button--danger',
        autofocus: false,
      },
    )
    return true
  } catch {
    // Пользователь нажал «Отмена» или закрыл окно
    return false
  }
}

async function remove(): Promise<void> {
  if (!(await confirmDeletion())) return
  try {
    await store.deleteTask(props.task.id)
    notify.success('Задача удалена')
    emit('deleted')
  } catch (error) {
    notify.error(error)
  }
}
</script>

<template>
  <el-button
    type="danger"
    :icon="Delete"
    :link="variant === 'link'"
    :plain="variant === 'button'"
    :loading="loading"
    @click="remove"
  >
    Удалить
  </el-button>
</template>
