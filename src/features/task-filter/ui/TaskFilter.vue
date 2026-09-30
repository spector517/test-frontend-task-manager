<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import type { FormInstance } from 'element-plus'
import { RefreshLeft, Search } from '@element-plus/icons-vue'
import {
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
  taskFilterSchema,
  type TaskPriority,
  type TaskStatus,
} from '@/entities/task'
import { yupToElRules } from '@/shared/lib'
import { useTaskFilterStore } from '../model/filter-store'

const TITLE_DEBOUNCE_MS = 300

interface FilterFormModel {
  title: string
  status: TaskStatus[]
  priority: TaskPriority[]
}

const filterStore = useTaskFilterStore()

const form = reactive<FilterFormModel>({
  title: filterStore.applied.title ?? '',
  status: [...(filterStore.applied.status ?? [])],
  priority: [...(filterStore.applied.priority ?? [])],
})

const formRef = ref<FormInstance>()
const rules = yupToElRules(
  () => taskFilterSchema,
  () => form,
  ['blur'],
)

const canReset = computed(
  () => filterStore.isActive || form.title !== '' || form.status.length || form.priority.length,
)

/** Невалидное название не применяется — ошибка остаётся видна под полем */
async function validTitle(): Promise<string | undefined> {
  const valid = await formRef.value?.validateField('title').then(
    () => true,
    () => false,
  )
  if (!valid) return undefined
  return taskFilterSchema.validateSync({ title: form.title }).title
}

async function applyFilters(): Promise<void> {
  filterStore.apply({
    title: await validTitle(),
    status: [...form.status],
    priority: [...form.priority],
  })
}

let titleTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => form.title,
  () => {
    clearTimeout(titleTimer)
    titleTimer = setTimeout(() => void applyFilters(), TITLE_DEBOUNCE_MS)
  },
)

watch(
  () => [form.status, form.priority],
  () => void applyFilters(),
  { deep: true },
)

onBeforeUnmount(() => clearTimeout(titleTimer))

function reset(): void {
  clearTimeout(titleTimer)
  form.title = ''
  form.status = []
  form.priority = []
  filterStore.reset()
  // Сбрасываем ошибку после того, как отработают watchers
  setTimeout(() => formRef.value?.clearValidate(), 0)
}
</script>

<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    class="task-filter"
    label-position="top"
    aria-label="Фильтр задач"
    @submit.prevent="applyFilters"
  >
    <el-form-item label="Название" prop="title" class="task-filter__title">
      <el-input
        v-model="form.title"
        :prefix-icon="Search"
        placeholder="Поиск по названию"
        clearable
      />
    </el-form-item>

    <el-form-item label="Статус" class="task-filter__select">
      <el-select
        v-model="form.status"
        multiple
        collapse-tags
        collapse-tags-tooltip
        clearable
        placeholder="Все статусы"
      >
        <el-option
          v-for="option in STATUS_OPTIONS"
          :key="option.value"
          :value="option.value"
          :label="option.label"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="Приоритет" class="task-filter__select">
      <el-select
        v-model="form.priority"
        multiple
        collapse-tags
        collapse-tags-tooltip
        clearable
        placeholder="Все приоритеты"
      >
        <el-option
          v-for="option in PRIORITY_OPTIONS"
          :key="option.value"
          :value="option.value"
          :label="option.label"
        />
      </el-select>
    </el-form-item>

    <el-form-item class="task-filter__actions">
      <el-button :icon="RefreshLeft" :disabled="!canReset" @click="reset">
        Сбросить фильтры
      </el-button>
    </el-form-item>
  </el-form>
</template>

<style scoped>
.task-filter {
  display: grid;
  grid-template-columns: minmax(200px, 2fr) minmax(160px, 1fr) minmax(160px, 1fr) auto;
  gap: 0 16px;
  align-items: end;
  padding: 16px 16px 0;
  margin-bottom: 16px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.task-filter :deep(.el-select) {
  width: 100%;
}

@media (max-width: 1023px) {
  .task-filter {
    grid-template-columns: 1fr 1fr;
  }

  .task-filter__title {
    grid-column: 1 / -1;
  }
}

@media (max-width: 767px) {
  .task-filter {
    grid-template-columns: 1fr;
    padding: 12px 12px 0;
  }

  .task-filter__actions :deep(.el-button) {
    width: 100%;
  }
}
</style>
