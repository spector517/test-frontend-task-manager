import type { TaskPriority, TaskStatus } from '../model/types'

/** Порядок колонок канбана */
export const TASK_STATUSES = [
  'todo',
  'in_progress',
  'done',
] as const satisfies readonly TaskStatus[]

export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const satisfies readonly TaskPriority[]

export const STATUS_LABELS: Readonly<Record<TaskStatus, string>> = {
  todo: 'К выполнению',
  in_progress: 'В работе',
  done: 'Готово',
}

export const PRIORITY_LABELS: Readonly<Record<TaskPriority, string>> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
}

export const STATUS_OPTIONS = TASK_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }))

export const PRIORITY_OPTIONS = TASK_PRIORITIES.map((value) => ({
  value,
  label: PRIORITY_LABELS[value],
}))
