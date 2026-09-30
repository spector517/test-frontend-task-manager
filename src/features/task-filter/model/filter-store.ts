import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { hasActiveFilters, type TaskFilters } from '@/entities/task'

/** Применённые (провалидированные) фильтры доски */
export const useTaskFilterStore = defineStore('task-filter', () => {
  const applied = ref<TaskFilters>({})
  const isActive = computed(() => hasActiveFilters(applied.value))

  function apply(filters: TaskFilters): void {
    applied.value = filters
  }

  function reset(): void {
    applied.value = {}
  }

  return { applied, isActive, apply, reset }
})
