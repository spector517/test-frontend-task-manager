export type {
  CommentSortOrder,
  LoadStatus,
  PendingOperation,
  Task,
  TaskComment,
  TaskFilters,
  TaskFormModel,
  TaskFormValues,
  TaskFull,
  TaskPriority,
  TaskStatus,
} from './model/types'
export { useTaskStore } from './model/task-store'
export { createEmptyTaskFormModel, taskToFormModel } from './model/form-model'
export {
  COMMENT_MAX,
  DESCRIPTION_MAX,
  TITLE_MAX,
  TITLE_MIN,
  commentSchema,
  createTaskFormSchema,
  taskFilterSchema,
} from './model/schema'
export type { CommentFormValues, TaskFormSchemaOptions } from './model/schema'
export {
  PRIORITY_LABELS,
  PRIORITY_OPTIONS,
  STATUS_LABELS,
  STATUS_OPTIONS,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from './config/labels'
export { filterTasks, hasActiveFilters } from './lib/filter-tasks'
export { groupByStatus } from './lib/group-by-status'
export { sortComments } from './lib/sort-comments'
export { default as TaskCard } from './ui/TaskCard.vue'
export { default as TaskStatusTag } from './ui/TaskStatusTag.vue'
export { default as TaskPriorityTag } from './ui/TaskPriorityTag.vue'
export { default as CommentItem } from './ui/CommentItem.vue'
export { default as TaskFormFields } from './ui/TaskFormFields.vue'
