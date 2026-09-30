<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import {
  STATUS_LABELS,
  TASK_STATUSES,
  TaskCard,
  filterTasks,
  groupByStatus,
  useTaskStore,
  type Task,
  type TaskStatus,
} from '@/entities/task'
import {
  ChangeStatusDialog,
  ChangeStatusMenu,
  type StatusChangeRequest,
} from '@/features/task-change-status'
import { CloneTaskButton } from '@/features/task-clone'
import { DeleteTaskButton } from '@/features/task-delete'
import { useTaskFilterStore } from '@/features/task-filter'
import { AppErrorState } from '@/shared/ui'

const store = useTaskStore()
const filterStore = useTaskFilterStore()

onMounted(() => {
  void store.ensureTasksLoaded()
})

const initialLoading = computed(() => store.listStatus === 'loading' && store.tasks.length === 0)
const filteredTasks = computed(() => filterTasks(store.tasks, filterStore.applied))
const isEmpty = computed(() => store.listStatus === 'success' && filteredTasks.value.length === 0)

/**
 * Локальные копии колонок: SortableJS переносит элементы между массивами сам,
 * а источник истины — store. После любого переноса колонки пересобираются из store.
 */
const columns = reactive<Record<TaskStatus, Task[]>>(groupByStatus([]))

function syncColumns(): void {
  const grouped = groupByStatus(filteredTasks.value)
  for (const status of TASK_STATUSES) columns[status] = grouped[status]
}

watch(filteredTasks, syncColumns, { immediate: true })

const changeRequest = ref<StatusChangeRequest | null>(null)

function requestStatusChange(task: Task, to: TaskStatus): void {
  if (task.status !== to) changeRequest.value = { task, to }
}

function isTaskStatus(value: string | undefined): value is TaskStatus {
  return TASK_STATUSES.some((status) => status === value)
}

/**
 * Конец перетаскивания (событие приходит после того, как SortableJS обновил оба списка).
 * Статус меняется только после комментария: откатываем перенос и открываем диалог;
 * после подтверждения карточка переедет реактивно, после отмены — останется на месте.
 */
function onDragEnd(event: { item: HTMLElement; from: HTMLElement; to: HTMLElement }): void {
  if (event.from === event.to) return
  const taskId = event.item.dataset.taskId
  const to = event.to.dataset.status
  syncColumns()

  const task = store.tasks.find((t) => t.id === taskId)
  if (task && isTaskStatus(to)) requestStatusChange(task, to)
}

function taskLink(task: Task) {
  return { name: 'task-card', params: { id: task.id } } as const
}
</script>

<template>
  <section class="kanban-board" aria-label="Канбан-доска задач">
    <AppErrorState
      v-if="store.listStatus === 'error'"
      :message="store.listError ?? ''"
      @retry="store.fetchTasks()"
    />

    <template v-else>
      <el-alert
        v-if="isEmpty"
        :title="filterStore.isActive ? 'Нет задач, подходящих под фильтры' : 'Задач пока нет'"
        type="info"
        :closable="false"
        show-icon
        class="kanban-board__empty"
      />

      <div
        v-loading="initialLoading"
        element-loading-text="Загружаем задачи…"
        class="kanban-board__columns"
      >
        <section
          v-for="status in TASK_STATUSES"
          :key="status"
          class="kanban-board__column"
          :aria-labelledby="`column-${status}`"
        >
          <header class="kanban-board__column-header">
            <h2 :id="`column-${status}`" class="kanban-board__column-title">
              {{ STATUS_LABELS[status] }}
            </h2>
            <span class="kanban-board__count" :aria-label="`Задач: ${columns[status].length}`">
              {{ columns[status].length }}
            </span>
          </header>

          <VueDraggable
            v-model="columns[status]"
            :data-status="status"
            tag="ul"
            class="kanban-board__list"
            group="tasks"
            :sort="false"
            :animation="150"
            :delay="200"
            :delay-on-touch-only="true"
            filter=".task-card--pending"
            ghost-class="kanban-board__ghost"
            chosen-class="kanban-board__chosen"
            @end="onDragEnd"
          >
            <li v-for="task in columns[status]" :key="task.id" :data-task-id="task.id">
              <TaskCard :task="task" :to="taskLink(task)" :pending="store.isPending(task.id)">
                <template #actions>
                  <ChangeStatusMenu :task="task" @select="(to) => requestStatusChange(task, to)" />
                  <CloneTaskButton :task-id="task.id" variant="link" />
                  <DeleteTaskButton :task="task" variant="link" />
                </template>
              </TaskCard>
            </li>
          </VueDraggable>

          <p
            v-if="!initialLoading && columns[status].length === 0"
            class="kanban-board__placeholder"
          >
            Перетащите карточку сюда
          </p>
        </section>
      </div>
    </template>

    <ChangeStatusDialog :request="changeRequest" @close="changeRequest = null" />
  </section>
</template>

<style scoped>
.kanban-board__empty {
  margin-bottom: 16px;
}

.kanban-board__columns {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
  min-height: 240px;
}

.kanban-board__column {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 200px;
  padding: 12px;
  background: var(--app-column-bg);
  border: 1px solid var(--app-border);
  border-radius: 10px;
}

.kanban-board__column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.kanban-board__column-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.kanban-board__count {
  min-width: 28px;
  padding: 2px 8px;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  color: var(--app-header-text);
  background: var(--app-header-bg);
  border-radius: 12px;
}

.kanban-board__list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  min-height: 120px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.kanban-board__list > li {
  cursor: grab;
}

.kanban-board__placeholder {
  position: absolute;
  inset: 56px 12px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  color: var(--el-text-color-secondary);
  border: 2px dashed var(--app-border-strong);
  border-radius: 8px;
  pointer-events: none;
}

.kanban-board__ghost {
  opacity: 0.5;
}

.kanban-board__ghost :deep(.task-card) {
  border-style: dashed;
  border-color: var(--el-color-primary);
}

.kanban-board__chosen :deep(.task-card) {
  box-shadow: 0 4px 12px rgb(0 0 0 / 18%);
}

@media (max-width: 767px) {
  .kanban-board__columns {
    grid-template-columns: minmax(0, 1fr);
  }

  .kanban-board__column {
    min-height: 0;
  }

  .kanban-board__list {
    min-height: 80px;
  }
}
</style>
