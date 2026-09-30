<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDown, Switch } from '@element-plus/icons-vue'
import { STATUS_OPTIONS, useTaskStore, type Task, type TaskStatus } from '@/entities/task'

/**
 * Альтернатива drag & drop (для мобильных и клавиатуры):
 * выбор нового статуса открывает тот же диалог с обязательным комментарием.
 */
const props = defineProps<{ task: Task }>()

const emit = defineEmits<{ select: [status: TaskStatus] }>()

const store = useTaskStore()
const options = computed(() =>
  STATUS_OPTIONS.filter((option) => option.value !== props.task.status),
)
const loading = computed(() => store.isPending(props.task.id, 'status'))

function isTaskStatus(value: unknown): value is TaskStatus {
  return options.value.some((option) => option.value === value)
}

function onCommand(command: unknown): void {
  if (isTaskStatus(command)) emit('select', command)
}
</script>

<template>
  <el-dropdown trigger="click" @command="onCommand">
    <el-button type="primary" link :icon="Switch" :loading="loading">
      Статус
      <el-icon class="el-icon--right" aria-hidden="true"><ArrowDown /></el-icon>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item v-for="option in options" :key="option.value" :command="option.value">
          {{ option.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>
