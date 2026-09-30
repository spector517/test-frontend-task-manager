<script setup lang="ts">
import { ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { useTaskStore } from '@/entities/task'
import { notify } from '@/shared/lib'

const props = defineProps<{ taskId: string; commentId: string }>()

const store = useTaskStore()
const loading = ref(false)

async function remove(): Promise<void> {
  try {
    await ElMessageBox.confirm(
      'Комментарий будет удалён без возможности восстановления.',
      'Удалить комментарий?',
      {
        type: 'warning',
        confirmButtonText: 'Удалить',
        cancelButtonText: 'Отмена',
        confirmButtonClass: 'el-button--danger',
      },
    )
  } catch {
    return
  }

  loading.value = true
  try {
    await store.removeComment(props.taskId, props.commentId)
    notify.success('Комментарий удалён')
  } catch (error) {
    notify.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-button type="danger" link :icon="Delete" :loading="loading" @click="remove">
    Удалить
  </el-button>
</template>
