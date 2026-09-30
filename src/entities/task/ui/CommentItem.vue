<script setup lang="ts">
import { formatDateTime } from '@/shared/lib'
import type { TaskComment } from '../model/types'

defineProps<{ comment: TaskComment }>()
</script>

<template>
  <article class="comment-item">
    <header class="comment-item__header">
      <time :datetime="comment.createdAt" class="comment-item__time">
        {{ formatDateTime(comment.createdAt) }}
      </time>
      <span
        v-if="comment.updatedAt"
        class="comment-item__edited"
        :title="`Изменён ${formatDateTime(comment.updatedAt)}`"
      >
        (изменён)
      </span>
      <div v-if="$slots.actions" class="comment-item__actions">
        <slot name="actions" />
      </div>
    </header>
    <slot>
      <p class="comment-item__text">{{ comment.text }}</p>
    </slot>
  </article>
</template>

<style scoped>
.comment-item {
  padding: 12px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.comment-item__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.comment-item__actions {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.comment-item__text {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: var(--el-text-color-primary);
}
</style>
