import type { Task, TaskFilters } from '../model/types'

/** Фильтры комбинируются по «И»; пустой фильтр не ограничивает выборку */
export function filterTasks(tasks: readonly Task[], filters: TaskFilters): Task[] {
  const title = filters.title?.trim().toLowerCase()
  const statuses = filters.status?.length ? new Set(filters.status) : null
  const priorities = filters.priority?.length ? new Set(filters.priority) : null

  return tasks.filter(
    (task) =>
      (!title || task.title.toLowerCase().includes(title)) &&
      (!statuses || statuses.has(task.status)) &&
      (!priorities || priorities.has(task.priority)),
  )
}

export function hasActiveFilters(filters: TaskFilters): boolean {
  return Boolean(filters.title?.trim() || filters.status?.length || filters.priority?.length)
}
