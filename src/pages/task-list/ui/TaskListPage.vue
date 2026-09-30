<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { TaskFull } from '@/entities/task'
import { CreateTaskButton } from '@/features/task-create'
import { TaskFilter } from '@/features/task-filter'
import { PageHeader } from '@/shared/ui'
import { KanbanBoard } from '@/widgets/kanban-board'

const router = useRouter()

function openTask(task: TaskFull): void {
  void router.push({ name: 'task-card', params: { id: task.id } })
}
</script>

<template>
  <div class="task-list-page">
    <PageHeader title="Задачи">
      <template #actions>
        <CreateTaskButton @created="openTask" />
      </template>
    </PageHeader>

    <TaskFilter />
    <KanbanBoard />
  </div>
</template>
