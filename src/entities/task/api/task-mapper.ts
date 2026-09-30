import {
  legacyCommentId,
  type CommentDto,
  type SavedCommentDto,
  type TaskCreateDto,
  type TaskDto,
  type TaskFiltersDto,
  type TaskFullDto,
  type TaskUpdateDto,
} from '@/shared/api'
import type { Task, TaskComment, TaskFilters, TaskFormValues, TaskFull } from '../model/types'

export function toTask(dto: TaskDto): Task {
  const task: Task = {
    id: dto.id,
    title: dto.title,
    status: dto.status,
    assignee: dto.assignee,
    priority: dto.priority,
    createdAt: dto.created_at,
  }
  if (dto.description) task.description = dto.description
  return task
}

export function toSavedComment(dto: SavedCommentDto): TaskComment {
  const comment: TaskComment = { id: dto.id, text: dto.text, createdAt: dto.created_at }
  if (dto.updated_at) comment.updatedAt = dto.updated_at
  return comment
}

/**
 * Комментарий старого формата (строка) не имеет ни id, ни даты:
 * id вычисляется детерминированно по позиции, дата — дата создания задачи.
 */
export function toComment(dto: CommentDto, index: number, task: TaskDto): TaskComment {
  const id = legacyCommentId(task.id, index)
  if (typeof dto === 'string') return { id, text: dto, createdAt: task.created_at }
  return toSavedComment({ ...dto, id: dto.id ?? id })
}

export function toTaskFull(dto: TaskFullDto): TaskFull {
  return {
    ...toTask(dto),
    comments: (dto.comments ?? []).map((comment, index) => toComment(comment, index, dto)),
  }
}

export function toCreateDto(values: TaskFormValues): TaskCreateDto {
  return {
    title: values.title,
    description: values.description || undefined,
    assignee: values.assignee,
    priority: values.priority,
    status: values.status ?? 'todo',
  }
}

export function toUpdateDto(values: TaskFormValues): TaskUpdateDto {
  const dto: TaskUpdateDto = {
    title: values.title,
    // Пустое описание при редактировании означает «очистить поле»
    description: values.description || undefined,
    assignee: values.assignee,
    priority: values.priority,
  }
  if (values.status) dto.status = values.status
  return dto
}

export function toFiltersDto(filters: TaskFilters): TaskFiltersDto {
  const dto: TaskFiltersDto = {}
  if (filters.title) dto.title = filters.title
  if (filters.status?.length) dto.status = [...filters.status]
  if (filters.priority?.length) dto.priority = [...filters.priority]
  return dto
}
