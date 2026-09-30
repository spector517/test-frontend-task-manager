<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useTaskStore, type TaskFull } from '@/entities/task'
import { notify } from '@/shared/lib'
import { AppErrorState, PageHeader } from '@/shared/ui'
import { CommentThread } from '@/widgets/comment-thread'
import { TaskDetails } from '@/widgets/task-details'

const props = defineProps<{ id: string }>()

const router = useRouter()
const store = useTaskStore()

const task = computed(() => (store.current?.id === props.id ? store.current : null))
const loading = computed(() => store.currentStatus === 'loading')
const failed = computed(() => store.currentStatus === 'error' && !task.value)

function goBack(): void {
  // Не history.back(): при прямом заходе по ссылке истории может не быть
  void router.push({ name: 'task-list' })
}

async function load(): Promise<void> {
  const id = props.id
  try {
    const result = await store.fetchTaskById(id)
    if (!result && id === props.id) {
      notify.warning('Задача не найдена')
      await router.replace({ name: 'task-list' })
    }
  } catch {
    // Ошибка уже в store.currentError — показываем её с кнопкой «Повторить»
  }
}

function openCopy(copy: TaskFull): void {
  void router.push({ name: 'task-card', params: { id: copy.id } })
}

watch(() => props.id, load, { immediate: true })
</script>

<template>
  <div class="task-card-page">
    <PageHeader title="Карточка задачи">
      <template #before>
        <el-button :icon="ArrowLeft" @click="goBack">Назад</el-button>
      </template>
    </PageHeader>

    <AppErrorState
      v-if="failed"
      title="Не удалось загрузить задачу"
      :message="store.currentError ?? ''"
      @retry="load"
    >
      <template #extra>
        <el-button @click="goBack">К списку задач</el-button>
      </template>
    </AppErrorState>

    <div v-else-if="task" class="task-card-page__content">
      <TaskDetails :task="task" :refreshing="loading" @deleted="goBack" @cloned="openCopy" />
      <CommentThread :task="task" />
    </div>

    <div v-else class="task-card-page__content" aria-busy="true" aria-label="Загрузка задачи">
      <div class="task-card-page__skeleton">
        <el-skeleton :rows="5" animated />
      </div>
      <div class="task-card-page__skeleton">
        <el-skeleton :rows="3" animated />
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-card-page__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.task-card-page__skeleton {
  padding: 16px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}
</style>
