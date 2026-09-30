<script setup lang="ts">
import { TaskPriorityTag, TaskStatusTag, type TaskFull } from '@/entities/task'
import { CloneTaskButton } from '@/features/task-clone'
import { DeleteTaskButton } from '@/features/task-delete'
import { EditTaskButton } from '@/features/task-edit'
import { formatDateTime, useIsMobile } from '@/shared/lib'

defineProps<{ task: TaskFull; refreshing?: boolean }>()

const emit = defineEmits<{ deleted: []; cloned: [task: TaskFull] }>()

const isMobile = useIsMobile()
</script>

<template>
  <section class="task-details" aria-labelledby="task-details-title">
    <header class="task-details__header">
      <h2 id="task-details-title" class="task-details__title">{{ task.title }}</h2>
      <div class="task-details__actions">
        <EditTaskButton :task="task" />
        <CloneTaskButton :task-id="task.id" @cloned="(copy) => emit('cloned', copy)" />
        <DeleteTaskButton :task="task" @deleted="emit('deleted')" />
      </div>
    </header>

    <el-descriptions
      :column="isMobile ? 1 : 2"
      border
      :direction="isMobile ? 'vertical' : 'horizontal'"
      class="task-details__fields"
    >
      <el-descriptions-item label="Название" :span="isMobile ? 1 : 2">
        {{ task.title }}
      </el-descriptions-item>
      <el-descriptions-item label="Описание" :span="isMobile ? 1 : 2">
        <span v-if="task.description" class="task-details__description">
          {{ task.description }}
        </span>
        <span v-else class="task-details__muted">Не указано</span>
      </el-descriptions-item>
      <el-descriptions-item label="Статус">
        <TaskStatusTag :status="task.status" />
      </el-descriptions-item>
      <el-descriptions-item label="Приоритет">
        <TaskPriorityTag :priority="task.priority" />
      </el-descriptions-item>
      <el-descriptions-item label="Исполнитель">
        <a :href="`mailto:${task.assignee}`" class="task-details__link">{{ task.assignee }}</a>
      </el-descriptions-item>
      <el-descriptions-item label="Создана">
        <time :datetime="task.createdAt">{{ formatDateTime(task.createdAt) }}</time>
      </el-descriptions-item>
    </el-descriptions>

    <p v-if="refreshing" class="task-details__muted task-details__refreshing" role="status">
      Обновляем данные…
    </p>
  </section>
</template>

<style scoped>
.task-details {
  padding: 16px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.task-details__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.task-details__title {
  margin: 0;
  font-size: 20px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.task-details__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.task-details__actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.task-details__fields :deep(.el-descriptions__label) {
  width: 160px;
  color: var(--el-text-color-regular);
  font-weight: 600;
}

.task-details__description {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.task-details__muted {
  color: var(--el-text-color-secondary);
}

.task-details__link {
  color: var(--el-color-primary);
  overflow-wrap: anywhere;
}

.task-details__refreshing {
  margin: 12px 0 0;
  font-size: 13px;
}

@media (max-width: 767px) {
  .task-details {
    padding: 12px;
  }

  .task-details__actions {
    width: 100%;
  }

  .task-details__fields :deep(.el-descriptions__label) {
    width: auto;
  }
}
</style>
