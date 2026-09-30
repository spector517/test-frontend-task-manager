export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

/** Превью задачи — то, что нужно карточке на канбане */
export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  /** email */
  assignee: string
  priority: TaskPriority
  /** ISO date string */
  createdAt: string
}

export interface TaskComment {
  id: string
  text: string
  /** ISO date string */
  createdAt: string
  /** ISO date string — есть, если комментарий редактировался */
  updatedAt?: string
}

/** Полная (детальная) карточка задачи */
export interface TaskFull extends Task {
  comments: TaskComment[]
}

export interface TaskFilters {
  title?: string
  status?: TaskStatus[]
  priority?: TaskPriority[]
}

/** Провалидированные значения формы создания/редактирования */
export interface TaskFormValues {
  title: string
  description?: string
  assignee: string
  priority: TaskPriority
  /** Только в форме редактирования; при создании — `todo` */
  status?: TaskStatus
}

/** Состояние полей формы до валидации */
export interface TaskFormModel {
  title: string
  description: string
  assignee: string
  priority: TaskPriority | undefined
  status: TaskStatus | undefined
}

export type CommentSortOrder = 'asc' | 'desc'

export type LoadStatus = 'idle' | 'loading' | 'success' | 'error'

export type PendingOperation = 'update' | 'delete' | 'clone' | 'status'
