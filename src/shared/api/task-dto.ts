/**
 * Контракт «бекенда». Формат намеренно отличается от доменной модели
 * (snake_case, старый формат комментариев) — приведение делает mapper в entities/task.
 */

export type TaskStatusDto = 'todo' | 'in_progress' | 'done'
export type TaskPriorityDto = 'low' | 'medium' | 'high'

export interface TaskDto {
  id: string
  title: string
  description?: string
  status: TaskStatusDto
  /** email */
  assignee: string
  priority: TaskPriorityDto
  /** ISO date string */
  created_at: string
}

export interface CommentObjectDto {
  /** У комментариев старого формата id нет — его вычисляет {@link legacyCommentId} */
  id?: string
  text: string
  /** ISO date string */
  created_at: string
  updated_at?: string
}

/** Комментарий, сохранённый на сервере: id есть всегда */
export type SavedCommentDto = CommentObjectDto & { id: string }

/** Строка — старый формат из первоначальных моков (`comments?: string[]`) */
export type CommentDto = string | CommentObjectDto

export interface TaskFullDto extends TaskDto {
  comments?: CommentDto[]
}

export interface TaskFiltersDto {
  title?: string
  status?: TaskStatusDto[]
  priority?: TaskPriorityDto[]
}

export type TaskCreateDto = Omit<TaskFullDto, 'id' | 'created_at' | 'comments'>
export type TaskUpdateDto = Partial<TaskCreateDto>

/**
 * Детерминированный id для комментария без id (старый формат).
 * Используется и клиентом (mapper), и моком (при миграции комментариев в объектный формат),
 * поэтому адресация комментария по id работает для обоих форматов.
 */
export function legacyCommentId(taskId: string, index: number): string {
  return `${taskId}:legacy:${index}`
}
