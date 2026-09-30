<script setup lang="ts">
import { computed, ref } from 'vue'
import { CommentItem, sortComments, type CommentSortOrder, type TaskFull } from '@/entities/task'
import { AddCommentForm, DeleteCommentButton, EditCommentForm } from '@/features/comment-manage'

const props = defineProps<{ task: TaskFull }>()

const sortOrder = ref<CommentSortOrder>('desc')
const editingId = ref<string | null>(null)

const sortedComments = computed(() => sortComments(props.task.comments, sortOrder.value))
</script>

<template>
  <section class="comment-thread" aria-labelledby="comment-thread-title">
    <header class="comment-thread__header">
      <h2 id="comment-thread-title" class="comment-thread__title">
        Комментарии <span class="comment-thread__count">({{ task.comments.length }})</span>
      </h2>
      <el-radio-group
        v-model="sortOrder"
        size="small"
        aria-label="Сортировка комментариев по времени"
      >
        <el-radio-button value="desc">Сначала новые</el-radio-button>
        <el-radio-button value="asc">Сначала старые</el-radio-button>
      </el-radio-group>
    </header>

    <AddCommentForm :task-id="task.id" class="comment-thread__add" />

    <el-empty
      v-if="sortedComments.length === 0"
      description="Комментариев пока нет"
      :image-size="80"
    />

    <ul v-else class="comment-thread__list">
      <li v-for="comment in sortedComments" :key="comment.id">
        <CommentItem :comment="comment">
          <template v-if="editingId !== comment.id" #actions>
            <el-button type="primary" link @click="editingId = comment.id">
              Редактировать
            </el-button>
            <DeleteCommentButton :task-id="task.id" :comment-id="comment.id" />
          </template>
          <template v-if="editingId === comment.id" #default>
            <EditCommentForm :task-id="task.id" :comment="comment" @done="editingId = null" />
          </template>
        </CommentItem>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.comment-thread {
  padding: 16px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.comment-thread__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.comment-thread__title {
  margin: 0;
  font-size: 18px;
}

.comment-thread__count {
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.comment-thread__add {
  margin-bottom: 16px;
}

.comment-thread__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

@media (max-width: 767px) {
  .comment-thread {
    padding: 12px;
  }
}
</style>
