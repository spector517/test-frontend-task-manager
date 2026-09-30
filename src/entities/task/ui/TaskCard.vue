<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { Calendar, User } from '@element-plus/icons-vue'
import { formatDate } from '@/shared/lib'
import type { Task } from '../model/types'
import TaskPriorityTag from './TaskPriorityTag.vue'
import TaskStatusTag from './TaskStatusTag.vue'

defineProps<{
  task: Task
  /** Куда ведёт название задачи */
  to?: RouteLocationRaw
  pending?: boolean
}>()
</script>

<template>
  <article class="task-card" :class="{ 'task-card--pending': pending }" :aria-busy="pending">
    <h3 class="task-card__title">
      <RouterLink v-if="to" :to="to" class="task-card__link">{{ task.title }}</RouterLink>
      <template v-else>{{ task.title }}</template>
    </h3>

    <div class="task-card__tags">
      <TaskStatusTag :status="task.status" />
      <TaskPriorityTag :priority="task.priority" />
    </div>

    <dl class="task-card__meta">
      <div class="task-card__meta-row">
        <dt>
          <el-icon aria-hidden="true"><User /></el-icon
          ><span class="visually-hidden">Исполнитель</span>
        </dt>
        <dd>{{ task.assignee }}</dd>
      </div>
      <div class="task-card__meta-row">
        <dt>
          <el-icon aria-hidden="true"><Calendar /></el-icon
          ><span class="visually-hidden">Создана</span>
        </dt>
        <dd>
          <time :datetime="task.createdAt">{{ formatDate(task.createdAt) }}</time>
        </dd>
      </div>
    </dl>

    <footer v-if="$slots.actions" class="task-card__actions">
      <slot name="actions" />
    </footer>
  </article>
</template>

<style scoped>
.task-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--app-surface);
  border: 1px solid var(--app-border-strong);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 6%);
  transition: opacity 0.2s;
}

.task-card--pending {
  opacity: 0.6;
  pointer-events: none;
}

.task-card__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.task-card__link {
  color: var(--el-text-color-primary);
  text-decoration: none;
}

.task-card__link:hover,
.task-card__link:focus-visible {
  color: var(--el-color-primary);
  text-decoration: underline;
}

.task-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.task-card__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.task-card__meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.task-card__meta-row dt {
  display: flex;
  color: var(--el-text-color-secondary);
}

.task-card__meta-row dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.task-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-top: 8px;
  border-top: 1px solid var(--app-border);
}
</style>
